"""Test the engine with a content creator award to verify it no longer returns business leaders."""
import asyncio, sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.WARNING)
from services.name_generator import generate_candidate_names
from services.nominee_discovery import generate_search_queries, parse_award_criteria, tavily_search_candidates, discover_candidates_from_web, validate_with_wikipedia

AWARDS = [
    {
        "name": "Top Indian Creator of the Year 2026",
        "desc": "Best in content creation — recognises India's most influential YouTubers, podcasters, bloggers and social media creators.",
        "criteria": ["content quality", "audience reach", "creativity", "influence"],
        "num": 5,
    },
    {
        "name": "Business Leader of the Year 2026",
        "desc": "Recognises the most impactful Indian business leader who has driven extraordinary growth in 2026.",
        "criteria": ["leadership", "revenue growth", "innovation", "impact"],
        "num": 3,
    },
]

async def test_award(award):
    print(f"\n{'='*55}")
    print(f"AWARD: {award['name']}")
    print(f"{'='*55}")

    # Step 1: Parse
    query_spec = await parse_award_criteria(award["name"], award["desc"], award["criteria"])
    print(f"  Sectors: {query_spec['likely_sectors']}")
    print(f"  Roles:   {query_spec['likely_occupations']}")

    # Step 2: Search queries
    queries = await generate_search_queries(award["name"], award["desc"], query_spec, award["num"])
    print(f"  Queries ({len(queries)}):")
    for q in queries[:5]:
        print(f"    - {q}")

    # Step 3: Tavily search
    names = await tavily_search_candidates(queries[:3])
    print(f"  Tavily names ({len(names)}): {names[:10]}")

    # Step 4: Name generator
    gen = await generate_candidate_names(award["name"], award["desc"], award["num"], award["criteria"], "person")
    print(f"  Generated names ({len(gen)}): {[g['name'] for g in gen[:8]]}")

async def main():
    for award in AWARDS:
        await test_award(award)
        await asyncio.sleep(1)

asyncio.run(main())
