"""
aima_historical_seed.py
────────────────────────
AIMA Managing India Awards — verified winners 2010–2024.
Source: aima.in official event pages + public records.

Two uses:
  1. AIMA_WINNERS_BY_CATEGORY  — historical winners per category (for search grounding)
  2. AWARD_CATEGORY_PROMPTS    — tuned Groq prompts per award category
  3. build_grounded_queries()  — call this from nominee_discovery.py instead of generic queries
"""

from __future__ import annotations

# ── Historical AIMA Managing India Awards winners ─────────────────────────────
# Format: {category: [{year, name, role, org}]}
# Only VERIFIED from official AIMA pages / reputable news sources.

AIMA_WINNERS_BY_CATEGORY: dict[str, list[dict]] = {

    "Business Leader of the Year": [
        {"year": 2024, "name": "Sanjiv Puri",           "role": "Chairman & MD",           "org": "ITC Ltd"},
        {"year": 2022, "name": "Adar Poonawalla",        "role": "CEO",                     "org": "Serum Institute of India"},
        {"year": 2019, "name": "Sanjiv Mehta",           "role": "Chairman & MD",           "org": "Hindustan Unilever Ltd"},
        {"year": 2018, "name": "Pawan Munjal",           "role": "MD & CEO",                "org": "Hero MotoCorp Ltd"},
        {"year": 2016, "name": "N Chandrasekaran",       "role": "CEO & MD",                "org": "Tata Consultancy Services"},
        {"year": 2014, "name": "Mukesh D Ambani",        "role": "Chairman & MD",           "org": "Reliance Industries Ltd"},
    ],

    "Lifetime Contribution Award": [
        {"year": 2024, "name": "Onkar Kanwar",           "role": "Chairman",                "org": "Apollo Tyres Ltd"},
        {"year": 2019, "name": "Azim H Premji",          "role": "Chairman",                "org": "Wipro Ltd"},
        {"year": 2018, "name": "Deepak Parekh",          "role": "Chairman",                "org": "HDFC"},
        {"year": 2017, "name": "Rahul Bajaj",            "role": "Chairman",                "org": "Bajaj Auto Ltd"},
        {"year": 2014, "name": "RP Goenka",              "role": "Founder & Chairman Emeritus", "org": "RPG Group"},
        {"year": 2013, "name": "Shiv Nadar",             "role": "Founder & Chairman",      "org": "HCL / Shiv Nadar Foundation"},
    ],

    "Transformational Business Leader": [
        {"year": 2024, "name": "Gopal Vittal",           "role": "MD & CEO",                "org": "Bharti Airtel Ltd"},
        {"year": 2023, "name": "Sanjiv Bajaj",           "role": "Chairman & MD",           "org": "Bajaj Finserv Ltd"},
        {"year": 2022, "name": "T V Narendran",          "role": "CEO & MD",                "org": "Tata Steel Ltd"},
        {"year": 2019, "name": "A M Naik",               "role": "Group Chairman",          "org": "Larsen & Toubro Ltd"},
    ],

    "Entrepreneur of the Year": [
        {"year": 2024, "name": "Vivek Gupta",            "role": "Co-Founder",              "org": "Licious"},
        {"year": 2024, "name": "Abhay Hanjura",          "role": "Co-Founder",              "org": "Licious"},
        {"year": 2023, "name": "Samir Mehta",            "role": "Chairman",                "org": "Torrent Group"},
        {"year": 2022, "name": "Harsh Jain",             "role": "CEO & Co-founder",        "org": "Dream11 & Dream Sports"},
        {"year": 2019, "name": "Sanjiv Bajaj",           "role": "Managing Director",       "org": "Bajaj Finserv Ltd"},
    ],

    "Young Entrepreneur Award": [
        {"year": 2024, "name": "Tarun Mehta",            "role": "Founder",                 "org": "Ather Energy"},
        {"year": 2024, "name": "Swapnil Jain",           "role": "Founder",                 "org": "Ather Energy"},
        {"year": 2022, "name": "Bhavit Sheth",           "role": "COO & Co-founder",        "org": "Dream11 & Dream Sports"},
    ],

    "Outstanding Institution Builder": [
        {"year": 2024, "name": "Venu Srinivasan",        "role": "Chairman Emeritus",       "org": "TVS Motor Company"},
        {"year": 2022, "name": "Sunil Bharti Mittal",   "role": "Founder & Chairman",      "org": "Bharti Enterprises"},
        {"year": 2019, "name": "Prathap C Reddy",        "role": "Founder Chairman",        "org": "Apollo Hospitals Group"},
        {"year": 2018, "name": "Nita M Ambani",          "role": "Chairperson",             "org": "Dhirubhai Ambani Foundation"},
    ],

    "Corporate Citizen Award": [
        {"year": 2022, "name": "Anil Agarwal",           "role": "Founder & Chairman",      "org": "Vedanta"},
        {"year": 2019, "name": "Devi Prasad Shetty",     "role": "Founder & Chairman",      "org": "Narayana Hrudalaya"},
        {"year": 2018, "name": "Rajashree Birla",        "role": "Chairperson",             "org": "Aditya Birla Centre for Community Initiatives"},
    ],

    "Outstanding PSU of the Year": [
        {"year": 2024, "name": "National Payments Corporation of India", "role": "Organisation", "org": "NPCI"},
        {"year": 2019, "name": "Indian Oil Corporation Ltd",             "role": "Organisation", "org": "IOC"},
        {"year": 2014, "name": "NTPC Ltd",                               "role": "Organisation", "org": "NTPC"},
    ],

    "Emerging Business Leader of the Year": [
        {"year": 2024, "name": "Ashish Bharat Ram",      "role": "Chairman & MD",           "org": "SRF Ltd"},
        {"year": 2022, "name": "GV Sanjay Reddy",        "role": "Vice Chairman",           "org": "GVK Industries Ltd"},
    ],

    "Outstanding Contribution to Media": [
        {"year": 2024, "name": "Rahul Kanwal",           "role": "News Director",           "org": "India Today / Aajtak"},
        {"year": 2022, "name": "Palki Sharma Upadhyay", "role": "Executive Editor",        "org": "WION"},
        {"year": 2022, "name": "Shereen Bhan",           "role": "Managing Editor",         "org": "CNBC-TV18"},
        {"year": 2019, "name": "Uday Shankar",           "role": "President",               "org": "21st Century Fox Asia / Star India"},
    ],

    "Lifetime Contribution to Media": [
        {"year": 2024, "name": "N Ram",                  "role": "Director / Former Editor-in-Chief", "org": "THG Publishing / The Hindu"},
        {"year": 2019, "name": "Mahendra Mohan Gupta",   "role": "Chairman & MD",           "org": "Jagran Prakashan Ltd / Dainik Jagran"},
    ],

    "MNC in India of the Year": [
        {"year": 2024, "name": "ABB India Ltd",          "role": "Organisation",            "org": "ABB India"},
        {"year": 2019, "name": "Mahindra & Mahindra Ltd","role": "Organisation",            "org": "Mahindra Group"},
    ],

    "JRD Tata Corporate Leadership Award": [
        {"year": 2023, "name": "T V Narendran",          "role": "CEO & MD",                "org": "Tata Steel Ltd"},
        {"year": 2018, "name": "Nandan Nilekani",        "role": "Former Chairman",         "org": "UIDAI"},
    ],
}

# ── Flat list of all past winners (names only) — for seeding search queries ───
ALL_PAST_WINNERS: list[str] = sorted({
    w["name"]
    for winners in AIMA_WINNERS_BY_CATEGORY.values()
    for w in winners
    if not any(c.islower() for c in w["name"][:3])  # exclude org names
})

# ── Known real foreign-MNC India subsidiaries — seed candidates for "MNC in
# India of the Year" specifically ───────────────────────────────────────────
# Live web search alone (even with anchor-example queries) kept surfacing
# famous INDIAN companies for this category — genuine foreign-MNC-in-India
# candidates are a narrower, harder-to-word search target than "top Indian
# company." These are real, well-known, easily-verified companies — fed into
# discover()'s Round 0 as additional candidates to verify via the normal
# Wikipedia pipeline (never skips verification, never assumed to qualify).
KNOWN_FOREIGN_MNC_INDIA_SUBSIDIARIES: list[str] = [
    "ABB India", "Siemens India", "Unilever India", "Bosch India", "Nestlé India",
    "Samsung India", "LG India", "Hyundai Motor India", "IBM India", "Nokia India",
    "Coca-Cola India", "PepsiCo India", "Ericsson India",
    "Schneider Electric India", "Philips India", "Mercedes-Benz India", "Whirlpool of India",
    "Cisco India", "SAP India",
]

# ── Known real Indian film directors — seed candidates for "Director of the
# Year" specifically ────────────────────────────────────────────────────────
# Live search for this category — even with dedicated film-industry queries —
# keeps surfacing famous ACTORS/ACTRESSES ahead of actual directors, since
# they're simply more famous and have richer Wikipedia pages that pass
# verification more easily. Confirmed live 2026-08-31. Real, well-known,
# easily-verified directors — fed into discover()'s Round 0 like the foreign-
# MNC list above, still verified through the normal Wikipedia pipeline, never
# assumed to qualify.
KNOWN_INDIAN_FILM_DIRECTORS: list[str] = [
    "S. S. Rajamouli", "Sanjay Leela Bhansali", "Zoya Akhtar", "Karan Johar",
    "Rajkumar Hirani", "Anurag Kashyap", "Vishal Bhardwaj", "Imtiaz Ali",
    "Sandeep Reddy Vanga", "Aditya Chopra", "Ayan Mukerji", "Farhan Akhtar",
    "R. Balki", "Nitesh Tiwari", "Kabir Khan", "Ashutosh Gowariker",
]

# ── Calibration: what kind of person wins each AIMA category ─────────────────
CATEGORY_PROFILE: dict[str, dict] = {
    "Business Leader of the Year": {
        "entity_type": "person",
        "seniority": ["Chairman", "MD", "CEO", "Chairman & MD"],
        "org_scale": "Large conglomerate or Fortune-equivalent Indian company",
        "examples": ["Mukesh Ambani", "N Chandrasekaran", "Sanjiv Puri", "Sanjiv Mehta"],
        "not": ["startup founders under 40", "politicians", "cricketers"],
    },
    "Lifetime Contribution Award": {
        "entity_type": "person",
        "seniority": ["Founder", "Chairman Emeritus", "Group Chairman"],
        "org_scale": "Built or led iconic Indian institution for 30+ years",
        "examples": ["Azim Premji", "Deepak Parekh", "Rahul Bajaj", "Shiv Nadar"],
        "not": ["young leaders", "mid-career executives"],
    },
    "Entrepreneur of the Year": {
        "entity_type": "person",
        "seniority": ["Founder", "Co-Founder", "MD"],
        "org_scale": "A business built/scaled substantially within roughly the last 10-20 years — a "
                     "unicorn, a high-growth company, or a genuinely disruptive challenger brand that is "
                     "STILL an underdog relative to older incumbents, not one that has itself become an "
                     "old, established giant",
        "examples": ["Harsh Jain", "Vivek Gupta", "Samir Mehta", "Falguni Nayar"],
        "not": [
            "salaried CEOs of inherited businesses",
            "billionaire founders of multi-decade-old conglomerates who are now themselves the "
            "'older, established' incumbent the award description explicitly contrasts against "
            "(e.g. Gautam Adani, Sunil Mittal, Shiv Nadar, Mukesh Ambani) — real entrepreneurs "
            "originally, but that career stage belongs to 'Business Leader of the Year' or "
            "'Lifetime Contribution Award', not this award",
        ],
    },
    "Young Entrepreneur Award": {
        "entity_type": "person",
        "seniority": ["Founder", "Co-Founder"],
        "org_scale": "High-growth startup, ideally unicorn or near-unicorn",
        "age_constraint": "Under 40 years old",
        "examples": ["Tarun Mehta", "Swapnil Jain", "Bhavit Sheth"],
        "not": ["established conglomerate heirs", "politicians"],
    },
    "Outstanding PSU of the Year": {
        "entity_type": "company",
        "company_type": "Public Sector Undertaking (PSU) — government-owned Indian company",
        "examples": ["NTPC", "IOC", "NPCI", "ISRO", "BEL", "BHEL", "ONGC", "HAL"],
        "not": ["private companies", "MNCs", "startups"],
    },
    "MNC in India of the Year": {
        "entity_type": "company",
        # Kept short and concrete on purpose — this string is interpolated directly
        # into search-query text in build_grounded_queries() below, not just used
        # for ranking calibration. A long clarifying sentence here (tried once,
        # reverted) turns into an unusable run-on search query; the detailed
        # "don't confuse with an Indian company" guidance belongs in "not" instead,
        # which is ranking-only (never interpolated into a query string).
        "company_type": "foreign multinational corporation's India subsidiary or operations",
        "examples": ["ABB India", "Siemens India", "Unilever India", "Bosch India"],
        "not": [
            "PSUs", "startups",
            "Indian-headquartered companies with global/multinational operations, even large famous "
            "ones (e.g. Bharti Airtel, Reliance Industries, Tata Motors, Tata Consultancy Services, "
            "HCL Technologies, ICICI Bank) — these are Indian companies that expanded abroad, which is "
            "'Indian MNC of the Year', the OPPOSITE of this award; having overseas operations does not "
            "make an Indian-headquartered company a foreign MNC",
        ],
    },
    "Outstanding Institution Builder": {
        "entity_type": "person",
        "seniority": ["Founder", "Chairman", "Chairperson"],
        "org_scale": "Built an institution that outlasts them — hospital, university, foundation",
        "examples": ["Prathap C Reddy", "Sunil Bharti Mittal", "Nita Ambani"],
        "not": ["pure profit-driven executives with no institution-building legacy"],
    },
    "Corporate Citizen Award": {
        "entity_type": "person",
        "seniority": ["Chairman", "Founder", "Chairperson"],
        "focus": "CSR, philanthropy, ESG, social impact",
        "examples": ["Anil Agarwal", "Devi Prasad Shetty", "Rajashree Birla"],
        "not": ["leaders known purely for profit, with no social impact record"],
    },
    "Outstanding Contribution to Media": {
        "entity_type": "person",
        "seniority": ["Editor-in-Chief", "Executive Editor", "Managing Editor", "News Director", "Anchor"],
        "org_scale": "Senior editorial or broadcast leadership at a major national Indian media house",
        "examples": ["Rahul Kanwal", "Palki Sharma Upadhyay", "Shereen Bhan", "N Ram"],
        "not": ["entry-level or regional-only journalists", "business executives with no media role"],
    },
    "Transformational Business Leader": {
        "entity_type": "person",
        "seniority": ["CEO", "MD", "CEO & MD", "Chairman & MD"],
        "org_scale": "Professional CEO/MD driving major modernisation or growth at an established large Indian company",
        "examples": ["Gopal Vittal", "Sanjiv Bajaj", "T V Narendran", "A M Naik"],
        "not": ["startup founders", "founders of brand-new companies with no transformation track record"],
    },
    "Emerging Business Leader of the Year": {
        "entity_type": "person",
        "seniority": ["Chairman & MD", "Vice Chairman", "MD"],
        "org_scale": "Mid-to-large Indian company led by a newer-generation or recently-prominent leader who "
                     "is STILL building their national reputation — not yet a top-tier household-name business "
                     "icon. Positive financial results and rising influence, but not decades of already-arrived "
                     "fame",
        "examples": ["Ashish Bharat Ram", "GV Sanjay Reddy"],
        "not": [
            "startup founders under 30 (that's closer to Entrepreneur/Young Entrepreneur, not this)",
            "already-arrived national business icons who have led their company for decades and are "
            "already household names (e.g. Mukesh Ambani, Gautam Adani, N Chandrasekaran, Sunil Mittal, "
            "Shiv Nadar) — real leaders, but that level of fame/tenure belongs to 'Business Leader of the "
            "Year' or 'Lifetime Contribution Award', not this award, which is specifically about someone "
            "still on the way up",
        ],
    },
    "Lifetime Contribution to Media": {
        "entity_type": "person",
        "seniority": ["Editor-in-Chief", "Chairman & MD", "Director", "Former Editor-in-Chief"],
        "org_scale": "Multi-decade leadership of a major Indian media/publishing house",
        "examples": ["N Ram", "Mahendra Mohan Gupta"],
        "not": ["early/mid-career journalists", "business executives with no media role"],
    },
    "JRD Tata Corporate Leadership Award": {
        "entity_type": "person",
        "seniority": ["CEO & MD", "Chairman", "Former Chairman"],
        "org_scale": "Top-tier corporate or institutional leadership at a nationally significant Indian organisation",
        "examples": ["T V Narendran", "Nandan Nilekani"],
        "not": ["startup founders", "leaders of small/regional companies"],
    },
    "Indian MNC of the Year": {
        "entity_type": "company",
        "company_type": "Indian-origin company with significant global/multinational operations and revenue",
        "examples": ["Tata Motors", "Infosys", "Wipro", "Sun Pharmaceutical Industries"],
        "not": ["foreign multinational companies operating in India (that's 'MNC in India of the Year', a different award)",
                "purely domestic Indian companies with no meaningful overseas revenue or operations", "PSUs"],
    },
    "Director of the Year": {
        "entity_type": "person",
        "seniority": ["Film Director", "Filmmaker"],
        "focus": "Indian film direction — critically acclaimed and/or major commercially successful films",
        "examples": ["S. S. Rajamouli", "Sanjay Leela Bhansali", "Zoya Akhtar"],
        "not": ["actors", "producers with no directing credit", "business executives — this is a film award, not a business one"],
    },
}

# ── Exact-name overrides ───────────────────────────────────────────────────
# The real award names on file (backend/scripts/seed_aima_awards.py) sometimes
# use different wording than the CATEGORY_PROFILE key that best fits them, and
# generic token-overlap scoring can tie or misfire on those specific pairs
# (e.g. "Young Entrepreneur of the Year" tied in score against "Entrepreneur
# of the Year" and lost purely on dict iteration order, silently dropping its
# age calibration). Known real award names are resolved here first — exact,
# no ambiguity; only an unrecognized/custom award name falls through to the
# fuzzy heuristic below.
_EXACT_ALIASES: dict[str, str] = {
    "corporate citizen of the year": "Corporate Citizen Award",
    "young entrepreneur of the year": "Young Entrepreneur Award",
    "business leader of the decade": "Business Leader of the Year",
}


# ── Category matching ──────────────────────────────────────────────────────
# Shared by build_grounded_queries(), get_name_generation_prompt(), and
# get_ranking_prompt() below, and by tier_router.py. A single correct
# implementation, not duplicated per-caller — a plain substring match here
# is a real bug: "india" as a substring matches inside "indian", and a
# single-letter example token like the "N" in "N Chandrasekaran" would
# substring-match almost any text. Whole-word tokenizing avoids both.

import re as _re

_WORD_RE = _re.compile(r"[a-z]+")
_MATCH_STOPWORDS = {"of", "the", "a", "an", "in", "for", "and", "to", "on", "n"}


def _tokenize(text: str) -> set[str]:
    return set(_WORD_RE.findall(text.lower())) - _MATCH_STOPWORDS


def match_category(award_name: str, award_description: str = "") -> str | None:
    """Returns the CATEGORY_PROFILE key that best matches this award, or None
    if nothing scores above zero. Category-name word overlap counts double;
    an example only counts if its FULL name appears as whole words (not any
    single word from it) — so "N Chandrasekaran" only matches text that
    actually contains "chandrasekaran", not any text with a lone "n"."""
    alias = _EXACT_ALIASES.get(award_name.strip().lower())
    if alias:
        return alias

    award_tokens = _tokenize(f"{award_name} {award_description}")

    best_cat, best_score = None, 0
    for cat, profile in CATEGORY_PROFILE.items():
        cat_tokens = _tokenize(cat)
        score = len(cat_tokens & award_tokens) * 2
        for ex in profile.get("examples", [])[:3]:
            ex_tokens = _tokenize(ex)
            if ex_tokens and ex_tokens.issubset(award_tokens):
                score += 1
        if score > best_score:
            best_score, best_cat = score, cat
    return best_cat


# ── Core function: build grounded search queries for each award ───────────────

def build_grounded_queries(
    award_name: str,
    award_description: str,
    num_nominees: int,
    year: int | None = None,
) -> list[str]:
    """
    Returns 6–8 targeted search queries grounded in AIMA history.
    Call this from nominee_discovery.generate_search_queries() instead of
    generating generic queries via Groq.

    Finds the closest matching AIMA category and uses past winners as anchors.
    """
    if year is None:
        from datetime import datetime
        year = datetime.utcnow().year
    matched_category = match_category(award_name, award_description)
    matched_profile = CATEGORY_PROFILE.get(matched_category) if matched_category else None

    examples = (matched_profile or {}).get("examples", [])[:3]
    seniority = (matched_profile or {}).get("seniority", ["CEO", "Chairman", "Founder"])
    entity_type = (matched_profile or {}).get("entity_type", "person")
    age_constraint = (matched_profile or {}).get("age_constraint", "")

    queries = []

    if entity_type == "company":
        company_type = (matched_profile or {}).get("company_type", "Indian company")
        queries = [
            f"top {company_type} India {year} award excellence",
            f"best {award_name} India {year}",
            f"India {company_type} award winner {year} Forbes ET",
            f"outstanding {company_type} India performance recognition {year}",
            f"India {award_name} nominees shortlist {year}",
            f"Economic Times Forbes India {award_name} {year}",
        ]
        # Company examples never got the same "like {anchor}" anchoring the person
        # branch below has — for a narrow/hard-to-word target like "a FOREIGN
        # company's India subsidiary" (MNC in India of the Year), generic
        # "top {company_type} India" queries just surface famous INDIAN companies
        # by sheer web presence, the same fame-bias problem person categories had.
        # Naming real examples directly narrows the search the same way it does
        # for people.
        if examples:
            queries.append(f"companies like {' '.join(examples[:3])} India {year}")
    else:
        seniority_str = " OR ".join(seniority[:3])
        if examples:
            anchor = examples[0]
            queries.append(
                f"India {award_name} {year} like {anchor} senior business leader"
            )
        if matched_category == "Director of the Year":
            # This one AIMA category is a film-industry award, not a business one —
            # every generic template below (Forbes/ET/Business Standard, "CEOs
            # chairmen", "business excellence") actively fights a film search, and
            # "director" itself collides hard with the common corporate title
            # (Managing Director, Executive Director), so live results were coming
            # back as zero real filmmakers, only business executives. Dedicated
            # film-industry queries instead.
            queries += [
                f"best Indian film director {year} Bollywood",
                f"top Indian filmmakers {year} box office critically acclaimed",
                f"Filmfare Award Best Director {year} India",
                f"IMDb top Indian film directors {year}",
                f"Indian cinema directors {year} National Film Award",
                f"Bollywood director {year} blockbuster acclaimed filmmaker",
                f"AIMA Managing India Awards Director of the Year nominees {year}",
            ]
        elif matched_category in ("Outstanding Contribution to Media", "Lifetime Contribution to Media"):
            # Same generic-template bug as Director of the Year above, different
            # symptom: "business excellence"/"CEOs chairmen"/Forbes-Business-
            # Standard phrasing actively dilutes a search for editors/anchors/
            # broadcasters. Confirmed live — "Lifetime Contribution to Media"
            # extracted only 2 raw candidate names total across all rounds before
            # this fix, when dozens of real senior Indian journalists exist.
            queries += [
                f"veteran Indian journalist editor {year} lifetime achievement",
                f"top Indian news anchor editor-in-chief {year}",
                f"Ramnath Goenka Award {year} India journalism",
                f"Padma Shri Padma Bhushan journalist India {year}",
                f"senior Indian broadcast media leader {year} news",
                f"India Today CNN-News18 NDTV senior editor {year}",
                f"AIMA Managing India Awards {matched_category} nominees {year}",
            ]
        elif age_constraint:
            # Award has an age ceiling (e.g. Young Entrepreneur) — generic "top Indian
            # business leader" queries reliably surface famous-but-decades-too-old
            # names (Ambani, Premji) regardless of an incidental "Young" in the award
            # title, since they dominate Indian business search results by sheer web
            # presence. Bias explicitly toward age-qualified phrasing instead.
            queries += [
                f"young Indian startup founders {age_constraint.lower()} {year}",
                f"Forbes India 30 under 30 entrepreneurs {year}",
                f"India young founder {age_constraint.lower()} startup {year}",
                f"top Indian entrepreneurs {age_constraint.lower()} Economic Times {year}",
                f"Indian startup founder aged {age_constraint.lower()} funding {year}",
                f"YourStory Inc42 young founders India {age_constraint.lower()} {year}",
                f"AIMA Managing India Awards {matched_category or award_name} nominees {year}",
            ]
        else:
            queries += [
                f"top Indian {seniority_str} {award_name} {year}",
                f"India best {award_name} nominees {year} Forbes Business Today",
                f"Indian {' '.join(seniority[:2])} award {year} business excellence",
                f"Economic Times India {award_name} {year} top leader",
                f"Forbes India powerful CEOs chairmen {year} {award_name}",
                f"Business Standard India top {seniority[0]} {year} award nominee",
                f"AIMA Managing India Awards {matched_category or award_name} nominees {year}",
            ]

    # Always add one AIMA-specific query
    queries.append(f"site:aima.in OR site:economictimes.com {award_name} India {year}")

    return queries[:8]


# ── Groq system prompts: use these in name_generator.py and nominee_discovery.py

def get_name_generation_prompt(
    award_name: str,
    award_description: str,
    evaluation_criteria: list[str],
    num_nominees: int,
    entity_type: str,
) -> str:
    """
    Returns a precision system+user prompt for Groq name generation.
    Grounded in AIMA historical winners to calibrate the output quality.
    """
    # Find matching category profile
    matched_category = match_category(award_name, award_description)
    matched_profile = CATEGORY_PROFILE.get(matched_category) if matched_category else None

    examples = (matched_profile or {}).get("examples", [])
    seniority = (matched_profile or {}).get("seniority", ["CEO", "Chairman", "Founder"])
    not_these = (matched_profile or {}).get("not", [])

    # Past winners as calibration anchors
    past_winners_str = ""
    winners = AIMA_WINNERS_BY_CATEGORY.get(matched_category, []) if matched_category else []
    if winners:
        past = [f"{w['name']} ({w['role']}, {w['org']}, {w['year']})" for w in winners[:4]]
        past_winners_str = f"\nPast AIMA winners in similar category: {', '.join(past)}"

    criteria_str = ", ".join(evaluation_criteria) if evaluation_criteria else "leadership, impact, governance"
    examples_str = ", ".join(examples[:4]) if examples else "Mukesh Ambani, N Chandrasekaran, Azim Premji"
    not_str = ", ".join(not_these[:3]) if not_these else ""

    if entity_type == "company":
        company_type = (matched_profile or {}).get("company_type", "Indian company")
        return f"""You are a senior research analyst for the AIMA Managing India Awards — India's most prestigious management award.

Award: "{award_name}"
Description: {award_description}
Evaluation Criteria: {criteria_str}
{past_winners_str}

Generate exactly {num_nominees * 3} REAL, VERIFIABLE Indian {company_type} names.

MANDATORY RULES:
1. Only REAL organisations that exist and operate in India right now (2025)
2. Must match the award category EXACTLY: {company_type}
3. Must have Wikipedia page OR major news coverage (ET, Business Standard, Forbes India)
4. Scale calibration: similar to past winners — large, well-known Indian entities
5. NO startups unless the award explicitly says startup/emerging
6. NO foreign companies unless the award says MNC
7. NO government ministries or regulatory bodies
8. Return ONLY a JSON array of organisation names — no explanations

Return JSON array only: ["Company 1", "Company 2", ...]"""

    else:
        return f"""You are a senior research analyst for the AIMA Managing India Awards — India's most prestigious management award, held annually since 2010.

Award: "{award_name}"
Description: {award_description}
Evaluation Criteria: {criteria_str}
{past_winners_str}

Generate exactly {num_nominees * 3} REAL Indian business leaders who match this specific award.

MANDATORY RULES:
1. ONLY real, living, currently active Indian people (born in India or primary career in India)
2. Seniority level: {', '.join(seniority)} — NOT mid-level managers
3. Organisation scale: {(matched_profile or {}).get('org_scale', 'large Indian company or conglomerate')}
4. Quality calibration — nominees must be at the same level as: {examples_str}
5. Must have Wikipedia page OR coverage in ET/Forbes India/Business Standard/Business Today
6. STRICTLY INDIAN: Primary known for work in India. DO NOT include:
   - Sundar Pichai, Satya Nadella, Indra Nooyi (based in USA, not India)
   - Politicians, ministers, bureaucrats
   - Cricketers, film stars (unless award is specifically for them)
   - {not_str if not_str else "people outside the award's scope"}
7. Diversity: include women leaders, regional industry leaders (not just Mumbai/Delhi)
8. NO hallucinated names — if unsure whether someone exists, exclude them

Return ONLY a JSON array of {num_nominees * 3} full names. No explanations, no numbering.
["Name 1", "Name 2", ...]"""


def get_ranking_prompt(
    award_name: str,
    award_description: str,
    criteria: list[str],
    candidate_briefs: list[dict],
    target_count: int,
) -> str:
    """
    Returns a precision ranking prompt for Groq dossier builder.
    Forces strict Indian + seniority filtering at ranking stage too.
    """
    matched_category = match_category(award_name, award_description)
    matched_profile = CATEGORY_PROFILE.get(matched_category) if matched_category else None

    examples = (matched_profile or {}).get("examples", [])[:3]
    not_these = (matched_profile or {}).get("not", [])[:3]
    examples_str = ", ".join(examples) if examples else "top Indian business leaders"
    not_str = ", ".join(not_these) if not_these else ""

    import json
    briefs_json = json.dumps(candidate_briefs, indent=2)

    return f"""You are a senior AIMA jury researcher. Select and rank nominees for:

Award: "{award_name}"
Description: {award_description}
Criteria: {", ".join(criteria)}

Quality benchmark: Past AIMA winners in this category include {examples_str}.
{f'Exclude: {not_str}' if not_str else ''}

CANDIDATES:
{briefs_json}

SELECTION RULES:
1. ONLY select people whose Wikipedia bio or news confirms they are:
   - Indian (born/based in India, primary career in India)
   - At the seniority level appropriate for AIMA awards (Chairman, MD, CEO, Founder of large org)
   - Genuinely relevant to "{award_name}" — not just famous Indians
2. confidence_score = 0.0–1.0 based on fit to THIS specific award (not general fame)
3. A widely known but irrelevant person scores LOW (e.g. a cricketer for a business award)
4. Write rationale using ONLY facts from the bio — do not invent achievements
5. Return exactly {target_count} candidates, best-first

Return ONLY a valid JSON array of {target_count} objects:
[{{"id":"...","rank":1,"rationale":"Two specific sentences from their bio.","confidence_score":0.87}}]
Raw JSON only, no markdown."""