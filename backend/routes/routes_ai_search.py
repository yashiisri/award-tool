"""
routes_ai_search.py  —  Chunk 5
─────────────────────────────────
POST /admin/awards/{award_id}/ai-search
Runs the full pipeline: classify → generate → enrich → dossier → save to MongoDB.
No preview step — saves directly to nominees collection.
"""

import logging
import time
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from auth import get_current_user
from database import get_database

logger = logging.getLogger(__name__)
router = APIRouter()


class AISearchRequest(BaseModel):
    award_id: str
    award_name: str
    award_description: str
    num_nominees: int = 10
    evaluation_criteria: List[str] = []


class AISearchResponse(BaseModel):
    award_name: str
    entity_type_detected: str
    total_generated: int
    total_validated: int
    total_saved: int
    elapsed_seconds: float


@router.post("/awards/{award_id}/ai-search", response_model=AISearchResponse)
async def run_ai_search(
    award_id: str,
    req: AISearchRequest,
    user=Depends(get_current_user),
):
    """
    Full AI nominee search pipeline.
    1. Classify entity type (person / company / both)
    2. Generate num_nominees × 3 candidate names via Groq
    3. Enrich each candidate from Wikipedia + Forbes + Fortune + DDG + Crunchbase
    4. Build structured dossiers via Groq
    5. Save exactly num_nominees dossiers to nominees collection
    """
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db = get_database()

    # Verify award exists
    try:
        award_obj_id = ObjectId(award_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid award_id format")

    award = await db.awards.find_one({"_id": award_obj_id})
    if not award:
        raise HTTPException(status_code=404, detail=f"Award {award_id} not found")

    start_time = time.monotonic()
    logger.info(
        "[AISearch] Starting pipeline for award '%s' (id=%s, target=%d)",
        req.award_name, award_id, req.num_nominees,
    )

    # ── Step 1: Classify entity type ──────────────────────────────────────────
    from services.entity_classifier import classify_entity_type
    entity_type = await classify_entity_type(req.award_name, req.award_description)
    logger.info("[AISearch] Entity type: %s", entity_type)

    # Persist entity_type on the award document
    await db.awards.update_one(
        {"_id": award_obj_id},
        {"$set": {"entity_type": entity_type}},
    )

    # ── Step 2: Generate candidate names ──────────────────────────────────────
    from services.name_generator import generate_candidate_names
    candidates = await generate_candidate_names(
        award_name=req.award_name,
        award_description=req.award_description,
        num_nominees=req.num_nominees,
        evaluation_criteria=req.evaluation_criteria,
        entity_type=entity_type,
    )
    total_generated = len(candidates)
    logger.info("[AISearch] Generated %d candidate names", total_generated)

    if not candidates:
        raise HTTPException(
            status_code=422,
            detail="Could not generate any candidate names. Check award description.",
        )

    # ── Step 3: Multi-source enrichment ───────────────────────────────────────
    from services.enrichment import enrich_all_candidates
    award_context = f"{req.award_name}: {req.award_description}"
    enriched = await enrich_all_candidates(candidates, award_context)
    total_validated = len(enriched)
    logger.info("[AISearch] Enriched: %d / %d passed validation", total_validated, total_generated)

    if not enriched:
        raise HTTPException(
            status_code=422,
            detail="No candidates could be validated. Try a different award description.",
        )

    # ── Step 4: Build dossiers ─────────────────────────────────────────────────
    from services.dossier_builder import build_dossiers
    dossiers = await build_dossiers(
        enriched=enriched,
        award_name=req.award_name,
        award_description=req.award_description,
        evaluation_criteria=req.evaluation_criteria,
        entity_type=entity_type,
        num_nominees=req.num_nominees,
    )
    logger.info("[AISearch] Dossiers built: %d", len(dossiers))

    if not dossiers:
        raise HTTPException(
            status_code=422,
            detail="Dossier assembly failed. Please try again.",
        )

    # ── Step 5: Save to nominees collection ───────────────────────────────────
    # Delete existing AI-generated nominees for this award first (fresh search)
    delete_result = await db.nominees.delete_many({
        "award_id":    award_id,
        "ai_generated": True,
    })
    if delete_result.deleted_count:
        logger.info("[AISearch] Cleared %d old AI nominees", delete_result.deleted_count)

    saved_count = 0
    # Enforce exact count — save only up to num_nominees
    for dossier in dossiers[:req.num_nominees]:
        nominee_doc = {
            # Core fields matching existing nominees schema
            "award_id":    award_id,
            "name":        dossier.get("name", ""),
            "designation": dossier.get("designation", ""),
            "organisation":dossier.get("organisation", ""),
            "photo_url":   dossier.get("photo_url", ""),
            "rationale":   dossier.get("bio", ""),
            "rationale_data": {
                "confidence_score":    dossier.get("confidence_score", 0.5),
                "relevance_reason":    dossier.get("relevance_reason", ""),
                "source_links":        dossier.get("source_links", []),
                "about_nominee":       dossier.get("about_nominee", []),
                "selection_rationale": dossier.get("selection_rationale", []),
                "key_achievements":    dossier.get("key_achievements", []),
                "financials":          dossier.get("financials", {}),
                "awards_recognitions": dossier.get("awards_recognitions", []),
                "wikipedia_url":       dossier.get("wikipedia_url", ""),
                "bio":                 dossier.get("bio", ""),
                # Person-specific
                **({}),
                # Company-specific
                **({
                    "founding_year": dossier.get("founding_year", ""),
                    "founders":      dossier.get("founders", []),
                    "sector":        dossier.get("sector", ""),
                    "team_size":     dossier.get("team_size", ""),
                    "hq":            dossier.get("hq", ""),
                } if dossier.get("entity_type") == "company" else {}),
            },
            # Extra fields
            "entity_type":  dossier.get("entity_type", entity_type),
            "ai_generated": True,
            "validated_by": [],
            "red_flagged":  False,
            "total_score":  0,
            "voted_by":     [],
            "added_by":     user["sub"],
            "created_at":   datetime.utcnow(),
            # Company-only top-level fields
            "founding_year": dossier.get("founding_year", "") if dossier.get("entity_type") == "company" else "",
            "founders":      dossier.get("founders", [])      if dossier.get("entity_type") == "company" else [],
            "sector":        dossier.get("sector", "")        if dossier.get("entity_type") == "company" else "",
            "team_size":     dossier.get("team_size", "")     if dossier.get("entity_type") == "company" else "",
            "hq":            dossier.get("hq", "")            if dossier.get("entity_type") == "company" else "",
        }

        try:
            await db.nominees.insert_one(nominee_doc)
            saved_count += 1
        except Exception as exc:
            logger.error("[AISearch] Failed to save nominee '%s': %s", dossier.get("name"), exc)

    elapsed = round(time.monotonic() - start_time, 1)
    logger.info(
        "[AISearch] Done: generated=%d validated=%d saved=%d elapsed=%.1fs",
        total_generated, total_validated, saved_count, elapsed,
    )

    # Audit log
    try:
        await db.audit_logs.insert_one({
            "user_id":   user["sub"],
            "user_role": user["role"],
            "action":    "ai_search_nominees_v2",
            "details": {
                "award_id":       award_id,
                "award_name":     req.award_name,
                "entity_type":    entity_type,
                "total_generated":total_generated,
                "total_validated":total_validated,
                "total_saved":    saved_count,
                "elapsed_seconds":elapsed,
            },
            "timestamp": datetime.utcnow(),
        })
    except Exception:
        pass  # audit log failure never blocks response

    return AISearchResponse(
        award_name=req.award_name,
        entity_type_detected=entity_type,
        total_generated=total_generated,
        total_validated=total_validated,
        total_saved=saved_count,
        elapsed_seconds=elapsed,
    )
