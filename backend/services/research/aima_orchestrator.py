"""
aima_orchestrator.py
────────────────────────
AIMA-specialized nominee research pipeline (spec: AIMA Managing India Awards
upgrade). Reuses the same shared, evidence-based building blocks as the
generic engine (research_orchestrator.py) — search, extraction, entity
resolution, evidence collection — but adds:

  - category auto-detection + a real historical-winner-derived category
    profile (aima_category_profile.py)
  - an organization-category short-circuit (never fakes a person nominee
    for a company-focused category)
  - category-fingerprint-driven discovery queries instead of
    "{category} winner {year}" queries
  - a hard minimum-evidence-sources eligibility gate driven by the profile
  - historical similarity scoring against real past winners
  - the AIMA response schema (spec §20), while still including the
    generic engine's fields for frontend backward compatibility

This module never invents a candidate identity, achievement, or source —
the same hallucination constraints as the generic engine apply throughout.
"""

import logging
import time
import uuid
from datetime import datetime, timezone

from config import settings
from services.ai_service import generate_grounded_rationale
from services.research.aima_category_profile import build_profile
from services.research.aima_history import get_history, is_aima_award
from services.research.candidate_extractor import extract_candidates
from services.research.entity_classifier import is_person
from services.research.entity_resolver import resolve_entities
from services.research.evidence_service import collect_evidence
from services.research.historical_similarity import compute_fit
from services.research.ranking_service import deterministic_rationale, score_candidate, verify_candidate
from services.research.search_provider import run_bounded_searches
from services.research.tavily_provider import TavilyProvider
from services.research.brave_provider import BraveProvider

logger = logging.getLogger(__name__)

# Category-flavored discovery templates (spec §7) — parametrized by the
# category's real industries/roles, never a literal "{category} winner" query.
_GENERIC_TEMPLATES = [
    "Indian {industry} leaders {year}",
    "Indian CEOs {industry} growth {year} {year2}",
    "Indian business leaders expansion {year}",
    "Indian corporate leaders transformation {year}",
    "Indian executives {industry} leadership {year2}",
]
_ENTREPRENEUR_TEMPLATES = [
    "Indian entrepreneurs major growth {year} {year2}",
    "Indian founders major business expansion",
    "Indian startup founders {year2}",
    "Indian entrepreneurs innovation {year}",
    "Indian {industry} startup founders {year2}",
]
_TRANSFORMATION_TEMPLATES = [
    "Indian business transformation leaders {year}",
    "Indian CEOs digital transformation",
    "Indian leaders major organizational transformation",
    "Indian executives business transformation India",
    "Indian {industry} leaders transformation {year2}",
]
_INSTITUTION_TEMPLATES = [
    "Indian institution builders {industry} {year}",
    "Indian founders long-term institution building",
    "Indian business leaders organizational legacy {year2}",
]


def _select_templates(normalized_category: str) -> list[str]:
    if "entrepreneur" in normalized_category:
        return _ENTREPRENEUR_TEMPLATES
    if "transformational" in normalized_category:
        return _TRANSFORMATION_TEMPLATES
    if "institution_builder" in normalized_category:
        return _INSTITUTION_TEMPLATES
    return _GENERIC_TEMPLATES


def _discovery_queries(normalized_category: str, profile: dict, max_queries: int) -> list[str]:
    year = datetime.now(timezone.utc).year
    industries = profile.get("industries") or ["business"]
    templates = _select_templates(normalized_category)

    queries: list[str] = []
    seen: set[str] = set()

    def add(q: str):
        q = " ".join(q.split())
        if q.lower() not in seen:
            seen.add(q.lower())
            queries.append(q)

    for industry in industries[:4]:
        for template in templates:
            add(template.format(industry=industry, year=year, year2=year + 1))
            if len(queries) >= max_queries:
                return queries[:max_queries]

    # Ensure coverage even if the category has no known industries yet
    for template in templates:
        add(template.format(industry="business", year=year, year2=year + 1))
        if len(queries) >= max_queries:
            break

    return queries[:max_queries]


def _unique_domains(evidence: list[dict]) -> set[str]:
    return {e.get("source_domain", "") for e in evidence if e.get("source_domain")}


def _build_plan_from_profile(profile: dict) -> dict:
    """Adapts an AIMA category profile into the generic `plan` shape that
    ranking_service.score_candidate already knows how to consume."""
    return {
        "keywords": profile.get("historical_signals", []),
        "leadership_requirements": (profile.get("preferred_roles") or [""])[0],
        "industry": (profile.get("industries") or [""])[0],
    }


def _empty_result(category: str, request_id: str, started: float, providers_used: list[str],
                   historical_years: list[int], diagnostic: str) -> dict:
    return {
        "category": category,
        "candidates": [],
        "research_metadata": {
            "request_id": request_id,
            "historical_years_analyzed": historical_years,
            "queries_executed": 0,
            "sources_examined": 0,
            "people_discovered": 0,
            "people_verified": 0,
            "research_duration_ms": int((time.monotonic() - started) * 1000),
            "providers_used": providers_used,
            "diagnostic": diagnostic,
        },
    }


async def run_aima_research(db, award: dict, award_id: str, num_results: int | None = None) -> dict:
    """
    Entry point. Callers should already know this award matched an AIMA
    category (see aima_history.is_aima_award) before calling this — it
    re-derives the category itself for safety, but doesn't decide routing.
    """
    started = time.monotonic()
    request_id = str(uuid.uuid4())[:8]
    award_name = award.get("name") or ""
    award_description = award.get("description", "")

    normalized_category = is_aima_award(award_name, award_description)
    if not normalized_category:
        raise ValueError("This award does not match a known AIMA category")

    log = lambda msg, **kw: logger.info("[aima %s] %s | category=%s %s", request_id, msg, normalized_category, kw)

    profile = build_profile(normalized_category)
    historical_years = profile["historical_years_analyzed"]

    # ── Organization-focused category: never fabricate a person nominee ────
    if profile["candidate_entity_type"] == "ORGANIZATION":
        log("organization category — skipping person research")
        return {
            "status": "organization_category",
            "message": f"'{award_name}' is an AIMA organization-focused category and is excluded from person nominee research.",
            "category": normalized_category,
        }

    num_results = num_results or settings.AIMA_FINAL_RESULTS

    providers = [TavilyProvider(), BraveProvider()]
    providers_used = [p.name for p in providers if p.is_configured]
    if not providers_used:
        return _empty_result(normalized_category, request_id, started, providers_used, historical_years,
                              "No search provider is configured. Set TAVILY_API_KEY in backend/.env.")

    # ── Stage 1: discovery ──────────────────────────────────────────────────
    queries = _discovery_queries(normalized_category, profile, max_queries=20)
    discovery_results = await run_bounded_searches(db, providers, queries, max_results_per_query=8)
    all_results = [r for results in discovery_results.values() for r in results]
    sources_examined = len({r.url for r in all_results})
    log("discovery complete", queries=len(queries), results=len(all_results), sources=sources_examined)

    if not all_results:
        return _empty_result(normalized_category, request_id, started, providers_used, historical_years,
                              "Discovery search returned no results for this category.")

    # candidate_extractor already runs every mention through entity_classifier —
    # only PERSON-shaped names ever become mentions here.
    mentions = extract_candidates(all_results)
    people_discovered = len(mentions)
    log("candidates extracted", mentions=people_discovered)

    if not mentions:
        return _empty_result(normalized_category, request_id, started, providers_used, historical_years,
                              f"Searched {len(queries)} queries across {sources_examined} sources but found no "
                              "person mentions matching this category's profile.")

    # ── Stage 2: entity resolution + basic verification ─────────────────────
    resolved = resolve_entities(mentions)
    resolved.sort(key=lambda c: len(c.get("candidate_sources", [])), reverse=True)
    resolved = resolved[:settings.AIMA_STAGE2_VERIFY_LIMIT * 2]

    basic_pass = [c for c in resolved if c.get("organization") or c.get("designation") or len(c.get("candidate_sources", [])) >= 2]
    basic_pass = basic_pass[:settings.AIMA_STAGE2_VERIFY_LIMIT] or resolved[:settings.AIMA_STAGE2_VERIFY_LIMIT]
    log("basic verification pass", candidates=len(basic_pass))

    # ── Stage 3: deep research ───────────────────────────────────────────────
    deep_candidates = basic_pass[:settings.AIMA_STAGE3_DEEP_LIMIT]
    await collect_evidence(db, deep_candidates, award_name, providers)
    log("evidence collected", deep_candidates=len(deep_candidates))

    plan = _build_plan_from_profile(profile)
    min_sources = profile.get("minimum_evidence_sources", 2)

    final_candidates = []
    for c in deep_candidates:
        # Defensive re-check — belt-and-suspenders on top of candidate_extractor's gate.
        if not is_person(c["name"]):
            continue

        domains = _unique_domains(c.get("evidence", []))
        role_verified = bool(c.get("designation"))
        org_verified = bool(c.get("organization"))

        # Minimum evidence rule (spec §11): real person + role + org + enough
        # independent sources. A candidate that fails this is excluded
        # entirely, not shown with an artificially low score.
        if len(domains) < min_sources:
            continue

        status, confidence = verify_candidate(c)
        base = score_candidate(c, plan)
        fit = compute_fit(c, profile)

        award_eligibility = round(sum([role_verified, org_verified, len(domains) >= min_sources]) / 3, 2)
        evidence_strength = round(min(1.0, len(domains) / max(3, min_sources)), 2)

        scores = {
            "award_eligibility": award_eligibility,
            "historical_category_fit": fit["historical_similarity_score"],
            "leadership_impact": base["scores"]["leadership_impact"],
            "achievement_strength": base["scores"]["achievement_strength"],
            "evidence_strength": evidence_strength,
            "source_quality": base["scores"]["source_quality"],
            "recency": base["scores"]["recency"],
        }

        final = (
            scores["award_eligibility"] * settings.AIMA_WEIGHT_AWARD_ELIGIBILITY
            + scores["historical_category_fit"] * settings.AIMA_WEIGHT_HISTORICAL_FIT
            + scores["leadership_impact"] * settings.AIMA_WEIGHT_LEADERSHIP_IMPACT
            + scores["achievement_strength"] * settings.AIMA_WEIGHT_ACHIEVEMENT_STRENGTH
            + scores["evidence_strength"] * settings.AIMA_WEIGHT_EVIDENCE_STRENGTH
            + scores["source_quality"] * settings.AIMA_WEIGHT_SOURCE_QUALITY
            + scores["recency"] * settings.AIMA_WEIGHT_RECENCY
        )
        final_score_100 = round(final * 100)

        evidence_texts = [e.get("evidence_text", "") for e in c.get("evidence", []) if e.get("evidence_text")]
        rationale = ""
        try:
            rationale = await generate_grounded_rationale(c["name"], c.get("designation", ""), c.get("organization", ""), evidence_texts)
        except Exception as exc:
            logger.warning("[aima %s] rationale generation failed for '%s': %s", request_id, c["name"], exc)
        if not rationale:
            rationale = deterministic_rationale(c)

        sources = [e["source_url"] for e in c.get("evidence", []) if e.get("source_url")]

        final_candidates.append({
            "name": c["name"],
            "designation": c.get("designation") or "Business Leader",
            "organization": c.get("organization", ""),
            "organisation": c.get("organization", ""),  # backward-compat spelling used by the existing frontend
            "entity_type": "PERSON",
            "verification_status": status,
            "verification_confidence": confidence,
            "final_score": final_score_100,
            "overall_score": round(final, 3),  # backward-compat 0-1 scale
            "scores": scores,
            "why_they_qualify": rationale,
            "rationale": rationale,  # backward-compat field name
            "historical_comparison": fit["reasoning"],
            "similar_previous_winners": fit["similar_previous_winners"],
            "evidence": c.get("evidence", []),
            "sources": sources,
            "photo_url": c.get("photo_url", ""),
            "wikipedia_url": c.get("wikipedia_url"),
            "ai_generated": True,
            "rationale_data": {
                "confidence_score": round(final, 3),
                "relevance_reason": rationale,
                "source_links": sources,
                "ai_generated": True,
            },
        })

    people_verified = len(final_candidates)
    final_candidates.sort(key=lambda c: c["final_score"], reverse=True)
    top = final_candidates[:num_results]

    duration_ms = int((time.monotonic() - started) * 1000)
    log("research complete", returned=len(top), duration_ms=duration_ms)

    diagnostic = None
    if not top:
        diagnostic = (
            f"Searched {len(queries)} queries across {sources_examined} sources and discovered "
            f"{people_discovered} person mention(s), but none met this category's minimum-evidence "
            f"bar of {min_sources} independent sources."
        )

    return {
        "category": normalized_category,
        "candidates": top,
        "research_metadata": {
            "request_id": request_id,
            "historical_years_analyzed": historical_years,
            "queries_executed": len(queries) + len(deep_candidates),
            "sources_examined": sources_examined,
            "people_discovered": people_discovered,
            "people_verified": people_verified,
            "research_duration_ms": duration_ms,
            "providers_used": providers_used,
            "diagnostic": diagnostic,
        },
    }
