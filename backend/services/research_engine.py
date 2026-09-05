"""
research_engine.py
────────────────────
Search-first, grounded nominee/company discovery engine.

Design principle: candidate names are extracted FROM real web search results
(Tavily primary, DuckDuckGo HTML fallback) — never invented from an LLM's
training-data recall. Wikipedia then verifies and enriches each name. Only
candidates with real supporting evidence (a Wikipedia page, or multiple
independent search-result mentions) are passed on to the dossier writer.

Pipeline:
  1. generate_search_queries()  Groq writes targeted queries for this award + entity type
  2. web_search()               Real web search — Tavily primary, DuckDuckGo fallback
  3. extract_candidates()       Groq extracts real names STRICTLY from search content
  4. fetch_wikipedia()          Verifies + enriches each candidate (people or orgs)
  5. build_briefs()             Produces RawEnrichment objects for dossier_builder.py
"""

import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

import httpx
from groq import AsyncGroq

from config import settings
from services import tier_router
from services import aima_historical_seed
from services.aima_historical_seed import build_grounded_queries
from services.google_search_source import (
    fetch_photo_via_google,
    search_candidates as google_search_candidates,
)
from services.groq_fallback import call_with_fallback
from services.list_scraper import scrape_tier_sources
from services.newsapi_source import fetch_recent_news

logger = logging.getLogger(__name__)

TIMEOUT = httpx.Timeout(15.0, connect=5.0)

TAVILY_URL = "https://api.tavily.com/search"
DDG_HTML_URL = "https://html.duckduckgo.com/html/"
WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/summary/"
WIKI_UA = "NobleCrestAI/2.0 (awards-research; contact@noblecrest.ai)"
BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


@dataclass
class RawEnrichment:
    """Grounded research brief for one candidate — consumed by dossier_builder.build_dossiers()."""
    name: str
    entity_type: str  # "person" | "company"
    wiki_extract: str = ""
    wiki_desc: str = ""
    wiki_url: str = ""
    photo_url: str = ""
    forbes_text: str = ""
    fortune_text: str = ""
    ddg_text: str = ""        # real search-result snippets mentioning this candidate
    crunchbase_text: str = ""
    news_text: str = ""       # recent headlines from NewsAPI, qualifying candidates only
    controversy_text: str = ""  # real search snippets from a controversy/criticism-targeted query
    recent_activity_text: str = ""    # last ~12 months of news coverage (Tavily, topic="news")
    financial_trend_text: str = ""    # last ~12 months of financial/performance coverage (Tavily, topic="finance")
    source_urls: list = field(default_factory=list)
    has_data: bool = False
    # Ground truth the jury/head-jury member typed in directly when suggesting this
    # nominee — set only by nominee_suggestion.py (the bulk AI-search path has no
    # equivalent, since it's discovering candidates rather than being told who they
    # are). Confirmed live this was a real gap: with no known-correct designation/
    # organisation to anchor to, Groq had to re-derive both purely from noisy search
    # text and outright invented a wrong company ("AI Centaur") for a real KPMG
    # partner when the search results were too thin to support a confident answer.
    known_designation: str = ""
    known_organisation: str = ""


def _groq() -> AsyncGroq:
    key = settings.GROQ_KEY or __import__("os").environ.get("GROQ_KEY", "")
    if not key:
        raise RuntimeError("GROQ_KEY not configured.")
    return AsyncGroq(api_key=key)


async def _groq_chat(prompt: str, temperature: float, max_tokens: int, attempts: int = 3) -> str:
    """Groq call with backoff retry, rotating models on daily-quota exhaustion."""
    last_exc = None
    for attempt in range(1, attempts + 1):
        try:
            resp = await call_with_fallback(
                _groq(),
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                extra_body={"reasoning_effort": "low"},
                attempts_per_model=1,
            )
            content = resp.choices[0].message.content or ""
            # Strip any thinking blocks that slipped through
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            return content
        except Exception as exc:
            last_exc = exc
            if attempt < attempts:
                await asyncio.sleep(2 ** attempt)
    raise last_exc


def _parse_json(text: str):
    # Strip qwen thinking blocks
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for s, e in [("[", "]"), ("{", "}")]:
        i, j = text.find(s), text.rfind(e)
        if i != -1 and j != -1 and j > i:
            try:
                return json.loads(text[i:j + 1])
            except json.JSONDecodeError:
                continue
    return None


# ── Step 1: query generation ──────────────────────────────────────────────

# Real AIMA Managing India Awards winners (2021-2026), gathered by category, used
# purely as calibration context for query generation below — NOT as candidates to
# reuse. This platform is built exclusively for AIMA awards; every past winner here
# is a senior, nationally-prominent figure or a major India-operating company, which
# is the bar new candidates need to clear (never an obscure/minor person).
_AIMA_REFERENCE = """Real past AIMA Managing India Award winners, by category (calibration only — never
reuse these exact names as new nominees; use them to gauge the SENIORITY and PUBLIC
PROMINENCE AIMA honours):
- Lifetime Contribution Award: Adi Godrej (Godrej Group), Onkar Kanwar (Apollo Tyres)
- Business Leader of the Year: Sanjiv Goenka (RPSG Group), Sanjiv Puri (ITC), Karan Adani (Adani Ports & SEZ)
- Business Leader of the Decade: Kumar Mangalam Birla (Aditya Birla Group)
- Transformational Business Leader: Bhavish Aggarwal (Ola), Sanjiv Bajaj (Bajaj Finserv), Gopal Vittal (Bharti Airtel)
- Emerging Business Leader of the Year: Adar Poonawalla (Serum Institute of India), Satyanarayana Chava (Laurus Labs), Ashish Bharat Ram (SRF)
- Entrepreneur of the Year: Falguni Nayar (Nykaa), Vivek Gupta & Abhay Hanjura (Licious), Aravind Sanka & Pavan Guntupalli (Rapido)
- Young Entrepreneur Award: Ritesh Agarwal (OYO), Harsh Jain & Bhavit Sheth (Dream11)
- Outstanding Institution Builder: A M Naik (Larsen & Toubro), Venu Srinivasan (TVS Motor)
- Outstanding Contribution to Media: Kalli Purie (India Today Group), Palki Sharma Upadhyay (WION), Shereen Bhan (CNBC-TV18), Rahul Kanwal (India Today/Aaj Tak), N Ram (The Hindu)
- MNC in India / Indian MNC of the Year: Xiaomi India, Nestle India, ABB India, Asian Paints, Serum Institute of India
- Outstanding PSU of the Year: State Bank of India, NPCI, Hindustan Aeronautics Limited
- AIMA JRD Tata Corporate Leadership Award: T V Narendran (Tata Steel)

Every name above is a Chairman, MD, CEO or Founder of a large/fast-growing Indian
organisation, or a nationally recognised media figure — never a minor or obscure name."""


async def generate_search_queries(
    award_name: str, award_desc: str, entity_type: str, count: int = 6,
) -> list[str]:
    """Groq writes targeted, award-specific search queries. Adapts to any award
    category — not hardcoded to any one sector, but calibrated to AIMA's real
    track record so it aims at people/companies of comparable prominence."""
    subject = {
        "person": "individual people",
        "company": "organisations or companies",
        "both": "people and organisations",
    }.get(entity_type, "people and organisations")

    india_clause = (
        "Every query MUST explicitly include \"India\" or \"Indian\" — this platform is "
        "exclusively for AIMA (All India Management Association) awards, so every candidate "
        "must be Indian (for people) or a major India-operating company."
        if entity_type != "company" else
        "Every query MUST explicitly include \"India\" or \"Indian\" — this platform is "
        "exclusively for AIMA (All India Management Association) awards, so every company "
        "must be Indian-headquartered or a major India-operating multinational."
    )

    tier_info = tier_router.classify(award_name, award_desc, entity_type)
    age_clause = ""
    if tier_info.age_constraint:
        age_clause = (
            f"\n- This award has an AGE CEILING: {tier_info.age_constraint}. Every query MUST target "
            f"candidates who fit that age range — use phrasing like \"young founder\", \"under 40\", "
            f"\"30 under 30\", \"emerging entrepreneur\". Do NOT generate queries aimed at senior/veteran "
            f"business leaders (Chairman, decades-long CEO) — those are reliably the wrong age here, even "
            f"though they dominate generic Indian-business search results."
        )

    prompt = f"""Generate {count} precise web search queries to find real, currently active, WELL-KNOWN {subject} who fit this award.

Award Name: "{award_name}"
Award Description: {award_desc[:400]}

{_AIMA_REFERENCE}

RULES:
- Read the award name and description carefully — the queries must target the EXACT category described
  (e.g. content creators -> YouTubers/influencers; scientists -> researchers; athletes -> sportspeople;
  business leaders -> CEOs/founders; startups -> startup companies/founders)
- {india_clause}
- Only target PROMINENT, nationally-recognised candidates — favour queries that include seniority/role
  words (Chairman, CEO, MD, Founder, renowned, leading, top) and terms that surface major Indian business
  press coverage (Economic Times, Business Standard, Livemint, Forbes India, Moneycontrol) rather than
  generic or hyper-local results. Avoid queries that would surface minor/unknown figures.{age_clause}
- Include the current year where it helps surface recent/active candidates
- Vary the angle across queries — do not repeat the same phrasing {count} times

Return ONLY a JSON array of {count} query strings, nothing else.
["query 1", "query 2", ...]"""

    try:
        raw = await _groq_chat(prompt, temperature=0.3, max_tokens=400)
        result = _parse_json(raw)
        if isinstance(result, list) and result:
            return [str(q) for q in result[:count]]
    except Exception as exc:
        logger.warning("generate_search_queries failed: %s", exc)

    return [f"{award_name} {award_desc[:60]}", f"top {award_name} nominees", f"{award_name} winners"]


# ── Step 2: real web search ───────────────────────────────────────────────

async def _tavily_one(query: str, client: httpx.AsyncClient) -> list[dict]:
    if not settings.TAVILY_API_KEY:
        return []
    try:
        r = await client.post(
            TAVILY_URL,
            json={
                "api_key": settings.TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "max_results": 8,
                "include_answer": False,
            },
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            return r.json().get("results", [])
        logger.debug("Tavily HTTP %d for '%s'", r.status_code, query)
    except Exception as exc:
        logger.debug("Tavily failed for '%s': %s", query, exc)
    return []


async def fetch_photo_via_tavily(name: str, context: str = "") -> str:
    """Best-effort headshot lookup via Tavily's image search — used as a
    fallback when Wikipedia has no thumbnail for a nominee (most common for a
    manually-suggested/added nominee whose Wikipedia page is thin or absent).
    Returns the first image URL Tavily finds, or "" if unavailable/unconfigured."""
    if not settings.TAVILY_API_KEY:
        return ""
    query = f"{name} {context} photo headshot".strip()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.post(
                TAVILY_URL,
                json={
                    "api_key": settings.TAVILY_API_KEY,
                    "query": query,
                    "search_depth": "basic",
                    "max_results": 3,
                    "include_images": True,
                    "include_answer": False,
                },
            )
        if r.status_code == 200:
            images = r.json().get("images", [])
            for img in images:
                url = img if isinstance(img, str) else (img.get("url") or "")
                if url:
                    return url
        else:
            logger.debug("Tavily image search HTTP %d for '%s'", r.status_code, query)
    except Exception as exc:
        logger.debug("Tavily image search failed for '%s': %s", name, exc)
    return ""


async def fetch_photo_via_serpapi(name: str, context: str = "") -> str:
    """Real Google Images results via SerpApi — verified working 2026-08-31
    (both person headshots and company logos returned genuine, relevant
    results in live testing, notably better than Tavily's image search for
    logos specifically). Deliberately the LAST fallback tried, not the first:
    the free plan is capped at 250 searches/month, and Wikipedia + Tavily
    alone already recover the large majority of cases for free (confirmed via
    a live backfill the same day — 35/35 previously-missing photos recovered
    without ever needing this). Returns "" if unconfigured, no results, or on
    any error, same contract as every other photo source here."""
    if not settings.SERPAPI_KEY:
        return ""
    query = f"{name} {context}".strip()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                "https://serpapi.com/search.json",
                params={"engine": "google_images", "q": query, "api_key": settings.SERPAPI_KEY, "num": 5},
            )
        if r.status_code == 200:
            for img in r.json().get("images_results", []):
                url = img.get("original") or img.get("thumbnail") or ""
                if url:
                    return url
        else:
            logger.debug("SerpApi image search HTTP %d for '%s'", r.status_code, query)
    except Exception as exc:
        logger.debug("SerpApi image search failed for '%s': %s", name, exc)
    return ""


async def _resolve_photo(name: str, entity_type: str, existing: str) -> str:
    """Wikipedia has no thumbnail for a real chunk of otherwise-qualified
    candidates (many notable businesspeople have a page but no infobox
    image) — without a fallback here, they'd show initials on every nominee
    card instead of a photo. Tries Google Custom Search's image mode first
    (a second, independent source from a different provider), then Tavily's
    image search, then SerpApi (real Google Images, but quota-limited so it's
    the last resort) — three real attempts before giving up, not just one.

    A free no-key logo lookup (Clearbit's logo.clearbit.com, then its
    icon.horse alternative) was tried and rejected here 2026-08-26: Clearbit's
    domain no longer resolves at all (service discontinued), and icon.horse
    returns HTTP 200 with a generic placeholder image even for a domain that
    doesn't exist — no way to tell "found the real logo" from "here's a
    generic fallback," which risks showing a wrong/generic icon as if it were
    a specific company's real logo. SerpApi (added 2026-08-31) closes that gap
    properly instead — verified real Google Images results, not a guess."""
    if existing:
        return existing
    context = "India" if entity_type == "person" else "logo"
    google_photo = await fetch_photo_via_google(name, context)
    if google_photo:
        return google_photo
    tavily_photo = await fetch_photo_via_tavily(name, context)
    if tavily_photo:
        return tavily_photo
    return await fetch_photo_via_serpapi(name, context)


async def _brave_one(query: str, client: httpx.AsyncClient) -> list[dict]:
    """Second-choice web search when Tavily returns nothing for a query — a
    real API (Brave Search), not the fragile DuckDuckGo HTML scrape below, and
    on genuinely independent infrastructure from both Tavily and Google, so it
    doesn't share their failure modes (rate limits, quota, outages). No-ops if
    BRAVE_API_KEY isn't configured — see .env for where to get a free key."""
    if not settings.BRAVE_API_KEY:
        return []
    try:
        r = await client.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query, "count": 8},
            headers={"Accept": "application/json", "X-Subscription-Token": settings.BRAVE_API_KEY},
        )
        if r.status_code != 200:
            logger.debug("Brave HTTP %d for '%s'", r.status_code, query)
            return []
        results = r.json().get("web", {}).get("results", [])
        return [
            {"title": item.get("title", ""), "content": (item.get("description") or "")[:600], "url": item.get("url", "")}
            for item in results
        ]
    except Exception as exc:
        logger.debug("Brave failed for '%s': %s", query, exc)
        return []


async def _ddg_one(query: str, client: httpx.AsyncClient) -> list[dict]:
    """Last-resort fallback web search — an unofficial HTML scrape, so it's the
    least reliable of the three (fragile to DuckDuckGo changing markup or
    blocking the request entirely), only reached if both Tavily and Brave have
    nothing for this query."""
    try:
        r = await client.post(
            DDG_HTML_URL,
            data={"q": query},
            headers={"User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9"},
        )
        if r.status_code != 200:
            return []
        html = r.text
        titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', html, re.DOTALL)
        snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', html, re.DOTALL)
        out = []
        for t, s in zip(titles[:8], snippets[:8]):
            title = re.sub(r"<[^>]+>", " ", t).strip()
            content = re.sub(r"<[^>]+>", " ", s).strip()
            if title:
                out.append({"title": title, "content": content, "url": ""})
        return out
    except Exception as exc:
        logger.debug("DDG fallback failed for '%s': %s", query, exc)
        return []


async def web_search(queries: list[str]) -> list[dict]:
    """Run all queries through Tavily; for any query Tavily returns nothing
    for, try Brave next, then DuckDuckGo's HTML scrape as the last resort."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        tavily_results = await asyncio.gather(
            *[_tavily_one(q, client) for q in queries], return_exceptions=True
        )

        chunks: list[dict] = []
        empty_queries = []
        for q, r in zip(queries, tavily_results):
            if isinstance(r, list) and r:
                for item in r:
                    chunks.append({
                        "query": q, "title": item.get("title", ""),
                        "content": item.get("content", "")[:600], "url": item.get("url", ""),
                    })
            else:
                empty_queries.append(q)

        if empty_queries:
            logger.info(
                "Tavily empty for %d/%d queries — trying Brave",
                len(empty_queries), len(queries),
            )
            brave_results = await asyncio.gather(
                *[_brave_one(q, client) for q in empty_queries], return_exceptions=True
            )
            still_empty = []
            for q, r in zip(empty_queries, brave_results):
                if isinstance(r, list) and r:
                    for item in r:
                        chunks.append({
                            "query": q, "title": item.get("title", ""),
                            "content": item.get("content", "")[:600], "url": item.get("url", ""),
                        })
                else:
                    still_empty.append(q)

            if still_empty:
                logger.info(
                    "Brave also empty for %d/%d queries — falling back to DuckDuckGo",
                    len(still_empty), len(queries),
                )
                ddg_results = await asyncio.gather(
                    *[_ddg_one(q, client) for q in still_empty], return_exceptions=True
                )
                for q, r in zip(still_empty, ddg_results):
                    if isinstance(r, list):
                        for item in r:
                            chunks.append({
                                "query": q, "title": item.get("title", ""),
                                "content": item.get("content", "")[:600], "url": item.get("url", ""),
                            })

    logger.info("web_search: %d result chunks from %d queries", len(chunks), len(queries))
    return chunks


# ── Controversy / due-diligence signal ────────────────────────────────────
#
# A separate, differently-worded search from the main candidate search —
# the main queries are built to find achievements/fit for the award, which
# rarely surfaces criticism even when it exists. This one is deliberately
# aimed at it. dossier_builder.py is instructed to report a concern ONLY if
# it is actually present in the returned snippet text below — this function
# just collects real search results, it never decides what's true.

_CONTROVERSY_QUERIES = (
    '"{name}" controversy OR criticism OR scandal',
    '"{name}" lawsuit OR fraud OR scam OR probe OR investigation',
    '"{name}" fine OR penalty OR resign OR resignation OR fired',
)


async def fetch_controversy_chunks(name: str) -> list[dict]:
    """Best-effort search for real, published negative coverage about a
    candidate. Returns raw result chunks (title/content/url) — same shape
    as web_search() — never a verdict, just source material.

    Three narrower queries instead of one long OR-string: search engines rank
    a dense OR query poorly (it tends to just return generic results for the
    name), while a few distinct, differently-worded queries actually surface
    different real coverage when it exists. Purely a recall improvement —
    dossier_builder.py still only writes a concern if it's actually present
    in what comes back; an empty result here is still the normal case."""
    try:
        return await web_search([q.format(name=name) for q in _CONTROVERSY_QUERIES])
    except Exception:
        return []


# ── Last-12-months activity / financial signal ────────────────────────────
#
# Both use Tavily's `topic` + `time_range` filters (not exposed by the plain
# web_search() helper above) to bias results toward the trailing year instead
# of whatever happens to rank highest overall — a candidate's Wikipedia bio
# and generic web search skew toward career-spanning highlights, which is
# exactly what these two are meant to correct for.

async def _tavily_scoped(query: str, topic: str, max_results: int = 6) -> list[dict]:
    """Tavily search scoped to the last year via time_range="year", and biased
    toward a specific topic ("news" or "finance"). Same result shape as
    web_search() — raw chunks, no interpretation. Fails open (empty list) on
    any error, matching every other Tavily call in this module."""
    if not settings.TAVILY_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.post(
                TAVILY_URL,
                json={
                    "api_key": settings.TAVILY_API_KEY,
                    "query": query,
                    "search_depth": "basic",
                    "topic": topic,
                    "time_range": "year",
                    "max_results": max_results,
                    "include_answer": False,
                },
            )
        if r.status_code == 200:
            return [
                {"title": item.get("title", ""), "content": item.get("content", "")[:600], "url": item.get("url", "")}
                for item in r.json().get("results", [])
            ]
        logger.debug("Tavily scoped(%s) HTTP %d for '%s'", topic, r.status_code, query)
    except Exception as exc:
        logger.debug("Tavily scoped(%s) failed for '%s': %s", topic, query, exc)
    return []


async def fetch_recent_activity(name: str, entity_type: str) -> list[dict]:
    """Real news coverage of this candidate from roughly the last 12 months —
    distinct from fetch_recent_news() (NewsAPI, capped to ~30 days on the free
    tier) and from the general web_search() results (unscoped by date, so they
    skew toward whatever is most-linked historically). Used to write a
    "recent activity" dossier section that's genuinely bounded to the last
    year, not just "recent" in the loose sense."""
    suffix = "India" if entity_type == "person" else ""
    return await _tavily_scoped(f'"{name}" {suffix}'.strip(), topic="news", max_results=8)


async def fetch_financial_trend(name: str, entity_type: str) -> list[dict]:
    """Real financial/performance coverage of this candidate (or their company)
    from roughly the last 12 months — revenue, funding, valuation, stock
    performance, quarterly results, as actually reported in the press. This is
    press coverage, not a structured time-series from a financial-data API —
    it gives dossier_builder.py real recent figures to cite, not a chart."""
    return await _tavily_scoped(
        f'"{name}" revenue OR funding OR valuation OR "stock price" OR "quarterly results"',
        topic="finance", max_results=8,
    )


# ── Step 3: grounded name extraction ──────────────────────────────────────
#
# Deliberately NOT an LLM call. Tavily/DuckDuckGo already returned real web
# text about exactly the right topic (the search queries were built for it) —
# extracting proper-noun sequences directly from that text is deterministic,
# free, has no rate-limit exposure, and can never invent a name that wasn't
# actually in the search results. The Groq calls that remain (query generation,
# dossier writing) are the ones where an LLM genuinely adds value the raw API
# results can't. The actual regex/heuristics live in name_extraction.py so
# list_scraper.py and google_search_source.py can reuse the exact same logic.

from services.name_extraction import extract_names as _extract_names_from_text


def extract_candidates(search_chunks: list[dict], entity_type: str) -> list[str]:
    """Extract candidate names/companies directly from real search-result text
    (frequency-ranked — names mentioned across multiple independent results
    rank first). No LLM involved."""
    freq: dict[str, tuple[str, int]] = {}  # lower -> (original casing, count)

    for c in search_chunks:
        text = f"{c['title']} {c['content']}"
        for candidate in _extract_names_from_text(text, entity_type):
            key = candidate.lower()
            orig, count = freq.get(key, (candidate, 0))
            freq[key] = (orig, count + 1)

    ranked = sorted(freq.values(), key=lambda v: -v[1])
    return [name for name, _count in ranked]


# ── Step 4: Wikipedia verification ────────────────────────────────────────

async def fetch_wikipedia(name: str, client: httpx.AsyncClient) -> dict:
    names_to_try = [name]
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
                f"{WIKI_REST}{encoded}",
                headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
            )
            if r.status_code != 200:
                continue
            data = r.json()
            extract = data.get("extract", "")
            if len(extract) < 60:
                continue
            thumb = (data.get("thumbnail") or {}).get("source", "")
            if thumb:
                thumb = re.sub(r"/\d+px-", "/400px-", thumb)
            return {
                "extract": extract[:800],
                "desc": data.get("description", ""),
                "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                "photo": thumb,
                "wikidata_qid": data.get("wikibase_item", ""),
            }
        except Exception:
            continue
    return {}


WIKIDATA_ENTITY_URL = "https://www.wikidata.org/wiki/Special:EntityData/"
WIKIDATA_INDIA_QID = "Q668"


async def _fetch_wikidata_claims(qid: str, client: httpx.AsyncClient) -> dict:
    """Fetches the raw claims dict for a Wikidata entity once, so citizenship
    (P27) and birth year (P569) can both be read from a single request instead
    of one each. Returns {} on any failure (missing qid, network error, no
    claims) — callers treat that as "nothing known", not an error."""
    if not qid:
        return {}
    try:
        r = await client.get(
            f"{WIKIDATA_ENTITY_URL}{qid}.json",
            headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
        )
        if r.status_code != 200:
            return {}
        return r.json().get("entities", {}).get(qid, {}).get("claims", {})
    except Exception as exc:
        logger.debug("Wikidata entity fetch failed for %s: %s", qid, exc)
        return {}


def _wikidata_is_indian(claims: dict) -> bool | None:
    """Wikidata's P27 (country of citizenship) claim is a much more reliable
    Indian/non-Indian signal than scanning free-text summaries — those often
    omit nationality entirely (e.g. a short bio that never says "Dutch" or
    "American"). Returns True/False when a P27 claim exists, None when
    Wikidata has no claim on file (fall back to the text heuristic)."""
    countries = {
        c.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
        for c in claims.get("P27", [])
    }
    countries.discard(None)
    if not countries:
        return None
    return WIKIDATA_INDIA_QID in countries


def _wikidata_birth_year(claims: dict) -> int | None:
    """Wikidata's P569 (date of birth) — far more reliable than scanning the
    Wikipedia extract text, since a well-established figure's REST API summary
    often never spells out an explicit birth year even though it's in the
    infobox (e.g. "Nandan Nilekani is an Indian entrepreneur..." with no date)."""
    for c in claims.get("P569", []):
        time_str = c.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("time", "")
        m = re.match(r"^[+-](\d{4})", time_str)
        if m:
            return int(m.group(1))
    return None


# ── Step 5: build grounded briefs ─────────────────────────────────────────

_NON_PERSON_DESC = [
    "country", "city", "town", "village", "hotel", "airline", "airport",
    "island", "state", "district", "region", "river", "mountain",
    "company", "corporation", "organisation", "organization", "government agency",
    "government body", "ministry", "political party", "newspaper", "magazine",
    "television", "film", "album", "song", "book", "video game", "software",
    "building", "stadium", "temple", "museum", "bank", "university", "school",
    "brand", "product", "award ceremony", "festival", "holiday", "event",
]

_NON_COMPANY_DESC = [
    "politician", "actor", "actress", "singer", "musician", "cricketer",
    "footballer", "athlete", "country", "city", "island", "person",
]
# Word-boundary regex for both lists — a plain substring check let "film" (meant
# to reject a movie's own Wikipedia page, e.g. "1994 Indian drama film") match
# inside "filmmaker" too, silently rejecting every real film director's page
# ("Indian filmmaker (born 1973)") for any person-type search. Confirmed live
# 2026-08-31 as the actual root cause behind "Director of the Year" returning
# no real directors, no matter how good the search queries/seed list were —
# candidates were being correctly found and then wrongly discarded right here.
_NON_PERSON_DESC_RE = re.compile(
    r"\b(" + "|".join(re.escape(s) for s in _NON_PERSON_DESC) + r")\b"
)
_NON_COMPANY_DESC_RE = re.compile(
    r"\b(" + "|".join(re.escape(s) for s in _NON_COMPANY_DESC) + r")\b"
)


def _is_wrong_entity_type(wiki_desc: str, entity_type: str) -> bool:
    """Wikipedia's short 'description' field is a reliable, cheap signal for what
    kind of thing a page is about — use it to reject obvious mismatches (a hotel
    or country turning up when we asked for a person, etc)."""
    desc = (wiki_desc or "").lower()
    if not desc:
        return False
    if entity_type == "person":
        return bool(_NON_PERSON_DESC_RE.search(desc))
    if entity_type == "company":
        return bool(_NON_COMPANY_DESC_RE.search(desc))
    return False


_PERSON_DESC_SIGNALS = [
    "businessman", "businesswoman", "business executive", "entrepreneur",
    "ceo", "chief executive", "chairman", "chairperson", "managing director",
    "founder", "co-founder", "executive", "industrialist", "investor",
    "politician", "journalist", "editor", "news anchor", "broadcaster",
    "actor", "actress", "cricketer", "footballer", "athlete", "sportsperson",
    "writer", "author", "scientist", "engineer", "professor", "economist",
    "banker", "philanthropist", "singer", "musician", "activist",
    "lawyer", "physician",
]
# Word-boundary regex per signal — a plain substring check would match "academic"
# inside "academic qualification" (an adjective, not an occupation) the same way
# it matches "an Indian academic" (an occupation); \b anchors avoid that.
_PERSON_DESC_RE = re.compile(
    r"\b(" + "|".join(re.escape(s) for s in _PERSON_DESC_SIGNALS) + r")\b"
)
_BORN_PATTERN_RE = re.compile(r"\bborn\b|\(\s*b\.\s*\d{4}\s*\)|\(\s*\d{4}\s*[–—-]\s*\)")
_DISAMBIG_DESC = ("topics referred to by the same term", "index of", "disambiguation")


def _is_disambiguation(wiki_desc: str, wiki_extract: str) -> bool:
    desc = (wiki_desc or "").lower()
    if any(d in desc for d in _DISAMBIG_DESC):
        return True
    return "may refer to" in (wiki_extract or "")[:60].lower()


def _looks_like_person_page(wiki_desc: str, wiki_extract: str) -> bool:
    """The absence of a red flag (_is_wrong_entity_type) isn't enough — a real
    Wikipedia page for a bank, a product, or a disambiguation/concept topic
    ("Union Bank", "Google Cloud", "Young Entrepreneur" the concept) clears
    that bar too. Require positive evidence the page is actually about a
    person: an occupation word in the short description (checked there only —
    a concept article's prose can use the same vocabulary while discussing the
    topic, so the extract isn't reliable for this), or a "born ..." marker
    which is specific enough to check across both."""
    # (disambiguation check now happens once, upstream in build_briefs, for both entity types)
    if _PERSON_DESC_RE.search((wiki_desc or "").lower()):
        return True
    combined = f"{wiki_desc or ''} {(wiki_extract or '')[:200]}".lower()
    return bool(_BORN_PATTERN_RE.search(combined))


_INDIAN_SIGNALS = [
    "indian", "india", "mumbai", "delhi", "bengaluru", "bangalore", "chennai",
    "hyderabad", "kolkata", "pune", "ahmedabad", "gujarat", "maharashtra",
    "karnataka", "tamil nadu", "kerala", "punjab", "rajasthan", "west bengal",
    "iit ", "iim ", "bharat", "rupee", "crore", "lakh", "bollywood",
]
# Deliberately broad — this platform sees global search results (Forbes/YourStory/
# Inc42 lists are not India-only), so anyone carrying one of these nationality
# words is rejected even if "Indian" also appears (catches "Indian-American",
# "British Indian", etc. — diaspora figures based abroad, e.g. Sundar Pichai,
# Satya Nadella, Indra Nooyi — which is exactly what the platform must exclude).
_NON_INDIAN_SIGNALS = [
    "american", "british", "canadian", "australian", "chinese", "japanese",
    "german", "french", "russian", "singaporean", "emirati", "pakistani",
    "bangladeshi", "sri lankan", "nepali", "thai", "vietnamese", "malaysian",
    "indonesian", "filipino", "korean", "taiwanese", "dutch", "swedish",
    "swiss", "italian", "spanish", "portuguese", "brazilian", "mexican",
    "south african", "nigerian", "kenyan", "israeli", "turkish", "irish",
    "scottish", "welsh", "english", "hong kong", "burmese", "cambodian",
    "laotian", "mongolian", "kazakh", "qatari", "saudi", "kuwaiti", "omani",
    # Foreign tech-hub/company context — catches the diaspora-founder pattern a
    # nationality-adjective alone misses: an IIT-alum who founded and runs a
    # Silicon-Valley/Nasdaq company has "iit " (an _INDIAN_SIGNALS hit) in their
    # press coverage but is not eligible for an India-based business award —
    # exactly the Sundar Pichai/Satya Nadella pattern this list already exists
    # to exclude, just missing the location half of the signal.
    "silicon valley", "san francisco", "bay area", "nasdaq", "new york stock exchange",
    "california", "seattle", "boston", "wall street",
]

# Matches a birth-death parenthetical regardless of what's between the two years —
# Wikipedia's actual lead-sentence format is "(4 July 1968 – 4 September 2022)", full
# dates, not bare "(1968-2022)". The previous version of this regex required the year
# to sit immediately after "(" and only matched the bare-year-range form, so it never
# matched real Wikipedia text and let deceased candidates through undetected.
_DEATH_YEAR_RE = re.compile(
    r"\([^()]*?\b(1[6-9]\d{2}|20\d{2})\b[^()]*?[–—-][^()]*?\b(1[6-9]\d{2}|20\d{2})\b[^()]*?\)"
)
# "X was a/an/the ..." is Wikipedia's standard opening-sentence convention for a
# deceased subject ("is a/an/the" for living) — searched (not anchored) over the start
# of the extract since the name+dates prefix contains "(", ")", "–" which a
# start-anchored word-character class can never cross.
_WAS_A_RE = re.compile(r"\bwas\s+(?:a|an|the)\b", re.IGNORECASE)

# Matches "(born 24 December 1972)", "born April 19, 1957", "born 1977", "(b. 1990)".
# Non-greedy .{0,40}? so it finds the NEAREST 4-digit year after "born" — a day-of-month
# number ("24") is only 2 digits so \b\d{4}\b skips past it to the actual year.
# Distinct enough from _DEATH_YEAR_RE (which requires a year RANGE) to coexist safely.
_BIRTH_YEAR_RE = re.compile(
    r"\bborn\b.{0,40}?\b(\d{4})\b|\(\s*b\.\s*(\d{4})\s*\)"
)


def _compute_age(wiki_desc: str, wiki_extract: str) -> int | None:
    """Best-effort age from a birth year mentioned in the bio. Returns None
    when no birth year can be found — callers should NOT reject on None
    (fail open on unknown age), only on a determined age that's too old."""
    from datetime import datetime
    combined = f"{wiki_desc or ''} {(wiki_extract or '')[:400]}"
    m = _BIRTH_YEAR_RE.search(combined)
    if not m:
        return None
    year_str = m.group(1) or m.group(2)
    try:
        birth_year = int(year_str)
    except ValueError:
        return None
    if not (1900 <= birth_year <= datetime.utcnow().year):
        return None
    return datetime.utcnow().year - birth_year

# ── LLM nationality fallback (BUG 1) ──────────────────────────────────────
# Only reached when the Wikidata claim (checked above) and the text heuristic
# both come back inconclusive — a bio that never states a nationality at all.
_LLM_NATIONALITY_SIGNALS = [
    "india", "indian", "mumbai", "delhi", "bengaluru", "chennai", "hyderabad",
    "kolkata", "pune", "ahmedabad", "gujarat", "maharashtra", "reliance",
    "tata", "infosys", "wipro", "rupee", "crore", "iit",
]
_LLM_NATIONALITY_SEM = asyncio.Semaphore(3)


async def _llm_verify_indian(name: str, wiki_extract: str) -> bool:
    """Fail-open: returns True only when Groq explicitly answers NO. Any
    error, timeout, or ambiguous answer keeps the candidate."""
    prompt = (
        "Based ONLY on this Wikipedia text, is this person primarily known for "
        f"work in India?\nText: {wiki_extract[:400]}\n"
        "Answer with exactly one word: YES or NO"
    )
    try:
        async with _LLM_NATIONALITY_SEM:
            resp = await call_with_fallback(
                _groq(),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=3,
                attempts_per_model=1,
            )
        if (resp.choices[0].message.content or "").strip().upper().startswith("NO"):
            logger.info("Dropped by LLM nationality check: %s", name)
            return True
    except Exception as exc:
        logger.debug("LLM nationality check failed for %s (keeping candidate): %s", name, exc)
    return False


def _is_non_indian(wiki_desc: str, wiki_extract: str) -> bool:
    """This platform is exclusively for Indian awards (AIMA) — nominees who are people
    must be Indian or clearly India-connected. Checks description + opening of the bio.
    A foreign-nationality word wins even if "Indian" also appears in the same text —
    that's the "Indian-American" / diaspora case, which AIMA does not consider Indian
    for this purpose."""
    combined = f"{wiki_desc or ''} {(wiki_extract or '')[:400]}".lower()
    if any(s in combined for s in _NON_INDIAN_SIGNALS):
        return True
    if any(s in combined for s in _INDIAN_SIGNALS):
        return False
    # Unclear nationality — don't reject on absence of a signal alone, since many
    # legitimate Indian public figures' Wikipedia summaries don't say "Indian" outright.
    return False


_INELIGIBLE_PROFESSIONS = [
    "politician", "minister", "member of parliament", "member of the legislative",
    "bureaucrat", "civil servant", "ias officer", "ips officer",
    # Sports — Wikipedia short descriptions usually name the specific sport/event
    # ("javelin thrower", "chess grandmaster"), not the generic word "athlete",
    # so this needs to enumerate the common ones rather than rely on one catch-all.
    "cricketer", "footballer", "athlete", "sportsperson", "sportswoman", "sportsman",
    "javelin thrower", "shot putter", "discus thrower", "long jumper", "high jumper",
    "sprinter", "marathon runner", "wrestler", "boxer", "badminton player",
    "tennis player", "table tennis player", "hockey player", "chess player",
    "chess grandmaster", "shooter", "archer", "weightlifter", "gymnast", "swimmer",
    "golfer", "kabaddi player", "basketball player", "volleyball player",
    "para athlete", "paralympian", "olympian",
    # Entertainment / creative
    "actor", "actress", "film star", "playback singer", "singer", "musician",
    "dancer", "model", "influencer", "content creator",
]
# award text containing any of these means the disqualifying profession above
# is actually the intended one for THIS award — don't reject it there.
_PROFESSION_AWARD_OVERRIDES = [
    "media", "journalism", "journalist", "editor", "broadcast", "broadcaster",
    "entertainment", "cinema", "film", "sports", "cricket", "athlete",
    "public service", "politician", "politics", "governance",
]


def _is_ineligible_profession(wiki_desc: str, award_text: str) -> bool:
    """AIMA business/entrepreneurship awards aren't for politicians, cricketers,
    or film stars — unless the award itself is explicitly for that field (e.g.
    "Outstanding Contribution to Media"), in which case this check is skipped."""
    if any(o in award_text for o in _PROFESSION_AWARD_OVERRIDES):
        return False
    desc = (wiki_desc or "").lower()
    return any(p in desc for p in _INELIGIBLE_PROFESSIONS)


# Language that shows up in press coverage of a genuinely young/emerging founder —
# used only as the qualification path below, never as a hard requirement elsewhere.
_YOUNG_FOUNDER_SIGNALS = [
    "young", "co-founder", "cofounder", "founder", "startup founder", "emerging",
    "30 under 30", "under 30", "under 40", "gen z", "millennial", "youngest",
]


def _qualifies_via_press_coverage(name: str, snippet_text: str, mention_count: int, award_text: str) -> bool:
    """Wikipedia's notability bar systematically favours decades-established
    figures — a real young founder with a recent funding round often has no
    Wikipedia page at all. For age-capped person awards specifically, allow a
    candidate to qualify on strong press coverage instead: real corroborating
    mentions (not a one-off noise match), Indian-context language, youth/founder
    language, and not an obviously wrong profession. This path is intentionally
    narrow — it only ever runs when hard_filters.max_age is set, i.e. exactly
    the case where the Wikipedia-only rule was excluding real candidates."""
    if mention_count < 2 or not snippet_text:
        return False
    text = snippet_text.lower()
    if any(s in text for s in _NON_INDIAN_SIGNALS):
        return False
    if not any(s in text for s in _YOUNG_FOUNDER_SIGNALS):
        return False
    if _is_ineligible_profession(text, award_text):
        return False
    return True


def _qualifies_via_generic_press(name: str, snippet_text: str, mention_count: int, award_text: str) -> bool:
    """Relaxed fallback qualification path — used ONLY when discover() finished all
    its normal rounds still short of the requested nominee count (build_briefs is
    called with strict=False for exactly this pool of otherwise-rejected names).
    A real, currently-active candidate can simply lack a Wikipedia page — English
    Wikipedia's notability bar skews toward decades-established figures — so this
    admits one on real corroborating press coverage instead: multiple independent
    mentions, explicit Indian-context language, and not an obviously wrong
    profession for the award. Unlike _qualifies_via_press_coverage() above, this
    has no youth/founder language requirement (it's not age-award-specific) but
    requires an explicit Indian signal rather than just the absence of a foreign
    one, since it no longer has that language requirement acting as a relevance
    filter. Never relaxes nationality or profession — only the 'must have a
    Wikipedia page' evidentiary bar."""
    if mention_count < 2 or not snippet_text:
        return False
    text = snippet_text.lower()
    if any(s in text for s in _NON_INDIAN_SIGNALS):
        return False
    if not any(s in text for s in _INDIAN_SIGNALS):
        return False
    if _is_ineligible_profession(text, award_text):
        return False
    return True


_MIN_PROMINENT_EXTRACT_LEN = 150


def _is_low_prominence(wiki_extract: str, mention_count: int) -> bool:
    """AIMA honours nationally-recognised figures (see _AIMA_REFERENCE) — a one-line
    Wikipedia stub with no corroborating press coverage is not enough evidence that a
    candidate is actually prominent. Require either a substantive Wikipedia bio or
    multiple independent search-result mentions."""
    return len(wiki_extract or "") < _MIN_PROMINENT_EXTRACT_LEN and mention_count < 2


def _wikidata_is_deceased(claims: dict) -> bool:
    """Wikidata's P570 (date of death) claim is the most reliable deceased signal —
    present iff the subject is confirmed dead, independent of whatever phrasing the
    Wikipedia lead sentence happens to use. Checked first; the text heuristics in
    _is_deceased() below are the fallback for candidates with no Wikidata claims
    (e.g. qualified via the press-coverage path, with no Wikipedia page at all)."""
    return bool(claims.get("P570"))


def _is_deceased(wiki_desc: str, wiki_extract: str) -> bool:
    """Nominees should be living people, except for lifetime-achievement awards.
    Wikipedia short descriptions for deceased people typically carry a
    '(4 July 1968 – 4 September 2022)' style lifespan; the extract often opens
    with 'was a...' rather than 'is a...'."""
    combined = f"{wiki_desc or ''} {(wiki_extract or '')[:250]}"
    if _DEATH_YEAR_RE.search(combined):
        return True
    extract_start = (wiki_extract or "").strip()[:160]
    if _WAS_A_RE.search(extract_start):
        return True
    return False


_NAME_TOKEN_RE = re.compile(r"[a-z]+")


def _mentions_full_name(name: str, chunk: dict) -> bool:
    """Requires EVERY word of the candidate's name to appear in the chunk, not
    just the first name — fixes a real bug where matching on first name alone
    (e.g. just "Sumit") pulled in unrelated people who happen to share it.
    Word-set match rather than exact-phrase so word order/spacing differences
    don't matter, still far stricter than a first-word substring check."""
    name_tokens = set(_NAME_TOKEN_RE.findall(name.lower()))
    if not name_tokens:
        return False
    text_tokens = set(_NAME_TOKEN_RE.findall(f"{chunk.get('title','')} {chunk.get('content','')}".lower()))
    return name_tokens.issubset(text_tokens)


_ORG_STOPWORDS = {"india", "ltd", "limited", "group", "inc", "pvt", "private", "co", "company", "the", "of", "and"}


def _url_matches_organisation(url: str, organisation: str) -> bool:
    """A chunk hosted on the candidate's own known employer's website is about
    them with much higher confidence than a name-only text match — no LLM
    judgment call needed. Reduces "KPMG India" to "kpmg" and checks it's a
    substring of the URL's host, deliberately simple (a false negative here
    just means that chunk goes through the normal LLM disambiguation instead,
    not that it's lost)."""
    if not organisation or not url:
        return False
    org_words = [w for w in re.findall(r"[a-z]+", organisation.lower()) if w not in _ORG_STOPWORDS]
    if not org_words:
        return False
    host = (urlparse(url).netloc or "").lower()
    return any(w in host for w in org_words if len(w) >= 3)


async def _disambiguate_mentions(
    name: str, mentions: list[dict], context: str = "", organisation: str = "",
) -> list[dict]:
    """Full-name matching alone doesn't help when two real, unrelated people
    share the exact same full name — confirmed live: nominee "Sumit Kapoor", a
    KPMG partner, had his source_links contaminated with news coverage of a
    completely different "Sumit Kapoor" (an airline pilot who died in an
    unrelated plane crash), plus an unrelated doctor, an unrelated CFO, and
    unrelated court cases, because all share the identical two-word name.
    This is the highest-risk case: a candidate with no Wikipedia page has NO
    other identity signal at all, so a same-name collision here has nothing
    to override it.

    Fails CLOSED, not open — a first version of this defaulted to "keep
    everything" whenever the model was uncertain or a chunk set happened to
    contain zero genuine matches for the real candidate (confirmed live: for
    Sumit Kapoor's controversy search, EVERY result was actually about other
    same-named people, so there was no internal "majority" pointing at the
    real person — the old prompt's fallback kept all 13 wrong results
    instead of catching that none of them matched). For a tool with no
    tolerance for misattributed information, silently dropping some real
    evidence on an ambiguous or failed call is the safe direction to fail in;
    silently keeping wrong-person content about a plane crash is not.

    A chunk hosted on the candidate's own known employer's site (see
    _url_matches_organisation) is auto-kept without needing an LLM judgment
    call — confirmed live this matters: the LLM pass alone was inconsistently
    discarding genuinely correct, richer content (real KPMG service pages
    listing his actual title) along with the wrong-person noise, leaving an
    accurate but nearly-empty profile. Only the remaining, less-certain chunks
    go through the LLM."""
    if len(mentions) < 2:
        return mentions

    auto_kept, to_judge = [], []
    for m in mentions:
        (auto_kept if _url_matches_organisation(m.get("url", ""), organisation) else to_judge).append(m)
    if not to_judge:
        return auto_kept
    if len(to_judge) < 2:
        return auto_kept + to_judge

    listing = "\n".join(f"[{i}] {m['title']}: {m['content'][:200]}" for i, m in enumerate(to_judge[:15]))
    context_line = (
        f'The correct candidate is specifically: {context}. Keep ONLY snippets clearly consistent with '
        f'being about that specific person — if NONE of the snippets clearly match, return an empty array.'
        if context else
        'No extra context is available beyond the name. Identify the single largest cluster of snippets '
        'that are mutually consistent with each other (same profession/organisation/context) and keep '
        'only that cluster. If there is no clear majority cluster — e.g. the snippets describe several '
        'different people in roughly equal numbers — return an empty array rather than guessing.'
    )
    prompt = f"""Below are real search snippets, all matched because they mention the name "{name}".
Some or ALL of them may actually be about a DIFFERENT real person who happens to share the same name
(a name collision) — this name may belong to several unrelated real people.

SNIPPETS:
{listing}

{context_line}

When in doubt about any individual snippet, EXCLUDE it rather than include it — the cost of wrongly
attributing a real event to the wrong person is much higher than the cost of leaving a snippet out.

Return ONLY a JSON array of the indices to KEEP, e.g. [0,1,3] or [] if none clearly match."""
    try:
        # 800, not a couple hundred — this project's Groq models spend tokens on
        # hidden reasoning before the final answer; a tight budget was confirmed
        # live to let the model exhaust it mid-think and return an empty string,
        # which (correctly, per the fail-closed policy above) looked identical to
        # "found no match" and silently dropped every real, valid source too.
        raw = await _groq_chat(prompt, temperature=0.0, max_tokens=800)
        keep_idx = _parse_json(raw)
        if isinstance(keep_idx, list):
            judged = [to_judge[i] for i in keep_idx if isinstance(i, int) and 0 <= i < min(len(to_judge), 15)]
            return auto_kept + judged
    except Exception as exc:
        logger.debug("Mention disambiguation failed for '%s': %s", name, exc)
    return auto_kept


async def build_briefs(
    names: list[str], search_chunks: list[dict], entity_type: str,
    is_lifetime_award: bool = False, award_text: str = "",
    hard_filters: dict | None = None, strict: bool = True,
) -> list[RawEnrichment]:
    """
    For each candidate name:
      - fetch Wikipedia (verification + bio + photo)
      - collect real search-result snippets that mention them (grounding text)
      - drop candidates with no evidence, the wrong entity type, non-Indian people,
        or (unless this is a lifetime-achievement award) deceased people

    strict=False relaxes only the evidentiary bar — a thin Wikipedia stub is no
    longer disqualifying on its own, and a candidate with no Wikipedia page at all
    can qualify on real corroborating press coverage regardless of the award's age
    constraints. Nationality, deceased-status, entity-type, and profession checks
    are never relaxed. Used by discover() as a last-resort fill when the strict
    pass came up short of the requested nominee count (see discover()'s final
    "relaxed fill" pass) — never as the default.
    """
    semaphore = asyncio.Semaphore(10)

    async def one(name: str, client: httpx.AsyncClient) -> RawEnrichment:
        async with semaphore:
            wiki = await fetch_wikipedia(name, client)

        mentions = [c for c in search_chunks if _mentions_full_name(name, c)]
        if not wiki and entity_type == "person" and len(mentions) >= 2:
            # No Wikipedia page = no other identity signal at all — the exact
            # condition under which a same-full-name collision goes undetected.
            mentions = await _disambiguate_mentions(name, mentions)
        snippet_text = " | ".join(f"{m['title']}: {m['content'][:300]}" for m in mentions[:8])

        r = RawEnrichment(name=name, entity_type=entity_type)
        wikidata_qid = ""
        if wiki:
            r.wiki_extract = wiki.get("extract", "")
            r.wiki_desc = wiki.get("desc", "")
            r.wiki_url = wiki.get("url", "")
            r.photo_url = wiki.get("photo", "")
            wikidata_qid = wiki.get("wikidata_qid", "")
            if r.wiki_url:
                r.source_urls.append(r.wiki_url)
        r.ddg_text = snippet_text
        r.source_urls.extend(m["url"] for m in mentions[:8] if m.get("url"))

        # Require an actual Wikipedia page — regex extraction over search-result text
        # also matches page boilerplate ("Apply Now", "Meet Our Team") that happens to
        # look like a proper name; a real Wikipedia page is the one check that reliably
        # tells a genuine notable person/company apart from that noise.
        qualifies = (
            bool(r.wiki_extract)
            and not _is_wrong_entity_type(r.wiki_desc, entity_type)
            and not _is_disambiguation(r.wiki_desc, r.wiki_extract)
        )
        if qualifies and entity_type == "person":
            if not _looks_like_person_page(r.wiki_desc, r.wiki_extract):
                qualifies = False
            else:
                # Wikidata's structured claims (citizenship, birth year), when they
                # exist, are more reliable than scanning free text — a short bio can
                # easily omit nationality words entirely, and a well-established
                # figure's extract often never states an explicit birth year even
                # though it's in the infobox. One fetch covers both.
                async with semaphore:
                    wikidata_claims = await _fetch_wikidata_claims(wikidata_qid, client)
                wikidata_indian = _wikidata_is_indian(wikidata_claims)
                # Exception: an EXPLICIT foreign-nationality word in the text (e.g.
                # "Indian-American business executive") wins over Wikidata regardless.
                # Wikidata's P27 is a set of ALL citizenship claims a person has ever
                # held — a naturalised dual/former citizen (Ajay Banga: born Indian,
                # naturalised American) still carries India as one of several P27
                # values, so "India in the claim set" alone doesn't mean India is the
                # CURRENT primary nationality the way an explicit text descriptor does.
                text_explicitly_foreign = any(
                    s in f"{r.wiki_desc or ''} {(r.wiki_extract or '')[:400]}".lower()
                    for s in _NON_INDIAN_SIGNALS
                )
                if text_explicitly_foreign:
                    is_non_indian = True
                elif wikidata_indian is not None:
                    is_non_indian = not wikidata_indian
                else:
                    is_non_indian = _is_non_indian(r.wiki_desc, r.wiki_extract)
                if (
                    not is_non_indian and wikidata_indian is not True
                    and len(r.wiki_extract) > 60
                    and not any(s in r.wiki_extract.lower() for s in _LLM_NATIONALITY_SIGNALS)
                ):
                    is_non_indian = await _llm_verify_indian(name, r.wiki_extract)
                max_age = hard_filters.get("max_age") if hard_filters else None
                age = None
                if max_age:
                    birth_year = _wikidata_birth_year(wikidata_claims)
                    if birth_year:
                        from datetime import datetime
                        age = datetime.utcnow().year - birth_year
                    else:
                        age = _compute_age(r.wiki_desc, r.wiki_extract)
                if is_non_indian:
                    qualifies = False
                elif not is_lifetime_award and (
                    _wikidata_is_deceased(wikidata_claims)
                    or _is_deceased(r.wiki_desc, r.wiki_extract)
                ):
                    logger.info("Dropped deceased candidate (non-lifetime award): %s", name)
                    qualifies = False
                elif strict and _is_low_prominence(r.wiki_extract, len(mentions)):
                    qualifies = False
                elif _is_ineligible_profession(r.wiki_desc, award_text):
                    qualifies = False
                elif max_age and age is not None and age > max_age:
                    logger.info("Dropped over-age candidate (age %d > max %d): %s", age, max_age, name)
                    qualifies = False
                elif max_age and age is None:
                    # Deliberate exception to the usual fail-open default: for a strict
                    # age-ceiling award (Young Entrepreneur, etc.) an undeterminable age
                    # is disproportionately an older, well-established public figure whose
                    # profile simply omits an explicit birth year (e.g. "Indian businessman"
                    # with no date) — not an actual young founder, who if anything tends to
                    # have thinner biographical data, not missing-in-a-suspicious-way data.
                    logger.info("Dropped candidate of undeterminable age for age-capped award: %s", name)
                    qualifies = False
        elif not r.wiki_extract and entity_type == "person" and (
            (
                hard_filters and hard_filters.get("max_age")
                and _qualifies_via_press_coverage(name, snippet_text, len(mentions), award_text)
            ) or (
                not strict
                and _qualifies_via_generic_press(name, snippet_text, len(mentions), award_text)
            )
        ):
            # No Wikipedia page. Either an age-capped award and the candidate has
            # real corroborating press coverage with youth/founder language (see
            # _qualifies_via_press_coverage), or — only in the relaxed fallback
            # pass — real corroborating press coverage in general (see
            # _qualifies_via_generic_press).
            logger.info("Qualified via press coverage (no Wikipedia page, strict=%s): %s", strict, name)
            qualifies = True
        elif qualifies and entity_type == "company" and hard_filters and hard_filters.get("require_psu"):
            name_lower, extract_lower = name.lower(), (r.wiki_extract or "").lower()
            is_known_psu = any(p.lower() in name_lower for p in tier_router.KNOWN_PSU_LIST)
            has_psu_evidence = any(
                s in extract_lower for s in ("public sector", "government of india", "ministry of")
            )
            if not is_known_psu and not has_psu_evidence:
                logger.info("Dropped non-PSU for PSU award: %s", name)
                qualifies = False
        r.has_data = qualifies
        if qualifies:
            (
                r.news_text, controversy_chunks, activity_chunks, financial_chunks, fallback_photo,
            ) = await asyncio.gather(
                fetch_recent_news(name, entity_type),
                fetch_controversy_chunks(name),
                fetch_recent_activity(name, entity_type),
                fetch_financial_trend(name, entity_type),
                _resolve_photo(name, entity_type, r.photo_url),
            )
            r.photo_url = fallback_photo
            # Tavily's quoted-phrase queries (`"{name}" ...`) already scope these three
            # fetches fairly well, but that's not a guarantee — re-check full-name
            # presence here too rather than trust the search engine honored the quotes,
            # especially for controversy_chunks: a wrongly-attributed "point of concern"
            # from a same-name collision is the single worst failure mode this pipeline
            # can produce.
            controversy_chunks = [c for c in controversy_chunks if _mentions_full_name(name, c)]
            activity_chunks = [c for c in activity_chunks if _mentions_full_name(name, c)]
            financial_chunks = [c for c in financial_chunks if _mentions_full_name(name, c)]
            # Disambiguate all three, not just controversy_chunks — a same-full-name
            # collision isn't confined to controversy search; confirmed live it slipped
            # through into "Recent Activity" for a candidate (a real KPMG partner mixed
            # up with an unrelated airline pilot who shares his exact name) because only
            # controversy_chunks had this call wired up the first time.
            if not r.wiki_extract and entity_type == "person":
                if len(controversy_chunks) >= 2:
                    controversy_chunks = await _disambiguate_mentions(name, controversy_chunks)
                if len(activity_chunks) >= 2:
                    activity_chunks = await _disambiguate_mentions(name, activity_chunks)
                if len(financial_chunks) >= 2:
                    financial_chunks = await _disambiguate_mentions(name, financial_chunks)
            if controversy_chunks:
                # 16, not 8 — confirmed live the real signal can get pushed past a
                # tight cutoff by generic same-name "Biography"/"Latest News"/"Profile"
                # aggregator pages that rank ahead of it (Naresh Goyal's actual ED
                # arrest article was chunk #9; an 8-chunk cap fed the AI nothing but
                # noise). fetch_controversy_chunks already pulls up to ~24 real chunks
                # across 3 queries, so this costs no extra API calls, just uses more
                # of what's already fetched.
                r.controversy_text = " | ".join(
                    f"{c['title']}: {c['content'][:250]}" for c in controversy_chunks[:16]
                )[:3000]
                r.source_urls.extend(c["url"] for c in controversy_chunks[:16] if c.get("url"))
            if activity_chunks:
                r.recent_activity_text = " | ".join(
                    f"{c['title']}: {c['content'][:400]}" for c in activity_chunks[:8]
                )[:1400]
                r.source_urls.extend(c["url"] for c in activity_chunks[:8] if c.get("url"))
            if financial_chunks:
                r.financial_trend_text = " | ".join(
                    f"{c['title']}: {c['content'][:400]}" for c in financial_chunks[:8]
                )[:1400]
                r.source_urls.extend(c["url"] for c in financial_chunks[:8] if c.get("url"))
        return r

    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        results = await asyncio.gather(*[one(n, client) for n in names], return_exceptions=True)

    kept = [r for r in results if isinstance(r, RawEnrichment) and r.has_data]
    dropped = len(names) - len(kept)
    logger.info("build_briefs: %d kept, %d dropped (no verifiable evidence)", len(kept), dropped)
    return kept


# ── Orchestrator ───────────────────────────────────────────────────────────

_LIFETIME_SIGNALS = [
    "lifetime", "life time", "legacy", "legend", "veteran", "distinguished",
    "posthumous", "hall of fame",
]


def _is_lifetime_award(award_name: str, award_desc: str) -> bool:
    combined = f"{award_name} {award_desc}".lower()
    return any(s in combined for s in _LIFETIME_SIGNALS)


async def discover(
    award_name: str, award_desc: str, entity_type: str, target_count: int,
) -> tuple[list[RawEnrichment], int]:
    """
    Full grounded discovery pipeline for one entity type ("person" or "company").
    Returns (briefs ready for dossier_builder.build_dossiers(), raw extracted-name count).

    Round 0 pulls from curated, deterministic sources first (real past AIMA winners
    for the matched category, tier-appropriate magazine "Top N" lists, Google Custom
    Search) — these are higher-precision than live web search and don't need widening.
    Only if that's still short of target_count does it fall into live Tavily/DuckDuckGo
    search, widening up to 3 extra rounds. The Indian/alive/prominence/profession filters
    in build_briefs() reject a lot of raw extraction noise, so this needs real headroom.
    """
    is_lifetime = _is_lifetime_award(award_name, award_desc)
    award_text = f"{award_name} {award_desc}".lower()
    tier_info = tier_router.classify(award_name, award_desc, entity_type)
    hard_filters = tier_router.get_hard_filters(entity_type, tier_info.tier, award_name, award_desc)

    all_chunks: list[dict] = []
    checked_names: set[str] = set()
    all_names_seen: dict[str, str] = {}  # lowercase -> original casing, every name ever checked
    briefs: list[RawEnrichment] = []
    total_extracted = 0

    # Past winners of THIS category are calibration signal for query/prompt quality
    # (see aima_historical_seed.py), never candidates themselves — someone who
    # already won "Entrepreneur of the Year" shouldn't be re-suggested as a nominee
    # for it. Excluded by name at every stage below, not just left out of round 0,
    # in case live search independently resurfaces the same person.
    past_winner_names = {n.lower() for n in tier_router.seed_names_for(tier_info)}

    # ── Round 0: curated sources — tier-matched magazine lists, Google Custom
    # Search. These are deterministic/curated, not something re-querying helps
    # with, so they run once, up front.
    #
    # scrape_tier_sources() pulls from PURELY BUSINESS lists (Forbes Rich List,
    # Most Powerful CEOs, BW500, YourStory/Inc42 startup lists) for every tier —
    # for a non-business-genre category (a film award, a media award) that's
    # tier_router.classify()'s default fallback tier "2", so it silently fills
    # the nominee quota with CEOs/chairmen before Rounds 1-4's genre-specific
    # queries below ever run. Confirmed live 2026-08-31: "Director of the Year"
    # returned 5/5 business executives with zero film directors, generated
    # entirely from this Round-0 scrape before the film-query fix got a chance
    # to fire. Skipped entirely for categories where it can't possibly help.
    _NON_BUSINESS_GENRE_CATEGORIES = {
        "Director of the Year", "Outstanding Contribution to Media", "Lifetime Contribution to Media",
    }
    scrape_task = (
        scrape_tier_sources(tier_info.tier, entity_type)
        if tier_info.matched_category not in _NON_BUSINESS_GENRE_CATEGORIES
        else asyncio.sleep(0, result=[])
    )
    scraped, googled = await asyncio.gather(
        scrape_task,
        google_search_candidates(
            award_name, entity_type,
            tier_label=tier_info.label, matched_category=tier_info.matched_category,
            age_constraint=tier_info.age_constraint,
        ),
        return_exceptions=True,
    )
    scraped = scraped if isinstance(scraped, list) else []
    googled = googled if isinstance(googled, list) else []

    # A couple of categories are narrow/hard-to-word search targets where live
    # search (even with dedicated queries) keeps surfacing the wrong kind of
    # famous name — Indian companies instead of foreign MNC subsidiaries, or
    # actors instead of directors. Known real, easily-verified candidates are
    # added as extra Round-0 seed candidates for exactly those; they still go
    # through the full build_briefs() verification below like any other
    # candidate, never assumed to qualify.
    known_seed_candidates: dict[str, list[str]] = {
        "MNC in India of the Year": aima_historical_seed.KNOWN_FOREIGN_MNC_INDIA_SUBSIDIARIES,
        "Director of the Year": aima_historical_seed.KNOWN_INDIAN_FILM_DIRECTORS,
    }
    known_seed = known_seed_candidates.get(tier_info.matched_category, [])

    curated_names, seen0 = [], set()
    for n in known_seed + [c["name"] for c in scraped] + [c["name"] for c in googled]:
        k = n.lower()
        if k not in seen0 and k not in past_winner_names:
            seen0.add(k)
            curated_names.append(n)

    logger.info(
        "[ResearchEngine] curated round: %d scraped + %d google = %d unique for '%s' (%s), "
        "excluding %d past winner(s) of this category",
        len(scraped), len(googled), len(curated_names), award_name, entity_type, len(past_winner_names),
    )

    if curated_names:
        checked_names.update(n.lower() for n in curated_names)
        all_names_seen.update({n.lower(): n for n in curated_names})
        total_extracted += len(curated_names)
        briefs.extend(await build_briefs(
            curated_names, all_chunks, entity_type, is_lifetime, award_text, hard_filters,
        ))

    # ── Rounds 1-4: live web search, only if curated sources fell short ──────────
    for round_num in range(1, 5):
        if len(briefs) >= target_count:
            break
        if round_num == 1:
            # Deterministic, AIMA-calibrated queries first (free, no LLM); Groq adds
            # a few more angles on top but the pipeline works fine without it.
            queries = build_grounded_queries(award_name, award_desc, target_count)
            try:
                queries += await generate_search_queries(award_name, award_desc, entity_type, count=4)
            except Exception as exc:
                logger.debug("generate_search_queries skipped: %s", exc)
        else:
            logger.info(
                "[ResearchEngine] Only %d/%d verified after round %d — widening search",
                len(briefs), target_count, round_num - 1,
            )
            queries = await generate_search_queries(
                award_name, award_desc, entity_type, count=6 + round_num,
            )
        logger.info("[ResearchEngine] round %d: %d queries for '%s' (%s)",
                    round_num, len(queries), award_name, entity_type)

        new_chunks = await web_search(queries)
        if not new_chunks and round_num == 1 and not briefs:
            logger.warning("[ResearchEngine] No web search results at all — check TAVILY_API_KEY / network")
            break
        all_chunks.extend(new_chunks)

        names = extract_candidates(all_chunks, entity_type)
        total_extracted += len(names)
        seen: set[str] = set()
        deduped = []
        for n in names:
            k = n.lower()
            if k not in seen and k not in past_winner_names:
                seen.add(k)
                deduped.append(n)

        # Only check names we haven't already checked against Wikipedia
        to_check = [n for n in deduped if n.lower() not in checked_names][: target_count * 15]
        checked_names.update(n.lower() for n in to_check)
        all_names_seen.update({n.lower(): n for n in to_check})

        if to_check:
            new_briefs = await build_briefs(
                to_check, all_chunks, entity_type, is_lifetime, award_text, hard_filters,
            )
            briefs.extend(new_briefs)

        if len(briefs) >= target_count or not new_chunks:
            break

    briefs = _dedupe_briefs(briefs)

    # ── Relaxed fill: the requested count still isn't met after the strict pass
    # exhausted its search rounds. Re-check every name already extracted-but-not-
    # kept (never re-search — the candidate pool is already there) with the
    # evidentiary bar relaxed (build_briefs(strict=False)): a thin Wikipedia stub
    # or no Wikipedia page at all no longer disqualifies on its own. Nationality,
    # deceased-status, and profession checks are NOT relaxed — this only recovers
    # real candidates that were rejected for being under-documented, never for
    # being non-Indian, dead (on a non-lifetime award), or the wrong profession.
    # dossier_builder's confidence_score ranking (and the caller's slice to
    # target_count) still decides which ones actually make the final cut, so this
    # only ever adds real, filtered candidates for that ranking to choose from.
    if len(briefs) < target_count:
        already_have = {b.name.lower() for b in briefs}
        relax_pool = [orig for low, orig in all_names_seen.items() if low not in already_have]
        if relax_pool:
            logger.info(
                "[ResearchEngine] Only %d/%d verified strictly for '%s' (%s) — relaxing "
                "evidence bar over %d already-seen candidate(s) to fill the shortfall",
                len(briefs), target_count, award_name, entity_type, len(relax_pool),
            )
            relaxed = await build_briefs(
                relax_pool[: target_count * 10], all_chunks, entity_type,
                is_lifetime, award_text, hard_filters, strict=False,
            )
            briefs = _dedupe_briefs(briefs + relaxed)
            logger.info(
                "[ResearchEngine] Relaxed fill added %d candidate(s) — now %d/%d for '%s' (%s)",
                len(relaxed), len(briefs), target_count, award_name, entity_type,
            )

    return briefs, total_extracted


def _dedupe_briefs(briefs: list[RawEnrichment]) -> list[RawEnrichment]:
    """Different candidate-name strings ("N Chandrasekaran" vs "N. Chandrasekaran",
    or a name pulled from both the seed list and a live search) can resolve to the
    same real Wikipedia page — dedupe by that actual identity (wiki_url), not just
    the literal name string, so the same person/company never appears twice."""
    seen: set[str] = set()
    out = []
    for b in briefs:
        key = b.wiki_url or b.name.lower()
        if key not in seen:
            seen.add(key)
            out.append(b)
    return out


async def discover_all(
    award_name: str, award_desc: str, entity_type: str, target_count: int,
) -> tuple[list[RawEnrichment], int]:
    """Entry point used by routes_ai_search.py. Handles entity_type == "both" by splitting."""
    if entity_type == "both":
        half_p = (target_count + 1) // 2
        half_c = target_count - half_p
        (persons, p_count), (companies, c_count) = await asyncio.gather(
            discover(award_name, award_desc, "person", half_p),
            discover(award_name, award_desc, "company", half_c),
        )
        return persons + companies, p_count + c_count
    return await discover(award_name, award_desc, entity_type, target_count)
