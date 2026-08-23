"""
aima_history.py
──────────────────
Real, source-cited historical winner data for AIMA's Managing India Awards,
plus category-name normalization and AIMA-award auto-detection.

Coverage: the 10th–14th editions (2019, 2021, 2022, 2023, 2024), sourced from
aima.in event pages and corroborating press coverage. 2015–2018 and 2020 are
NOT included as guesses — they simply aren't in this dataset, and
`get_history(category)` returns whatever real entries exist (possibly none).
This is a deliberate choice: fabricating plausible-sounding early-year
winners would defeat the entire point of an evidence-based engine.
"""

from dataclasses import dataclass, field


@dataclass
class HistoricalWinner:
    year: int
    edition: str
    raw_category: str
    winner_name: str
    winner_type: str  # "PERSON" | "ORGANIZATION"
    designation: str
    organization: str
    industry: str
    achievement_summary: str
    source_urls: list[str] = field(default_factory=list)


AIMA_SOURCE_URLS = [
    "https://www.aima.in/events/14th-managing-india-awards",
    "https://www.aima.in/events/aima-13th-managing-india-awards",
    "https://www.aima.in/events/aima-12th-managing-india-awards-2022",
    "https://www.aima.in/events/11th-managing-india-awards-2021",
    "https://www.aima.in/events/aima-managing-india-awards-2019-hotel-taj-palace-new-delhi",
]

# ── Real historical winners ──────────────────────────────────────────────────
HISTORY: list[HistoricalWinner] = [
    # 14th edition — 2024
    HistoricalWinner(2024, "14th", "Business Leader of the Year", "Sanjiv Puri", "PERSON",
                      "Chairman & Managing Director", "ITC Ltd", "FMCG / Conglomerate",
                      "Led ITC as Chairman & MD across its diversified FMCG, hotels, and agri businesses.",
                      [AIMA_SOURCE_URLS[0]]),
    HistoricalWinner(2024, "14th", "Transformational Business Leader", "Gopal Vittal", "PERSON",
                      "Managing Director & CEO", "Bharti Airtel Ltd", "Telecom",
                      "Led Bharti Airtel's operational and digital transformation as MD & CEO.",
                      [AIMA_SOURCE_URLS[0]]),
    HistoricalWinner(2024, "14th", "Lifetime Contribution Award", "Onkar Kanwar", "PERSON",
                      "Chairman", "Apollo Tyres Ltd", "Automotive / Manufacturing",
                      "Recognised for lifetime contribution as Chairman of Apollo Tyres.",
                      [AIMA_SOURCE_URLS[0]]),
    HistoricalWinner(2024, "14th", "Lifetime Contribution to Media", "N Ram", "PERSON",
                      "Director; former Editor-in-Chief", "THG Publishing / The Hindu", "Media",
                      "Recognised for lifetime contribution to Indian media as former Editor-in-Chief of The Hindu.",
                      [AIMA_SOURCE_URLS[0]]),
    HistoricalWinner(2024, "14th", "Young Entrepreneur Award", "Tarun Mehta & Swapnil Jain", "PERSON",
                      "Founders", "Ather Energy", "Electric Vehicles / Startup",
                      "Co-founded and scaled Ather Energy in the electric two-wheeler space.",
                      [AIMA_SOURCE_URLS[0]]),
    HistoricalWinner(2024, "14th", "Indian MNC of the Year", "Asian Paints Ltd", "ORGANIZATION",
                      "", "Asian Paints Ltd", "Paints / Manufacturing",
                      "Recognised as Indian MNC of the Year.", [AIMA_SOURCE_URLS[0]]),
    HistoricalWinner(2024, "14th", "Outstanding PSU of the Year", "Hindustan Aeronautics Limited", "ORGANIZATION",
                      "", "Hindustan Aeronautics Limited", "Aerospace / Defence / PSU",
                      "Recognised as Outstanding PSU of the Year.", [AIMA_SOURCE_URLS[0]]),

    # 13th edition — 2023
    HistoricalWinner(2023, "13th", "Business Leader of the Year", "Adar Poonawalla", "PERSON",
                      "Chief Executive Officer", "Serum Institute of India", "Pharmaceuticals / Vaccines",
                      "Led Serum Institute of India as CEO through large-scale vaccine manufacturing.",
                      [AIMA_SOURCE_URLS[1]]),
    HistoricalWinner(2023, "13th", "Young Entrepreneur Award", "Tarun Mehta & Swapnil Jain", "PERSON",
                      "Founders", "Ather Energy", "Electric Vehicles / Startup",
                      "Co-founded and scaled Ather Energy in the electric two-wheeler space.",
                      [AIMA_SOURCE_URLS[1]]),
    HistoricalWinner(2023, "13th", "MNC in India of the Year", "ABB India Ltd", "ORGANIZATION",
                      "", "ABB India Ltd", "Industrial / Engineering",
                      "Recognised as MNC in India of the Year.", [AIMA_SOURCE_URLS[1]]),
    HistoricalWinner(2023, "13th", "Business Leader of the Decade", "Kumar Mangalam Birla", "PERSON",
                      "Chairman", "Aditya Birla Group", "Conglomerate",
                      "Recognised as Business Leader of the Decade for long-term leadership of the Aditya Birla Group.",
                      [AIMA_SOURCE_URLS[1]]),

    # 12th edition — 2022
    HistoricalWinner(2022, "12th", "Transformational Business Leader", "N Chandrasekaran", "PERSON",
                      "Chairman", "Tata Sons", "Conglomerate",
                      "Led transformation across the Tata Group as Chairman of Tata Sons.",
                      [AIMA_SOURCE_URLS[2]]),
    HistoricalWinner(2022, "12th", "Business Leader of the Year", "Adar Poonawalla", "PERSON",
                      "Chief Executive Officer", "Serum Institute of India", "Pharmaceuticals / Vaccines",
                      "Led Serum Institute of India as CEO.", [AIMA_SOURCE_URLS[2]]),
    HistoricalWinner(2022, "12th", "Outstanding Institution Builder", "Sunil Bharti Mittal", "PERSON",
                      "Founder and Chairman", "Bharti Enterprises", "Telecom / Conglomerate",
                      "Founded and built Bharti Enterprises into a major diversified group.",
                      [AIMA_SOURCE_URLS[2]]),
    HistoricalWinner(2022, "12th", "Corporate Citizen Award", "Anil Agarwal", "PERSON",
                      "Founder and Chairman", "Vedanta", "Mining / Natural Resources",
                      "Recognised for corporate citizenship as Founder and Chairman of Vedanta.",
                      [AIMA_SOURCE_URLS[2]]),
    HistoricalWinner(2022, "12th", "Young Entrepreneur Award", "Harsh Jain & Bhavit Sheth", "PERSON",
                      "CEO & Co-founder; COO & Co-founder", "Dream Sports (Dream11)", "Gaming / Startup",
                      "Co-founded and scaled Dream11 / Dream Sports.", [AIMA_SOURCE_URLS[2]]),

    # 11th edition — 2021
    HistoricalWinner(2021, "11th", "Entrepreneur of the Year", "Falguni Nayar", "PERSON",
                      "Founder & CEO", "Nykaa (FSN E-Commerce Ventures)", "E-commerce / Beauty",
                      "Founded and led Nykaa as Founder & CEO.", [AIMA_SOURCE_URLS[3]]),
    HistoricalWinner(2021, "11th", "Young Entrepreneur Award", "Ritesh Agarwal", "PERSON",
                      "Founder & Group CEO", "OYO Rooms", "Hospitality / Startup",
                      "Founded and led OYO Rooms as Founder & Group CEO.", [AIMA_SOURCE_URLS[3]]),
    HistoricalWinner(2021, "11th", "Transformational Business Leader of the Year", "Bhavish Aggarwal", "PERSON",
                      "Co-Founder & CEO", "Ola Cabs", "Mobility / Startup",
                      "Co-founded and led Ola Cabs through rapid growth and transformation.",
                      [AIMA_SOURCE_URLS[3]]),

    # 10th edition — 2019
    HistoricalWinner(2019, "10th", "Business Leader of the Year", "Sanjiv Mehta", "PERSON",
                      "Chairman & Managing Director", "Hindustan Unilever Ltd", "FMCG",
                      "Led Hindustan Unilever as Chairman & MD.", [AIMA_SOURCE_URLS[4]]),
    HistoricalWinner(2019, "10th", "Lifetime Contribution Award", "Azim H Premji", "PERSON",
                      "Chairman", "Wipro Ltd", "Information Technology",
                      "Recognised for lifetime contribution as Chairman of Wipro.", [AIMA_SOURCE_URLS[4]]),
    HistoricalWinner(2019, "10th", "Outstanding Institution Builder", "Prathap C Reddy", "PERSON",
                      "Founder-Chairman", "Apollo Hospitals Group", "Healthcare",
                      "Founded and built the Apollo Hospitals Group.", [AIMA_SOURCE_URLS[4]]),
    HistoricalWinner(2019, "10th", "Corporate Citizen Award", "Devi Prasad Shetty", "PERSON",
                      "Founder & Chairman", "Narayana Hrudayalaya", "Healthcare",
                      "Recognised for corporate citizenship as Founder & Chairman of Narayana Hrudayalaya.",
                      [AIMA_SOURCE_URLS[4]]),
    HistoricalWinner(2019, "10th", "Entrepreneur of the Year", "Sanjiv Bajaj", "PERSON",
                      "Managing Director", "Bajaj Finserv Ltd", "Financial Services",
                      "Led Bajaj Finserv as Managing Director.", [AIMA_SOURCE_URLS[4]]),
    HistoricalWinner(2019, "10th", "Indian MNC of the Year", "Mahindra & Mahindra Ltd", "ORGANIZATION",
                      "", "Mahindra & Mahindra Ltd", "Automotive / Conglomerate",
                      "Recognised as Indian MNC of the Year.", [AIMA_SOURCE_URLS[4]]),
    HistoricalWinner(2019, "10th", "MNC in India of the Year", "Coca-Cola India", "ORGANIZATION",
                      "", "Coca-Cola India", "Beverages",
                      "Recognised as MNC in India of the Year.", [AIMA_SOURCE_URLS[4]]),
    HistoricalWinner(2019, "10th", "Outstanding PSU of the Year", "Indian Oil Corporation Ltd", "ORGANIZATION",
                      "", "Indian Oil Corporation Ltd", "Oil & Gas / PSU",
                      "Recognised as Outstanding PSU of the Year.", [AIMA_SOURCE_URLS[4]]),
]

YEARS_WITH_DATA = sorted({w.year for w in HISTORY})
YEARS_REQUESTED = list(range(2015, 2026))
YEARS_UNAVAILABLE = [y for y in YEARS_REQUESTED if y not in YEARS_WITH_DATA]


# ── Category normalization ───────────────────────────────────────────────────
# Raw historical category string -> normalized snake_case key. Category names
# have drifted over the years (e.g. "Transformational Business Leader of the
# Year" vs "Transformational Business Leader") — both must resolve to the
# same profile.
CATEGORY_NORMALIZATION: dict[str, str] = {
    "business leader of the year": "business_leader",
    "business leader of the decade": "business_leader_of_the_decade",
    "transformational business leader": "transformational_business_leader",
    "transformational business leader of the year": "transformational_business_leader",
    "emerging business leader": "emerging_business_leader",
    "entrepreneur of the year": "entrepreneur_of_the_year",
    "young entrepreneur award": "young_entrepreneur",
    "outstanding institution builder": "outstanding_institution_builder",
    "lifetime contribution award": "lifetime_contribution",
    "corporate citizen award": "corporate_citizen",
    "lifetime contribution to media": "lifetime_contribution_media",
    "outstanding contribution to media": "lifetime_contribution_media",
    "director of the year": "director_of_the_year",
    "indian mnc of the year": "indian_mnc_of_the_year",
    "mnc in india of the year": "mnc_in_india_of_the_year",
    "outstanding psu of the year": "outstanding_psu_of_the_year",
}

# Categories whose historical winners are organizations, not people.
ORGANIZATION_CATEGORIES = {
    "indian_mnc_of_the_year", "mnc_in_india_of_the_year", "outstanding_psu_of_the_year",
}


def normalize_category(raw_category: str) -> str | None:
    """Map a raw category string to its normalized key, or None if unrecognized."""
    if not raw_category:
        return None
    key = " ".join(raw_category.strip().lower().split())
    if key in CATEGORY_NORMALIZATION:
        return CATEGORY_NORMALIZATION[key]
    # Tolerate near-matches like "...Award" / "...of the Year" suffix drift
    stripped = key.replace(" award", "").replace(" of the year", "").strip()
    for raw, norm in CATEGORY_NORMALIZATION.items():
        raw_stripped = raw.replace(" award", "").replace(" of the year", "").strip()
        if stripped == raw_stripped:
            return norm
    return None


def is_aima_award(name: str, description: str = "") -> str | None:
    """
    Auto-detect whether an award (by name, falling back to description) matches
    a known AIMA Managing India Awards category. Returns the normalized
    category key, or None if this isn't recognized as an AIMA category.
    """
    for text in (name, description):
        normalized = normalize_category(text or "")
        if normalized:
            return normalized
    return None


def get_history(normalized_category: str) -> list[HistoricalWinner]:
    """All real historical winners for a normalized category, most recent first."""
    matches = [
        w for w in HISTORY
        if normalize_category(w.raw_category) == normalized_category
    ]
    return sorted(matches, key=lambda w: w.year, reverse=True)


def is_organization_category(normalized_category: str) -> bool:
    return normalized_category in ORGANIZATION_CATEGORIES
