"""
seed_aima_awards.py
─────────────────────
Seeds the 13 canonical AIMA award categories (from the official brochure +
the 2025 category list). Idempotent — skips any award whose name already
exists, so it's safe to re-run and never touches the awards already created
in production (different names, e.g. "Business Leader of year 2026").

Run:  python scripts/seed_aima_awards.py
"""
import asyncio, sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from database import connect_db, close_db, get_database

def criteria(*blocks):
    """blocks: [(id, title, [points]), ...] -> aima_criteria structure."""
    return [{"id": i, "title": t, "points": p} for i, t, p in blocks]

AWARDS = [
    {
        "name": "AIMA-JRD TATA Corporate Leadership Award",
        "description": "Recognising distinguished business leaders who have demonstrated exemplary governance, societal contribution, and transformational organisational performance.",
        "num_nominees": 8,
        "entity_type": "person",
        "criteria_ids": ["governance", "org_performance", "general"],
        "aima_criteria": criteria(
            ("governance", "Governance & Societal Responsibilities", [
                "Contribution to society and nation at large",
                "Personal values, ethics and corporate integrity in business and expression of these values in public",
                "Contribution to the positive evolution of government policy and ability to establish right equilibrium between business and its external environment",
                "Contribution towards globalisation of Indian economy and industry",
            ]),
            ("org_performance", "Organisational Performance", [
                "Display of corporate courage and leadership; the organisation must have displayed exemplary performance despite challenges",
                "Contribution towards evolving appropriate management culture and ethos in the Indian context",
                "Contribution towards development of the management profession",
                "Vision and support for innovation and new ideas leading to turnaround of the organisation",
            ]),
            ("general", "General Eligibility", [
                "The organisation must be an entity operating in India and have contributed substantially to Indian economic growth",
                "Nominations of individuals from their own organisations will be considered",
            ]),
        ),
    },
    {
        "name": "AIMA Life Time Achievement Award for Management",
        "description": "Honouring eminent Professional Managers who have made outstanding lifetime contribution to professional management in India.",
        "num_nominees": 5,
        "entity_type": "person",
        "criteria_ids": ["innovation", "leadership", "general"],
        "aima_criteria": criteria(
            ("innovation", "Innovation & Strategic Leadership", [
                "Sustained strategic leadership and innovation that has altered strategic practice",
                "Significant impact on strategy practices in industries beyond the home industry",
            ]),
            ("leadership", "Leadership Excellence", [
                "A distinguished and acknowledged leader and achiever in their own organisation(s)",
                "Awards won / recognition beyond their organisation",
                "Left footprints in management profession, thought and culture",
                "Upheld high ethical values and behavioural standards",
            ]),
            ("general", "General", [
                "Likely to be past the normal age of superannuation",
                "The organisation must be an entity operating in India",
            ]),
        ),
    },
    {
        "name": "AIMA Public Service Excellence Award",
        "description": "Recognising excellence in public services by public servants who have demonstrated exceptional governance and societal impact.",
        "num_nominees": 6,
        "entity_type": "person",
        "criteria_ids": ["governance", "impact", "innovation"],
        "aima_criteria": criteria(
            ("governance", "Governance & Societal Responsibilities", [
                "Awareness of and commitment to nationally important issues",
                "Concern for the downtrodden segments of society",
                "Commitment to social responsibility and environmental preservation",
            ]),
            ("impact", "Impact on Workforce Environment", [
                "Managerial and leadership skills that could be imbibed by others",
                "Exceptional caliber in performance under adverse environments",
                "Individual philosophy, moral values, ethics and integrity",
            ]),
            ("innovation", "Innovation & Strategic Partnerships", [
                "Innovativeness in approach and tangible contribution to social/civic undertakings",
                "Developed, managed and sustained strategic partnerships across sectors",
            ]),
        ),
    },
    {
        "name": "Business Leader of the Year",
        "description": "Recognising the most outstanding business leader who has demonstrated exceptional leadership, organisational performance, and societal contribution in the current year.",
        "num_nominees": 8,
        "entity_type": "person",
        "criteria_ids": ["governance", "org_performance", "general"],
        "aima_criteria": criteria(
            ("governance", "Governance & Societal Responsibilities", ["Contribution to society and nation at large", "Personal values, ethics and corporate integrity"]),
            ("org_performance", "Organisational Performance", ["Corporate courage and leadership under challenging conditions", "Vision and support for innovation and new ideas"]),
            ("general", "General Eligibility", ["Organisation must be operating in India", "Substantial contribution to the Indian economy"]),
        ),
    },
    {
        "name": "Transformational Business Leader of the Year",
        "description": "Honouring a leader who has transformed their organisation through bold strategy, innovation, and sustained performance improvement.",
        "num_nominees": 6,
        "entity_type": "person",
        "criteria_ids": ["transformation", "innovation", "impact"],
        "aima_criteria": criteria(
            ("transformation", "Transformational Leadership", ["Led a significant, measurable turnaround or reinvention of the organisation"]),
            ("innovation", "Innovation", ["Introduced strategy or products that materially changed the organisation's trajectory"]),
            ("impact", "Organisational Impact", ["Sustained performance improvement attributable directly to their leadership"]),
        ),
    },
    {
        "name": "Entrepreneur of the Year",
        "description": "Recognising an outstanding entrepreneur who has built a significant business through innovation, resilience, and value creation.",
        "num_nominees": 8,
        "entity_type": "person",
        "criteria_ids": ["innovation", "impact", "governance"],
        "aima_criteria": criteria(
            ("innovation", "Innovation & Risk-Taking", ["Built a differentiated business model or product from the ground up"]),
            ("impact", "Business Impact", ["Demonstrated significant, verifiable business scale and value creation"]),
            ("governance", "Governance", ["Sound governance and ethical conduct through the growth journey"]),
        ),
    },
    {
        "name": "Young Entrepreneur Award",
        "description": "Celebrating an exceptional entrepreneur under 40 years of age who has demonstrated extraordinary vision and business building capability.",
        "num_nominees": 10,
        "entity_type": "person",
        "filters": {"max_age": 40},
        "criteria_ids": ["innovation", "scale", "age"],
        "aima_criteria": criteria(
            ("innovation", "Innovation", ["Original, differentiated approach to building the business"]),
            ("scale", "Business Scale", ["Demonstrable growth, funding, or revenue milestones for the company stage"]),
            ("age", "Age Eligibility", ["Nominee must be under 40 years of age"]),
        ),
    },
    {
        "name": "Director of the Year",
        "description": "Recognising an independent or executive director who has demonstrated exceptional governance, strategic guidance, and board leadership.",
        "num_nominees": 6,
        "entity_type": "person",
        "criteria_ids": ["governance", "strategy", "ethics"],
        "aima_criteria": criteria(
            ("governance", "Board Governance", ["Substantive contribution to board oversight and governance quality"]),
            ("strategy", "Strategic Contribution", ["Demonstrated influence on the organisation's strategic direction"]),
            ("ethics", "Ethics & Integrity", ["Consistent record of ethical conduct and independence of judgement"]),
        ),
    },
    {
        "name": "Outstanding Institution Builder",
        "description": "Honouring a leader who has built an enduring institution — a company, hospital, university, or foundation — that outlasts individual tenure.",
        "num_nominees": 6,
        "entity_type": "person",
        "criteria_ids": ["institution", "impact", "legacy"],
        "aima_criteria": criteria(
            ("institution", "Institution Building", ["Founded or shaped an institution with durable, self-sustaining structures"]),
            ("impact", "Long-term Impact", ["Institution's impact extends well beyond the founder's individual tenure"]),
            ("legacy", "Legacy & Values", ["Instilled values and culture that persist within the institution"]),
        ),
    },
    {
        "name": "Corporate Citizen Award",
        "description": "Recognising a business leader whose organisation has made exceptional contribution to society, environment, and community through sustained CSR.",
        "num_nominees": 6,
        "entity_type": "person",
        "criteria_ids": ["societal", "csr", "environment"],
        "aima_criteria": criteria(
            ("societal", "Societal Contribution", ["Measurable, sustained contribution to communities and society"]),
            ("csr", "CSR Impact", ["Well-documented CSR programmes with real outcomes, not just spend"]),
            ("environment", "Environmental Stewardship", ["Concrete environmental initiatives with tracked impact"]),
        ),
    },
    {
        "name": "Indian MNC of the Year",
        "description": "Recognising an Indian multinational that has demonstrated outstanding global expansion, performance, and representation of Brand India.",
        "num_nominees": 8,
        "entity_type": "company",
        "criteria_ids": ["global", "financial", "brand"],
        "aima_criteria": criteria(
            ("global", "Global Presence", ["Meaningful operating presence across multiple countries"]),
            ("financial", "Financial Performance", ["Strong, verifiable financial performance at global scale"]),
            ("brand", "Brand India Impact", ["Positive representation of Indian industry on the world stage"]),
        ),
    },
    {
        "name": "Outstanding PSU of the Year",
        "description": "Recognising a Public Sector Undertaking that has demonstrated exceptional operational excellence, financial performance, and national contribution.",
        "num_nominees": 8,
        "entity_type": "company",
        "filters": {"require_psu": True},
        "criteria_ids": ["operations", "financial", "national", "governance"],
        "aima_criteria": criteria(
            ("operations", "Operational Excellence", ["Demonstrated operational efficiency and modernisation"]),
            ("financial", "Financial Performance", ["Strong revenue, profitability, or return-on-assets performance"]),
            ("national", "National Impact", ["Substantial contribution to national infrastructure, energy, or public service"]),
            ("governance", "Governance", ["Sound public-sector governance and regulatory compliance"]),
        ),
    },
    {
        "name": "Lifetime Contribution to Media",
        "description": "Honouring a media personality who has made outstanding lifetime contribution to Indian journalism, broadcasting, or digital media.",
        "num_nominees": 5,
        "entity_type": "person",
        "criteria_ids": ["excellence", "integrity", "impact"],
        "aima_criteria": criteria(
            ("excellence", "Media Excellence", ["Sustained, high-quality body of work across a career in media"]),
            ("integrity", "Journalistic Integrity", ["Consistent record of editorial independence and integrity"]),
            ("impact", "Long-term Impact", ["Demonstrable influence on Indian journalism, broadcasting, or digital media"]),
        ),
    },
]


async def main():
    await connect_db()
    db = get_database()

    print(f"{'Award':<48} Status")
    print("-" * 65)
    for a in AWARDS:
        existing = await db.awards.find_one({"name": a["name"]})
        if existing:
            print(f"{a['name']:<48} already exists, skipped")
            continue
        doc = {
            "name": a["name"],
            "description": a["description"],
            "num_nominees": a["num_nominees"],
            "criteria": a["criteria_ids"],
            "aima_criteria": a["aima_criteria"],
            "entity_type": a["entity_type"],
            "filters": a.get("filters", {}),
            "results_published": False,
            "ai_metrics": [],
            "created_by": "system_seed",
            "created_at": datetime.utcnow(),
        }
        await db.awards.insert_one(doc)
        print(f"{a['name']:<48} created")

    await close_db()


asyncio.run(main())
