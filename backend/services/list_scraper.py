"""
list_scraper.py
──────────────────
Primary curated-list name source. These are the same "Top N" magazine lists
AIMA's real past winners are historically drawn from (Forbes India, BT500,
BW500, YourStory, Inc42, Wikipedia's PSU list, Fortune India) — scraping them
directly gives real, tier-appropriate names instead of asking an LLM to
recall names from training data.

Most of these publishers render their list pages with client-side JS, so a
plain GET often returns a near-empty shell. Each source tries a real scrape
first (httpx + BeautifulSoup over the live page) and — only if that comes
back thin — falls back to a Tavily search restricted to that exact domain,
so it's still that same trusted source, just reached through search instead
of a raw page fetch. Wikipedia's PSU table is reliably static HTML and
usually needs no fallback.
"""

from __future__ import annotations

import asyncio
import logging
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from config import settings
from services.name_extraction import extract_names

logger = logging.getLogger(__name__)

TIMEOUT = httpx.Timeout(15.0, connect=5.0)
TAVILY_URL = "https://api.tavily.com/search"
BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
_HEADERS = {"User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9"}

# entity tier -> curated list source URLs. "1"/"2"/"3" are person tiers
# (see tier_router.py); "company" covers PSU/startup/company-of-the-year awards.
TIER_SOURCES: dict[str, list[str]] = {
    "1": [
        "https://www.forbes.com/india/list/india-rich-list/",
        "https://www.businesstoday.in/magazine/bt500",
    ],
    "2": [
        "https://www.businesstoday.in/magazine/most-powerful-ceos",
        "https://www.bwbusinessworld.com/bw500",
    ],
    "3": [
        "https://yourstory.com/2024/09/trailblazers-2024",
        "https://inc42.com/buzz/top-startups-india/",
        "https://www.forbes.com/india/list/30-under-30/",
    ],
    "company": [
        "https://en.wikipedia.org/wiki/List_of_largest_public_sector_undertakings_in_India",
        "https://www.fortuneindia.com/lists",
    ],
}


async def _fetch(url: str, client: httpx.AsyncClient) -> str:
    try:
        r = await client.get(url, headers=_HEADERS, timeout=TIMEOUT, follow_redirects=True)
        if r.status_code == 200:
            return r.text
        logger.debug("list_scraper: HTTP %d for %s", r.status_code, url)
    except Exception as exc:
        logger.debug("list_scraper: fetch failed for %s: %s", url, exc)
    return ""


def _names_from_html(html: str, entity_type: str) -> list[str]:
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    names: list[str] = list(extract_names(soup.get_text(" ", strip=True)[:20000], entity_type))

    if entity_type == "company":
        # Wikipedia's PSU table: link text there is often a bare company name
        # ("NTPC", "GAIL") without the Ltd/Limited suffix the regex requires.
        for table in soup.find_all("table", class_="wikitable"):
            for a in table.find_all("a"):
                t = a.get_text(strip=True)
                if 2 <= len(t) <= 60 and t[:1].isupper() and not t.isdigit():
                    names.append(t)

    return names


async def _tavily_domain_fallback(url: str, entity_type: str, client: httpx.AsyncClient) -> list[str]:
    """Live scrape came back thin (almost certainly a JS-rendered page) —
    reach the same domain's coverage through Tavily search instead."""
    if not settings.TAVILY_API_KEY:
        return []
    domain = urlparse(url).netloc
    query = f"India {'business leaders' if entity_type == 'person' else 'companies'} list"
    try:
        r = await client.post(
            TAVILY_URL,
            json={
                "api_key": settings.TAVILY_API_KEY, "query": query,
                "search_depth": "basic", "max_results": 8,
                "include_domains": [domain], "include_answer": False,
            },
            timeout=TIMEOUT,
        )
        if r.status_code != 200:
            return []
        results = r.json().get("results", [])
        text = " ".join(f"{item.get('title', '')} {item.get('content', '')}" for item in results)
        return extract_names(text, entity_type)
    except Exception as exc:
        logger.debug("list_scraper: Tavily domain fallback failed for %s: %s", domain, exc)
        return []


async def scrape_tier_sources(tier: str, entity_type: str) -> list[dict]:
    """Returns deduped [{"name":..., "role": "", "org": "", "source": url}]
    from the curated lists for this tier."""
    urls = TIER_SOURCES.get(tier, [])
    if not urls:
        return []

    out: dict[str, dict] = {}
    async with httpx.AsyncClient() as client:
        htmls = await asyncio.gather(*[_fetch(u, client) for u in urls], return_exceptions=True)

        for url, html in zip(urls, htmls):
            html = html if isinstance(html, str) else ""
            names = _names_from_html(html, entity_type)
            if len(names) < 3:
                logger.info(
                    "list_scraper: %s returned only %d names (likely JS-rendered) — Tavily fallback",
                    url, len(names),
                )
                names = await _tavily_domain_fallback(url, entity_type, client)
            for n in names:
                key = n.lower()
                if key not in out:
                    out[key] = {"name": n, "role": "", "org": "", "source": url}

    logger.info(
        "list_scraper: %d unique candidates from %d tier-%s sources", len(out), len(urls), tier,
    )
    return list(out.values())
