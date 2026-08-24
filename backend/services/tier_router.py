"""
tier_router.py
────────────────
Classifies an AIMA award into a quality tier + pulls the seniority/scale
constraints and calibration examples that discovery and dossier-writing
should target. Built on top of aima_historical_seed.CATEGORY_PROFILE so the
tier definitions and the historical calibration data live in exactly one
place, not two.

Tiers:
  "1"       — National icons (Business Leader of the Year, Lifetime
              Contribution, JRD Tata Corporate Leadership)
  "2"       — Senior business leaders (Transformational/Emerging Business
              Leader, Institution Builder, Corporate Citizen, MNC in India)
  "3"       — Founders/entrepreneurs (Entrepreneur of the Year, Young
              Entrepreneur — carries an age_constraint)
  "company" — PSU / startup / company-of-the-year style awards
"""

from __future__ import annotations

from dataclasses import dataclass, field

from services.aima_historical_seed import AIMA_WINNERS_BY_CATEGORY, CATEGORY_PROFILE, match_category

_TIER1_KEYWORDS = ["lifetime", "business leader of the year", "jrd tata", "corporate leadership"]
_TIER2_KEYWORDS = ["transformational", "emerging", "institution builder", "corporate citizen", "mnc"]
_TIER3_KEYWORDS = ["entrepreneur", "young", "startup", "founder"]

_TIER_LABELS = {
    "1": "national business icons (Chairman/MD/Founder of a large Indian conglomerate)",
    "2": "senior business executives (CEO/MD/Chairman of a well-known listed company)",
    "3": "startup founders and entrepreneurs",
    "company": "companies",
}


@dataclass
class TierInfo:
    tier: str                                  # "1" | "2" | "3" | "company"
    entity_type: str                           # "person" | "company"
    matched_category: str | None = None
    seniority: list[str] = field(default_factory=list)
    org_scale: str = ""
    examples: list[str] = field(default_factory=list)
    exclude: list[str] = field(default_factory=list)
    age_constraint: str = ""
    seed_winners: list[dict] = field(default_factory=list)  # raw rows from AIMA_WINNERS_BY_CATEGORY

    @property
    def label(self) -> str:
        return _TIER_LABELS.get(self.tier, "candidates")


def _keyword_score(text: str, keywords: list[str]) -> int:
    return sum(1 for kw in keywords if kw in text)


def classify(award_name: str, award_description: str, entity_type: str) -> TierInfo:
    """entity_type is the caller's already-decided "person"/"company" (from
    entity_classifier.py or a discover_all() split) — this function does not
    re-decide it, only figures out which tier within that entity_type."""
    text = f"{award_name} {award_description}".lower()
    matched_category = match_category(award_name, award_description)
    profile = CATEGORY_PROFILE.get(matched_category, {}) if matched_category else {}

    if entity_type == "company":
        tier = "company"
    else:
        scores = {
            "1": _keyword_score(text, _TIER1_KEYWORDS),
            "2": _keyword_score(text, _TIER2_KEYWORDS),
            "3": _keyword_score(text, _TIER3_KEYWORDS),
        }
        # Precedence 3 > 2 > 1 on ties. A qualifier word ("emerging", "young",
        # "startup") is a more specific signal than the generic tier-1 phrase
        # "business leader of the year" — which appears as a literal substring
        # inside qualified variants like "Emerging Business Leader of the Year",
        # and would otherwise win a tie just by being checked first.
        if scores["3"] > 0 and scores["3"] >= scores["2"] and scores["3"] >= scores["1"]:
            tier = "3"
        elif scores["2"] > 0 and scores["2"] >= scores["1"]:
            tier = "2"
        elif scores["1"] > 0:
            tier = "1"
        else:
            tier = "2"  # default: mid-seniority

    seed_winners = AIMA_WINNERS_BY_CATEGORY.get(matched_category, []) if matched_category else []

    return TierInfo(
        tier=tier,
        entity_type=entity_type,
        matched_category=matched_category,
        seniority=profile.get("seniority", []),
        org_scale=profile.get("org_scale", "") or profile.get("company_type", ""),
        examples=profile.get("examples", []),
        exclude=profile.get("not", []),
        age_constraint=profile.get("age_constraint", ""),
        seed_winners=seed_winners,
    )


# ── Hard filters (BUG 2) ───────────────────────────────────────────────────
# Checked at discovery time (build_briefs in research_engine.py), not just at
# dossier-ranking time — so a Groq ranking failure/partial-result can't let an
# ineligible candidate through.
KNOWN_PSU_LIST = [
    "NTPC", "ONGC", "IOC", "BHEL", "BEL", "HAL", "NALCO", "SAIL", "GAIL",
    "Coal India", "Power Grid", "NMDC", "MOIL", "HPCL", "BPCL", "IOCL",
    "NPCIL", "ISRO", "DRDO", "BSNL", "MTNL", "Air India", "Indian Railways",
    "FCI", "SIDBI", "NABARD", "NHB", "EXIM Bank", "NPCI", "IIFCL", "REC",
    "PFC", "HUDCO", "IRFC", "IREDA", "NBCC", "RITES", "IRCON", "BEML",
    "GRSE", "MDL", "BDL", "Ordnance Factories",
]


def get_hard_filters(entity_type: str, tier: str, award_name: str, award_description: str) -> dict:
    """
    Returns hard rejection rules for a given award.
    These are checked BEFORE dossier building, not just at ranking.
    """
    text = f"{award_name} {award_description}".lower()
    return {
        "require_psu": tier == "company" and ("psu" in text or "public sector" in text),
        "require_indian_founder": entity_type == "person",
        "max_age": 40 if tier == "3" and "young" in text else None,
        "require_listed_company": tier == "2",
        "reject_foreign_hq": entity_type == "company",
    }


def seed_names_for(tier_info: TierInfo) -> list[str]:
    """Real past AIMA winners for the matched category, filtered to this
    entity_type — used as guaranteed-quality seed candidates so the result
    never falls short purely because live search came up thin."""
    names = []
    for w in tier_info.seed_winners:
        is_org_row = w.get("role") == "Organisation"
        if tier_info.entity_type == "company" and is_org_row:
            names.append(w["name"])
        elif tier_info.entity_type == "person" and not is_org_row:
            names.append(w["name"])
    return names
