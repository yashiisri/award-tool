"""Full end-to-end pipeline test."""
import asyncio
import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(name)s - %(message)s")
sys.path.insert(0, ".")


async def main():
    from services.entity_classifier import classify_entity_type
    from services.research_engine import discover_all
    from services.dossier_builder import build_dossiers

    award_name = "Business Leader of the Year 2026"
    award_desc = (
        "Recognises an outstanding Indian business leader who has demonstrated "
        "exceptional leadership, innovation, and measurable impact on the Indian economy."
    )
    num = 3

    print("\n=== Step 1: classify entity type ===")
    entity_type = await classify_entity_type(award_name, award_desc)
    print(f"  entity_type = {entity_type}")

    print("\n=== Step 2+3: discover + verify candidates ===")
    enriched, total = await discover_all(award_name, award_desc, entity_type, num)
    print(f"  {len(enriched)} verified from {total} extracted")
    for r in enriched[:8]:
        print(f"  - {r.name} | wiki={bool(r.wiki_extract)} | photo={bool(r.photo_url)} | desc={r.wiki_desc[:60]}")

    if not enriched:
        print("ERROR: No verified candidates — check Tavily key and network")
        return

    print("\n=== Step 4: build dossiers ===")
    dossiers = await build_dossiers(enriched, award_name, award_desc, [], entity_type, num)
    print(f"  {len(dossiers)} dossiers built")
    for d in dossiers:
        name = d.get("name", "?")
        score = d.get("confidence_score", 0)
        bio = d.get("bio", "")[:80]
        print(f"  - {name} | score={score} | bio={bio}")

    if not dossiers:
        print("ERROR: Dossier assembly failed — check Groq key and model")


asyncio.run(main())
