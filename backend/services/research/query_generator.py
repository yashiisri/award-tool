"""
query_generator.py
────────────────────
Award criteria -> research plan -> dynamic search queries.

Query generation is deterministic template expansion over the extracted
criteria (fast, free, no LLM latency per query) plus one LLM call to widen
the industry term into related terminology (spec §13). No query set is
hardcoded to a specific geography or industry — everything is derived from
the award's own text via ai_service.extract_research_criteria().
"""

import logging

from services.ai_service import extract_research_criteria, expand_industry_terms

logger = logging.getLogger(__name__)

ROLE_TERMS = ["CEO", "founder", "chairperson", "executive leader"]

PUBLICATION_TERMS = ["Forbes", "Fortune", "Bloomberg", "Reuters"]

GENERIC_TEMPLATES = [
    "{industry} leaders {geography}",
    "{industry} {role} {geography}",
    "top {industry} executives {geography}",
    "{industry} innovation leaders {geography}",
    "recent {industry} leadership achievements {geography}",
    "{industry} awards {geography} winners",
]


async def build_research_plan(award_title: str, award_description: str) -> dict:
    """Extract structured criteria for this award. Never invents candidates."""
    criteria = await extract_research_criteria(award_title, award_description)
    criteria["award_title"] = award_title
    return criteria


def _clean(term: str) -> str:
    return " ".join(term.split()).strip()


async def generate_discovery_queries(plan: dict, max_queries: int = 16) -> list[str]:
    """
    Build the stage-1 discovery query set from a research plan.
    Combines industry synonyms x geography x role/publication templates,
    deduplicated, capped at max_queries.
    """
    geography = plan.get("geography") or "Global"
    industry = plan.get("industry") or ""
    leadership = plan.get("leadership_requirements") or ""
    keywords = plan.get("keywords") or [plan.get("award_title", "")]

    industry_terms = [industry] if industry else []
    if industry:
        expanded = await expand_industry_terms(industry)
        for t in expanded:
            if t.lower() not in [x.lower() for x in industry_terms]:
                industry_terms.append(t)
    if not industry_terms:
        industry_terms = keywords[:3] or ["business"]

    queries: list[str] = []
    seen: set[str] = set()

    def add(q: str):
        q = _clean(q)
        key = q.lower()
        if q and key not in seen:
            seen.add(key)
            queries.append(q)

    geo_suffix = "" if geography.lower() == "global" else geography

    for industry_term in industry_terms:
        for template in GENERIC_TEMPLATES:
            role = leadership or ROLE_TERMS[0]
            add(template.format(industry=industry_term, geography=geo_suffix, role=role).strip())
            if len(queries) >= max_queries:
                return queries[:max_queries]

    for industry_term in industry_terms[:2]:
        for pub in PUBLICATION_TERMS:
            add(f"{industry_term} leaders {geo_suffix} {pub}".strip())
            if len(queries) >= max_queries:
                return queries[:max_queries]

    for kw in keywords:
        add(f"{kw} {geo_suffix}".strip())
        if len(queries) >= max_queries:
            break

    return queries[:max_queries]


def generate_candidate_queries(name: str, organization: str, award_title: str) -> list[str]:
    """Stage-2 targeted, per-candidate evidence queries (spec §6)."""
    queries = [f'"{name}" {organization}'.strip()] if organization else []
    queries += [
        f'"{name}" CEO',
        f'"{name}" leadership',
        f'"{name}" achievements',
        f'"{name}" award',
        f'"{name}" Forbes',
        f'"{name}" Reuters',
        f'"{name}" Bloomberg',
    ]
    seen: set[str] = set()
    out = []
    for q in queries:
        key = q.lower()
        if key not in seen:
            seen.add(key)
            out.append(q)
    return out
