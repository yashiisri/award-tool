"""Test the engine across multiple award categories."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.WARNING)  # suppress HTTP noise
from services.nominee_discovery import (
    parse_award_criteria, discover_candidates_from_web, validate_with_wikipedia,
)

AWARDS = [
    {
        "name": "Top Startup of the Year 2025",
        "desc": "Recognises India's most disruptive and fastest-growing startup of 2025. Open to founders and co-founders of Indian startups with significant growth, innovation and market impact.",
        "criteria": ["growth rate", "innovation", "market disruption", "funding raised"],
    },
    {
        "name": "Lifetime Excellence in Business",
        "desc": "Awarded to an Indian business leader who has made an extraordinary and sustained contribution to Indian industry over a career spanning decades.",
        "criteria": ["lifetime contribution", "industry impact", "legacy", "nation building"],
    },
    {
        "name": "Women Business Leader of the Year",
        "desc": "Honours outstanding Indian women who have demonstrated exceptional leadership, built successful enterprises, and inspired the next generation of women leaders.",
        "criteria": ["leadership", "business growth", "inspiration", "impact"],
    },
]

async def test_award(award):
    print(f"\n{'='*60}")
    print(f"AWARD: {award['name']}")
    print(f"{'='*60}")
    query_spec = await parse_award_criteria(award["name"], award["desc"], award["criteria"])
    print(f"  Category detected: sectors={query_spec['likely_sectors']} | occ={query_spec['likely_occupations']}")
    names = await discover_candidates_from_web(award["name"], award["desc"], query_spec, 5)
    print(f"  Raw names found: {len(names)} — first 10: {names[:10]}")
    validated = await validate_with_wikipedia(names[:20])
    print(f"  Validated ({len(validated)} confirmed):")
    for v in validated[:8]:
        print(f"    {v['name']:<35} | {v.get('wiki_description','')[:55]}")

async def main():
    for award in AWARDS:
        await test_award(award)
        await asyncio.sleep(2)  # polite pause between awards

asyncio.run(main())
