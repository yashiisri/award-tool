"""
source_scrapers.py
──────────────────
Pure source-based nominee discovery.
NO Llama. NO Wikipedia. NO DuckDuckGo.

Sources (from spreadsheet):
  RSS feeds:
    - Economic Times
    - Business Today
    - LiveMint
    - The Hindu Business Line
    - Fortune India
    - Inc42
    - Entrackr
    - VCCircle
    - News18 Business
    - PIB
    - YourStory
    - Times of India Business
    - Business World

  Scraped pages:
    - Hurun India Rich List
    - Great Place to Work India
    - Forbes India (rankings page)
    - CII Awards winners
    - FICCI Awards
    - BSE listed companies (top by market cap)
    - Screener.in API

  Photos:
    - Google Images scrape
    - Bing Images fallback
"""

import asyncio
import logging
import re
import xml.etree.ElementTree as ET
import urllib.parse

import httpx

logger = logging.getLogger(__name__)

TIMEOUT = httpx.Timeout(15.0, connect=6.0)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
}

# ── RSS Sources ───────────────────────────────────────────────────────────────

RSS_SOURCES = [
    {"name": "Economic Times",       "url": "https://economictimes.indiatimes.com/rss.cms"},
    {"name": "Business Today",       "url": "https://www.businesstoday.in/rss/home.rss"},
    {"name": "LiveMint",             "url": "https://www.livemint.com/rss/news"},
    {"name": "Hindu Business Line",  "url": "https://www.thehindubusinessline.com/feeder/default.rss"},
    {"name": "Fortune India",        "url": "https://www.fortuneindia.com/rss"},
    {"name": "Inc42",                "url": "https://inc42.com/feed/"},
    {"name": "Entrackr",             "url": "https://entrackr.com/feed/"},
    {"name": "VCCircle",             "url": "https://www.vccircle.com/rss/"},
    {"name": "News18 Business",      "url": "https://www.news18.com/rss/business.xml"},
    {"name": "PIB",                  "url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3"},
    {"name": "YourStory",            "url": "https://yourstory.com/feed"},
    {"name": "Times of India Biz",   "url": "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms"},
    {"name": "Business World",       "url": "https://businessworld.in/rss/home"},
    {"name": "TechCrunch",           "url": "https://techcrunch.com/feed/"},
]

# Leadership role keywords — article must mention at least one
ROLE_KEYWORDS = [
    "ceo", "chief executive", "chairman", "chairperson", "founder",
    "co-founder", "managing director", "md &", "& ceo", "billionaire",
    "industrialist", "conglomerate", "unicorn", "entrepreneur",
    "vice chairman", "group chairman", "executive chairman",
    "padma bhushan", "padma vibhushan", "forbes india", "fortune india",
    "nse-listed", "bse-listed", "listed company", "promoter",
]

# Words that are NOT person names
NOT_NAMES = {
    "india", "indian", "new", "top", "best", "how", "why", "what", "when",
    "where", "who", "the", "a", "an", "ltd", "pvt", "inc", "corp", "company",
    "group", "holdings", "enterprises", "technologies", "solutions", "services",
    "global", "international", "national", "digital", "tech", "data", "market",
    "business", "economic", "financial", "startup", "venture", "capital",
    "fund", "bank", "finance", "growth", "revenue", "profit", "loss",
    "report", "news", "today", "year", "quarter", "crore", "billion",
    "million", "rupee", "share", "stock", "equity", "sector", "industry",
    "government", "ministry", "policy", "budget", "tax", "gst", "sebi",
    "rbi", "nse", "bse", "sensex", "nifty", "ipo", "fdi", "gdp",
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "monday", "tuesday", "wednesday", "thursday", "friday",
    "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai",
    "kolkata", "pune", "ahmedabad", "surat", "jaipur",
}

NAME_RE = re.compile(r"\b([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){1,3})\b")

ROLE_RE = re.compile(
    r"\b(CEO|Chief Executive Officer|Chairman|Chairperson|Founder|Co-Founder|"
    r"Managing Director|MD|President|Director|Industrialist|Billionaire|"
    r"CTO|CFO|COO|Vice Chairman|Group Chairman|Executive Chairman)\b",
    re.IGNORECASE,
)

ORG_RE = re.compile(
    r"(?:of|at|,)\s+([A-Z][A-Za-z0-9\s&\-\.]{2,35}?)(?:\s*[,\.\n]|\s+(?:said|has|is|was|will|to|in|on|for))",
)


# ── RSS Fetcher ───────────────────────────────────────────────────────────────

async def _fetch_rss(source: dict) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(source["url"], headers=HEADERS)
            resp.raise_for_status()

        content = resp.content.decode("utf-8", errors="replace")
        # Remove namespace prefixes that break ET
        content = re.sub(r'\s+xmlns[^=]*="[^"]*"', '', content)
        content = re.sub(r'<[a-z]+:', '<', content)
        content = re.sub(r'</[a-z]+:', '</', content)

        root = ET.fromstring(content)
        items = root.findall(".//item")

        results = []
        for item in items[:40]:
            title = (item.findtext("title") or "").strip()
            desc  = re.sub(r"<[^>]+>", " ", item.findtext("description") or "").strip()
            img   = ""
            enc   = item.find("enclosure")
            if enc is not None and "image" in (enc.get("type") or ""):
                img = enc.get("url", "")

            if title:
                results.append({
                    "title":     title,
                    "desc":      desc[:600],
                    "source":    source["name"],
                    "image_url": img,
                })

        logger.info("RSS %s → %d items", source["name"], len(results))
        return results

    except Exception as exc:
        logger.warning("RSS %s failed: %s", source["name"], exc)
        return []


async def fetch_all_rss() -> list[dict]:
    results = await asyncio.gather(*[_fetch_rss(s) for s in RSS_SOURCES], return_exceptions=True)
    combined = []
    for r in results:
        if isinstance(r, list):
            combined.extend(r)
    logger.info("RSS total items: %d", len(combined))
    return combined


# ── Scraped pages ─────────────────────────────────────────────────────────────

async def scrape_hurun_india() -> list[dict]:
    """Hurun India Rich List — free to browse."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get("https://www.hurunindia.com/hurun-report", headers=HEADERS)
        names = NAME_RE.findall(resp.text)
        results = []
        for name in names:
            if _valid_name(name):
                results.append({"title": name, "desc": "Hurun India Rich List", "source": "Hurun India", "image_url": ""})
        logger.info("Hurun India → %d names", len(results))
        return results[:30]
    except Exception as exc:
        logger.warning("Hurun India failed: %s", exc)
        return []


async def scrape_great_place_to_work() -> list[dict]:
    """Great Place to Work India — Best Workplaces list."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get("https://www.greatplacetowork.in/best-workplaces/", headers=HEADERS)
        names = NAME_RE.findall(resp.text)
        results = []
        for name in names:
            if _valid_name(name):
                results.append({"title": name, "desc": "Great Place to Work India", "source": "Great Place to Work", "image_url": ""})
        return results[:20]
    except Exception as exc:
        logger.warning("Great Place to Work failed: %s", exc)
        return []


async def scrape_cii_awards() -> list[dict]:
    """CII Awards — industry excellence winners."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get("https://www.cii.in/awards.aspx", headers=HEADERS)
        names = NAME_RE.findall(resp.text)
        results = []
        for name in names:
            if _valid_name(name):
                results.append({"title": name, "desc": "CII Industry Excellence Award", "source": "CII", "image_url": ""})
        return results[:20]
    except Exception as exc:
        logger.warning("CII Awards failed: %s", exc)
        return []


async def scrape_ficci_awards() -> list[dict]:
    """FICCI Awards — industry leadership."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get("https://ficci.in/events.asp?cat=awards", headers=HEADERS)
        names = NAME_RE.findall(resp.text)
        results = []
        for name in names:
            if _valid_name(name):
                results.append({"title": name, "desc": "FICCI Award", "source": "FICCI", "image_url": ""})
        return results[:20]
    except Exception as exc:
        logger.warning("FICCI Awards failed: %s", exc)
        return []


async def scrape_screener_top_companies() -> list[dict]:
    """Screener.in — top NSE/BSE listed companies."""
    queries = ["reliance", "tata", "infosys", "hdfc", "wipro", "adani", "bajaj", "mahindra", "airtel", "icici"]
    results = []
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            for q in queries:
                try:
                    resp = await client.get(
                        f"https://www.screener.in/api/company/search/?q={q}&v=3",
                        headers={**HEADERS, "Accept": "application/json"},
                    )
                    if resp.status_code == 200:
                        for item in resp.json()[:3]:
                            if isinstance(item, dict) and item.get("name"):
                                results.append({
                                    "title":     item["name"],
                                    "desc":      f"NSE/BSE listed company — {item['name']}",
                                    "source":    "Screener.in",
                                    "image_url": "",
                                })
                except Exception:
                    pass
    except Exception as exc:
        logger.warning("Screener failed: %s", exc)
    logger.info("Screener → %d companies", len(results))
    return results


async def scrape_nasscom() -> list[dict]:
    """Nasscom — IT/tech sector rankings."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get("https://nasscom.in/knowledge-center/publications", headers=HEADERS)
        names = NAME_RE.findall(resp.text)
        results = []
        for name in names:
            if _valid_name(name):
                results.append({"title": name, "desc": "Nasscom IT sector leader", "source": "Nasscom", "image_url": ""})
        return results[:15]
    except Exception as exc:
        logger.warning("Nasscom failed: %s", exc)
        return []


async def scrape_ibef() -> list[dict]:
    """India Brand Equity Foundation — sector reports."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get("https://www.ibef.org/industry", headers=HEADERS)
        names = NAME_RE.findall(resp.text)
        results = []
        for name in names:
            if _valid_name(name):
                results.append({"title": name, "desc": "IBEF India sector leader", "source": "IBEF", "image_url": ""})
        return results[:15]
    except Exception as exc:
        logger.warning("IBEF failed: %s", exc)
        return []


# ── Name validation ───────────────────────────────────────────────────────────

def _valid_name(name: str) -> bool:
    words = name.split()
    if len(words) < 2 or len(words) > 4:
        return False
    if not all(w[0].isupper() for w in words):
        return False
    if any(w.lower() in NOT_NAMES for w in words):
        return False
    if any(w.isupper() and len(w) > 2 for w in words):
        return False
    # Avoid very short words (initials only)
    if all(len(w) <= 2 for w in words):
        return False
    return True


# ── Name + context extraction from all items ─────────────────────────────────

def extract_candidates_from_items(items: list[dict]) -> list[dict]:
    """
    Extract named candidates from all scraped items.
    Returns list of {name, role, organization, summary, source, image_url}.
    """
    # name → best candidate dict
    candidates: dict[str, dict] = {}

    for item in items:
        text = item.get("title", "") + " " + item.get("desc", "")
        text_lower = text.lower()

        # Must mention a leadership role
        if not any(kw in text_lower for kw in ROLE_KEYWORDS):
            # Still include if from a rankings/awards source
            if item.get("source") not in (
                "Hurun India", "CII", "FICCI", "Great Place to Work",
                "Screener.in", "Nasscom", "IBEF", "Fortune India",
            ):
                continue

        # Extract names from this item
        found_names = []

        # Pattern: "Name, Role" at start of title
        m = re.match(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})[,:\-–]", item.get("title", ""))
        if m and _valid_name(m.group(1)):
            found_names.append(m.group(1))

        # Scan full text
        for match in NAME_RE.finditer(text):
            candidate = match.group(1)
            if _valid_name(candidate):
                found_names.append(candidate)

        # Extract role and org from text
        role = ""
        rm = ROLE_RE.search(text)
        if rm:
            role = rm.group(1)

        org = ""
        for om in ORG_RE.finditer(text):
            candidate_org = om.group(1).strip().rstrip(",.")
            if (
                len(candidate_org) > 3
                and candidate_org[0].isupper()
                and not any(w.lower() in NOT_NAMES for w in candidate_org.split()[:2])
            ):
                org = candidate_org
                break

        for name in found_names:
            key = name.lower()
            if key not in candidates:
                candidates[key] = {
                    "name":         name,
                    "role":         role or "Business Leader",
                    "organization": org or "",
                    "summary":      item.get("desc", "")[:500],
                    "source":       item.get("source", ""),
                    "image_url":    item.get("image_url", ""),
                    "sources":      [item.get("source", "")],
                }
            else:
                # Enrich existing entry
                existing = candidates[key]
                if not existing["role"] or existing["role"] == "Business Leader":
                    if role:
                        existing["role"] = role
                if not existing["organization"] and org:
                    existing["organization"] = org
                if not existing["image_url"] and item.get("image_url"):
                    existing["image_url"] = item["image_url"]
                if item.get("source") and item["source"] not in existing["sources"]:
                    existing["sources"].append(item["source"])

    result = list(candidates.values())
    logger.info("Extracted %d unique candidates from all sources", len(result))
    return result


# ── Photo fetching ────────────────────────────────────────────────────────────

async def fetch_photo_wikipedia(person_name: str) -> str:
    """Fetch photo from Wikipedia REST API thumbnail."""
    try:
        encoded = urllib.parse.quote(person_name.replace(" ", "_"))
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                **HEADERS,
                "User-Agent": "NomineePhotoFetcher/1.0 (photo-only; contact@awardsai.com)",
                "Accept": "application/json",
            })
        if resp.status_code == 200:
            data = resp.json()
            thumb = (data.get("thumbnail") or {}).get("source", "")
            if thumb:
                thumb = re.sub(r"/\d+px-", "/400px-", thumb)
                return thumb
    except Exception as exc:
        logger.debug("Wikipedia photo failed for '%s': %s", person_name, exc)
    return ""


async def fetch_photo_wikimedia_search(person_name: str) -> str:
    """Search Wikimedia Commons for a person image using full-text search."""
    try:
        # Try multiple search variations
        queries = [
            person_name,
            person_name.split()[0] + " " + person_name.split()[-1],  # first + last only
        ]
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            for q in queries:
                params = {
                    "action": "query",
                    "generator": "search",
                    "gsrnamespace": "6",
                    "gsrsearch": q,
                    "gsrlimit": "8",
                    "prop": "imageinfo",
                    "iiprop": "url|mime|extmetadata",
                    "iiurlwidth": "400",
                    "format": "json",
                }
                resp = await client.get(
                    "https://commons.wikimedia.org/w/api.php",
                    params=params,
                    headers={**HEADERS, "Accept": "application/json"},
                )
                if resp.status_code == 200:
                    pages = resp.json().get("query", {}).get("pages", {})
                    for page in pages.values():
                        for ii in page.get("imageinfo", []):
                            mime = ii.get("mime", "")
                            url = ii.get("thumburl") or ii.get("url", "")
                            title = page.get("title", "").lower()
                            if (url and "image" in mime
                                    and not any(x in title for x in ["logo", "icon", "flag", "map", "coat", "seal"])
                                    and not any(x in url.lower() for x in ["logo", "icon", "flag"])):
                                return url
    except Exception as exc:
        logger.debug("Wikimedia search failed for '%s': %s", person_name, exc)
    return ""


async def fetch_photo_open_search(person_name: str) -> str:
    """
    Use Wikipedia's OpenSearch to find the correct page title,
    then fetch the page image via pageimages API.
    Handles name variations and redirects.
    """
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            # Step 1: OpenSearch to find correct title
            search_resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "opensearch",
                    "search": person_name,
                    "limit": "3",
                    "namespace": "0",
                    "format": "json",
                },
                headers={**HEADERS, "Accept": "application/json"},
            )
            if search_resp.status_code != 200:
                return ""

            results = search_resp.json()
            titles = results[1] if len(results) > 1 else []
            if not titles:
                return ""

            # Step 2: Get page image for the best matching title
            for title in titles[:2]:
                img_resp = await client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "titles": title,
                        "prop": "pageimages",
                        "pithumbsize": 400,
                        "format": "json",
                        "redirects": 1,
                    },
                    headers={**HEADERS, "Accept": "application/json"},
                )
                if img_resp.status_code == 200:
                    pages = img_resp.json().get("query", {}).get("pages", {})
                    for page in pages.values():
                        thumb = page.get("thumbnail", {}).get("source", "")
                        if thumb:
                            return re.sub(r"/\d+px-", "/400px-", thumb)
    except Exception as exc:
        logger.debug("OpenSearch photo failed for '%s': %s", person_name, exc)
    return ""


async def fetch_photo_duckduckgo_api(person_name: str) -> str:
    """DuckDuckGo Instant Answer API — free, no scraping needed."""
    try:
        query = urllib.parse.quote(f"{person_name} Indian business leader")
        url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1"
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(url, headers={**HEADERS, "Accept": "application/json"})
        if resp.status_code == 200:
            data = resp.json()
            # Check main image
            img = data.get("Image", "")
            if img and img.startswith("http"):
                return img
            # Check related topics
            for topic in data.get("RelatedTopics", [])[:5]:
                icon = topic.get("Icon", {})
                if isinstance(icon, dict):
                    img = icon.get("URL", "")
                    if img and img.startswith("http"):
                        return img
    except Exception as exc:
        logger.debug("DuckDuckGo API failed for '%s': %s", person_name, exc)
    return ""


async def fetch_photo_wikipedia_search(person_name: str) -> str:
    """Search Wikipedia for the person and get their page image."""
    try:
        params = {
            "action": "query",
            "titles": person_name,
            "prop": "pageimages",
            "pithumbsize": 400,
            "format": "json",
            "redirects": 1,
        }
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params=params,
                headers={**HEADERS, "Accept": "application/json"},
            )
        if resp.status_code == 200:
            pages = resp.json().get("query", {}).get("pages", {})
            for page in pages.values():
                thumb = page.get("thumbnail", {}).get("source", "")
                if thumb:
                    return re.sub(r"/\d+px-", "/400px-", thumb)
    except Exception as exc:
        logger.debug("Wikipedia search photo failed for '%s': %s", person_name, exc)
    return ""


async def fetch_photo(person_name: str) -> str:
    """
    5-layer photo fetch — all free APIs, no scraping:
    1. Wikipedia REST summary (fastest)
    2. Wikipedia OpenSearch → pageimages (handles name variations)
    3. Wikipedia API pageimages (direct lookup)
    4. DuckDuckGo Instant Answer API
    5. Wikimedia Commons search
    Falls back to ui-avatars.com generated avatar if all fail.
    """
    url = await fetch_photo_wikipedia(person_name)
    if url:
        return url
    url = await fetch_photo_open_search(person_name)
    if url:
        return url
    url = await fetch_photo_wikipedia_search(person_name)
    if url:
        return url
    url = await fetch_photo_duckduckgo_api(person_name)
    if url:
        return url
    url = await fetch_photo_wikimedia_search(person_name)
    if url:
        return url
    # Final fallback: generated letter avatar (always works, looks professional)
    initials = "+".join(w[0].upper() for w in person_name.split()[:2] if w)
    return f"https://ui-avatars.com/api/?name={urllib.parse.quote(person_name)}&size=400&background=00338D&color=ffffff&bold=true&font-size=0.4"


async def batch_fetch_photos(names: list[str]) -> dict[str, str]:
    """Fetch photos for multiple people concurrently."""
    tasks = [fetch_photo(name) for name in names]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return {
        name: (r if isinstance(r, str) else "")
        for name, r in zip(names, results)
    }


# ── Main entry point ──────────────────────────────────────────────────────────

async def scrape_all_sources() -> list[dict]:
    """
    Scrape all sources concurrently and return enriched candidate list.
    """
    rss_task       = fetch_all_rss()
    hurun_task     = scrape_hurun_india()
    gptw_task      = scrape_great_place_to_work()
    cii_task       = scrape_cii_awards()
    ficci_task     = scrape_ficci_awards()
    screener_task  = scrape_screener_top_companies()
    nasscom_task   = scrape_nasscom()
    ibef_task      = scrape_ibef()

    results = await asyncio.gather(
        rss_task, hurun_task, gptw_task, cii_task,
        ficci_task, screener_task, nasscom_task, ibef_task,
        return_exceptions=True,
    )

    all_items = []
    for r in results:
        if isinstance(r, list):
            all_items.extend(r)

    logger.info("Total items from all sources: %d", len(all_items))
    return extract_candidates_from_items(all_items)
