"""Test Tavily-powered research engine across 3 award categories."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.INFO, format='%(levelname)-8s %(message)s')
from services.nominee_discovery import (
    parse_award_criteria, discover_candidates_from_web, validate_with_wikipedia,
    tavily_search_candidates,
)

AWARDS = [
    {
        "name": "Top Business Leader of India 2025",
        "desc": "Recognises India's most impactful business leaders who have driven extraordinary growth, innovation and national economic impact in 2025.",
        "criteria": ["leadership", "revenue growth", "innovation", "national impact"],
    },
    {
        "name": "Top Startup of the Year 2025",
        "desc": "Recognises India's most disruptive and fastest-growing startup — open to founders with significant growth and market disruption.",
        "criteria": ["growth rate", "innovation", "market disruption", "funding raised"],
    },
    {
        "name": "Women Business Leader of the Year",
        "desc": "Honours outstanding Indian women who have demonstrated exceptional leadership and built successful enterprises.",
        "criteria": ["leadership", "business growth", "inspiration", "impact"],
    },
]

async def test_tavily_direct():
    print("\n=== DIRECT TAVILY TEST ===")
    names = await tavily_search_candidates([
        "Forbes India top business leaders 2025",
        "India most powerful CEOs 2025 list",
    ])
    print(f"Tavily returned {len(names)} names: {names}")

async def test_award(award):
    print(f"\n{'='*60}")
    print(f"AWARD: {award['name']}")
    print(f"{'='*60}")
    query_spec = await parse_award_criteria(award["name"], award["desc"], award["criteria"])
    print(f"  Sectors: {query_spec['likely_sectors']}")
    print(f"  Roles:   {query_spec['likely_occupations']}")
    names = await discover_candidates_from_web(award["name"], award["desc"], query_spec, 5)
    print(f"  Raw candidates: {len(names)}")
    validated = await validate_with_wikipedia(names[:25])
    print(f"  Confirmed ({len(validated)}):")
    for v in validated[:8]:
        print(f"    {v['name']:<38} | {v.get('wiki_description','')[:55]}")

async def main():
    await test_tavily_direct()
    for award in AWARDS:
        await test_award(award)
        await asyncio.sleep(1)

asyncio.run(main())
