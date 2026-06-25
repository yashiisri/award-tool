"""Full end-to-end test with Google Custom Search wired in."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.INFO, format='%(levelname)-8s %(message)s')
from services.nominee_discovery import (
    parse_award_criteria,
    discover_candidates_from_web,
    validate_with_wikipedia,
    google_search_candidates,
)

AWARDS = [
    {
        "name": "Top Business Leader of the Year 2025",
        "desc": "Recognises India's most impactful business leaders who have driven extraordinary growth, innovation and national economic impact in 2025.",
        "criteria": ["leadership", "revenue growth", "innovation", "national impact"],
    },
    {
        "name": "Top Startup of the Year 2025",
        "desc": "Recognises India's most disruptive and fastest-growing startup of 2025 — open to founders of Indian startups with significant growth and market disruption.",
        "criteria": ["growth rate", "innovation", "market disruption", "funding"],
    },
    {
        "name": "Women Business Leader of the Year",
        "desc": "Honours outstanding Indian women who have demonstrated exceptional leadership, built successful enterprises, and inspired the next generation.",
        "criteria": ["leadership", "business growth", "inspiration", "impact"],
    },
]

async def test_award(award):
    print(f"\n{'='*65}")
    print(f"AWARD: {award['name']}")
    print(f"{'='*65}")

    query_spec = await parse_award_criteria(award["name"], award["desc"], award["criteria"])
    print(f"  Sectors: {query_spec['likely_sectors']}")
    print(f"  Roles:   {query_spec['likely_occupations']}")

    names = await discover_candidates_from_web(award["name"], award["desc"], query_spec, 5)
    print(f"\n  Candidates found: {len(names)}")

    validated = await validate_with_wikipedia(names[:25])
    print(f"  Confirmed business people: {len(validated)}")
    print()
    for v in validated[:8]:
        print(f"    {v['name']:<38} | {v.get('wiki_description','')[:55]}")

async def main():
    # First test Google search directly
    print("=== Testing Google Custom Search ===")
    queries = ["Forbes India top business leaders 2025", "India richest businessmen 2025 list"]
    google_names = await google_search_candidates(queries)
    print(f"Google extracted {len(google_names)} names: {google_names}")

    print("\n=== Testing Full Pipeline ===")
    for award in AWARDS:
        await test_award(award)
        await asyncio.sleep(1)

asyncio.run(main())
