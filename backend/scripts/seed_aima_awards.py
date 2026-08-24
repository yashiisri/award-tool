"""
seed_aima_awards.py
─────────────────────
Seeds the 15 canonical AIMA Managing India Awards categories with their
official descriptions and the shared 6-part evaluation criteria (the original
3 — Governance & Societal Responsibilities, Organisational Performance,
General Eligibility — plus Innovation & Strategic Partnership, Leadership,
and Impact on Workforce & Environment).

Upserts by name: an award that already exists gets its description,
num_nominees, criteria and aima_criteria refreshed in place (created_at,
created_by, results_published, ai_metrics and head_jury_approved are left
untouched) — so re-running this script after an edit here is exactly how a
category's text/criteria gets applied retroactively to whatever's already
in the database. An award with no match by name is inserted fresh.

Run:  python scripts/seed_aima_awards.py
"""
import asyncio, sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from database import connect_db, close_db, get_database

# ── Shared 6-part evaluation criteria — same set used for every award created
# through the admin/head-jury "New Award" form (routes/admin.py AIMA_CRITERIA).
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

AWARDS = [
    {
        "name": "Entrepreneur of the Year",
        "description": "This accolade will be awarded to the individual who has created an innovative enterprise which shows tremendous potential of creating ripples across the global industry. The individual would have created a brand which has the strength to give older and established brands a run for their money. The one who is the epitome of the never-say-die spirit of entrepreneurship.",
        "num_nominees": 8,
        "entity_type": "person",
    },
    {
        "name": "Corporate Citizen of the Year",
        "description": "This accolade will be awarded to the individual from the corporate arena who has made a significant contribution to the public good. The philanthropy may be in a variety of forms, such as strengthening health and education systems, alleviating poverty, helping the handicapped or providing underprivileged children a promising future, or fostering a greater understanding among people and/or communities.",
        "num_nominees": 6,
        "entity_type": "person",
    },
    {
        "name": "Outstanding Contribution to Media",
        "description": "This accolade will be awarded to the individual from the Indian media industry whose passion and commitment drive Indian news reporting to new heights. The individual should have built a strong work ethic for the burgeoning Indian media industry. The individual should be someone that young media persons look up to.",
        "num_nominees": 5,
        "entity_type": "person",
    },
    {
        "name": "Outstanding PSU of the Year",
        "description": "This award will be given in recognition of the outstanding performance of PSUs in their core fields. An institution or body responsible for shaping many careers by following the best human resource management practices. An institution that has not only made the economy grow manifold but has also proven that they are an essential part of the economy. Innovation and technology have been their offerings to the growth of the country. One that feels social responsibility is the very essence of its existence.",
        "num_nominees": 8,
        "entity_type": "company",
        "filters": {"require_psu": True},
    },
    {
        "name": "Indian MNC of the Year",
        "description": "Many Indian firms are slowly but surely establishing themselves abroad, embarking on the global path and leading to the emergence of Indian multinational companies. This award will be given to honour and recognize the Indian company which has not only grown domestically but also adopted global investment as an integral part of its business strategy, and has successfully carried out consolidation of its business on the global front to enhance its potential for growth and global competitiveness.",
        "num_nominees": 8,
        "entity_type": "company",
    },
    {
        "name": "MNC in India of the Year",
        "description": "This award would honour a multinational corporation which has made outstanding contributions towards the economic and social upliftment of India and has shown a powerful influence on local — and even the world — economy. One which has taken India to an all-new growth trajectory while demonstrating exceptional financial returns, strong growth, innovation strategies, and market leadership in its sector, and has delivered consistent results in dynamic market conditions.",
        "num_nominees": 8,
        "entity_type": "company",
    },
    {
        "name": "Director of the Year",
        "description": "We are looking for a personality who exemplifies the spirit of filmmaking — somebody who has taken a story and created a masterpiece out of it, the sort of masterpiece displayed for art connoisseurs to admire. She/he should have made legendary movie(s) worth watching over and over again.",
        "num_nominees": 5,
        "entity_type": "person",
    },
    {
        "name": "Business Leader of the Decade",
        "description": "This accolade will be awarded to a senior business leader who has led a business organization with excellence, innovation, and social responsibility over the past few decades. The award honours the leader who has demonstrated vision, strategy, and execution in creating value for stakeholders, customers, employees, and society at large — a leader who has inspired and influenced others in the industry and beyond.",
        "num_nominees": 5,
        "entity_type": "person",
    },
    {
        "name": "Lifetime Contribution Award",
        "description": "This accolade will be awarded to the individual who has revolutionized existing practices in their respective field(s). She/he would have put India on the world map in their own way, and would have had a lifetime of leadership excellence, being a worthy ambassador of India on the global stage.",
        "num_nominees": 5,
        "entity_type": "person",
    },
    {
        "name": "Outstanding Institution Builder",
        "description": "This accolade will be awarded to the individual who has displayed exceptional vision and leadership in building an organization, institution, or company. This may be a founder, majority (or largest single) owner, or driving force of a company who has made a major contribution to an industry and achieved notable commercial success in revenue and profit growth.",
        "num_nominees": 6,
        "entity_type": "person",
    },
    {
        "name": "Emerging Business Leader of the Year",
        "description": "This accolade will be awarded to the individual for their continuing commitment to excellence, developing best business practices and innovative strategies — someone who has made a visible contribution and will go on to make an even bigger impact with their vision and leadership in their respective business and industry. This person should have achieved positive financial results, increased shareholder value, and been an exemplar of sound management, proven corporate governance, demonstrated innovation, best business practices and accountability, together with intangible qualities such as integrity and vision.",
        "num_nominees": 6,
        "entity_type": "person",
    },
    {
        "name": "Transformational Business Leader",
        "description": "Business calls for profound and rapid change around the globe; everyone is being challenged to find creative solutions to problems and inefficiencies. This award is to honour and recognize the thought leader who has developed and transmitted the principles of transformational leadership, with a unique emphasis on personal transformation as the starting point for transforming businesses, communities, and the world.",
        "num_nominees": 6,
        "entity_type": "person",
    },
    {
        "name": "Business Leader of the Year",
        "description": "This accolade will be awarded to the individual whose passion and hard work have revolutionized traditional Indian business practices. She/he should have defined a global outlook, held shareholders' interests uppermost in mind, and clearly demonstrated strategic direction relentlessly.",
        "num_nominees": 8,
        "entity_type": "person",
    },
    {
        "name": "Young Entrepreneur of the Year",
        "description": "This accolade will be awarded to a young individual who has demonstrated exceptional entrepreneurial skills while carving out an innovative enterprise — someone who has shown tremendous potential for creating disruption in the industry while helping create jobs, lift the standard of living, usher in new technology, and keep competition alive in the marketplace.",
        "num_nominees": 10,
        "entity_type": "person",
        "filters": {"max_age": 40},
    },
    {
        "name": "Lifetime Contribution to Media",
        "description": "This accolade will be awarded to the individual who has made a mark in media over the years, including print and broadcast media, cinema, art, and culture — whose immortal contribution has revolutionized the industry as a whole, who is solely responsible for changing the face of media in the 21st century and taking the legacy forward for the next generation, and who has transformed the news from an intellectual protégé into something the common person can relate to.",
        "num_nominees": 5,
        "entity_type": "person",
    },
]


async def main():
    await connect_db()
    db = get_database()

    print(f"{'Award':<48} Status")
    print("-" * 65)
    for a in AWARDS:
        doc_fields = {
            "name": a["name"],
            "description": a["description"],
            "num_nominees": a["num_nominees"],
            "criteria": CRITERIA_IDS,
            "aima_criteria": AIMA_CRITERIA,
            "entity_type": a["entity_type"],
            "filters": a.get("filters", {}),
        }
        existing = await db.awards.find_one({"name": a["name"]})
        if existing:
            await db.awards.update_one({"_id": existing["_id"]}, {"$set": doc_fields})
            print(f"{a['name']:<48} updated")
            continue

        doc = {
            **doc_fields,
            "results_published": False,
            "ai_metrics": [],
            "head_jury_approved": False,
            "created_by": "system_seed",
            "created_at": datetime.utcnow(),
        }
        await db.awards.insert_one(doc)
        print(f"{a['name']:<48} created")

    await close_db()


asyncio.run(main())
