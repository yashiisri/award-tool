"""
brave_provider.py
──────────────────
Brave Search API — optional secondary provider. Returns [] (not configured)
until BRAVE_API_KEY is set; the orchestrator skips unconfigured providers
automatically, so this is a safe no-op fallback rather than a hard dependency.
"""

import logging
import re

import httpx

from config import settings
from services.research.search_provider import SearchProvider, SearchResult

logger = logging.getLogger(__name__)


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

BRAVE_URL = "https://api.search.brave.com/res/v1/web/search"
TIMEOUT = httpx.Timeout(settings.RESEARCH_SEARCH_TIMEOUT, connect=6.0)


class BraveProvider(SearchProvider):
    name = "brave"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.BRAVE_API_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        if not self.is_configured:
            return []

        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": self.api_key,
        }
        params = {"q": query, "count": min(max_results, 20)}

        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.get(BRAVE_URL, headers=headers, params=params)
            if resp.status_code == 429:
                logger.warning("Brave rate-limited for query: %s", query)
                return []
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as exc:
            logger.warning("Brave search failed for '%s': %s", query, exc)
            return []
        except ValueError as exc:
            logger.warning("Brave JSON parse failed for '%s': %s", query, exc)
            return []

        results = []
        for item in data.get("web", {}).get("results", []):
            results.append(SearchResult(
                title=_clean_text(item.get("title", "")),
                url=item.get("url", ""),
                snippet=_clean_text(item.get("description", ""))[:500],
                published_date=item.get("age"),
            ))
        logger.debug("Brave '%s' -> %d results", query, len(results))
        return results
