"""
historical_similarity.py
────────────────────────────
Deterministic comparison of a candidate against a category's real historical
winners (spec §14). Historical winners are a pattern to match against, never
a pool to copy from — this never suggests a past winner as a "candidate".
"""

from services.research.aima_history import get_history


def _role_overlap(designation: str, preferred_roles: list[str]) -> bool:
    if not designation or not preferred_roles:
        return False
    d = designation.lower()
    return any(role.lower() in d or d in role.lower() for role in preferred_roles)


def _industry_overlap(industry: str, profile_industries: list[str]) -> bool:
    if not industry or not profile_industries:
        return False
    i = industry.lower()
    return any(pi.lower() in i or i in pi.lower() for pi in profile_industries)


def _evidence_blob(candidate: dict) -> str:
    return " ".join(
        (e.get("evidence_text", "") + " " + e.get("claim", ""))
        for e in candidate.get("evidence", [])
    ).lower()


def compute_fit(candidate: dict, profile: dict) -> dict:
    """
    Returns {historical_similarity_score, similar_previous_winners, reasoning}.
    Score and winners are computed deterministically; reasoning is a
    template built only from those same computed facts (no LLM invention).
    """
    reasons = []
    score = 0.0

    role_match = _role_overlap(candidate.get("designation", ""), profile.get("preferred_roles", []))
    if role_match:
        score += 0.4
        reasons.append(f"holds a role ({candidate.get('designation')}) consistent with past winners' seniority")

    industry_match = _industry_overlap(candidate.get("industry", "") or candidate.get("organization", ""), profile.get("industries", []))
    if industry_match:
        score += 0.3
        reasons.append("comes from an industry represented among past winners")

    blob = _evidence_blob(candidate)
    signals = profile.get("historical_signals", [])
    signal_hits = [s for s in signals if s in blob]
    if signal_hits:
        score += min(0.3, 0.1 * len(signal_hits))
        reasons.append(f"evidence reflects recognised patterns for this category ({', '.join(signal_hits[:3])})")

    score = round(min(1.0, score), 2)

    history = get_history(profile.get("category", ""))
    # Prefer historical winners that actually share a signal with this candidate;
    # fall back to the most recent ones if nothing lines up closely.
    matching = [w for w in history if _role_overlap(candidate.get("designation", ""), [w.designation]) or _industry_overlap(candidate.get("industry", ""), [w.industry])]
    similar = matching or history
    similar_previous_winners = [f"{w.winner_name} ({w.year})" for w in similar[:3]]

    if not history:
        reasoning = "No verified historical winners exist for this category yet, so historical fit could not be assessed against precedent."
    elif reasons:
        reasoning = f"{candidate.get('name', 'This candidate')} " + "; ".join(reasons) + "."
    else:
        reasoning = f"{candidate.get('name', 'This candidate')} does not closely match the role, industry, or achievement patterns seen in this category's past winners."

    return {
        "historical_similarity_score": score,
        "similar_previous_winners": similar_previous_winners,
        "reasoning": reasoning,
    }
