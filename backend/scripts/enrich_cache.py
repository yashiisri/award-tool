"""
enrich_cache.py
───────────────
Fetches Wikipedia content for every entity in entity_cache and updates:
  - description (Wikipedia short description)
  - sector_tags (derived from Wikipedia extract + description)
  - image_url   (if missing)
  - wikipedia_url (if missing)

Run:  python scripts/enrich_cache.py
"""
import asyncio, sys, logging, re
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-8s %(message)s")
logger = logging.getLogger(__name__)

WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/summary/"
UA        = "NobleCrestAI/2.0 (cache-enrich; admin@noblecrest.ai)"
TIMEOUT   = httpx.Timeout(10.0, connect=4.0)
BATCH     = 15   # concurrent requests per batch
SLEEP     = 0.5  # seconds between batches

SECTOR_MAP = {
    "Technology":     ["software", "tech", "it ", "digital", "internet", "ai ", "cloud",
                       "data", "saas", "fintech", "semiconductor", "cybersecurity",
                       "infosys", "wipro", "tcs", "hcl", "cognizant", "microsoft",
                       "google", "amazon", "oracle", "ibm"],
    "Banking":        ["bank", "financ", "nbfc", "credit", "lending", "insurance",
                       "asset management", "capital markets", "wealth management",
                       "hdfc", "icici", "kotak", "sbi", "axis", "yes bank", "indusind"],
    "FMCG":           ["fmcg", "consumer good", "food", "beverage", "household",
                       "personal care", "retail brand", "hindustan unilever",
                       "nestle", "itc", "dabur", "godrej consumer"],
    "Pharma":         ["pharma", "healthcare", "biotech", "medicine", "drug",
                       "hospital", "diagnostic", "sun pharma", "cipla", "lupin",
                       "dr reddy", "aurobindo", "biocon"],
    "Energy":         ["energy", "power", "oil", "gas", "renewable", "solar",
                       "wind", "coal", "petroleum", "ongc", "ntpc", "adani green",
                       "tata power", "reliance industries"],
    "Manufacturing":  ["manufactur", "automobile", "auto", "steel", "cement",
                       "chemical", "industrial", "engineering", "tata motors",
                       "mahindra", "bajaj", "hero", "maruti", "l&t", "jsw"],
    "Retail":         ["retail", "ecommerce", "e-commerce", "shopping", "d2c",
                       "omnichannel", "flipkart", "amazon india", "meesho", "myntra"],
    "Infrastructure": ["infrastructure", "real estate", "construction", "road",
                       "port", "logistics", "telecom", "dlf", "godrej properties",
                       "airtel", "jio", "vodafone", "bsnl"],
    "Conglomerate":   ["conglomerate", "diversified", "group of companies",
                       "holding company", "tata group", "reliance", "adani group",
                       "birla", "godrej", "mahindra group", "bajaj group"],
    "Media":          ["media", "broadcast", "entertainment", "ott", "publishing",
                       "news channel", "zee", "sun tv", "star", "sony"],
}


def derive_sector(text: str) -> list[str]:
    t = text.lower()
    tags = [s for s, kws in SECTOR_MAP.items() if any(k in t for k in kws)]
    return tags if tags else ["Other"]


async def fetch_wiki(name: str, client: httpx.AsyncClient) -> dict | None:
    encoded = name.replace(" ", "_")
    for attempt_name in [name, " ".join([name.split()[0], name.split()[-1]])]:
        try:
            r = await client.get(
                f"{WIKI_REST}{attempt_name.replace(' ','_')}",
                headers={"User-Agent": UA, "Accept": "application/json"},
            )
            if r.status_code == 200:
                d = r.json()
                if len(d.get("extract", "")) >= 80:
                    return d
        except Exception:
            pass
    return None


async def enrich_batch(entities: list[dict], client: httpx.AsyncClient) -> list[UpdateOne]:
    ops = []
    for e in entities:
        wiki = await fetch_wiki(e["name"], client)
        if not wiki:
            continue

        extract     = wiki.get("extract", "")
        description = wiki.get("description", "")
        thumb       = (wiki.get("thumbnail") or {}).get("source", "")
        wiki_url    = wiki.get("content_urls", {}).get("desktop", {}).get("page", "")

        sector_text = f"{description} {extract[:400]} {e.get('designation','')} {e.get('employer_org','')}"
        sector_tags = derive_sector(sector_text)

        if thumb:
            thumb = re.sub(r"/\d+px-", "/400px-", thumb)

        update = {
            "$set": {
                "description":    description or None,
                "sector_tags":    sector_tags,
                "last_refreshed": datetime.utcnow(),
            }
        }
        if thumb and not e.get("image_url"):
            update["$set"]["image_url"] = thumb
        if wiki_url and not e.get("wikipedia_url"):
            update["$set"]["wikipedia_url"] = wiki_url

        ops.append(UpdateOne({"wikidata_id": e["wikidata_id"]}, update))
    return ops


async def run():
    logger.info("=== Entity Cache Enrichment ===")
    mc = AsyncIOMotorClient(settings.MONGODB_URL)
    db = mc[settings.DATABASE_NAME]

    total   = await db.entity_cache.count_documents({})
    logger.info("Total entities to enrich: %d", total)

    all_entities = await db.entity_cache.find(
        {}, {"wikidata_id": 1, "name": 1, "description": 1,
             "image_url": 1, "wikipedia_url": 1, "designation": 1, "employer_org": 1}
    ).to_list(total)

    updated = 0
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        for i in range(0, len(all_entities), BATCH):
            batch = all_entities[i: i + BATCH]
            ops   = await enrich_batch(batch, client)
            if ops:
                result = await db.entity_cache.bulk_write(ops, ordered=False)
                updated += result.modified_count
                logger.info("Batch %d-%d: modified %d | total updated so far: %d",
                            i, i + BATCH, result.modified_count, updated)
            await asyncio.sleep(SLEEP)

    # Report final sector distribution
    logger.info("\n=== Sector distribution after enrichment ===")
    pipeline = [{"$unwind": "$sector_tags"},
                {"$group": {"_id": "$sector_tags", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}]
    async for doc in db.entity_cache.aggregate(pipeline):
        logger.info("  %-20s : %d", doc["_id"], doc["count"])

    mc.close()
    logger.info("=== Done. %d entities updated ===", updated)

if __name__ == "__main__":
    asyncio.run(run())
