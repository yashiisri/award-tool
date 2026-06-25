import asyncio, sys
sys.path.insert(0, '.')
from services.nominee_discovery import retrieve_tier1_candidates, parse_award_criteria, enrich_with_wikipedia
from database import connect_db, get_database

async def test():
    await connect_db()
    db = get_database()

    filters = {'nationality': ['Indian'], 'alive_only': True}
    query_spec = await parse_award_criteria(
        'Business Leader of the Year',
        'Recognises outstanding Indian business leaders who have demonstrated exceptional leadership, innovation and impact',
        ['leadership excellence', 'innovation', 'CSR impact']
    )
    print('query_spec:', query_spec)

    candidates = await retrieve_tier1_candidates(db, filters, query_spec, pool_size=5)
    print(f'Retrieved {len(candidates)} candidates from entity_cache')
    for c in candidates:
        print(f'  - {c["name"]} | alive={c.get("is_alive")} | nat={c.get("nationality")} | occ={c.get("occupation")}')

    print('\nEnriching with Wikipedia...')
    enriched = await enrich_with_wikipedia(candidates)
    for c in enriched:
        has_wiki = bool(c.get('wiki_extract'))
        print(f'  {c["name"]}: wiki={has_wiki} | photo={bool(c.get("image_url"))} | desc={c.get("wiki_description","")[:60]}')

asyncio.run(test())
