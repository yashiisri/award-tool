"""
evidence_service.py
──────────────────────
Stage-2/3: for a shortlist of resolved candidates, run targeted per-candidate
searches and turn the results into structured Evidence records. Wikipedia is
used here only as an enrichment source (never a mandatory gate).
"""

import logging

from services.research.query_generator import generate_candidate_queries
from services.research.search_provider import SearchProvider, run_bounded_searches
from services.research.source_quality import score_domain, tier_label
from services.wikipedia_service import fetch_summary

logger = logging.getLogger(__name__)


def _build_evidence_item(source_url: str, source_title: str, source_domain: str,
                          published_date: str | None, claim: str, evidence_text: str) -> dict:
    return {
        "source_url": source_url,
        "source_title": source_title,
        "source_domain": source_domain,
        "source_type": tier_label(source_url),
        "published_date": published_date,
        "claim": claim,
        "evidence_text": evidence_text[:600],
        "source_quality": round(score_domain(source_url), 2),
    }


async def enrich_with_wikipedia(candidate: dict) -> None:
    """Best-effort enrichment only — never blocks or disqualifies a candidate."""
    try:
        summary = await fetch_summary(candidate["name"])
    except Exception as exc:
        logger.debug("Wikipedia enrichment failed for '%s': %s", candidate["name"], exc)
        return
    if not summary:
        return

    candidate.setdefault("evidence", []).append(_build_evidence_item(
        source_url=summary.get("wiki_url", ""),
        source_title=summary.get("title", candidate["name"]),
        source_domain="wikipedia.org",
        published_date=None,
        claim=summary.get("description", "") or "Wikipedia biography",
        evidence_text=summary.get("extract", ""),
    ))
    if not candidate.get("photo_url") and summary.get("thumbnail_url"):
        candidate["photo_url"] = summary["thumbnail_url"]
    candidate["wikipedia_url"] = summary.get("wiki_url", "")


async def collect_evidence(db, candidates: list[dict], award_title: str, providers: list[SearchProvider]) -> None:
    """
    Mutates each candidate in place, appending Evidence records from
    targeted searches. Candidates already carry discovery-stage evidence
    from candidate_extractor — this adds independent, targeted corroboration.
    """
    query_map: dict[str, dict] = {}
    for candidate in candidates:
        for q in generate_candidate_queries(candidate["name"], candidate.get("organization", ""), award_title):
            query_map[q] = candidate

    if not query_map:
        return

    search_results = await run_bounded_searches(
        db, providers, list(query_map.keys()), max_results_per_query=5,
        cache_ttl=None,
    )

    for query, candidate in query_map.items():
        for r in search_results.get(query, []):
            # Guard against evidence that doesn't actually mention the candidate —
            # a targeted query can still return tangential results.
            if candidate["name"].split()[0].lower() not in (r.title + r.snippet).lower():
                continue
            candidate.setdefault("evidence", []).append(_build_evidence_item(
                source_url=r.url,
                source_title=r.title,
                source_domain=r.domain,
                published_date=r.published_date,
                claim=r.title,
                evidence_text=r.snippet or r.content,
            ))

    for candidate in candidates:
        await enrich_with_wikipedia(candidate)
