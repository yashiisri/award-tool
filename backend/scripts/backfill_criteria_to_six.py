"""
backfill_criteria_to_six.py
────────────────────────────
One-off backfill: forces EVERY award document already in the database — not
just the 15 canonical categories seed_aima_awards.py knows about — onto the
shared 6-part evaluation criteria (governance, org_performance, general,
innovation, leadership, impact). Older award categories created before this
criteria expansion (e.g. from an earlier seed run, or created via the app
with per-award bespoke 3-criteria sets) would otherwise keep showing "3
criteria" forever, since seed_aima_awards.py only upserts awards whose name
matches its own list.

Only touches the `criteria` and `aima_criteria` fields — nothing else on the
award document (nominees, votes, description, etc.) is affected.

Run:  python scripts/backfill_criteria_to_six.py
"""
import asyncio, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from database import connect_db, close_db, get_database

AIMA_CRITERIA = [
    {"id": "governance", "title": "Governance & Societal Responsibilities",
     "points": ["Contribution to society and nation at large", "Personal values, ethics and corporate integrity",
                "Contribution to positive evolution of government policy",
                "Contribution towards globalisation of Indian economy and industry"]},
    {"id": "org_performance", "title": "Organisational Performance",
     "points": ["Display of corporate courage and leadership",
                "Contribution towards evolving appropriate management culture",
                "Contribution towards development of management profession",
                "Vision and support for innovation and new ideas"]},
    {"id": "general", "title": "General Eligibility",
     "points": ["Organisation must be operating in India",
                "Business must have contributed substantially to Indian economy",
                "Nominations of individuals from their own organisations will be considered"]},
    {"id": "innovation", "title": "Innovation & Strategic Partnership",
     "points": ["Innovativeness in approach and tangible contribution to sustained growth",
                "Developed, managed and sustained strategic partnerships across sectors",
                "Adoption of new technology or business models to stay ahead of the curve"]},
    {"id": "leadership", "title": "Leadership",
     "points": ["A distinguished and acknowledged leader and achiever within the organisation",
                "Upheld high ethical values and behavioural standards",
                "Inspired and mentored the next generation of leadership"]},
    {"id": "impact", "title": "Impact on Workforce & Environment",
     "points": ["Concern for employee welfare, safety and professional growth",
                "Commitment to environmental preservation and sustainability",
                "Exceptional performance and resilience under adverse conditions"]},
]
CRITERIA_IDS = [c["id"] for c in AIMA_CRITERIA]


async def main():
    await connect_db()
    db = get_database()

    awards = await db.awards.find().to_list(500)
    print(f"{'Award':<52} Criteria before -> after")
    print("-" * 75)
    updated = 0
    for a in awards:
        before = len(a.get("aima_criteria") or [])
        if before == len(AIMA_CRITERIA) and {c["id"] for c in a.get("aima_criteria", [])} == set(CRITERIA_IDS):
            print(f"{a.get('name', '')[:52]:<52} {before} -> {before} (already 6, skipped)")
            continue
        await db.awards.update_one(
            {"_id": a["_id"]},
            {"$set": {"criteria": CRITERIA_IDS, "aima_criteria": AIMA_CRITERIA}},
        )
        updated += 1
        print(f"{a.get('name', '')[:52]:<52} {before} -> {len(AIMA_CRITERIA)}")

    print("-" * 75)
    print(f"{updated}/{len(awards)} award(s) updated to 6 criteria")

    await close_db()


asyncio.run(main())
