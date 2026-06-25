"""Full end-to-end test of the discovery pipeline (no LLM — GROQ_KEY optional)."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.INFO, format='%(levelname)-8s %(message)s')
from database import connect_db, get_database
from services.nominee_discovery import (
    parse_award_criteria, retrieve_tier1_candidates,
    enrich_with_wikipedia, _filter_business_people, enrich_with_tier2_news,
)

async def test():
    await connect_db()
    db = get_database()

    award_name = "Business Leader of the Year"
    award_desc = "Recognises outstanding Indian business leaders who have demonstrated exceptional leadership, innovation, and sustained impact on the Indian economy."
    criteria   = ["leadership excellence", "innovation", "CSR impact", "financial performance"]

    print("\n=== Step 1: Parse Award Criteria ===")
    query_spec = await parse_award_criteria(award_name, award_desc, criteria)
    print(f"  sectors:     {query_spec.get('likely_sectors')}")
    print(f"  occupations: {query_spec.get('likely_occupations')}")
    print(f"  themes:      {query_spec.get('key_evaluation_themes')}")

    print("\n=== Step 2: Retrieve from entity_cache ===")
    filters = {"nationality": ["Indian"], "alive_only": True}
    candidates = await retrieve_tier1_candidates(db, filters, query_spec, pool_size=20)
    print(f"  Retrieved {len(candidates)} candidates")

    print("\n=== Step 3: Wikipedia enrichment ===")
    candidates = await enrich_with_wikipedia(candidates)
    has_wiki = sum(1 for c in candidates if c.get('wiki_extract'))
    print(f"  {has_wiki}/{len(candidates)} have Wikipedia content")

    print("\n=== Step 4: Business filter ===")
    before = len(candidates)
    candidates = _filter_business_people(candidates)
    print(f"  {before} → {len(candidates)} after filtering non-business people")

    print("\n=== Step 5: News enrichment ===")
    news_map = await enrich_with_tier2_news(candidates)
    with_news = sum(1 for v in news_map.values() if v)
    print(f"  {with_news}/{len(candidates)} have recent news mentions")

    print("\n=== Final candidate pool (top 10) ===")
    for i, c in enumerate(candidates[:10], 1):
        wid  = str(c.get('wikidata_id', ''))
        news = len(news_map.get(wid, []))
        print(f"  {i:2}. {c['name']:<35} | {c.get('wiki_description',''):<40} | news={news}")

asyncio.run(test())
