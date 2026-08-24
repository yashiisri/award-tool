"""
newsapi_source.py
────────────────────
Recent-news enrichment via NewsAPI (newsapi.org, free tier — 100 requests/day).
Only called for candidates that have ALREADY passed Wikipedia verification —
the free-tier quota is small, so it's spent on real, qualifying nominees, not
on the much larger raw candidate pool.

Gives dossier_builder.py real, recent (last ~30 days) headline/description
text to write "recent achievement" bullets from, instead of the LLM having
to rely on Wikipedia alone (which can lag current events by months or years).
Fails open everywhere — no key, no results, or an API error all just mean
"no news text for this candidate," never a pipeline failure.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from config import settings

logger = logging.getLogger(__name__)

NEWS_API_URL = "https://newsapi.org/v2/everything"
TIMEOUT = httpx.Timeout(10.0, connect=5.0)

# Free tier is 100 req/day — cap concurrent usage so one search can't burn
# through most of the day's quota by itself.
_SEMAPHORE = asyncio.Semaphore(5)


async def fetch_recent_news(name: str, entity_type: str) -> str:
    """Returns a short joined blob of recent headline+description snippets
    mentioning this candidate, or "" if unavailable for any reason."""
    if not settings.NEWS_API_KEY:
        return ""

    query = f'"{name}" India' if entity_type == "person" else f'"{name}"'
    try:
        async with _SEMAPHORE:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                r = await client.get(
                    NEWS_API_URL,
                    params={
                        "q": query,
                        "language": "en",
                        "sortBy": "publishedAt",
                        "pageSize": 5,
                        "apiKey": settings.NEWS_API_KEY,
                    },
                )
        if r.status_code != 200:
            logger.debug("NewsAPI HTTP %d for '%s': %s", r.status_code, name, r.text[:200])
            return ""
        articles = r.json().get("articles", [])
        snippets = [
            f"{a.get('title', '')}: {a.get('description', '') or ''}".strip(": ")
            for a in articles if a.get("title")
        ]
        return " | ".join(snippets)[:600]
    except Exception as exc:
        logger.debug("NewsAPI fetch failed for '%s': %s", name, exc)
        return ""
