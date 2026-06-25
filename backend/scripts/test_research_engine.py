"""Test the live research engine — Wikipedia + Wikidata discovery."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.INFO, format='%(levelname)-8s %(message)s')
from services.nominee_discovery import (
    parse_award_criteria,
    discover_candidates_from_web,
    validate_with_wikipedia,
)

async def main():
    award_name = "Top Business Leaders of India 2025"
    award_desc = (
        "Recognises the most influential and impactful Indian business leaders "
        "of 2025 — CEOs, Chairpersons and Founders who have driven extraordinary "
        "growth, innovation and national economic impact."
    )
    criteria = ["business leadership", "revenue growth", "innovation", "national impact"]

    print("\n=== Step 1: Parse award ===")
    query_spec = await parse_award_criteria(award_name, award_desc, criteria)
    print(f"  sectors:    {query_spec['likely_sectors']}")
    print(f"  roles:      {query_spec['likely_occupations']}")
    print(f"  themes:     {query_spec['key_evaluation_themes']}")

    print("\n=== Step 2: Discover via Wikipedia + Wikidata ===")
    names = await discover_candidates_from_web(award_name, award_desc, query_spec, 10)
    print(f"  Found {len(names)} raw candidate names")
    print(f"  First 20: {names[:20]}")

    print("\n=== Step 3: Wikipedia validation ===")
    validated = await validate_with_wikipedia(names[:30])
    print(f"  {len(validated)} confirmed business people:")
    for v in validated[:15]:
        print(f"    {v['name']:<35} | {v.get('wiki_description','')[:60]}")

asyncio.run(main())
