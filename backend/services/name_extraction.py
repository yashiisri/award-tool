"""
name_extraction.py
────────────────────
Deterministic, regex-based candidate-name extraction — shared by every
candidate source (research_engine.py's own Tavily/DuckDuckGo search,
list_scraper.py's curated-list scraping, google_search_source.py's Google
Custom Search results). Pulled out of research_engine.py into its own module
so the new sources can reuse it without a circular import.

No LLM involved — a name only ever enters the pipeline because it was
actually printed in real fetched text.
"""

import re

_CANDIDATE_RE = re.compile(r"\b([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){1,3})\b")

_STOPWORDS = {
    "india", "indian", "top", "best", "new", "the", "a", "an", "this", "that",
    "forbes", "fortune", "business", "leader", "leaders", "award", "awards",
    "year", "years", "list", "chief", "executive", "officer", "chairman",
    "chairperson", "managing", "director", "group", "company", "companies",
    "national", "international", "global", "economic", "times", "today",
    "news", "world", "management", "association", "foundation", "corporation",
    "limited", "private", "public", "government", "ministry", "startup",
    "ceo", "cfo", "coo", "cto", "president", "founder", "co-founder",
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai",
    "kolkata", "pune", "ahmedabad", "jaipur", "surat", "gurugram", "gurgaon",
    # List/headline-title words ("Young Achievers", "40 Under 40", "Young
    # Entrepreneurs") — real generic phrases, never a person's actual name.
    "young", "achievers", "achiever", "entrepreneur", "entrepreneurs", "under",
    "emerging", "rising", "stars", "innovators", "trailblazers", "changemakers",
    # Web-page UI/chrome boilerplate — a repeated button/footer label (e.g. "Add
    # Logo Now") can accidentally match the proper-noun-sequence regex and, if it
    # repeats across enough scraped pages, outrank real names by frequency. Only
    # matters when the real candidate pool is thin enough that the relaxed-fill
    # pass reaches for low-mention-count names — caught live as "Logo Add Now"
    # occupying a real nominee slot for Young Entrepreneur of the Year.
    "logo", "add", "now", "click", "menu", "subscribe", "sign", "login",
    "signup", "search", "share", "comment", "comments", "advertisement",
    "sponsored", "cookie", "cookies", "privacy", "terms", "policy", "read",
    "more", "continue", "reading", "download", "register", "submit",
}

_COMPANY_HINT_RE = re.compile(
    r"\b[A-Z][A-Za-z0-9&\-]*(?:\s+[A-Z][A-Za-z0-9&\-]*){0,4}\s+"
    r"(?:Ltd|Limited|Inc|Technologies|Industries|Group|Motors|Enterprises|"
    r"Pharma|Pharmaceuticals|Bank|Airlines|Energy|Solutions|Systems)\b"
)


def looks_like_person_name(words: list[str]) -> bool:
    if len(words) < 2 or len(words) > 4:
        return False
    if not all(w[0].isupper() and len(w) >= 2 for w in words):
        return False
    if any(w.lower() in _STOPWORDS for w in words):
        return False
    if any(c.isdigit() for c in " ".join(words)):
        return False
    return True


def extract_names(text: str, entity_type: str) -> list[str]:
    """Extract candidate person/company names directly from real text — no LLM."""
    names: list[str] = []
    if entity_type in ("person", "both"):
        for m in _CANDIDATE_RE.finditer(text):
            candidate = m.group(1)
            if looks_like_person_name(candidate.split()):
                names.append(candidate)
    if entity_type in ("company", "both"):
        for m in _COMPANY_HINT_RE.finditer(text):
            names.append(m.group(0).strip())
    return names
