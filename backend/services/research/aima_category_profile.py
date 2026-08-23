"""
aima_category_profile.py
───────────────────────────
Builds a category profile (spec §3) from AIMA's real historical winner data
— never hardcoded as universal truth. A category with a different real
history would produce a different profile.
"""

import re
from collections import Counter

from services.research.aima_history import HistoricalWinner, get_history, is_organization_category

SENIOR_ROLE_RE = re.compile(
    r"\b(chairman|chairperson|chief executive|ceo|managing director|founder|"
    r"co-founder)\b", re.IGNORECASE
)

ACHIEVEMENT_KEYWORDS_RE = re.compile(
    r"\b(led|founded|built|scaled|transformation|transformed|growth|grew|"
    r"expansion|expanded|leadership|innovation|innovated|impact|recognised|"
    r"recognized|diversified|manufacturing|digital)\b", re.IGNORECASE
)


def _dominant_entity_type(history: list[HistoricalWinner]) -> str:
    if not history:
        return "PERSON"  # default assumption for an unseen category; no data to say otherwise
    types = Counter(w.winner_type for w in history)
    person_count = types.get("PERSON", 0)
    org_count = types.get("ORGANIZATION", 0)
    if person_count and org_count:
        return "MIXED"
    return "ORGANIZATION" if org_count else "PERSON"


def _preferred_roles(history: list[HistoricalWinner]) -> list[str]:
    roles = Counter()
    for w in history:
        if not w.designation:
            continue
        # A combined designation like "CEO & Co-founder; COO & Co-founder"
        # covers multiple winners — split on common separators.
        for part in re.split(r"[;&]", w.designation):
            part = part.strip()
            if part:
                roles[part] += 1
    return [role for role, _ in roles.most_common(8)]


def _typical_seniority(history: list[HistoricalWinner]) -> str:
    if not history:
        return "unknown"
    senior_hits = sum(1 for w in history if SENIOR_ROLE_RE.search(w.designation or ""))
    return "senior" if senior_hits >= max(1, len(history) // 2) else "mixed"


def _historical_signals(history: list[HistoricalWinner]) -> list[str]:
    signal_counts = Counter()
    for w in history:
        for match in ACHIEVEMENT_KEYWORDS_RE.findall(w.achievement_summary or ""):
            signal_counts[match.lower()] += 1
    return [signal for signal, _ in signal_counts.most_common(8)]


def _industries(history: list[HistoricalWinner]) -> list[str]:
    industries = Counter(w.industry for w in history if w.industry)
    return [i for i, _ in industries.most_common(6)]


def build_profile(normalized_category: str) -> dict:
    """
    Build a category profile from real historical data. Degrades gracefully
    when a category has thin (or zero) verified history — it never invents
    winners to pad the profile, it just returns conservative defaults.
    """
    history = get_history(normalized_category)
    entity_type = "ORGANIZATION" if is_organization_category(normalized_category) else _dominant_entity_type(history)

    profile = {
        "category": normalized_category,
        "candidate_entity_type": entity_type,
        "historical_winner_count": len(history),
        "historical_years_analyzed": sorted({w.year for w in history}, reverse=True),
        "preferred_roles": _preferred_roles(history),
        "typical_seniority": _typical_seniority(history),
        "historical_signals": _historical_signals(history) or ["leadership", "impact", "growth"],
        "industries": _industries(history),
        "recent_achievement_weight": 0.25,
        "minimum_evidence_sources": 3 if _typical_seniority(history) == "senior" else 2,
    }
    return profile
