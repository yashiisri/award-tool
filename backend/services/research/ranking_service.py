"""
ranking_service.py
─────────────────────
Transparent, deterministic verification and scoring. None of these numbers
come from an LLM — they're computed directly from the evidence a candidate
has, so scoring keeps working even if the LLM/rationale step fails entirely
(spec §18: "AI ranking fails -> return evidence-based candidates with
deterministic scores").
"""

import re
from datetime import datetime, timezone

from config import settings

ACHIEVEMENT_RE = re.compile(
    r"\b(launched|led|founded|built|pioneered|transformed|expanded|achieved|"
    r"won|ranked|awarded|grew|scaled|delivered|drove|spearheaded)\b", re.IGNORECASE
)


def _unique_domains(evidence: list[dict]) -> set[str]:
    return {e.get("source_domain", "") for e in evidence if e.get("source_domain")}


def verify_candidate(candidate: dict) -> tuple[str, float]:
    """Returns (verification_status, verification_confidence)."""
    evidence = candidate.get("evidence", [])
    if not evidence:
        return "unverified", 0.0

    domains = _unique_domains(evidence)
    avg_quality = sum(e.get("source_quality", 0.0) for e in evidence) / len(evidence)

    if len(domains) >= 2 and avg_quality >= 0.5:
        confidence = min(1.0, 0.55 + 0.15 * len(domains) + 0.2 * avg_quality)
        return "verified", round(confidence, 2)
    if len(domains) >= 1:
        confidence = min(0.65, 0.25 + 0.15 * len(domains) + 0.2 * avg_quality)
        return "partially_verified", round(confidence, 2)
    return "unverified", 0.1


def _keyword_overlap_score(text: str, terms: list[str]) -> float:
    if not terms:
        return 0.4  # no constraint specified — neutral, not penalised
    text_lower = text.lower()
    hits = sum(1 for t in terms if t and t.lower() in text_lower)
    return min(1.0, hits / max(1, len(terms)))


def _evidence_text_blob(candidate: dict) -> str:
    return " ".join(e.get("evidence_text", "") + " " + e.get("claim", "") for e in candidate.get("evidence", []))


def _recency_score(candidate: dict) -> float:
    dates = [e.get("published_date") for e in candidate.get("evidence", []) if e.get("published_date")]
    if not dates:
        return 0.5  # unknown recency — neutral rather than penalised
    parsed = []
    for d in dates:
        try:
            parsed.append(datetime.fromisoformat(str(d).replace("Z", "+00:00")))
        except ValueError:
            continue
    if not parsed:
        return 0.5
    most_recent = max(parsed)
    now = datetime.now(timezone.utc)
    if most_recent.tzinfo is None:
        most_recent = most_recent.replace(tzinfo=timezone.utc)
    age_days = max(0, (now - most_recent).days)
    if age_days <= 365:
        return 1.0
    if age_days <= 365 * 3:
        return 0.7
    if age_days <= 365 * 7:
        return 0.45
    return 0.25  # older info still counts for major career achievements, just not recency


def score_candidate(candidate: dict, plan: dict) -> dict:
    """Compute explainable component scores (each 0.0-1.0) and an overall_score."""
    blob = _evidence_text_blob(candidate)
    evidence = candidate.get("evidence", [])

    keywords = plan.get("keywords", [])
    award_relevance = _keyword_overlap_score(blob, keywords)

    leadership_terms = [plan.get("leadership_requirements", "")] if plan.get("leadership_requirements") else []
    designation = candidate.get("designation", "")
    leadership_impact = 1.0 if (leadership_terms and any(t.lower() in designation.lower() for t in leadership_terms)) \
        else (0.7 if designation else 0.3)

    industry_terms = [plan.get("industry", "")] if plan.get("industry") else []
    industry_relevance = _keyword_overlap_score(blob + " " + candidate.get("organization", ""), industry_terms)

    achievement_hits = len(ACHIEVEMENT_RE.findall(blob))
    achievement_strength = min(1.0, achievement_hits / 4)

    source_quality = (sum(e.get("source_quality", 0.0) for e in evidence) / len(evidence)) if evidence else 0.0

    recency = _recency_score(candidate)

    scores = {
        "award_relevance": round(award_relevance, 2),
        "leadership_impact": round(leadership_impact, 2),
        "industry_relevance": round(industry_relevance, 2),
        "achievement_strength": round(achievement_strength, 2),
        "source_quality": round(source_quality, 2),
        "recency": round(recency, 2),
    }

    overall = (
        scores["award_relevance"] * settings.WEIGHT_AWARD_RELEVANCE
        + scores["leadership_impact"] * settings.WEIGHT_LEADERSHIP_IMPACT
        + scores["industry_relevance"] * settings.WEIGHT_INDUSTRY_RELEVANCE
        + scores["achievement_strength"] * settings.WEIGHT_ACHIEVEMENT_STRENGTH
        + scores["source_quality"] * settings.WEIGHT_SOURCE_QUALITY
        + scores["recency"] * settings.WEIGHT_RECENCY
    )

    return {"scores": scores, "overall_score": round(overall, 3)}


def deterministic_rationale(candidate: dict) -> str:
    """Fallback rationale built directly from evidence, no LLM required."""
    evidence = candidate.get("evidence", [])
    if not evidence:
        return f"{candidate['name']} was discovered as a potential match but has no independent supporting evidence yet."

    best = max(evidence, key=lambda e: e.get("source_quality", 0))
    designation = candidate.get("designation") or "a leadership role"
    organization = candidate.get("organization") or "their organization"
    return (
        f"{candidate['name']} holds {designation} at {organization}, corroborated by "
        f"{len(_unique_domains(evidence))} independent source(s), including {best.get('source_domain', 'a cited source')}."
    )
