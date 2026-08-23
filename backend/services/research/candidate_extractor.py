"""
candidate_extractor.py
────────────────────────
Extracts candidate PEOPLE from real search results only. The LLM is never
used here — every name, role, and organization comes directly from the
title/snippet/content of a retrieved SearchResult. If evidence doesn't
mention a person, they don't become a candidate.
"""

import re
from datetime import datetime, timezone

from services.research.search_provider import SearchResult


def _clean(text: str) -> str:
    """Collapse whitespace/newlines so name-detection regexes can't match
    garbage spanning what were originally separate lines."""
    return re.sub(r"\s+", " ", text or "").strip()

NAME_RE = re.compile(r"\b([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){1,3})\b")

ROLE_KEYWORDS = [
    "ceo", "chief executive", "chairman", "chairperson", "chair", "founder",
    "co-founder", "managing director", "president", "director", "billionaire",
    "industrialist", "entrepreneur", "vice chairman", "group chairman",
    "executive chairman", "chief operating officer", "coo", "cfo",
    "chief financial officer", "chief technology officer", "cto",
]

ROLE_RE = re.compile(
    r"\b(CEO|Chief Executive Officer|Chairman|Chairperson|Founder|Co-Founder|"
    r"Managing Director|President|Director|Industrialist|Billionaire|"
    r"CTO|CFO|COO|Vice Chairman|Group Chairman|Executive Chairman)\b",
    re.IGNORECASE,
)

ORG_RE = re.compile(
    r"(?:of|at|,)\s+([A-Z][A-Za-z0-9\s&\-\.]{2,40}?)(?:\s*[,\.\n]|\s+(?:said|has|is|was|will|to|in|on|for))",
)

NOT_NAMES = {
    "the", "and", "for", "with", "this", "that", "from", "about", "into",
    "new", "top", "best", "how", "why", "what", "when", "where", "who",
    "read", "more", "click", "here", "home", "page", "news", "today",
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    # Small connector words that headlines/title-case text often capitalize
    # mid-phrase (e.g. "Anaplan In Fortune") — never part of a person's name.
    "in", "on", "at", "of", "to", "is", "are", "was", "were", "a", "an",
    "or", "by", "as", "its", "his", "her", "their", "our", "your", "not",
    "but", "so", "than", "then", "will", "can", "could", "would", "should",
}

# Suffixes/words that mark a phrase as an organization, not a person
ORG_SUFFIXES = {
    "corp", "corporation", "inc", "incorporated", "ltd", "llc", "co",
    "group", "holdings", "enterprises", "technologies", "industries",
    "international", "global", "solutions", "systems", "partners",
    "ventures", "capital", "robotics", "labs", "motors", "airlines",
    "bank", "insurance", "pharma", "pharmaceuticals",
}

# Generic capitalized business/topic words that regularly appear at the start
# of title-case phrases but are never themselves part of a person's name —
# without this, phrases like "Finance Executive Search" or "Finance Degrees
# Finance" get misread as names just because they're capitalized and sit near
# a role keyword.
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
}

# Individual words pulled from ROLE_KEYWORDS phrases — a captured "name"
# containing one of these is a role/title fragment, not a person.
ROLE_WORDS = {
    "ceo", "chief", "executive", "chairman", "chairperson", "chair",
    "founder", "president", "director", "billionaire", "industrialist",
    "entrepreneur", "vice", "coo", "cfo", "cto", "officer", "operating",
    "financial", "technology", "managing",
}


def _valid_name(name: str) -> bool:
    words = name.split()
    if not (2 <= len(words) <= 4):
        return False
    lower_words = [w.lower().rstrip(".,") for w in words]
    if any(w in NOT_NAMES for w in lower_words):
        return False
    if any(w in ORG_SUFFIXES for w in lower_words):
        return False
    if any(w in GENERIC_WORDS for w in lower_words):
        return False
    if any(w in ROLE_WORDS for w in lower_words):
        return False
    if any(w.isupper() and len(w) > 2 for w in words):
        return False
    if all(len(w) <= 2 for w in words):
        return False
    if len(lower_words) != len(set(lower_words)):
        return False  # real names don't repeat a word ("Finance Degrees Finance")
    return True


def _looks_high_profile(text: str, role_keywords: list[str]) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in role_keywords)


def _extract_role(text: str) -> str:
    m = ROLE_RE.search(text)
    return m.group(1) if m else ""


_ORG_CONNECTORS = {"of", "the", "and", "for", "in", "at", "on", "&"}


def _looks_like_org_name(candidate: str) -> bool:
    """Reject captures where the regex ran on past the organization name into
    surrounding prose — every word should be capitalized, a number, or a
    small connector, never a stray lowercase verb/pronoun like 'or'/'are'."""
    words = candidate.split()
    if not words:
        return False
    for w in words:
        bare = w.strip(".,&")
        if not bare:
            continue
        if bare.lower() in _ORG_CONNECTORS:
            continue
        if bare[0].isupper() or bare.isdigit():
            continue
        return False
    return True


def _extract_org(text: str) -> str:
    for m in ORG_RE.finditer(text[:500]):
        candidate = m.group(1).strip().rstrip(",.")
        if len(candidate) > 3 and candidate[0].isupper() and _looks_like_org_name(candidate):
            return candidate
    return ""


def extract_candidates(results: list[SearchResult], role_keywords: list[str] | None = None) -> list[dict]:
    """
    Extract raw candidate mentions from a batch of search results.

    Returns a list of mentions matching:
      { name, designation, organization, location, industry,
        candidate_sources: [...], evidence: [...] }

    Each mention is tied to at least one real source — nothing here is
    invented. Multiple mentions of the same name (even across results) are
    kept separate; merging is entity_resolver's job.
    """
    role_keywords = role_keywords or ROLE_KEYWORDS
    mentions: list[dict] = []

    for r in results:
        title = _clean(r.title)
        snippet = _clean(r.snippet or r.content[:400])
        text = f"{title} {snippet}"
        if not _looks_high_profile(text, role_keywords):
            continue

        found_names: list[str] = []

        # "Name, Role" or "Name - Role" pattern at the start of a title
        m = re.match(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})[,:\-–]", title)
        if m and _valid_name(m.group(1)):
            found_names.append(m.group(1))

        for match in NAME_RE.finditer(text):
            candidate = match.group(1)
            if _valid_name(candidate) and candidate not in found_names:
                found_names.append(candidate)

        if not found_names:
            continue

        role = _extract_role(text)
        org = _extract_org(text)
        source = {
            "url": r.url,
            "title": title,
            "domain": r.domain,
        }

        for name in found_names[:3]:  # a single article rarely profiles more than a few people
            mentions.append({
                "name": name,
                "designation": role,
                "organization": org,
                "location": "",
                "industry": "",
                "candidate_sources": [source],
                "evidence": [{
                    "source_url": r.url,
                    "source_title": title,
                    "source_domain": r.domain,
                    "published_date": r.published_date,
                    "evidence_text": snippet,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }],
            })

    return mentions
