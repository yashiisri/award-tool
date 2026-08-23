"""
source_quality.py
──────────────────
Domain-tier scoring. Wikipedia is deliberately mid-tier — an enrichment
source, never a mandatory gate (per spec: don't reject a candidate merely
because Wikipedia is unavailable).
"""

from urllib.parse import urlparse

# Highest priority — official / authoritative
TIER_HIGHEST = {
    "gov", "gov.in", "nic.in",                      # government
    "sec.gov", "sebi.gov.in",                       # regulatory filings
}
TIER_HIGHEST_SUFFIXES = (".gov", ".gov.in", ".edu", ".ac.in", ".ac.uk")

# High priority — major, established publications
TIER_HIGH_DOMAINS = {
    "reuters.com", "bloomberg.com", "ft.com", "forbes.com", "fortune.com",
    "bbc.com", "bbc.co.uk", "wsj.com", "economist.com", "nytimes.com",
    "economictimes.indiatimes.com", "livemint.com", "business-standard.com",
    "thehindubusinessline.com", "moneycontrol.com", "cnbc.com",
}

# Medium priority — enrichment / structured databases, not primary evidence
TIER_MEDIUM_DOMAINS = {
    "wikipedia.org", "en.wikipedia.org", "crunchbase.com", "linkedin.com",
    "bloomberg.com/profile",
}

# Low priority — aggregators, unknown blogs, SEO farms
TIER_LOW_HINTS = ("blogspot.", "medium.com", "wordpress.com", "quora.com")


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().replace("www.", "")
    except ValueError:
        return ""


def score_domain(url: str) -> float:
    """Return a 0.0–1.0 source-quality score for a URL's domain."""
    domain = _domain(url)
    if not domain:
        return 0.2

    if domain in TIER_HIGHEST or any(domain.endswith(s) for s in TIER_HIGHEST_SUFFIXES):
        return 1.0
    if any(domain == d or domain.endswith("." + d) for d in TIER_HIGH_DOMAINS):
        return 0.8
    if any(domain == d or domain.endswith("." + d) for d in TIER_MEDIUM_DOMAINS):
        return 0.55
    if any(hint in domain for hint in TIER_LOW_HINTS):
        return 0.2

    # An official-looking company site (name matches org, no path depth) — treated as
    # highest tier only when the caller already knows it's the candidate's own org site;
    # this generic scorer defaults unknown domains to a moderate-low score.
    return 0.35


def tier_label(url: str) -> str:
    score = score_domain(url)
    if score >= 0.9:
        return "official"
    if score >= 0.7:
        return "major_publication"
    if score >= 0.5:
        return "enrichment"
    if score >= 0.3:
        return "unknown"
    return "low_quality"
