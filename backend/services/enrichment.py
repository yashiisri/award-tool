"""
enrichment.py  —  Chunk 3
──────────────────────────
Multi-source enrichment for persons and companies.
All fetches run concurrently. Gate: no Wikipedia + no secondary = drop.
"""

import asyncio
import logging
import re
import urllib.parse
from dataclasses import dataclass, field
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "NobleCrestAI/1.0 (Award Management Platform; contact@noblecrest.ai) httpx/0.27",
    "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}
TIMEOUT     = httpx.Timeout(12.0, connect=5.0)
SEMAPHORE   = asyncio.Semaphore(8)
WIKI_UA     = "NobleCrestAI/1.0 (awards-research; contact@noblecrest.ai)"


@dataclass
class RawEnrichment:
    name:          str
    entity_type:   str   # "person" | "company"
    wiki_extract:  str   = ""
    wiki_desc:     str   = ""
    wiki_url:      str   = ""
    photo_url:     str   = ""
    forbes_text:   str   = ""
    fortune_text:  str   = ""
    ddg_text:      str   = ""
    crunchbase_text: str = ""   # company only
    source_urls:   list  = field(default_factory=list)
    has_data:      bool  = False  # True if at least one source returned content


# ── Wikipedia ─────────────────────────────────────────────────────────────────

async def _fetch_wikipedia(name: str, client: httpx.AsyncClient) -> dict:
    names_to_try = [name]
    # Also try stripping country suffix like "(India)"
    clean = re.sub(r"\s*\([^)]*\)\s*$", "", name).strip()
    if clean != name:
        names_to_try.append(clean)
    parts = clean.split()
    if len(parts) > 2:
        names_to_try.append(f"{parts[0]} {parts[-1]}")

    for attempt in names_to_try:
        encoded = attempt.replace(" ", "_")
        try:
            r = await client.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}",
                headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
            )
            if r.status_code == 200:
                data    = r.json()
                extract = data.get("extract", "")
                if len(extract) >= 60:
                    thumb = (data.get("thumbnail") or {}).get("source", "")
                    if thumb:
                        thumb = re.sub(r"/\d+px-", "/400px-", thumb)
                    return {
                        "extract":  extract[:800],
                        "desc":     data.get("description", ""),
                        "url":      data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                        "photo":    thumb,
                    }
        except Exception:
            pass
    return {}


# ── Forbes scrape ─────────────────────────────────────────────────────────────

async def _fetch_forbes(name: str, client: httpx.AsyncClient) -> str:
    q   = urllib.parse.quote(name)
    url = f"https://www.forbes.com/search/?q={q}"
    try:
        r = await client.get(url, headers=HEADERS)
        if r.status_code == 200:
            text = re.sub(r"<[^>]+>", " ", r.text)
            text = re.sub(r"\s+", " ", text)
            # Extract first 800 chars around the name
            idx = text.lower().find(name.lower().split()[0])
            if idx != -1:
                return text[max(0, idx - 100): idx + 700].strip()
    except Exception:
        pass
    return ""


# ── Fortune scrape ────────────────────────────────────────────────────────────

async def _fetch_fortune(name: str, client: httpx.AsyncClient) -> str:
    q   = urllib.parse.quote(name)
    url = f"https://fortune.com/?s={q}"
    try:
        r = await client.get(url, headers=HEADERS)
        if r.status_code == 200:
            text = re.sub(r"<[^>]+>", " ", r.text)
            text = re.sub(r"\s+", " ", text)
            idx = text.lower().find(name.lower().split()[0])
            if idx != -1:
                return text[max(0, idx - 100): idx + 500].strip()
    except Exception:
        pass
    return ""


# ── DuckDuckGo HTML scrape ────────────────────────────────────────────────────

async def _fetch_ddg(name: str, suffix: str, client: httpx.AsyncClient) -> str:
    q   = urllib.parse.quote(f"{name} {suffix}")
    url = f"https://html.duckduckgo.com/html/?q={q}"
    try:
        r = await client.post(
            "https://html.duckduckgo.com/html/",
            data={"q": f"{name} {suffix}"},
            headers={**HEADERS, "Content-Type": "application/x-www-form-urlencoded"},
        )
        if r.status_code == 200:
            html     = r.text
            snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</(?:a|span|div)>', html, re.DOTALL)
            titles   = re.findall(r'class="result__a"[^>]*>(.*?)</a>', html, re.DOTALL)
            combined = " ".join(snippets[:5] + titles[:5])
            return re.sub(r"<[^>]+>", " ", combined)[:800].strip()
    except Exception:
        pass
    return ""


# ── Crunchbase scrape (company only) ─────────────────────────────────────────

async def _fetch_crunchbase(company_name: str, client: httpx.AsyncClient) -> str:
    clean = re.sub(r"\s*\([^)]*\)\s*$", "", company_name).strip()
    slug  = clean.lower().replace(" ", "-").replace(",", "").replace(".", "")
    url   = f"https://www.crunchbase.com/search/organizations?q={urllib.parse.quote(clean)}"
    try:
        r = await client.get(url, headers=HEADERS)
        if r.status_code == 200:
            text = re.sub(r"<[^>]+>", " ", r.text)
            text = re.sub(r"\s+", " ", text)
            idx  = text.lower().find(clean.lower()[:8])
            if idx != -1:
                return text[max(0, idx - 50): idx + 600].strip()
    except Exception:
        pass
    return ""


# ── Main enrichment orchestrator ──────────────────────────────────────────────

async def _enrich_one(candidate: dict, award_context: str) -> RawEnrichment:
    name        = candidate["name"]
    entity_type = candidate["entity_type"]
    result      = RawEnrichment(name=name, entity_type=entity_type)

    async with SEMAPHORE:
        async with httpx.AsyncClient(
            timeout=TIMEOUT, follow_redirects=True, headers=HEADERS
        ) as client:
            # Wikipedia always fetched for both types
            wiki_task = asyncio.create_task(_fetch_wikipedia(name, client))

            if entity_type == "person":
                forbes_task  = asyncio.create_task(_fetch_forbes(name, client))
                fortune_task = asyncio.create_task(_fetch_fortune(name, client))
                ddg_task     = asyncio.create_task(
                    _fetch_ddg(name, "achievements business leader 2025", client)
                )
                wiki, forbes, fortune, ddg = await asyncio.gather(
                    wiki_task, forbes_task, fortune_task, ddg_task,
                    return_exceptions=True,
                )
                result.forbes_text  = forbes  if isinstance(forbes,  str) else ""
                result.fortune_text = fortune if isinstance(fortune, str) else ""
                result.ddg_text     = ddg     if isinstance(ddg,     str) else ""

            else:  # company
                crunchbase_task = asyncio.create_task(_fetch_crunchbase(name, client))
                fortune_task    = asyncio.create_task(_fetch_fortune(name, client))
                ddg_task        = asyncio.create_task(
                    _fetch_ddg(name, "company startup 2025 funding", client)
                )
                wiki, crunchbase, fortune, ddg = await asyncio.gather(
                    wiki_task, crunchbase_task, fortune_task, ddg_task,
                    return_exceptions=True,
                )
                result.crunchbase_text = crunchbase if isinstance(crunchbase, str) else ""
                result.fortune_text    = fortune    if isinstance(fortune,    str) else ""
                result.ddg_text        = ddg        if isinstance(ddg,        str) else ""

            if isinstance(wiki, dict) and wiki:
                result.wiki_extract = wiki.get("extract", "")
                result.wiki_desc    = wiki.get("desc", "")
                result.wiki_url     = wiki.get("url", "")
                result.photo_url    = wiki.get("photo", "")
                if result.wiki_url:
                    result.source_urls.append(result.wiki_url)

    # Gate: must have at least some real data
    secondary = result.forbes_text or result.fortune_text or result.ddg_text or result.crunchbase_text
    result.has_data = bool(result.wiki_extract) or bool(secondary)

    return result


async def enrich_all_candidates(
    candidates: list[dict],
    award_context: str,
) -> list[RawEnrichment]:
    """
    Enrich all candidates concurrently.
    Drops candidates with has_data = False.
    """
    logger.info("Enriching %d candidates...", len(candidates))
    results = await asyncio.gather(
        *[_enrich_one(c, award_context) for c in candidates],
        return_exceptions=True,
    )

    enriched = []
    dropped  = 0
    for r in results:
        if isinstance(r, RawEnrichment):
            if r.has_data:
                enriched.append(r)
            else:
                dropped += 1
                logger.debug("Dropped (no data): %s", r.name)
        else:
            dropped += 1
            logger.debug("Dropped (error): %s", r)

    logger.info(
        "Enrichment done: %d kept, %d dropped",
        len(enriched), dropped,
    )
    return enriched
