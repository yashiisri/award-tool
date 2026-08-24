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

import httpx
from groq import AsyncGroq

from config import settings
from services import tier_router
from services.aima_historical_seed import build_grounded_queries
from services.google_search_source import search_candidates as google_search_candidates
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
    source_urls: list = field(default_factory=list)
    has_data: bool = False


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


async def _ddg_one(query: str, client: httpx.AsyncClient) -> list[dict]:
    """Fallback web search when Tavily is unavailable or returns nothing for a query."""
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
    """Run all queries through Tavily; fall back to DuckDuckGo per-query if Tavily returns nothing."""
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
                "Tavily empty for %d/%d queries — using DuckDuckGo fallback",
                len(empty_queries), len(queries),
            )
            ddg_results = await asyncio.gather(
                *[_ddg_one(q, client) for q in empty_queries], return_exceptions=True
            )
            for q, r in zip(empty_queries, ddg_results):
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

_CONTROVERSY_TERMS = (
    "controversy OR criticism OR lawsuit OR fraud OR scam OR probe OR "
    "investigation OR fine OR penalty OR resign OR resignation OR scandal"
)


async def fetch_controversy_chunks(name: str) -> list[dict]:
    """Best-effort search for real, published negative coverage about a
    candidate. Returns raw result chunks (title/content/url) — same shape
    as web_search() — never a verdict, just source material."""
    try:
        return await web_search([f'"{name}" {_CONTROVERSY_TERMS}'])
    except Exception:
        return []


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


def _is_wrong_entity_type(wiki_desc: str, entity_type: str) -> bool:
    """Wikipedia's short 'description' field is a reliable, cheap signal for what
    kind of thing a page is about — use it to reject obvious mismatches (a hotel
    or country turning up when we asked for a person, etc)."""
    desc = (wiki_desc or "").lower()
    if not desc:
        return False
    if entity_type == "person":
        return any(p in desc for p in _NON_PERSON_DESC)
    if entity_type == "company":
        return any(p in desc for p in _NON_COMPANY_DESC)
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
]

_DEATH_YEAR_RE = re.compile(r"\(\s*(?:born\s+)?1[89]\d{2}\s*[–—-]\s*(?:19|20)\d{2}\s*\)")

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


_MIN_PROMINENT_EXTRACT_LEN = 150


def _is_low_prominence(wiki_extract: str, mention_count: int) -> bool:
    """AIMA honours nationally-recognised figures (see _AIMA_REFERENCE) — a one-line
    Wikipedia stub with no corroborating press coverage is not enough evidence that a
    candidate is actually prominent. Require either a substantive Wikipedia bio or
    multiple independent search-result mentions."""
    return len(wiki_extract or "") < _MIN_PROMINENT_EXTRACT_LEN and mention_count < 2


def _is_deceased(wiki_desc: str, wiki_extract: str) -> bool:
    """Nominees should be living people, except for lifetime-achievement awards.
    Wikipedia short descriptions for deceased people typically carry a
    '(1930-2021)' style lifespan; the extract often opens with 'was a...'."""
    combined = f"{wiki_desc or ''} {(wiki_extract or '')[:200]}"
    if _DEATH_YEAR_RE.search(combined):
        return True
    extract_start = (wiki_extract or "").strip()[:80].lower()
    if re.match(r"^[\w .'-]+ was (a|an|the)\b", extract_start):
        return True
    return False


async def build_briefs(
    names: list[str], search_chunks: list[dict], entity_type: str,
    is_lifetime_award: bool = False, award_text: str = "",
    hard_filters: dict | None = None,
) -> list[RawEnrichment]:
    """
    For each candidate name:
      - fetch Wikipedia (verification + bio + photo)
      - collect real search-result snippets that mention them (grounding text)
      - drop candidates with no evidence, the wrong entity type, non-Indian people,
        or (unless this is a lifetime-achievement award) deceased people
    """
    semaphore = asyncio.Semaphore(10)

    async def one(name: str, client: httpx.AsyncClient) -> RawEnrichment:
        async with semaphore:
            wiki = await fetch_wikipedia(name, client)

        first_word = name.split()[0].lower()
        mentions = [
            c for c in search_chunks
            if first_word in c["title"].lower() or first_word in c["content"].lower()
        ]
        snippet_text = " | ".join(f"{m['title']}: {m['content'][:200]}" for m in mentions[:3])

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
        r.source_urls.extend(m["url"] for m in mentions[:3] if m.get("url"))

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
                elif not is_lifetime_award and _is_deceased(r.wiki_desc, r.wiki_extract):
                    qualifies = False
                elif _is_low_prominence(r.wiki_extract, len(mentions)):
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
        elif (
            not r.wiki_extract and entity_type == "person"
            and hard_filters and hard_filters.get("max_age")
            and _qualifies_via_press_coverage(name, snippet_text, len(mentions), award_text)
        ):
            # No Wikipedia page, but this is an age-capped award and the candidate
            # has real corroborating press coverage with youth/founder language —
            # qualify via that instead (see _qualifies_via_press_coverage docstring).
            logger.info("Qualified via press coverage (no Wikipedia page): %s", name)
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
            r.news_text = await fetch_recent_news(name, entity_type)
            controversy_chunks = await fetch_controversy_chunks(name)
            if controversy_chunks:
                r.controversy_text = " | ".join(
                    f"{c['title']}: {c['content'][:200]}" for c in controversy_chunks[:5]
                )[:800]
                r.source_urls.extend(c["url"] for c in controversy_chunks[:5] if c.get("url"))
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
    briefs: list[RawEnrichment] = []
    total_extracted = 0

    # ── Round 0: curated sources — historical AIMA winners (seed), tier-matched
    # magazine lists, Google Custom Search. These are deterministic/curated, not
    # something re-querying helps with, so they run once, up front.
    seed_names = tier_router.seed_names_for(tier_info)
    scraped, googled = await asyncio.gather(
        scrape_tier_sources(tier_info.tier, entity_type),
        google_search_candidates(
            award_name, entity_type,
            tier_label=tier_info.label, matched_category=tier_info.matched_category,
            age_constraint=tier_info.age_constraint,
        ),
        return_exceptions=True,
    )
    scraped = scraped if isinstance(scraped, list) else []
    googled = googled if isinstance(googled, list) else []

    curated_names, seen0 = [], set()
    for n in seed_names + [c["name"] for c in scraped] + [c["name"] for c in googled]:
        k = n.lower()
        if k not in seen0:
            seen0.add(k)
            curated_names.append(n)

    logger.info(
        "[ResearchEngine] curated round: %d seed + %d scraped + %d google = %d unique for '%s' (%s)",
        len(seed_names), len(scraped), len(googled), len(curated_names), award_name, entity_type,
    )

    if curated_names:
        checked_names.update(n.lower() for n in curated_names)
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
            if k not in seen:
                seen.add(k)
                deduped.append(n)

        # Only check names we haven't already checked against Wikipedia
        to_check = [n for n in deduped if n.lower() not in checked_names][: target_count * 15]
        checked_names.update(n.lower() for n in to_check)

        if to_check:
            new_briefs = await build_briefs(
                to_check, all_chunks, entity_type, is_lifetime, award_text, hard_filters,
            )
            briefs.extend(new_briefs)

        if len(briefs) >= target_count or not new_chunks:
            break

    return _dedupe_briefs(briefs), total_extracted


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
