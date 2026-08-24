"""
nominee_service.py
──────────────────
Award metadata helpers used at award-creation time.

Nominee discovery itself lives in research_engine.py + dossier_builder.py,
wired via routes/routes_ai_search.py.
"""

import logging

from bson import ObjectId

from services.ai_service import extract_award_metrics

logger = logging.getLogger(__name__)


async def extract_and_store_metrics(
    db, award_id: str, award_title: str, award_description: str
) -> list[str]:
    if not award_description.strip():
        return []
    try:
        metrics = await extract_award_metrics(award_title, award_description)
        await db.awards.update_one(
            {"_id": ObjectId(award_id)},
            {"$set": {"ai_metrics": metrics}},
        )
        return metrics
    except Exception as exc:
        logger.warning("Failed to extract metrics: %s", exc)
        return []
