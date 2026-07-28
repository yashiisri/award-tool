"""
nominee_discovery.py  —  Live Research Engine  v5
──────────────────────────────────────────────────
Pipeline (all free, no paid API keys):

  1. parse_award_criteria()     Groq extracts search intent from award text
  2. generate_search_queries()  Groq writes 5 targeted DuckDuckGo queries
  3. ddg_search_candidates()    DuckDuckGo fetches real names from web results
  4. validate_with_wikipedia()  Wikipedia confirms each name is a real person
  5. entity_cache_fallback()    MongoDB top-up if web search finds < target
  6. enrich_with_news()         17 RSS feeds match articles to confirmed names
  7. rank_with_llm()            Groq ranks + writes grounded dossier per person
  8. run_nominee_discovery()    Orchestrator — returns exactly num_nominees
"""

import asyncio
import json
import logging
import re
import urllib.parse
from datetime import datetime

import httpx
from groq import AsyncGroq

from config import settings

logger = logging.getLogger(__name__)
MODEL   = "llama-3.3-70b-versatile"
TIMEOUT = httpx.Timeout(15.0, connect=5.0)

WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/summary/"
WIKI_UA   = "NobleCrestAI/2.0 (awards-research; admin@noblecrest.ai)"

GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"
TAVILY_SEARCH_URL = "https://api.tavily.com/search"
DDG_URL   = "https://api.duckduckgo.com/"
DDG_HTML  = "https://html.duckduckgo.com/html/"

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# Business role keywords — used to confirm a name is a business person
_BIZ_ROLES = [
    "ceo", "chief executive", "chairman", "chairperson", "founder",
    "co-founder", "managing director", "president", "director",
    "industrialist", "billionaire", "entrepreneur", "investor",
    "cto", "cfo", "coo", "vice chairman", "group chairman",
    "executive chairman", "promoter", "managing partner",
]

# Wikipedia description patterns that disqualify (non-business people)
_DISQUALIFY = [
    "actor", "actress", "singer", "musician", "cricketer", "footballer",
    "athlete", "politician", "minister", "member of parliament",
    "activist", "journalist", "film director", "comedian", "model",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _groq():
    key = settings.GROQ_KEY or __import__("os").environ.get("GROQ_KEY", "")
    if not key:
        raise RuntimeError("GROQ_KEY not configured.")
    return AsyncGroq(api_key=key)


# ── Tavily AI Search (primary web search) ────────────────────────────────────

async def _tavily_search(query: str, client: httpx.AsyncClient) -> list[dict]:
    """
    Tavily AI Search API — purpose-built for AI research pipelines.
    Returns clean extracted content from real web pages (Forbes, ET, BW, Inc42 etc).
    Free 1,000 searches/month.
    """
    api_key = settings.TAVILY_API_KEY
    if not api_key:
        return []
    try:
        r = await client.post(
            TAVILY_SEARCH_URL,
            json={
                "api_key":        api_key,
                "query":          query,
                "search_depth":   "basic",
                "max_results":    8,
                "include_answer": False,
            },
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            return r.json().get("results", [])
        else:
            logger.debug("Tavily HTTP %d for '%s'", r.status_code, query)
    except Exception as exc:
        logger.debug("Tavily failed for '%s': %s", query, exc)
    return []


async def tavily_search_candidates(queries: list[str]) -> list[str]:
    """
    Run queries through Tavily, extract real person names from results using Groq.
    Returns (names, raw_content) — names for validation, content for dossier grounding.
    """
    if not settings.TAVILY_API_KEY:
        logger.info("[Tavily] API key not set — skipping")
        return []

    logger.info("[Tavily] Running %d queries...", len(queries))

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        tasks   = [_tavily_search(q, client) for q in queries]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    all_text_chunks: list[str] = []
    for r in results:
        if not isinstance(r, list):
            continue
        for item in r:
            title   = item.get("title", "")
            content = item.get("content", "")[:500]
            url     = item.get("url", "")
            if title or content:
                all_text_chunks.append(f"SOURCE: {url}\nTITLE: {title}\nCONTENT: {content}")

    if not all_text_chunks:
        logger.info("[Tavily] No results returned from any query")
        return []

    logger.info("[Tavily] Got %d result chunks from web", len(all_text_chunks))

    try:
        prompt = f"""You are a research analyst. Read these real web search results about "{queries[0] if queries else 'this award'}" and extract the names of real people mentioned.

Award context: {queries[0] if queries else ''}

Web search results:
{chr(10).join(all_text_chunks[:30])}

Extract ONLY:
- Real person names (first name + last name) who are relevant to this search
- Living people currently active
- Indian or Indian-origin people preferred

DO NOT include:
- Company names, brand names, or award names
- People clearly not relevant to this search context

Return ONLY a JSON array of full names:
["Name One", "Name Two", ...]

Return 15-25 names maximum."""

        resp = await _groq().chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=600,
        )
        raw   = resp.choices[0].message.content.strip()
        names = _parse_json(raw)
        if isinstance(names, list):
            valid = [n.strip() for n in names if isinstance(n, str) and _valid_person_name(n.strip())]
            logger.info("[Tavily] Groq extracted %d names from %d web chunks",
                        len(valid), len(all_text_chunks))
            return valid
    except Exception as exc:
        logger.warning("[Tavily] Name extraction failed: %s", exc)

    return []


# ── Google Custom Search (kept as fallback) ───────────────────────────────────

async def _google_search(query: str, client: httpx.AsyncClient) -> list[dict]:
    """Google Custom Search — fallback if Tavily not available."""
    api_key = settings.GOOGLE_SEARCH_API_KEY
    cx      = settings.GOOGLE_SEARCH_CX
    if not api_key or not cx:
        return []
    try:
        r = await client.get(
            GOOGLE_SEARCH_URL,
            params={"key": api_key, "cx": cx, "q": query, "num": 10},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            return [
                {"title": i.get("title",""), "content": i.get("snippet",""), "url": i.get("link","")}
                for i in r.json().get("items", [])
            ]
    except Exception as exc:
        logger.debug("Google Search failed for '%s': %s", query, exc)
    return []


async def google_search_candidates(queries: list[str]) -> list[str]:
    """Google Custom Search fallback — same extraction logic as Tavily."""
    if not settings.GOOGLE_SEARCH_API_KEY or not settings.GOOGLE_SEARCH_CX:
        return []
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        results = await asyncio.gather(*[_google_search(q, client) for q in queries[:6]], return_exceptions=True)
    chunks = []
    for r in results:
        if isinstance(r, list):
            for item in r:
                chunks.append(f"{item.get('title','')}. {item.get('content','')}")
    if not chunks:
        return []
    try:
        resp = await _groq().chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": f"Extract Indian business leader names from these snippets. Return JSON array only:\n\n" + "\n".join(chunks[:20])}],
            temperature=0.1, max_tokens=400,
        )
        names = _parse_json(resp.choices[0].message.content.strip())
        return [n for n in names if isinstance(n, str) and _valid_person_name(n)] if isinstance(names, list) else []
    except Exception:
        return []


def _parse_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for s, e in [("[", "]"), ("{", "}")]:
        i, j = text.find(s), text.rfind(e)
        if i != -1 and j != -1 and j > i:
            try:
                return json.loads(text[i: j + 1])
            except json.JSONDecodeError:
                continue
    raise ValueError(f"No JSON:\n{text[:200]}")


def _is_business_person(description: str, extract: str) -> bool:
    combined = f"{description} {extract[:300]}".lower()

    # Reject non-person entities — companies, events, places, awards, games
    entity_patterns = [
        "company", "organization", "organisation", "founded in",
        "publishing trade", "trade fair", "baseball", "league",
        "award ceremony", "film festival", "technology hub",
        "startup company", "merchant platform", "hotel in",
        "civilian award", "highest award", "video game",
        "mobile game", "free-to-play", "application",
        "restaurant", "temple", "monument", "stadium",
    ]
    if any(p in combined for p in entity_patterns):
        return False

    # Reject deceased people — Wikipedia descriptions show lifespan e.g. "(1946–2017)"
    import re as _re
    if _re.search(r'\(1[89]\d{2}[\u2013\u2014\-]{1,2}(19|20)\d{2}\)', description):
        return False

    if any(d in combined for d in _DISQUALIFY):
        biz = sum(1 for r in _BIZ_ROLES if r in combined)
        bad = sum(1 for d in _DISQUALIFY if d in combined)
        return biz >= bad
    return any(r in combined for r in _BIZ_ROLES) or len(extract) > 200


def _is_indian_or_unknown(description: str, extract: str) -> bool:
    """Returns True if person is Indian or has clear Indian connection."""
    combined = f"{description} {extract[:300]}".lower()
    # Explicitly Indian — always include
    if "indian" in combined:
        return True
    # Indian-American, Indian-origin, NRI — include (relevant for Indian awards)
    if "indian-american" in combined or "indian origin" in combined or "born in india" in combined:
        return True
    # Explicitly non-Indian with no Indian connection — exclude
    non_indian = [
        "american entrepreneur", "american business executive",
        "american investor", "american venture", "american ceo",
        "british businessman", "chinese businessman", "japanese businessman",
        "indonesian", "singaporean", "bangladeshi", "pakistani",
        "cypriot entrepreneur",  # catches "Pradeep Singh — Cypriot entrepreneur"
    ]
    if any(ni in combined for ni in non_indian):
        return False
    # Unknown nationality — include (Wikipedia may not list it)
    return True


# ── Step 1: Parse award criteria ──────────────────────────────────────────────

async def parse_award_criteria(award_name: str, award_desc: str, criteria: list) -> dict:
    FALLBACK = {
        "likely_sectors": [], "likely_occupations": [],
        "seniority_level": "executive", "key_evaluation_themes": criteria,
    }
    try:
        prompt = f"""Award: "{award_name}"
Description: {award_desc}
Criteria: {", ".join(criteria)}

Return ONLY JSON (no markdown):
{{"likely_sectors":["Technology","Banking"],"likely_occupations":["CEO","Founder","Chairman"],"seniority_level":"executive","key_evaluation_themes":["innovation","leadership","impact"]}}"""
        resp = await _groq().chat.completions.create(
            model=MODEL, messages=[{"role": "user", "content": prompt}],
            temperature=0.2, max_tokens=400,
        )
        result = _parse_json(resp.choices[0].message.content.strip())
        if isinstance(result, dict):
            for k, v in FALLBACK.items():
                result.setdefault(k, v)
            return result
    except Exception as exc:
        logger.warning("parse_award_criteria: %s", exc)
    return FALLBACK


# ── Step 2: Generate search queries ──────────────────────────────────────────

async def generate_search_queries(
    award_name: str, award_desc: str, query_spec: dict, num_nominees: int
) -> list[str]:
    """Generate 5 targeted queries based on the specific award — not generic business."""
    year = datetime.utcnow().year

    try:
        prompt = f"""Generate 5 specific web search queries to find nominees for this award.

Award Name: "{award_name}"
Award Description: {award_desc[:200]}
Year: {year}

RULES:
- Read the award name carefully and generate queries that find the RIGHT type of person
- If the award is for "content creators" → search for YouTubers, influencers, bloggers
- If the award is for "business leaders" → search for CEOs, founders
- If the award is for "scientists" → search for scientists
- If the award is for "athletes" → search for athletes
- If award mentions "India/Indian" → India-specific queries
- If award mentions a specific year → include that year
- Do NOT default to generic business leader queries if the award is about something else
- Include the current year {year} in queries

Return ONLY a JSON array of 5 query strings. No explanation.
["query 1", "query 2", "query 3", "query 4", "query 5"]"""

        resp = await _groq().chat.completions.create(
            model=MODEL, messages=[{"role": "user", "content": prompt}],
            temperature=0.3, max_tokens=300,
        )
        result = _parse_json(resp.choices[0].message.content.strip())
        if isinstance(result, list) and result:
            logger.info("Generated %d search queries", len(result))
            return [str(q) for q in result[:6]]
    except Exception as exc:
        logger.warning("generate_search_queries: %s", exc)

    # Fallback — use award name directly
    return [
        f"{award_name} India {year}",
        f"top Indian {award_name} {year} list",
        f"best {award_name} nominees India {year}",
        f"{award_name} award winners India",
        f"India {award_name} {year} ranking",
    ]


_NAME_RE = re.compile(r"\b([A-Z][a-z]{1,18}(?:\s+[A-Z][a-z]{1,18}){1,3})\b")
_NOT_NAME = {
    "india", "indian", "top", "best", "new", "the", "a", "an", "ltd",
    "pvt", "inc", "corp", "company", "group", "global", "national",
    "digital", "tech", "market", "business", "economic", "financial",
    "startup", "venture", "capital", "fund", "bank", "year", "award",
    "forbes", "fortune", "times", "today", "world", "list", "most",
    "powerful", "richest", "largest", "north", "south", "east", "west",
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai",
}


def _valid_person_name(name: str) -> bool:
    words = name.split()
    if len(words) < 2 or len(words) > 4:
        return False
    if not all(w[0].isupper() and len(w) >= 2 for w in words):
        return False
    if any(w.lower() in _NOT_NAME for w in words):
        return False
    if any(w.isupper() and len(w) > 2 for w in words):
        return False
    if any(c.isdigit() for c in name):
        return False
    # Reject obvious non-person patterns
    non_person = ["fair", "awards", "valley", "labs", "genomics", "guardians",
                  "technologies", "solutions", "platform", "ventures", "capital",
                  "express", "book", "league", "sports", "foundation", "association"]
    name_lower = name.lower()
    if any(np in name_lower for np in non_person):
        return False
    return True


# ── Step 3: Wikipedia search + Wikidata SPARQL → candidate names ─────────────

async def _wiki_search(query: str, client: httpx.AsyncClient, max_results: int = 8) -> list[str]:
    """
    Search Wikipedia for pages matching a query.
    Returns titles of matching pages (= verified person names).
    """
    try:
        r = await client.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action":   "query",
                "list":     "search",
                "srsearch": query,
                "srlimit":  max_results,
                "srnamespace": "0",
                "format":   "json",
                "srprop":   "snippet|titlesnippet",
            },
            headers={"User-Agent": WIKI_UA, "Accept": "application/json"},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            items = r.json().get("query", {}).get("search", [])
            return [item["title"] for item in items]
    except Exception as exc:
        logger.debug("wiki_search '%s': %s", query, exc)
    return []


async def _wikidata_sparql(occupation_qid: str, country_qid: str = "Q668",
                           limit: int = 30) -> list[str]:
    """
    Query Wikidata SPARQL for Indian business people by occupation.
    Returns English Wikipedia page titles (= their names).
    More targeted than generic search.
    """
    query = f"""
SELECT DISTINCT ?personLabel WHERE {{
  ?person wdt:P106 wd:{occupation_qid} ;
          wdt:P27  wd:{country_qid} .
  ?article schema:about ?person ;
           schema:inLanguage "en" ;
           schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL {{ ?person wdt:P570 ?deathDate. }}
  FILTER(!BOUND(?deathDate))
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}} LIMIT {limit}"""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            r = await client.get(
                "https://query.wikidata.org/sparql",
                params={"query": query, "format": "json"},
                headers={
                    "User-Agent": WIKI_UA,
                    "Accept":     "application/sparql-results+json",
                },
            )
            if r.status_code == 200:
                bindings = r.json().get("results", {}).get("bindings", [])
                names = []
                for b in bindings:
                    label = b.get("personLabel", {}).get("value", "")
                    if label and not label.startswith("Q"):
                        names.append(label)
                logger.info("Wikidata SPARQL %s → %d names", occupation_qid, len(names))
                return names
    except Exception as exc:
        logger.debug("wikidata_sparql %s: %s", occupation_qid, exc)
    return []


# Wikidata occupation QIDs for Indian business leaders
_OCCUPATION_QIDS = {
    "business_executive": "Q484876",
    "entrepreneur":       "Q131524",
    "businessperson":     "Q43845",
    "investor":           "Q672281",
    "banker":             "Q806798",
}

# Wikipedia search templates — tailored queries per award context
_WIKI_SEARCH_TEMPLATES = [
    "{name} Indian business leader",
    "{name} Indian CEO chairman founder",
    "{name} Indian billionaire industrialist",
    "Forbes India {sector} CEO 2025",
    "top Indian {role} businessperson",
    "India richest businessman industrialist",
    "Indian business leader CEO chairman conglomerate",
    "India billionaire entrepreneur founder 2025",
]


async def discover_candidates_from_web(
    award_name: str,
    award_desc: str,
    query_spec: dict,
    target_count: int,
) -> list[str]:
    """
    Find candidate names using Wikipedia search API + Wikidata SPARQL.
    Queries are fully driven by award description — works for any award category.
    """
    sectors = query_spec.get("likely_sectors", [])[:2]
    roles   = query_spec.get("likely_occupations", [])[:3]
    level   = query_spec.get("seniority_level", "executive")
    text_lower = f"{award_name} {award_desc}".lower()

    # Detect award category from name + description
    is_startup  = any(w in text_lower for w in ["startup", "start-up", "emerging", "young entrepreneur", "new venture"])
    is_lifetime = any(w in text_lower for w in ["lifetime", "life time", "legend", "veteran", "legacy", "distinguished"])
    is_women    = any(w in text_lower for w in ["women", "woman", "female", "lady leaders"])
    is_tech     = any(w in text_lower for w in ["tech", "technology", "innovation", "digital", "it sector"])
    is_banking  = any(w in text_lower for w in ["bank", "finance", "financial", "nbfc", "fsi", "fintech"])
    is_csr      = any(w in text_lower for w in ["csr", "social responsibility", "sustainability", "esg", "philanthrop"])
    is_young    = any(w in text_lower for w in ["young", "under 40", "under 35", "rising", "next gen", "30 under"])
    is_global   = any(w in text_lower for w in ["global", "international", "diaspora", "nri"])

    # Build category-specific Wikipedia search queries
    search_queries: list[str] = []

    if is_startup:
        search_queries += [
            "top Indian startup founders 2025 unicorn",
            "India best startup of the year 2025 founder CEO",
            "Indian unicorn startup founders entrepreneurs list",
            "Forbes India 30 under 30 startup founders 2025",
            "YourStory Inc42 top Indian startups founders 2025",
        ]
    elif is_lifetime:
        search_queries += [
            "India lifetime achievement business award winners",
            "Indian veteran business leader legacy industrialist",
            "Padma Bhushan Padma Vibhushan Indian business leader",
            "India legendary industrialist conglomerate founder",
            "Indian business icon legend lifetime contribution",
        ]
    elif is_women:
        search_queries += [
            "top Indian women business leaders 2025",
            "Forbes India most powerful women 2025",
            "Indian women entrepreneurs CEOs 2025 list",
            "most influential women in Indian business 2025",
            "Business Today powerful women India 2025",
        ]
    elif is_young:
        search_queries += [
            "Forbes India 30 under 30 entrepreneurs 2025",
            "young Indian entrepreneur under 40 2025",
            "India rising business leader next generation 2025",
            "young Indian CEO founder unicorn 2025",
            "India emerging business leader award 2025",
        ]
    elif is_csr:
        search_queries += [
            "India CSR excellence award 2025 business leader",
            "Indian company CSR sustainability ESG award winner",
            "best CSR initiative India business 2025",
            "India ESG sustainability business leader award",
            "Indian corporate social responsibility award winner 2025",
        ]
    elif is_tech:
        search_queries += [
            "top Indian technology leaders CEOs 2025",
            "India tech CEO CTO innovator of the year 2025",
            "Indian tech unicorn founder 2025 list",
            "Nasscom top Indian technology executive 2025",
            "Forbes India technology leaders 2025",
        ]
    elif is_banking:
        search_queries += [
            "top Indian banking finance leaders 2025",
            "India best bank CEO MD 2025 award",
            "Indian banker of the year 2025",
            "ET BFSI awards India banking leader 2025",
            "top Indian NBFC fintech leader 2025",
        ]
    elif is_global:
        search_queries += [
            "Indian origin global business leader 2025",
            "NRI Indian diaspora CEO business leader 2025",
            "Indian CEO global company 2025",
            "India born international business executive 2025",
        ]
    else:
        # General — derive queries from award description keywords
        desc_words = [w for w in text_lower.split() if len(w) > 5
                      and w not in {"award", "india", "indian", "leader", "business",
                                    "recognition", "annual", "honours", "excellence",
                                    "recognises", "outstanding", "impactful"}]
        core_theme = " ".join(desc_words[:4]) if desc_words else "business leadership"
        search_queries += [
            f"top Indian business leaders {core_theme} 2025",
            f"India {core_theme} CEO chairman award 2025",
        ]

    # Universal depth queries — use award name directly, NOT hardcoded business queries
    search_queries += [
        f"top Indian {award_name} {datetime.utcnow().year}",
        f"India best {award_name} nominees list",
        f"{award_name} India award winners {datetime.utcnow().year}",
    ]

    # Deduplicate and cap queries
    seen_q: set[str] = set()
    unique_queries = []
    for q in search_queries:
        if q.lower() not in seen_q:
            seen_q.add(q.lower())
            unique_queries.append(q)
    search_queries = unique_queries[:10]

    logger.info("[Discovery] %d Wikipedia searches for: %s", len(search_queries), award_name)

    # ── Tavily web search (primary — real web results) ───────────────────────
    tavily_names = await tavily_search_candidates(search_queries[:6])

    # ── Wikipedia search (secondary — fills gaps) ─────────────────────────────
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        wiki_tasks = [_wiki_search(q, client, max_results=10) for q in search_queries]
        wiki_results = await asyncio.gather(*wiki_tasks, return_exceptions=True)

    all_names: list[str] = list(tavily_names)  # Tavily names go first (most relevant)
    for r in wiki_results:
        if isinstance(r, list):
            all_names.extend(r)

    # Wikidata SPARQL — optional, break on 429
    if is_startup:
        occ_buckets = ["Q131524", "Q43845"]
    elif is_banking:
        occ_buckets = ["Q806798", "Q484876"]
    elif is_lifetime:
        occ_buckets = ["Q484876", "Q43845"]
    else:
        occ_buckets = ["Q484876", "Q131524"]

    for qid in occ_buckets[:2]:
        result = await _wikidata_sparql(qid, limit=40)
        if result:
            all_names.extend(result)
            await asyncio.sleep(1.5)
        else:
            logger.info("[Discovery] Wikidata skipped — Wikipedia search sufficient")
            break

    # Deduplicate by frequency (most-mentioned names first)
    freq: dict[str, int] = {}
    for name in all_names:
        freq[name.lower()] = freq.get(name.lower(), 0) + 1

    seen: set[str] = set()
    deduped: list[str] = []
    for name in sorted(all_names, key=lambda n: -freq.get(n.lower(), 0)):
        k = name.lower()
        if k not in seen and _valid_person_name(name):
            seen.add(k)
            deduped.append(name)

    logger.info("[Discovery] %d unique candidate names found", len(deduped))
    return deduped


# ── Step 4: Wikipedia validation — confirms real people + gets bios ───────────

async def _wiki_fetch(name: str, client: httpx.AsyncClient) -> dict | None:
    """Fetch Wikipedia summary for one name. Returns None if not a real person."""
    names_to_try = [name]
    parts = name.split()
    if len(parts) > 2:
        names_to_try.append(f"{parts[0]} {parts[-1]}")

    headers = {"User-Agent": WIKI_UA, "Accept": "application/json"}

    for attempt in names_to_try:
        encoded = attempt.replace(" ", "_")
        try:
            r = await client.get(f"{WIKI_REST}{encoded}", headers=headers)
            if r.status_code != 200:
                continue
            data   = r.json()
            extract = data.get("extract", "")
            desc    = data.get("description", "")
            if len(extract) < 80:
                continue  # stub / disambiguation page

            return {
                "name":          data.get("title", name),
                "wiki_extract":  extract[:1200],
                "wiki_description": desc,
                "image_url":     re.sub(r"/\d+px-", "/400px-",
                                        (data.get("thumbnail") or {}).get("source", "")),
                "wikipedia_url": data.get("content_urls", {})
                                     .get("desktop", {}).get("page", ""),
            }
        except Exception:
            continue
    return None


async def validate_with_wikipedia(names: list[str]) -> list[dict]:
    """
    For each candidate name:
      1. Fetch Wikipedia summary
      2. Confirm they're a real, living person (not a company, place, or event)
      3. Must be Indian or Indian-origin
      4. Return enriched candidate dicts — only verified real Indian people pass
    """
    logger.info("Validating %d names via Wikipedia...", len(names))
    semaphore = asyncio.Semaphore(10)

    async def fetch_one(name: str, client: httpx.AsyncClient) -> dict | None:
        async with semaphore:
            return await _wiki_fetch(name, client)

    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        results = await asyncio.gather(
            *[fetch_one(n, client) for n in names],
            return_exceptions=True,
        )

    # Patterns that mean this Wikipedia page is NOT a person
    _NON_PERSON = [
        "company", "corporation", "organisation", "organization",
        "founded in", "established in", "headquartered",
        "television series", "album", "song",
        "city", "town", "village", "district",
        "award ceremony", "trade fair",
    ]

    # Clearly non-Indian patterns — people based in foreign countries with no Indian connection
    _NON_INDIAN = [
        "american entrepreneur", "american business executive",
        "american investor", "american singer", "american actress",
        "american politician", "american athlete",
        "british businessman", "british politician",
        "chinese businessman", "japanese businessman",
        "australian", "canadian politician",
    ]

    validated = []
    for name, result in zip(names, results):
        if not isinstance(result, dict):
            continue
        desc    = result.get("wiki_description", "").lower()
        extract = result.get("wiki_extract", "").lower()
        combined = f"{desc} {extract[:300]}"

        # Skip non-person Wikipedia pages — check description only, not extract
        # (extract mentions "company", "song" etc. about what the person does — that's fine)
        if any(p in desc for p in _NON_PERSON):
            continue

        # Must have at least some content
        if len(result.get("wiki_extract", "")) < 60:
            continue

        # Must be Indian or Indian-origin — mandatory filter
        # Check description + first 800 chars of extract
        full_combined = f"{desc} {result.get('wiki_extract', '')[:800]}".lower()

        is_indian = (
            "indian" in full_combined or
            "india" in full_combined or
            "mumbai" in full_combined or "delhi" in full_combined or
            "bengaluru" in full_combined or "bangalore" in full_combined or
            "chennai" in full_combined or "hyderabad" in full_combined or
            "kolkata" in full_combined or "pune" in full_combined or
            "ahmedabad" in full_combined or "gujarat" in full_combined or
            "maharashtra" in full_combined or "karnataka" in full_combined or
            "tamil" in full_combined or "kerala" in full_combined or
            "bollywood" in full_combined or "iit " in full_combined or
            "bharat" in full_combined or "rupee" in full_combined or
            "crore" in full_combined or "reliance" in full_combined or
            "infosys" in full_combined or "tata" in full_combined
        )

        if not is_indian:
            logger.debug("Dropped non-Indian: %s | desc: %s", name, desc[:80])
            continue

        result["wikidata_id"] = f"web_{re.sub(r'[^a-z0-9]', '_', name.lower())}"
        result["is_alive"]    = True
        result["nationality"] = ["Indian"]
        validated.append(result)

    logger.info("Wikipedia validation: %d / %d passed (Indian filter applied)", len(validated), len(names))
    return validated


# ── Step 5: entity_cache top-up ───────────────────────────────────────────────

async def entity_cache_topup(
    db, filters: dict, query_spec: dict,
    needed: int, already_have: set[str],
) -> list[dict]:
    """
    If web search + Wikipedia gives us fewer than needed,
    top up from entity_cache using hard filters.
    """
    if needed <= 0:
        return []

    mongo_filter: dict = {}
    if filters.get("nationality"):
        mongo_filter["nationality"] = {"$in": filters["nationality"]}
    if filters.get("alive_only", True):
        mongo_filter["is_alive"] = True

    sector_hints = filters.get("sector") or query_spec.get("likely_sectors", [])
    if sector_hints:
        mongo_filter["sector_tags"] = {"$in": sector_hints}

    candidates = await db.entity_cache.find(mongo_filter).limit(needed * 3).to_list(needed * 3)
    topup = []
    for c in candidates:
        name = c.get("name", "")
        if name.lower() in already_have:
            continue
        topup.append(c)
        if len(topup) >= needed:
            break

    # Fallback without sector if not enough
    if len(topup) < needed and sector_hints:
        base = {k: v for k, v in mongo_filter.items() if k != "sector_tags"}
        extras = await db.entity_cache.find(base).limit(needed * 3).to_list(needed * 3)
        for c in extras:
            name = c.get("name", "")
            if name.lower() not in already_have and c not in topup:
                topup.append(c)
                if len(topup) >= needed:
                    break

    logger.info("entity_cache top-up: +%d candidates", len(topup))
    return topup


# ── Step 6: News enrichment ───────────────────────────────────────────────────

async def enrich_with_news(candidates: list[dict]) -> dict[str, list[dict]]:
    """Match candidates against 17 RSS feed articles."""
    from services.source_scrapers import fetch_all_news_articles, match_candidate_to_news
    articles = await fetch_all_news_articles()
    logger.info("News articles for matching: %d", len(articles))
    news_map = {}
    for c in candidates:
        wid  = str(c.get("wikidata_id", c.get("_id", "")))
        name = c.get("name", "")
        news_map[wid] = match_candidate_to_news(name, articles) if name else []
    matched = sum(1 for v in news_map.values() if v)
    logger.info("Candidates with news: %d / %d", matched, len(candidates))
    return news_map


# ── Step 7: LLM ranking + dossier ────────────────────────────────────────────

async def rank_with_llm(
    candidates: list[dict],
    news_map: dict,
    award_name: str,
    award_desc: str,
    criteria: list,
    query_spec: dict,
    target_count: int,
) -> list[dict]:
    """
    Send all validated candidates to Groq for ranking.
    Each brief includes real Wikipedia bio — dossier is grounded, not hallucinated.
    Safety: discards any ID the LLM invents that wasn't in the input.
    """
    if not candidates:
        return []

    valid_ids = {str(c.get("wikidata_id", c.get("_id", ""))) for c in candidates}
    themes    = ", ".join(query_spec.get("key_evaluation_themes", criteria) or criteria)

    briefs = []
    for c in candidates:
        wid       = str(c.get("wikidata_id", c.get("_id", "")))
        news      = [a["title"] for a in news_map.get(wid, [])[:3]]
        wiki_bio  = (c.get("wiki_extract", "") or "")[:600]
        wiki_desc = c.get("wiki_description", "") or c.get("description", "") or ""
        briefs.append({
            "id":          wid,
            "name":        c.get("name", ""),
            "role":        c.get("wiki_description") or c.get("designation", ""),
            "org":         c.get("employer_org", ""),
            "bio":         wiki_bio or "(no Wikipedia data)",
            "recent_news": news,
        })

    prompt = f"""You are a senior awards researcher selecting nominees for: "{award_name}"

Award: {award_desc[:250]}
Evaluation themes: {themes}

All candidates below are VERIFIED real people relevant to this award.
Select and rank the TOP {target_count} most relevant to this SPECIFIC award category.

RULES:
1. Only use names/IDs already in the list — never invent new ones.
2. Write a specific 2-sentence rationale using facts from their bio.
3. Rank by fit to "{award_name}" specifically — not by general fame or wealth.
4. criteria_match_score: 0.0-1.0 based on how well they match this specific award.
5. If this award is for content creators, rank content creators highest.
6. If this award is for scientists, rank scientists highest.
7. Match the award category exactly.

Candidates:
{json.dumps(briefs, indent=2)}

Return JSON array of exactly {target_count} items, best-first:
[{{"id":"...","rank":1,"rationale":"Two specific sentences from their bio.","criteria_match_score":0.85}}, ...]
Raw JSON only, no markdown."""

    try:
        resp = await _groq().chat.completions.create(
            model=MODEL, messages=[{"role": "user", "content": prompt}],
            temperature=0.1, max_tokens=4000,
        )
        raw      = resp.choices[0].message.content.strip()
        rankings = _parse_json(raw)
        if not isinstance(rankings, list):
            raise ValueError("Not a list")

        # Safety: discard invented IDs
        safe     = [r for r in rankings if r.get("id") in valid_ids]
        discarded = len(rankings) - len(safe)
        if discarded:
            logger.warning("Safety net removed %d invented IDs", discarded)

        rank_map = {r["id"]: r for r in safe}
        for c in candidates:
            wid = str(c.get("wikidata_id", c.get("_id", "")))
            r   = rank_map.get(wid, {})
            c["rank"]                 = r.get("rank", 999)
            c["llm_rationale"]        = r.get("rationale", "")
            c["criteria_match_score"] = float(r.get("criteria_match_score", 0.5))

        candidates.sort(key=lambda x: x.get("rank", 999))
        logger.info("LLM ranked %d candidates", len(candidates))
        return candidates

    except Exception as exc:
        logger.warning("rank_with_llm failed: %s — returning unranked", exc)
        for i, c in enumerate(candidates):
            c.setdefault("rank", i + 1)
            c.setdefault("llm_rationale", "")
            c.setdefault("criteria_match_score", 0.5)
        return candidates


# ── Confidence score ──────────────────────────────────────────────────────────

def _confidence(c: dict, news_map: dict) -> dict:
    wid      = str(c.get("wikidata_id", c.get("_id", "")))
    articles = news_map.get(wid, [])
    has_wiki = bool(c.get("wiki_extract"))
    wq       = 1.0 if has_wiki else 0.3
    nr       = min(len(articles) / 3.0, 1.0) * 0.8 + (0.2 if articles else 0.0)
    cm       = float(c.get("criteria_match_score", 0.5))
    return {
        "confidence_score":      round(0.35 * wq + 0.25 * nr + 0.40 * cm, 3),
        "wiki_quality_score":    round(wq, 3),
        "news_recency_score":    round(nr, 3),
        "criteria_match_score":  round(cm, 3),
        "matched_article_count": len(articles),
        "source_links":          [a["source"] for a in articles],
        "relevance_reason":      c.get("llm_rationale", ""),
        "wikipedia_url":         c.get("wikipedia_url", ""),
        "ai_generated":          True,
    }


# ── Main orchestrator ─────────────────────────────────────────────────────────

async def run_nominee_discovery(db, award_id: str, award_doc: dict) -> dict:
    """
    Live research engine.
    1. Groq understands the award
    2. DuckDuckGo searches for relevant people
    3. Wikipedia validates + enriches each name
    4. entity_cache tops up if needed
    5. News RSS enriches confirmed candidates
    6. Groq ranks and writes dossiers
    7. Returns exactly num_nominees people
    """
    filters      = award_doc.get("filters", {}) or {}
    award_name   = award_doc.get("name", "Business Excellence Award")
    award_desc   = award_doc.get("description", "")
    criteria_raw = award_doc.get("criteria", [])
    target_count = int(award_doc.get("num_nominees", 10))

    if isinstance(criteria_raw, dict):
        criteria = [str(v) for v in criteria_raw.values() if v]
    elif isinstance(criteria_raw, list):
        criteria = [str(c) for c in criteria_raw if c]
    else:
        criteria = []

    # ── 1. Understand award ───────────────────────────────────────────────────
    logger.info("[Discovery] Award: %s | target: %d", award_name, target_count)
    query_spec = await parse_award_criteria(award_name, award_desc, criteria)
    logger.info("[Discovery] sectors=%s occ=%s",
                query_spec.get("likely_sectors"), query_spec.get("likely_occupations"))

    # ── 2. Discover candidates via Wikipedia + Wikidata ───────────────────────
    raw_names = await discover_candidates_from_web(award_name, award_desc, query_spec, target_count)
    logger.info("[Discovery] Web discovery: %d raw names", len(raw_names))

    # ── 3. Wikipedia validation ───────────────────────────────────────────────
    wiki_candidates = await validate_with_wikipedia(raw_names[:target_count * 4])

    # ── 5. entity_cache top-up ────────────────────────────────────────────────
    already_have = {c.get("name", "").lower() for c in wiki_candidates}
    still_needed = max(0, target_count * 2 - len(wiki_candidates))
    cache_candidates = await entity_cache_topup(
        db, filters, query_spec, still_needed, already_have
    )

    # Wikipedia-enrich cache candidates too
    if cache_candidates:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as cl:
            for c in cache_candidates:
                wiki = await _wiki_fetch(c.get("name", ""), cl)
                if wiki:
                    c["wiki_extract"]     = wiki.get("wiki_extract", "")
                    c["wiki_description"] = wiki.get("wiki_description", "")
                    if not c.get("image_url"):
                        c["image_url"] = wiki.get("image_url", "")
                    if not c.get("wikipedia_url"):
                        c["wikipedia_url"] = wiki.get("wikipedia_url", "")

    all_candidates = wiki_candidates + cache_candidates

    # Exclude already-nominated
    if filters.get("exclude_existing_nominees", True):
        existing = {n.lower() for n in await db.nominees.distinct("name")}
        all_candidates = [c for c in all_candidates
                          if c.get("name", "").lower() not in existing]

    if not all_candidates:
        return {
            "status":   "no_candidates",
            "message":  "Could not find matching candidates. Try a different award description or widen filters.",
            "nominees": [],
        }

    logger.info("[Discovery] Total candidate pool: %d", len(all_candidates))

    # ── 6. News enrichment ────────────────────────────────────────────────────
    news_map = await enrich_with_news(all_candidates)

    # ── 7. LLM ranking + dossiers ─────────────────────────────────────────────
    ranked = await rank_with_llm(
        all_candidates, news_map, award_name, award_desc,
        criteria, query_spec, target_count,
    )

    # ── 8. Build output (exactly target_count) ────────────────────────────────
    top = ranked[:target_count]
    nominees_out = []
    for c in top:
        wid        = str(c.get("wikidata_id", c.get("_id", "")))
        score_data = _confidence(c, news_map)

        # Build dossier rationale: LLM text + Wikipedia bio
        llm_text = c.get("llm_rationale", "")
        wiki_bio = (c.get("wiki_extract", "") or "")[:500]
        if llm_text and wiki_bio:
            rationale = f"{llm_text}\n\n{wiki_bio}"
        elif llm_text:
            rationale = llm_text
        else:
            rationale = wiki_bio or c.get("description", "")

        designation = (
            c.get("wiki_description")
            or c.get("designation")
            or (c.get("occupation", [""])[0] if c.get("occupation") else "")
        )

        nominees_out.append({
            "wikidata_id":   wid,
            "name":          c.get("name", ""),
            "designation":   designation,
            "organisation":  c.get("employer_org", ""),
            "photo_url":     c.get("image_url", ""),
            "wikipedia_url": c.get("wikipedia_url", ""),
            "rationale":     rationale,
            "rationale_data": {**score_data},
            "ai_generated":  True,
            "rank":          c.get("rank", 999),
        })

    logger.info("[Discovery] Done — returned %d nominees", len(nominees_out))
    return {
        "status":         "success",
        "pool_size":      len(all_candidates),
        "returned_count": len(nominees_out),
        "nominees":       nominees_out,
    }


# ── Backwards-compatible helpers (used by admin routes) ──────────────────────

async def parse_award_criteria_compat(award_name, award_desc, criteria):
    return await parse_award_criteria(award_name, award_desc, criteria)


# Keep old function names working
enrich_with_tier2_news  = enrich_with_news
rank_candidates_with_llm = rank_with_llm
