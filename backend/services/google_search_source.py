"""
google_search_source.py
──────────────────────────
Google Programmable Search (Custom Search JSON API) as a secondary name
source, run alongside list_scraper.py's curated lists and research_engine's
own Tavily/DuckDuckGo search. Names are pulled from result snippets with the
same deterministic regex extraction used everywhere else in this pipeline —
deliberately not a Groq call, so this source never invents a name and never
competes with dossier writing for the account's (often tight) Groq token
budget.

Requires GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX in config.py/.env — a
Programmable Search Engine ID from https://programmablesearchengine.google.com.
No-ops (returns []) if either is unset.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from config import settings
from services.name_extraction import extract_names

logger = logging.getLogger(__name__)

GOOGLE_CSE_URL = "https://www.googleapis.com/customsearch/v1"
TIMEOUT = httpx.Timeout(15.0, connect=5.0)


def _build_queries(
    award_name: str, tier_label: str, matched_category: str | None, age_constraint: str = "",
) -> list[str]:
    if age_constraint:
        # An age ceiling means "top {tier_label}" queries reliably surface famous but
        # wrong-age names (Ambani, Premji) — bias explicitly toward the age range instead.
        queries = [
            f"India young entrepreneurs {age_constraint.lower()} 2025 2026",
            f"Forbes India 30 under 30 {award_name}",
            f"India startup founder {age_constraint.lower()} nominees list",
        ]
    else:
        queries = [
            f"{award_name} India 2025 2026 nominees",
            f"top {tier_label} India 2025 Forbes Economic Times",
            f"India best {award_name} 2024 2025 list",
        ]
    if matched_category:
        queries.append(f"AIMA Managing India Awards {matched_category} nominees")
    return queries


async def _search_one(query: str, client: httpx.AsyncClient) -> list[dict]:
    try:
        r = await client.get(
            GOOGLE_CSE_URL,
            params={
                "key": settings.GOOGLE_SEARCH_API_KEY,
                "cx": settings.GOOGLE_SEARCH_CX,
                "q": query,
                "num": 10,
            },
            timeout=TIMEOUT,
        )
        if r.status_code != 200:
            logger.debug("Google CSE HTTP %d for '%s': %s", r.status_code, query, r.text[:200])
            return []
        return r.json().get("items", [])
    except Exception as exc:
        logger.debug("Google CSE failed for '%s': %s", query, exc)
        return []


async def search_candidates(
    award_name: str,
    entity_type: str,
    tier_label: str = "",
    matched_category: str | None = None,
    age_constraint: str = "",
) -> list[dict]:
    """Returns deduped [{"name":..., "snippet":..., "source_url":...}]."""
    if not settings.GOOGLE_SEARCH_API_KEY or not settings.GOOGLE_SEARCH_CX:
        logger.info("google_search_source: GOOGLE_SEARCH_API_KEY/CX not configured — skipping")
        return []

    queries = _build_queries(award_name, tier_label or entity_type, matched_category, age_constraint)

    out: dict[str, dict] = {}
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[_search_one(q, client) for q in queries], return_exceptions=True
        )

        for items in results:
            if not isinstance(items, list):
                continue
            for item in items:
                snippet = f"{item.get('title', '')} {item.get('snippet', '')}"
                url = item.get("link", "")
                for name in extract_names(snippet, entity_type):
                    key = name.lower()
                    if key not in out:
                        out[key] = {"name": name, "snippet": snippet[:200], "source_url": url}

    logger.info("google_search_source: %d unique candidates from %d queries", len(out), len(queries))
    return list(out.values())
