"""
search_service.py
─────────────────
Web search helpers and candidate extraction.

Wikipedia calls are delegated to wikipedia_service.py (which handles
User-Agent, retries, and error logging).

DuckDuckGo is used as a supplementary source — failures are silently
swallowed so the pipeline never crashes.
"""

import asyncio
import logging
import re
import urllib.parse

import httpx

from services.wikipedia_service import (
    fetch_summary,
    search_pages,
    batch_fetch_summaries,
)

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

DDGO_URL = "https://html.duckduckgo.com/html/"
TIMEOUT  = httpx.Timeout(15.0, connect=5.0)

# Keywords that indicate a high-profile business leader
HIGH_PROFILE_TITLE_KEYWORDS = [
    "ceo", "chief executive", "chairman", "chairperson", "chair",
    "founder", "co-founder", "managing director", "md", "president",
    "billionaire", "industrialist", "entrepreneur", "director",
    "vice chairman", "group chairman", "executive chairman",
    "chief operating officer", "coo", "cfo", "chief financial",
]

# Keywords that indicate a small/local business — used to EXCLUDE
EXCLUDE_KEYWORDS = [
    "small business", "local business", "boutique", "freelancer",
    "self-employed", "sole proprietor", "micro enterprise", "home-based",
]

# Minimum Wikipedia summary length for a candidate to be considered credible
MIN_WIKI_SUMMARY_LEN = 150

# ── Re-export wikipedia helpers so existing callers don't break ───────────────
fetch_wikipedia_summary       = fetch_summary
wikipedia_search              = search_pages
enrich_candidates_with_wikipedia = None   # replaced below — see function


# ── DuckDuckGo ────────────────────────────────────────────────────────────────

async def duckduckgo_search(query: str, max_results: int = 10) -> list[dict]:
    """
    Search DuckDuckGo HTML endpoint.
    Returns list of {title, url, snippet} dicts.
    Never raises — returns [] on any failure.
    """
    params  = {"q": query, "kl": "us-en", "s": "0"}
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.post(DDGO_URL, data=params, headers=headers)
            resp.raise_for_status()
            html = resp.text
    except httpx.HTTPError as exc:
        logger.warning("DuckDuckGo failed for '%s': %s", query, exc)
        return []

    title_pat   = re.compile(r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL | re.IGNORECASE)
    snippet_pat = re.compile(r'class="result__snippet"[^>]*>(.*?)</a>',              re.DOTALL | re.IGNORECASE)

    titles   = title_pat.findall(html)
    snippets = [re.sub(r"<[^>]+>", "", s).strip() for s in snippet_pat.findall(html)]

    results = []
    for i, (url, title) in enumerate(titles[:max_results]):
        clean_title = re.sub(r"<[^>]+>", "", title).strip()
        snippet     = snippets[i] if i < len(snippets) else ""

        # Decode DuckDuckGo redirect URLs
        if url.startswith("//duckduckgo.com/l/?"):
            qs  = urllib.parse.parse_qs(urllib.parse.urlparse("https:" + url).query)
            url = qs.get("uddg", [url])[0]

        results.append({"title": clean_title, "url": url, "snippet": snippet})

    logger.debug("DuckDuckGo '%s' → %d results", query, len(results))
    return results


# ── Candidate name extraction from search results ─────────────────────────────

_NAME_RE   = re.compile(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b")
_SKIP_NAMES = {
    "United States", "New York", "Los Angeles", "San Francisco",
    "New Delhi", "Mumbai India", "South Asia", "North America",
    "Chief Executive", "Managing Director", "Executive Chairman",
    "Vice President", "Board Director", "Annual Report",
    "Forbes India", "Economic Times", "Business Today",
    "Fortune India", "Times India",
}


def _looks_like_high_profile(title: str, snippet: str) -> bool:
    combined    = (title + " " + snippet).lower()
    has_title   = any(kw in combined for kw in HIGH_PROFILE_TITLE_KEYWORDS)
    has_exclude = any(kw in combined for kw in EXCLUDE_KEYWORDS)
    return has_title and not has_exclude


def extract_candidate_names_from_results(results: list[dict]) -> list[str]:
    """Extract candidate names from DuckDuckGo / Wikipedia search result dicts."""
    names: list[str] = []
    seen:  set[str]  = set()

    for r in results:
        title   = r.get("title", "")
        snippet = r.get("snippet", "")

        if not _looks_like_high_profile(title, snippet):
            continue

        # Title is often "Person Name - Role at Company"
        name_part = title.split(" - ")[0].split(" | ")[0].strip()
        for kw in ["CEO", "Chairman", "Founder", "MD", "President", "Director"]:
            name_part = re.sub(rf"\b{kw}\b.*", "", name_part, flags=re.IGNORECASE).strip()

        if name_part and len(name_part.split()) >= 2 and name_part not in _SKIP_NAMES:
            key = name_part.lower()
            if key not in seen:
                seen.add(key)
                names.append(name_part)
            continue

        # Fallback: scan snippet for capitalised names
        for match in _NAME_RE.finditer(snippet):
            candidate = match.group(1)
            if candidate not in _SKIP_NAMES and len(candidate.split()) >= 2:
                key = candidate.lower()
                if key not in seen:
                    seen.add(key)
                    names.append(candidate)

    return names


# ── Role / organisation extraction from Wikipedia summary ─────────────────────

_ROLE_PATTERNS = [
    re.compile(
        r"(?:is|was|serves? as|served as|appointed as|became)\s+(?:the\s+)?"
        r"((?:(?:Executive|Group|Non-Executive|Independent|Managing|Deputy|Vice|Co-)\s+)?"
        r"(?:Chairman|Chairperson|CEO|Chief Executive Officer|Founder|Co-Founder|"
        r"Managing Director|President|Director|Industrialist|Billionaire|"
        r"Chief Operating Officer|Chief Financial Officer))",
        re.IGNORECASE,
    ),
    re.compile(
        r"((?:Executive|Group|Non-Executive|Independent|Managing|Deputy|Vice|Co-)\s+)?"
        r"(Chairman|Chairperson|CEO|Chief Executive Officer|Founder|Co-Founder|"
        r"Managing Director|President|Director|Industrialist|Billionaire)"
        r"\s+(?:of|at)\s+([A-Z][A-Za-z0-9\s&,\.]+)",
        re.IGNORECASE,
    ),
]

_ORG_PATTERNS = [
    re.compile(
        r"(?:of|at|for)\s+([A-Z][A-Za-z0-9\s&,\.]{2,40}?)(?:\s*[,\.]|\s+(?:and|in|is|was|has))",
        re.IGNORECASE,
    ),
]


def extract_role_and_org(wiki_summary: str, person_name: str) -> tuple[str, str]:
    """Extract (role, organisation) from a Wikipedia summary string."""
    role = ""
    org  = ""

    for pat in _ROLE_PATTERNS:
        m = pat.search(wiki_summary)
        if m:
            role = m.group(0)
            role = re.sub(
                r"^(?:is|was|serves? as|served as|appointed as|became)\s+(?:the\s+)?",
                "", role, flags=re.IGNORECASE,
            ).strip()
            role = role.split(" of ")[0].split(" at ")[0].strip()
            if len(role) < 60:
                break

    for pat in _ORG_PATTERNS:
        for m in pat.finditer(wiki_summary[:500]):
            candidate_org = m.group(1).strip().rstrip(",.")
            if (
                len(candidate_org) > 3
                and candidate_org[0].isupper()
                and candidate_org.lower() not in {"india", "the", "a", "an", "his", "her"}
                and person_name.split()[0].lower() not in candidate_org.lower()
            ):
                org = candidate_org
                break
        if org:
            break

    return role or "Business Leader", org or "Major Corporation"


# ── Batch Wikipedia enrichment ────────────────────────────────────────────────

async def enrich_candidates_with_wikipedia(names: list[str]) -> list[dict]:
    """
    Fetch Wikipedia summaries for all names concurrently (via wikipedia_service).
    Returns only candidates that have a valid, substantial Wikipedia page
    and look like high-profile business leaders.
    """
    summaries = await batch_fetch_summaries(names)

    candidates = []
    for name, summary in summaries.items():
        if summary is None:
            continue

        extract     = summary.get("extract", "")
        description = summary.get("description", "")
        combined    = (extract + " " + description).lower()

        # Must look like a business person
        if not any(kw in combined for kw in HIGH_PROFILE_TITLE_KEYWORDS):
            continue

        # Must NOT look like a small/local business person
        if any(kw in combined for kw in EXCLUDE_KEYWORDS):
            continue

        role, org = extract_role_and_org(extract, name)

        wiki_url = summary.get("wiki_url", "")
        candidates.append({
            "name":              summary["title"],
            "role":              role,
            "organization":      org,
            "wikipedia_summary": extract[:800],
            "wikipedia_url":     wiki_url,
            "photo_url":         summary.get("thumbnail_url", ""),
            "description":       description,
            "source_links":      [wiki_url] if wiki_url else [],
            "confidence_score":  0.0,
            "relevance_reason":  "",
        })

    return candidates
