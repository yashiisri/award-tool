"""
entity_classifier.py
───────────────────────
Deterministic entity-type classification. This is the authority on whether a
discovered name is a PERSON — the LLM is never consulted here and can never
override this result, no matter how "famous" an organization is. This module
is what stands between the research pipeline and returning a company as if
it were a nominee.

Layered, in order:
  1. Known-organization / all-caps-acronym gazetteer  -> ORGANIZATION
  2. Company-suffix pattern or known-company gazetteer -> COMPANY
  3. Person-name shape heuristic (reused from candidate_extractor)
     -> PERSON if it passes, UNKNOWN otherwise
"""

import re
from enum import Enum


class EntityType(str, Enum):
    PERSON = "PERSON"
    COMPANY = "COMPANY"
    ORGANIZATION = "ORGANIZATION"
    PRODUCT = "PRODUCT"
    AWARD = "AWARD"
    LOCATION = "LOCATION"
    UNKNOWN = "UNKNOWN"


# Well-known Indian and international public institutions / government bodies —
# not companies, but still never a person.
KNOWN_ORGANIZATIONS = {
    "isro", "drdo", "ongc", "lic", "sbi", "bhel", "ntpc", "sail", "gail",
    "nasa", "who", "unesco", "reserve bank of india", "rbi", "sebi", "trai",
    "niti aayog", "aiims", "iit", "iim", "aima",
    "hindustan aeronautics limited", "hindustan aeronautics",
    "indian oil corporation", "indian oil", "indian space research organisation",
}

# Well-known companies — including ones with no "Ltd/Inc/Corp" suffix in
# casual usage, so a suffix check alone would miss them.
KNOWN_COMPANIES = {
    "infosys", "tcs", "tata consultancy services", "wipro", "reliance",
    "reliance industries", "serum institute of india", "serum institute",
    "hcl", "hcltech", "itc", "bharti airtel", "airtel", "apollo tyres",
    "apollo hospitals", "tata sons", "bharti enterprises", "vedanta",
    "dream11", "dream sports", "nykaa", "oyo", "oyo rooms", "ola", "ola cabs",
    "ather energy", "bajaj finserv", "bajaj auto", "hindustan unilever", "hul",
    "asian paints", "abb india", "mahindra & mahindra", "mahindra and mahindra",
    "coca-cola india", "coca cola india", "morgan stanley", "jpmorgan chase",
    "jpmorgan chase & co", "goldman sachs", "microsoft", "google", "amazon",
    "apple", "meta", "narayana hrudalaya",
}

COMPANY_SUFFIXES = {
    "ltd", "limited", "inc", "incorporated", "corp", "corporation", "llc",
    "llp", "pvt", "co", "company", "group", "holdings", "enterprises",
    "technologies", "industries", "international", "solutions", "systems",
    "partners", "ventures", "capital", "labs", "motors", "airlines", "bank",
    "insurance", "pharma", "pharmaceuticals", "sons",
    # "<Brand> India" / "<Brand> Global" etc. is an extremely common company
    # naming pattern (Dabur India, Coca-Cola India, Nike India, Google India)
    # and essentially never a person's actual second name.
    "india", "global", "worldwide",
}

_HONORIFICS = {"mr", "mrs", "ms", "dr", "shri", "smt", "sir", "prof"}

# These three sets are the single source of truth for "does this capitalized
# phrase look like a person's name" — candidate_extractor.py imports them
# rather than keeping its own copies, specifically so a fix made here (like
# adding "influential" after it slipped through as a name) can't drift out of
# sync between the two call sites again.
NOT_NAMES = {
    "the", "and", "for", "with", "this", "that", "from", "about", "into",
    "new", "top", "best", "how", "why", "what", "when", "where", "who",
    "read", "more", "click", "here", "home", "page", "news", "today",
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "in", "on", "at", "of", "to", "is", "are", "was", "were", "a", "an",
    "or", "by", "as", "its", "his", "her", "their", "our", "your", "not",
    "but", "so", "than", "then", "will", "can", "could", "would", "should",
    # Superlative/descriptive words that headlines love ("Most Influential
    # CEOs of 2026") but that are never part of an actual person's name.
    "most", "influential", "leading", "powerful", "notable", "prominent",
}

GENERIC_WORDS = {
    "finance", "financial", "executive", "search", "degrees", "degree",
    "officer", "director", "board", "committee", "council", "global",
    "group", "corporate", "leadership", "management", "business",
    "companies", "company", "industry", "industries", "award", "awards",
    "foundation", "institute", "association", "university", "college",
    "school", "program", "programs", "service", "services", "solutions",
    "partners", "capital", "ventures", "holdings", "international",
    "national", "worldwide", "digital", "technology", "technologies",
    "innovation", "innovations", "banking", "investment", "investments",
    "enterprise", "enterprises", "consulting", "advisory", "advisors",
    "team", "teams", "network", "networks", "media", "report", "reports",
    "guide", "insights", "data", "research", "development", "strategy",
    "strategic", "growth", "market", "markets", "world", "review",
    "magazine", "journal", "excellence", "recognition", "profile",
    # Startup-incubator / accelerator naming pattern ("iHub Awadh", "T-Hub")
    # — an organization, never a person.
    "hub", "ihub", "incubator", "accelerator",
}

ROLE_WORDS = {
    "ceo", "chief", "executive", "chairman", "chairperson", "chair",
    "founder", "president", "director", "billionaire", "industrialist",
    "entrepreneur", "vice", "coo", "cfo", "cto", "officer", "operating",
    "financial", "technology", "managing", "partner", "advisor", "coach",
}


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().lower().rstrip(".,")


def _looks_like_person_name(name: str) -> bool:
    words = name.split()
    if not (2 <= len(words) <= 4):
        return False
    lower_words = [_norm(w) for w in words]
    if any(w in NOT_NAMES for w in lower_words):
        return False
    if any(w in GENERIC_WORDS for w in lower_words):
        return False
    if any(w in ROLE_WORDS for w in lower_words):
        return False
    if any(w.rstrip(".,") in COMPANY_SUFFIXES for w in lower_words):
        return False
    if any(w.isupper() and len(w) > 2 for w in words):
        return False
    if all(len(w) <= 2 for w in words):
        return False
    if len(lower_words) != len(set(lower_words)):
        return False
    return True


def classify(name: str) -> EntityType:
    """Classify a discovered name. Deterministic — no LLM involved."""
    if not name or not name.strip():
        return EntityType.UNKNOWN

    key = _norm(name)

    # A bare all-caps acronym (ISRO, DRDO, NASA...) is never a person.
    stripped = name.strip()
    if stripped.isupper() and 2 <= len(stripped) <= 8 and stripped.isalpha():
        return EntityType.ORGANIZATION

    if key in KNOWN_ORGANIZATIONS:
        return EntityType.ORGANIZATION
    if key in KNOWN_COMPANIES:
        return EntityType.COMPANY

    words = key.split()
    if any(w.rstrip(".,&") in COMPANY_SUFFIXES for w in words):
        return EntityType.COMPANY
    # Substring containment covers e.g. "Serum Institute of India Pvt Ltd" variants
    if any(company in key or key in company for company in KNOWN_COMPANIES):
        return EntityType.COMPANY
    if any(org in key or key in org for org in KNOWN_ORGANIZATIONS):
        return EntityType.ORGANIZATION

    if _looks_like_person_name(stripped):
        return EntityType.PERSON

    return EntityType.UNKNOWN


def is_person(name: str) -> bool:
    return classify(name) == EntityType.PERSON
