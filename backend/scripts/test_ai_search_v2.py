"""End-to-end test of the new 5-chunk AI search engine."""
import asyncio, sys, logging, time
sys.path.insert(0, '.')
logging.basicConfig(level=logging.INFO, format='%(levelname)-8s %(message)s')

from services.entity_classifier import classify_entity_type
from services.name_generator     import generate_candidate_names
from services.enrichment         import enrich_all_candidates
from services.dossier_builder    import build_dossiers

AWARDS = [
    {
        "name":     "Business Leader of the Year 2025",
        "desc":     "Recognises the most impactful Indian CEO or founder who has driven extraordinary growth and innovation in 2025.",
        "criteria": ["leadership excellence", "revenue growth", "innovation", "national impact"],
        "num":      3,
    },
    {
        "name":     "Best Indian Startup of the Year",
        "desc":     "Awarded to the most disruptive Indian startup or enterprise that has achieved significant growth and market impact.",
        "criteria": ["growth rate", "innovation", "market disruption", "funding"],
        "num":      3,
    },
]

async def test_award(award):
    t0 = time.monotonic()
    print(f"\n{'='*60}")
    print(f"AWARD: {award['name']}")
    print(f"{'='*60}")

    # Step 1: Classify
    entity_type = await classify_entity_type(award["name"], award["desc"])
    print(f"  Entity type: {entity_type}")

    # Step 2: Generate names
    candidates = await generate_candidate_names(
        award["name"], award["desc"], award["num"],
        award["criteria"], entity_type,
    )
    print(f"  Generated: {len(candidates)} candidates")
    for c in candidates[:5]:
        print(f"    - {c['name']} ({c['entity_type']})")

    # Step 3: Enrich (just first 6 to keep test fast)
    enriched = await enrich_all_candidates(candidates[:6], f"{award['name']}: {award['desc']}")
    print(f"  Enriched: {len(enriched)} passed validation")
    for e in enriched[:3]:
        print(f"    {e.name}: wiki={bool(e.wiki_extract)} photo={bool(e.photo_url)} ddg={bool(e.ddg_text)}")

    # Step 4: Build dossiers
    if enriched:
        dossiers = await build_dossiers(
            enriched, award["name"], award["desc"],
            award["criteria"], entity_type, award["num"],
        )
        print(f"\n  DOSSIERS ({len(dossiers)}):")
        for d in dossiers:
            print(f"    [{d.get('confidence_score',0):.2f}] {d.get('name','?')}")
            print(f"         Role: {d.get('designation','')}")
            print(f"         Org:  {d.get('organisation','')}")
            print(f"         Bio:  {d.get('bio','')[:100]}...")
            print(f"         Why:  {d.get('relevance_reason','')[:100]}")
    
    print(f"\n  Elapsed: {time.monotonic()-t0:.1f}s")

async def main():
    for award in AWARDS:
        await test_award(award)
        await asyncio.sleep(2)

asyncio.run(main())
