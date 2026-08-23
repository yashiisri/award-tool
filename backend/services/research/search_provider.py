"""
search_provider.py
───────────────────
Provider-agnostic search interface. Every web-search backend (Tavily, Brave,
future providers) implements SearchProvider so the orchestrator never depends
on a specific vendor's API shape.

A provider must NEVER raise on a request-level failure — timeouts, rate
limits, and HTTP errors are caught internally and logged; callers always get
back a (possibly empty) list of SearchResult.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from urllib.parse import urlparse

from config import settings
from services.research import cache_service

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str = ""
    content: str = ""                 # fuller extracted text, if the provider supplies it
    published_date: str | None = None
    provider_score: float = 0.0       # provider's own relevance score, if any
    domain: str = field(default="")

    def __post_init__(self):
        if not self.domain and self.url:
            try:
                self.domain = urlparse(self.url).netloc.replace("www.", "")
            except ValueError:
                self.domain = ""


class SearchProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        """Run a single search query. Must never raise — return [] on failure."""
        raise NotImplementedError

    @property
    def is_configured(self) -> bool:
        return True


def _result_to_dict(r: SearchResult) -> dict:
    return {
        "title": r.title, "url": r.url, "snippet": r.snippet, "content": r.content,
        "published_date": r.published_date, "provider_score": r.provider_score, "domain": r.domain,
    }


def _dict_to_result(d: dict) -> SearchResult:
    return SearchResult(**d)


async def run_bounded_searches(
    db,
    providers: list[SearchProvider],
    queries: list[str],
    max_results_per_query: int = 8,
    cache_ttl: int | None = None,
) -> dict[str, list[SearchResult]]:
    """
    Run `queries` against every configured provider, bounded to
    RESEARCH_MAX_CONCURRENCY concurrent requests, deduplicating identical
    queries and using the Mongo cache when available.

    Returns {query: [SearchResult, ...]} — merged across providers, first
    provider's results first. A provider that isn't configured (no API key)
    is silently skipped, never raising.
    """
    active_providers = [p for p in providers if p.is_configured]
    if not active_providers:
        logger.warning("No search providers configured — skipping %d queries", len(queries))
        return {q: [] for q in queries}

    unique_queries = list(dict.fromkeys(q for q in queries if q and q.strip()))
    ttl = cache_ttl if cache_ttl is not None else settings.RESEARCH_CACHE_TTL_SEARCH
    semaphore = asyncio.Semaphore(settings.RESEARCH_MAX_CONCURRENCY)
    results: dict[str, list[SearchResult]] = {}

    async def run_one(query: str):
        cache_key = f"{'|'.join(p.name for p in active_providers)}:{query}"
        cached = await cache_service.get_cached(db, "search", cache_key) if db is not None else None
        if cached is not None:
            results[query] = [_dict_to_result(d) for d in cached]
            return

        async with semaphore:
            merged: list[SearchResult] = []
            for provider in active_providers:
                try:
                    provider_results = await asyncio.wait_for(
                        provider.search(query, max_results_per_query),
                        timeout=settings.RESEARCH_SEARCH_TIMEOUT + 5,
                    )
                    merged.extend(provider_results)
                except asyncio.TimeoutError:
                    logger.warning("%s timed out for query: %s", provider.name, query)
                except Exception as exc:
                    logger.warning("%s errored for query '%s': %s", provider.name, query, exc)
            results[query] = merged

        if db is not None:
            await cache_service.set_cached(db, "search", cache_key, [_result_to_dict(r) for r in merged], ttl)

    await asyncio.gather(*(run_one(q) for q in unique_queries))
    return results
