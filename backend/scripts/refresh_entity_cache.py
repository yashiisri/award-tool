"""
refresh_entity_cache.py  —  Wikidata → MongoDB entity cache
─────────────────────────────────────────────────────────────
Run manually:
    python scripts/refresh_entity_cache.py

What changed vs v1:
• Dropped politician bucket (not relevant for business awards)
• Added business_leader (Q43845) and investor (Q672281) buckets
• After Wikidata SPARQL, fetches Wikipedia REST summary per person
  to get a real description and derive accurate sector_tags
• Filters out non-business people (actors, athletes, politicians)
  using Wikipedia description keywords BEFORE storing in cache
• SPARQL uses LIMIT 300 per bucket
• Polite 2s sleep between buckets
"""

import asyncio
import logging
import re
import sys
from datetime import datetime
from pathlib import Path

import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, TEXT, UpdateOne

BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))
from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s")
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
WIKI_REST_BASE  = "https://en.wikipedia.org/api/rest_v1/page/summary/"
USER_AGENT      = "NobleCrestAI/2.0 (awards-research; contact: admin@noblecrest.ai)"
TIMEOUT         = httpx.Timeout(30.0, connect=8.0)
MAX_RETRIES     = 3
BUCKET_SLEEP    = 2.0    # seconds between SPARQL buckets
WIKI_CONCURRENCY = 20    # concurrent Wikipedia fetches per bucket

# Business-relevant occupation buckets only
OCCUPATION_BUCKETS = {
    "business_executive": "Q484876",   # business executive
    "entrepreneur":       "Q131524",   # entrepreneur
    "business_leader":    "Q43845",    # businessperson (broader catch-all)
    "banker":             "Q806798",   # banker
    "investor":           "Q672281",   # investor
}

COUNTRY_QIDS = {"Indian": "Q668"}

# Keywords that CONFIRM this is a business/industry person
BUSINESS_KEYWORDS = [
    "businessman", "businesswoman", "businessperson",
    "ceo", "chief executive", "chairman", "chairperson",
    "founder", "co-founder", "entrepreneur", "industrialist",
    "managing director", "banker", "investor", "billionaire",
    "conglomerate", "unicorn", "startup", "venture",
    "executive", "director", "president",
]

# Keywords that DISQUALIFY — person is primarily in a non-business field
DISQUALIFY_KEYWORDS = [
    "actor", "actress", "singer", "musician", "athlete", "cricketer",
    "footballer", "player", "politician", "minister", "member of parliament",
    "chief minister", "prime minister", "president of india",
    "activist", "social worker", "journalist", "author", "writer",
    "director (film)", "film director", "comedian", "television",
    "model", "fashion designer", "chef", "dancer",
]

SECTOR_KEYWORDS = {
    "Technology":     ["tech", "software", "it ", "digital", "internet", "ai ", "cloud", "data", "saas", "fintech"],
    "Banking":        ["bank", "financ", "nbfc", "credit", "lending", "insurance", "asset management", "capital markets"],
    "FMCG":           ["fmcg", "consumer good", "food", "beverage", "household", "personal care", "retail brand"],
    "Pharma":         ["pharma", "healthcare", "biotech", "medicine", "drug", "hospital", "diagnostic"],
    "Energy":         ["energy", "power", "oil", "gas", "renewable", "solar", "wind", "coal", "petroleum"],
    "Manufacturing":  ["manufactur", "automobile", "steel", "cement", "chemical", "industrial", "engineering"],
    "Retail":         ["retail", "ecommerce", "e-commerce", "shopping", "d2c", "omnichannel"],
    "Infrastructure": ["infrastructure", "real estate", "construction", "road", "port", "logistics", "telecom"],
    "Media":          ["media", "broadcast", "entertainment", "ott", "publishing", "news channel"],
    "Conglomerate":   ["conglomerate", "diversified", "group of companies", "holding company"],
}


def derive_sector_tags(text: str) -> list[str]:
    """Derive sector tags from any free text using keyword matching."""
    t = text.lower()
    return [s for s, kws in SECTOR_KEYWORDS.items() if any(k in t for k in kws)] or ["Other"]


def parse_year(s: str):
    m = re.search(r"(\d{4})", s)
    return int(m.group(1)) if m else None


def sparql_query(occ_qid: str, country_qid: str) -> str:
    return f"""
SELECT DISTINCT ?person ?personLabel ?birthDate ?deathDate
  ?genderLabel ?employerLabel ?positionLabel ?image ?article
WHERE {{
  ?person wdt:P106 wd:{occ_qid} ;
          wdt:P27  wd:{country_qid} .
  OPTIONAL {{ ?person wdt:P569 ?birthDate. }}
  OPTIONAL {{ ?person wdt:P570 ?deathDate. }}
  OPTIONAL {{ ?person wdt:P21  ?gender. }}
  OPTIONAL {{ ?person wdt:P108 ?employer. }}
  OPTIONAL {{ ?person wdt:P39  ?position. }}
  OPTIONAL {{ ?person wdt:P18  ?image. }}
  OPTIONAL {{
    ?article schema:about ?person ;
             schema:inLanguage "en" ;
             schema:isPartOf <https://en.wikipedia.org/> .
  }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
LIMIT 300
"""


async def run_sparql(client: httpx.AsyncClient, query: str, label: str) -> list[dict]:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = await client.get(
                WIKIDATA_SPARQL,
                params={"query": query, "format": "json"},
                headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
                timeout=TIMEOUT,
            )
            if resp.status_code == 429:
                wait = 2 ** attempt * 30   # respect Wikidata's 1 req/min limit
                logger.warning("429 — sleeping %ds (attempt %d) for %s", wait, attempt, label)
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json().get("results", {}).get("bindings", [])
        except httpx.TimeoutException:
            logger.warning("Timeout %s attempt %d", label, attempt)
            await asyncio.sleep(3 * attempt)
        except Exception as exc:
            logger.warning("SPARQL error %s attempt %d: %s", label, attempt, exc)
            await asyncio.sleep(3 * attempt)
    logger.error("All attempts failed for %s", label)
    return []


async def fetch_wiki_description(name: str, client: httpx.AsyncClient) -> tuple[str, str, str]:
    """
    Fetch Wikipedia REST summary for a person.
    Returns (description, extract_snippet, thumbnail_url).
    """
    encoded = name.replace(" ", "_")
    url = f"{WIKI_REST_BASE}{encoded}"
    try:
        resp = await client.get(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            desc    = data.get("description", "")
            extract = data.get("extract", "")[:600]
            thumb   = (data.get("thumbnail") or {}).get("source", "")
            if thumb:
                thumb = re.sub(r"/\d+px-", "/400px-", thumb)
            return desc, extract, thumb
    except Exception:
        pass
    return "", "", ""


def is_business_person(name: str, designation: str, employer: str, wiki_desc: str, wiki_extract: str) -> bool:
    """
    Returns True only if this person is primarily a business/industry leader.
    Uses Wikipedia description as primary signal.
    """
    combined = f"{wiki_desc} {wiki_extract} {designation} {employer}".lower()

    # Hard disqualify: clearly in a different field
    if any(kw in combined for kw in DISQUALIFY_KEYWORDS):
        # Allow if they ALSO have strong business keywords (e.g., actor-turned-entrepreneur)
        business_signals = sum(1 for kw in BUSINESS_KEYWORDS if kw in combined)
        disqualify_signals = sum(1 for kw in DISQUALIFY_KEYWORDS if kw in combined)
        if disqualify_signals >= business_signals:
            return False

    # Accept if any business keyword found
    if any(kw in combined for kw in BUSINESS_KEYWORDS):
        return True

    # If we have no Wikipedia data at all, tentatively include
    # (Wikipedia enrichment in discovery pipeline will re-filter)
    if not wiki_desc and not wiki_extract:
        return True

    return False


async def process_bucket(
    rows: list[dict],
    nationality_label: str,
    occ_name: str,
    wiki_client: httpx.AsyncClient,
) -> list[UpdateOne]:
    """
    Parse SPARQL rows, fetch Wikipedia descriptions concurrently,
    filter to business people only, return bulk write ops.
    """
    # Parse raw rows first
    parsed = []
    for row in rows:
        label = row.get("personLabel", {}).get("value", "")
        if not label or label.startswith("Q"):
            continue
        wid = (row.get("person", {}).get("value", "") or "").split("/")[-1]
        if not wid:
            continue

        birth_year = None
        if row.get("birthDate"):
            birth_year = parse_year(row["birthDate"]["value"])

        is_alive = not bool(row.get("deathDate"))
        gender_raw = row.get("genderLabel", {}).get("value", "").lower()
        gender = "male" if "male" in gender_raw else ("female" if "female" in gender_raw else None)
        employer    = row.get("employerLabel", {}).get("value", "")
        designation = row.get("positionLabel", {}).get("value", "")
        image_url   = row.get("image",   {}).get("value", "")
        wiki_url    = row.get("article", {}).get("value", "")

        parsed.append({
            "wikidata_id": wid, "name": label,
            "nationality": [nationality_label],
            "is_alive": is_alive, "birth_year": birth_year,
            "gender": gender, "employer_org": employer or None,
            "designation": designation or None,
            "image_url": image_url or None, "wikipedia_url": wiki_url or None,
        })

    if not parsed:
        return []

    # Fetch Wikipedia descriptions concurrently (batched)
    semaphore = asyncio.Semaphore(WIKI_CONCURRENCY)

    async def fetch_one(entity):
        async with semaphore:
            desc, extract, thumb = await fetch_wiki_description(entity["name"], wiki_client)
            entity["_wiki_desc"]    = desc
            entity["_wiki_extract"] = extract
            if not entity.get("image_url") and thumb:
                entity["image_url"] = thumb
            return entity

    enriched = await asyncio.gather(*[fetch_one(e) for e in parsed], return_exceptions=True)

    ops = []
    accepted = rejected = 0
    for entity in enriched:
        if isinstance(entity, Exception):
            continue

        wiki_desc    = entity.pop("_wiki_desc", "")
        wiki_extract = entity.pop("_wiki_extract", "")

        # Filter: must be a business person
        if not is_business_person(
            entity["name"],
            entity.get("designation", ""),
            entity.get("employer_org", ""),
            wiki_desc,
            wiki_extract,
        ):
            rejected += 1
            continue

        # Derive accurate sector tags from Wikipedia content
        sector_text = f"{wiki_desc} {wiki_extract} {entity.get('designation','')} {entity.get('employer_org','')}"
        entity["sector_tags"] = derive_sector_tags(sector_text)
        entity["description"] = wiki_desc or None
        entity["last_refreshed"] = datetime.utcnow()

        ops.append(UpdateOne(
            {"wikidata_id": entity["wikidata_id"]},
            {
                "$set": {k: v for k, v in entity.items() if k not in ("nationality",)},
                "$addToSet": {
                    "nationality": {"$each": entity["nationality"]},
                    "occupation":  occ_name,
                },
            },
            upsert=True,
        ))
        accepted += 1

    logger.info("  Bucket %s: %d accepted, %d rejected (non-business)", occ_name, accepted, rejected)
    return ops


async def refresh_entity_cache():
    logger.info("=== Entity Cache Refresh v2 ===")

    mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = mongo_client[settings.DATABASE_NAME]

    # Ensure indexes
    try:
        await db.entity_cache.create_index([("nationality", ASCENDING), ("is_alive", ASCENDING)], name="idx_nat_alive")
        await db.entity_cache.create_index([("sector_tags", ASCENDING)], name="idx_sector")
        await db.entity_cache.create_index([("name", TEXT)], name="idx_name_text")
        await db.entity_cache.create_index([("wikidata_id", ASCENDING)], unique=True, name="idx_wid_unique")
        await db.discovery_runs.create_index([("created_at", ASCENDING)], expireAfterSeconds=3600, name="idx_runs_ttl")
        logger.info("Indexes OK")
    except Exception as exc:
        logger.warning("Index warning (may exist): %s", exc)

    # Clear old cache before repopulating with better data
    deleted = await db.entity_cache.delete_many({})
    logger.info("Cleared %d old cache entries", deleted.deleted_count)

    sparql_client = httpx.AsyncClient(timeout=TIMEOUT)
    wiki_client   = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=4.0))

    total_ops = 0
    try:
        for country_label, country_qid in COUNTRY_QIDS.items():
            for occ_name, occ_qid in OCCUPATION_BUCKETS.items():
                logger.info("--- %s × %s ---", occ_name, country_label)
                rows = await run_sparql(sparql_client, sparql_query(occ_qid, country_qid), f"{occ_name}×{country_label}")
                logger.info("  SPARQL returned %d rows", len(rows))

                if rows:
                    ops = await process_bucket(rows, country_label, occ_name, wiki_client)
                    if ops:
                        result = await db.entity_cache.bulk_write(ops, ordered=False)
                        done = result.upserted_count + result.modified_count
                        total_ops += done
                        logger.info("  Upserted/modified: %d", done)

                await asyncio.sleep(BUCKET_SLEEP)

    finally:
        await sparql_client.aclose()
        await wiki_client.aclose()
        mongo_client.close()

    total = await _count(settings.MONGODB_URL, settings.DATABASE_NAME)
    logger.info("=== Done. ops=%d total_in_cache=%d ===", total_ops, total)
    return {"ops": total_ops, "total": total}


async def _count(url, db_name):
    try:
        mc = AsyncIOMotorClient(url)
        n = await mc[db_name].entity_cache.count_documents({})
        mc.close()
        return n
    except Exception:
        return -1


if __name__ == "__main__":
    asyncio.run(refresh_entity_cache())
