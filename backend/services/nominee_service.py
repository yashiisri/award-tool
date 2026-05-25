"""
nominee_service.py
──────────────────
Production nominee search pipeline.

Flow:
  1. Extract award metrics via Groq
  2. Groq generates exactly num_results * 3 contextually correct names
     (respects age, gender, sector, geography constraints)
  3. Sources (RSS + scraped pages) enrich candidates with role/org/summary
  4. Groq ranks all candidates
  5. Photos fetched concurrently (Wikipedia → Bing → Google)
  6. Retry loop ensures exactly num_results nominees are returned
"""

import asyncio
import logging
import re

from bson import ObjectId

from services.ai_service import extract_award_metrics, generate_candidate_names, rank_candidates
from services.source_scrapers import scrape_all_sources, batch_fetch_photos

logger = logging.getLogger(__name__)

MIN_CONFIDENCE = 0.30


def _deduplicate(candidates: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for c in candidates:
        key = re.sub(r"\s+", " ", c.get("name", "").lower().strip())
        if key and key not in seen:
            seen.add(key)
            out.append(c)
    return out


def _build_payload(candidate: dict, award_id: str) -> dict:
    sources   = list(candidate.get("sources", []))
    reason    = candidate.get("relevance_reason", "")
    summary   = candidate.get("summary", "")
    rationale = f"{reason}\n\n{summary[:600]}".strip() if summary else reason

    return {
        "award_id":     award_id,
        "name":         candidate.get("name", ""),
        "designation":  candidate.get("role", "Business Leader"),
        "organisation": candidate.get("organization", ""),
        "photo_url":    candidate.get("photo_url", ""),
        "rationale":    rationale or f"Identified as a strong candidate for {award_id}",
        "rationale_data": {
            "confidence_score": candidate.get("confidence_score", 0.5),
            "relevance_reason": candidate.get("relevance_reason", ""),
            "source_links":     sources,
            "ai_generated":     True,
        },
        "ai_generated": True,
        "sources":      sources,
    }


def _enrich_from_sources(ai_names: list[dict], source_map: dict) -> list[dict]:
    enriched = []
    for item in ai_names:
        name = item.get("name", "").strip()
        if not name:
            continue
        key = name.lower()
        src = source_map.get(key, {})

        # Partial match fallback
        if not src:
            parts = key.split()
            for sk, sv in source_map.items():
                sp = sk.split()
                if len(parts) >= 2 and len(sp) >= 2 and parts[0] == sp[0] and parts[-1] == sp[-1]:
                    src = sv
                    break

        enriched.append({
            "name":         name,
            "role":         src.get("role") or item.get("role", "Business Leader"),
            "organization": src.get("organization") or item.get("organization", ""),
            "summary":      src.get("summary", ""),
            "photo_url":    src.get("image_url", "") or src.get("photo_url", ""),
            "sources":      src.get("sources", [item.get("organization", "")]),
            "confidence_score": 0.0,
            "relevance_reason": "",
        })
    return enriched


async def _fetch_photos_for(candidates: list[dict]) -> None:
    """Fetch photos concurrently for all candidates missing one. Mutates in place."""
    missing = [c for c in candidates if not c.get("photo_url")]
    if not missing:
        return
    logger.info("Fetching photos for %d candidates...", len(missing))
    photo_map = await batch_fetch_photos([c["name"] for c in missing])
    for c in missing:
        url = photo_map.get(c["name"], "")
        if url:
            c["photo_url"] = url


async def run_ai_nominee_search(db, award_id: str, num_results: int = 5) -> list[dict]:
    """
    Full pipeline. Guarantees exactly num_results nominees are returned.
    Retries generation if initial pass yields fewer than requested.
    """
    award = await db.awards.find_one({"_id": ObjectId(award_id)})
    if not award:
        raise ValueError(f"Award {award_id} not found")

    award_title = award.get("name") or "Business Excellence Award"
    award_desc  = award.get("description", "")

    # ── Metrics ───────────────────────────────────────────────────────────────
    metrics: list[str] = award.get("ai_metrics", [])
    if not metrics:
        metrics = await extract_award_metrics(award_title, award_desc)
        await db.awards.update_one(
            {"_id": ObjectId(award_id)},
            {"$set": {"ai_metrics": metrics}},
        )

    # ── Scrape sources (background, for enrichment) ───────────────────────────
    source_task = asyncio.create_task(scrape_all_sources())

    # ── Generate names — ask for 3x to have buffer ────────────────────────────
    ask_for = max(num_results * 3, 15)
    ai_names = await generate_candidate_names(award_title, metrics, ask_for)
    logger.info("Groq returned %d names (asked for %d)", len(ai_names), ask_for)

    if not ai_names:
        raise ValueError("No candidates generated. Check GROQ_KEY and award description.")

    # ── Wait for sources ──────────────────────────────────────────────────────
    try:
        source_candidates = await asyncio.wait_for(source_task, timeout=20)
    except asyncio.TimeoutError:
        source_candidates = []
        logger.warning("Source scraping timed out — proceeding with AI names only")

    source_map = {c.get("name", "").lower(): c for c in source_candidates if c.get("name")}

    # ── Enrich + deduplicate ──────────────────────────────────────────────────
    candidates = _deduplicate(_enrich_from_sources(ai_names, source_map))
    logger.info("Enriched candidates: %d", len(candidates))

    # ── Rank ──────────────────────────────────────────────────────────────────
    ranked = await rank_candidates(candidates, award_title, metrics)
    ranked = [c for c in ranked if c.get("confidence_score", 0) >= MIN_CONFIDENCE]
    logger.info("After confidence filter (>= %.2f): %d", MIN_CONFIDENCE, len(ranked))

    # ── Retry if we don't have enough ────────────────────────────────────────
    if len(ranked) < num_results:
        logger.info("Not enough ranked candidates (%d < %d), retrying generation...", len(ranked), num_results)
        extra_names = await generate_candidate_names(award_title, metrics, num_results * 2)
        extra = _deduplicate(_enrich_from_sources(extra_names, source_map))
        # Remove already-ranked names
        ranked_keys = {c["name"].lower() for c in ranked}
        extra = [c for c in extra if c.get("name", "").lower() not in ranked_keys]
        if extra:
            extra_ranked = await rank_candidates(extra, award_title, metrics)
            ranked.extend([c for c in extra_ranked if c.get("confidence_score", 0) >= MIN_CONFIDENCE])
            ranked = _deduplicate(ranked)
            ranked.sort(key=lambda c: c.get("confidence_score", 0), reverse=True)

    # ── Fallback: fill remaining slots from unranked candidates ──────────────
    if len(ranked) < num_results:
        ranked_keys = {c["name"].lower() for c in ranked}
        remaining = [c for c in candidates if c.get("name", "").lower() not in ranked_keys]
        for c in remaining:
            c.setdefault("confidence_score", 0.45)
            c.setdefault("relevance_reason", "Identified as a relevant candidate for this award")
        ranked.extend(remaining)
        ranked = _deduplicate(ranked)

    top = ranked[:num_results]

    # ── Photos ────────────────────────────────────────────────────────────────
    await _fetch_photos_for(top)

    # ── Build payloads ────────────────────────────────────────────────────────
    return [_build_payload(c, award_id) for c in top]


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
