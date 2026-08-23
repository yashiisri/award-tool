"""
research_orchestrator.py
───────────────────────────
Top-level pipeline:

  award criteria -> research plan -> broad web search -> candidate discovery
  -> entity resolution -> evidence collection -> verification -> scoring

This replaces the old "LLM invents names -> fuzzy-match against scraped
pages" flow. The LLM is used only to (a) structure the award's own text into
criteria, (b) optionally widen industry terminology, and (c) write a
grounded rationale sentence for the final shortlist — never to originate a
candidate's identity.
"""

import logging
import time
import uuid

from services.research.candidate_extractor import extract_candidates
from services.research.entity_resolver import resolve_entities
from services.research.evidence_service import collect_evidence
from services.research.query_generator import build_research_plan, generate_discovery_queries
from services.research.ranking_service import deterministic_rationale, score_candidate, verify_candidate
from services.research.search_provider import run_bounded_searches
from services.research.tavily_provider import TavilyProvider
from services.research.brave_provider import BraveProvider
from services.ai_service import generate_grounded_rationale
from config import settings

logger = logging.getLogger(__name__)


def _build_payload(candidate: dict, award_id: str, rationale: str) -> dict:
    sources = [e["source_url"] for e in candidate.get("evidence", []) if e.get("source_url")]
    return {
        "award_id": award_id,
        "name": candidate["name"],
        "designation": candidate.get("designation") or "Business Leader",
        "organisation": candidate.get("organization", ""),
        "photo_url": candidate.get("photo_url", ""),
        "rationale": rationale,
        "overall_score": candidate["overall_score"],
        "verification_status": candidate["verification_status"],
        "verification_confidence": candidate["verification_confidence"],
        "scores": candidate["scores"],
        "evidence": candidate.get("evidence", []),
        "sources": sources,
        "wikipedia_url": candidate.get("wikipedia_url"),
        "ai_generated": True,
        # Backward-compatible fields for the existing frontend contract
        "rationale_data": {
            "confidence_score": candidate["overall_score"],
            "relevance_reason": rationale,
            "source_links": sources,
            "ai_generated": True,
        },
    }


async def run_research(db, award: dict, award_id: str, num_results: int = 5) -> dict:
    request_id = str(uuid.uuid4())[:8]
    started = time.monotonic()
    award_title = award.get("name") or "Business Excellence Award"
    award_description = award.get("description", "")

    log = lambda msg, **kw: logger.info("[research %s] %s | award=%s %s", request_id, msg, award_id, kw)

    providers = [TavilyProvider(), BraveProvider()]
    providers_used = [p.name for p in providers if p.is_configured]
    if not providers_used:
        log("no search providers configured")
        return _empty_result(award_id, request_id, started, providers_used,
                              "No search provider is configured. Set TAVILY_API_KEY in backend/.env.")

    # ── 1. Research plan ──────────────────────────────────────────────────────
    plan = await build_research_plan(award_title, award_description)
    log("plan built", industry=plan.get("industry"), geography=plan.get("geography"))

    # ── 2. Discovery queries ─────────────────────────────────────────────────
    discovery_queries = await generate_discovery_queries(plan, max_queries=16)
    log("discovery queries generated", count=len(discovery_queries))

    # ── 3. Broad parallel search ─────────────────────────────────────────────
    discovery_results = await run_bounded_searches(db, providers, discovery_queries, max_results_per_query=8)
    all_results = [r for results in discovery_results.values() for r in results]
    sources_examined = len({r.url for r in all_results})
    log("discovery search complete", results=len(all_results), unique_sources=sources_examined)

    if not all_results:
        return _empty_result(award_id, request_id, started, providers_used,
                              "Discovery search returned no results for this award's criteria.")

    # ── 4. Candidate discovery ───────────────────────────────────────────────
    mentions = extract_candidates(all_results)
    log("candidates extracted", mentions=len(mentions))

    if not mentions:
        return _empty_result(award_id, request_id, started, providers_used,
                              f"Searched {len(discovery_queries)} queries across {sources_examined} sources "
                              "but found no leadership-role mentions to extract.")

    # ── 5. Entity resolution ─────────────────────────────────────────────────
    resolved = resolve_entities(mentions)
    resolved.sort(key=lambda c: len(c.get("candidate_sources", [])), reverse=True)
    resolved = resolved[:settings.RESEARCH_STAGE1_DISCOVERY_LIMIT]
    log("entities resolved", unique_candidates=len(resolved))

    # ── 6. Basic verification pre-filter ────────────────────────────────────
    basic_pass = [c for c in resolved if c.get("organization") or c.get("designation") or len(c.get("candidate_sources", [])) >= 2]
    basic_pass = basic_pass[:settings.RESEARCH_STAGE2_VERIFY_LIMIT] or resolved[:settings.RESEARCH_STAGE2_VERIFY_LIMIT]
    log("basic verification pass", candidates=len(basic_pass))

    # ── 7. Deep evidence enrichment (stage 3) ───────────────────────────────
    deep_candidates = basic_pass[:settings.RESEARCH_STAGE3_DEEP_LIMIT]
    await collect_evidence(db, deep_candidates, award_title, providers)
    log("evidence collection complete", deep_candidates=len(deep_candidates))

    # ── 8. Verify + score everyone in the basic pass ────────────────────────
    for c in basic_pass:
        status, confidence = verify_candidate(c)
        c["verification_status"] = status
        c["verification_confidence"] = confidence
        c.update(score_candidate(c, plan))

    basic_pass.sort(key=lambda c: c["overall_score"], reverse=True)
    candidates_verified = sum(1 for c in basic_pass if c["verification_status"] in ("verified", "partially_verified"))

    # ── 9. Final shortlist + grounded rationale ─────────────────────────────
    top = basic_pass[:num_results]
    payloads = []
    for c in top:
        evidence_texts = [e.get("evidence_text", "") for e in c.get("evidence", []) if e.get("evidence_text")]
        rationale = ""
        try:
            rationale = await generate_grounded_rationale(c["name"], c.get("designation", ""), c.get("organization", ""), evidence_texts)
        except Exception as exc:
            logger.warning("[research %s] grounded rationale failed for '%s': %s", request_id, c["name"], exc)
        if not rationale:
            rationale = deterministic_rationale(c)
        payloads.append(_build_payload(c, award_id, rationale))

    duration_ms = int((time.monotonic() - started) * 1000)
    log("research complete", returned=len(payloads), duration_ms=duration_ms)

    diagnostic = None
    if not payloads:
        diagnostic = (
            f"Searched {len(discovery_queries)} queries across {sources_examined} sources and found "
            f"{len(resolved)} candidate(s), but none passed basic verification for this award's criteria."
        )

    return {
        "candidates": payloads,
        "research_metadata": {
            "request_id": request_id,
            "queries_executed": len(discovery_queries) + sum(1 for _ in deep_candidates),
            "sources_examined": sources_examined,
            "candidates_discovered": len(resolved),
            "candidates_verified": candidates_verified,
            "research_duration_ms": duration_ms,
            "providers_used": providers_used,
            "diagnostic": diagnostic,
        },
    }


def _empty_result(award_id: str, request_id: str, started: float, providers_used: list[str], diagnostic: str) -> dict:
    return {
        "candidates": [],
        "research_metadata": {
            "request_id": request_id,
            "queries_executed": 0,
            "sources_examined": 0,
            "candidates_discovered": 0,
            "candidates_verified": 0,
            "research_duration_ms": int((time.monotonic() - started) * 1000),
            "providers_used": providers_used,
            "diagnostic": diagnostic,
        },
    }
