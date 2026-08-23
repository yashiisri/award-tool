"""
nominee_service.py
──────────────────
Entry point for the AI nominee research pipeline. Delegates to
services/research/research_orchestrator.py, which discovers candidates from
real search evidence rather than LLM invention (see
AI_NOMINEE_SEARCH_ARCHITECTURE.md for the full pipeline design).
"""

import logging

from bson import ObjectId

from services.research.research_orchestrator import run_research

logger = logging.getLogger(__name__)


async def run_ai_nominee_search(db, award_id: str, num_results: int = 5) -> dict:
    """
    Returns {"candidates": [...], "research_metadata": {...}}.

    Unlike the previous implementation, this does NOT force exactly
    num_results candidates — it returns however many genuinely pass
    evidence-based verification (up to num_results), so the admin never sees
    a fabricated candidate just to fill a quota.
    """
    award = await db.awards.find_one({"_id": ObjectId(award_id)})
    if not award:
        raise ValueError(f"Award {award_id} not found")

    return await run_research(db, award, award_id, num_results)


async def extract_and_store_metrics(
    db, award_id: str, award_title: str, award_description: str
) -> list[str]:
    """Kept for the existing /awards/{id}/metrics endpoint — extracts free-text
    evaluation metric phrases (distinct from the structured research criteria
    used internally by the research pipeline)."""
    if not award_description.strip():
        return []
    try:
        from services.ai_service import extract_award_metrics
        metrics = await extract_award_metrics(award_title, award_description)
        await db.awards.update_one(
            {"_id": ObjectId(award_id)},
            {"$set": {"ai_metrics": metrics}},
        )
        return metrics
    except Exception as exc:
        logger.warning("Failed to extract metrics: %s", exc)
        return []
