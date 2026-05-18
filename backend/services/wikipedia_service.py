"""
wikipedia_service.py
────────────────────
Centralised Wikipedia access layer.

All requests include the required User-Agent header so api.php never returns 403.
Provides retry logic, graceful error handling, and structured return types.
"""

import asyncio
import logging
import re
import urllib.parse
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

# Wikipedia REQUIRES a descriptive User-Agent — without it api.php returns 403
USER_AGENT = "AwardsNomineeAI/1.0 (support@awardsai.com)"

WIKI_REST_BASE  = "https://en.wikipedia.org/api/rest_v1/page/summary/"
WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php"

TIMEOUT        = httpx.Timeout(20.0, connect=8.0)
MAX_RETRIES    = 3
RETRY_BACKOFF  = 1.5   # seconds between retries (multiplied by attempt number)

# A summary shorter than this is a stub / disambiguation — skip it
MIN_SUMMARY_LEN = 150

# ── Shared headers ────────────────────────────────────────────────────────────

_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept":     "application/json",
}


# ── Internal retry helper ─────────────────────────────────────────────────────

async def _get_with_retry(url: str, params: Optional[dict] = None) -> Optional[httpx.Response]:
    """
    GET `url` with retries.  Returns the Response on success, None on failure.
    Validates status before returning so callers can safely call .json().
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
                resp = await client.get(url, params=params, headers=_HEADERS)

            if resp.status_code == 200:
                return resp

            if resp.status_code == 404:
                logger.debug("Wikipedia 404 for %s", url)
                return None          # Not found — no point retrying

            if resp.status_code == 403:
                # Should not happen with correct User-Agent, but log clearly
                logger.error(
                    "Wikipedia 403 Forbidden for %s — User-Agent may be rejected. "
                    "Attempt %d/%d", url, attempt, MAX_RETRIES
                )
            else:
                logger.warning(
                    "Wikipedia HTTP %d for %s. Attempt %d/%d",
                    resp.status_code, url, attempt, MAX_RETRIES,
                )

        except httpx.TimeoutException:
            logger.warning("Wikipedia timeout for %s. Attempt %d/%d", url, attempt, MAX_RETRIES)
        except httpx.HTTPError as exc:
            logger.warning("Wikipedia request error for %s: %s. Attempt %d/%d", url, exc, attempt, MAX_RETRIES)

        if attempt < MAX_RETRIES:
            await asyncio.sleep(RETRY_BACKOFF * attempt)

    logger.error("Wikipedia: all %d attempts failed for %s", MAX_RETRIES, url)
    return None


# ── Public API ────────────────────────────────────────────────────────────────

async def fetch_summary(name: str) -> Optional[dict]:
    """
    Fetch the Wikipedia REST summary for a person/entity by name.

    Returns a dict with keys:
        title, extract, description, thumbnail_url, wiki_url
    Returns None if the page doesn't exist or the summary is too short.
    """
    encoded = urllib.parse.quote(name.replace(" ", "_"))
    url = f"{WIKI_REST_BASE}{encoded}"

    resp = await _get_with_retry(url)
    if resp is None:
        return None

    try:
        data = resp.json()
    except Exception as exc:
        logger.warning("Wikipedia REST JSON parse error for '%s': %s", name, exc)
        return None

    extract = data.get("extract", "")
    if len(extract) < MIN_SUMMARY_LEN:
        logger.debug("Wikipedia summary too short for '%s' (%d chars)", name, len(extract))
        return None

    return {
        "title":         data.get("title", name),
        "extract":       extract,
        "description":   data.get("description", ""),
        "thumbnail_url": (data.get("thumbnail") or {}).get("source", ""),
        "wiki_url":      data.get("content_urls", {}).get("desktop", {}).get("page", ""),
    }


async def search_pages(query: str, max_results: int = 5) -> list[dict]:
    """
    Search Wikipedia for pages matching `query` using the MediaWiki API.
    Returns a list of {title, snippet, pageid} dicts.
    Falls back to [] on any error (never raises).
    """
    params = {
        "action":   "query",
        "list":     "search",
        "srsearch": query,
        "srlimit":  max_results,
        "format":   "json",
        "srprop":   "snippet|titlesnippet",
    }

    resp = await _get_with_retry(WIKI_SEARCH_URL, params=params)
    if resp is None:
        logger.warning("Wikipedia search returned no response for query: '%s'", query)
        return []

    try:
        data = resp.json()
    except Exception as exc:
        logger.warning("Wikipedia search JSON parse error for '%s': %s", query, exc)
        return []

    results = []
    for item in data.get("query", {}).get("search", []):
        snippet = re.sub(r"<[^>]+>", "", item.get("snippet", "")).strip()
        results.append({
            "title":   item.get("title", ""),
            "snippet": snippet,
            "pageid":  item.get("pageid"),
        })

    logger.debug("Wikipedia search '%s' → %d results", query, len(results))
    return results


async def batch_fetch_summaries(names: list[str]) -> dict[str, Optional[dict]]:
    """
    Fetch Wikipedia summaries for multiple names concurrently.
    Returns a dict mapping each name to its summary (or None).
    """
    tasks = [fetch_summary(name) for name in names]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    out: dict[str, Optional[dict]] = {}
    for name, result in zip(names, results):
        if isinstance(result, Exception):
            logger.warning("batch_fetch_summaries error for '%s': %s", name, result)
            out[name] = None
        else:
            out[name] = result

    return out
