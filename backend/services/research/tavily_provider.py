"""
tavily_provider.py
───────────────────
Tavily Search API via plain httpx (no SDK dependency — Tavily is a simple
REST API, and the rest of this codebase already standardises on httpx).
"""

import logging
import re

import httpx

from config import settings
from services.research.search_provider import SearchProvider, SearchResult

logger = logging.getLogger(__name__)


def _clean_text(text: str) -> str:
    """Collapse newlines/extra whitespace — Tavily's content can be multi-line,
    which otherwise lets name-detection regexes match garbage across line breaks."""
    return re.sub(r"\s+", " ", text or "").strip()

TAVILY_URL = "https://api.tavily.com/search"
TIMEOUT = httpx.Timeout(settings.RESEARCH_SEARCH_TIMEOUT, connect=6.0)


class TavilyProvider(SearchProvider):
    name = "tavily"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.TAVILY_API_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        if not self.is_configured:
            return []

        payload = {
            "api_key": self.api_key,
            "query": query,
            "max_results": max_results,
            "search_depth": "basic",
            "include_answer": False,
            "include_raw_content": False,
        }

        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.post(TAVILY_URL, json=payload)
            if resp.status_code == 429:
                logger.warning("Tavily rate-limited for query: %s", query)
                return []
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as exc:
            logger.warning("Tavily search failed for '%s': %s", query, exc)
            return []
        except ValueError as exc:
            logger.warning("Tavily JSON parse failed for '%s': %s", query, exc)
            return []

        results = []
        for item in data.get("results", []):
            content = _clean_text(item.get("content", ""))
            results.append(SearchResult(
                title=_clean_text(item.get("title", "")),
                url=item.get("url", ""),
                snippet=content[:500],
                content=content,
                published_date=item.get("published_date"),
                provider_score=float(item.get("score", 0.0) or 0.0),
            ))
        logger.debug("Tavily '%s' -> %d results", query, len(results))
        return results
