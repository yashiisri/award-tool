"""
nominee_service.py
──────────────────
Orchestration layer for the AI nominee research engine.

Strategy (two tracks, merged):
  TRACK A – AI-direct (primary, reliable)
    Llama 3.3 generates real candidate names → Wikipedia validates each one

  TRACK B – Web-search (supplementary, best-effort)
    DuckDuckGo queries → extract names from results → Wikipedia validates

Both tracks feed into the same filter → rank → return pipeline.
If Track B fails entirely the pipeline still succeeds via Track A.
"""

import asyncio
import logging
import re

from bson import ObjectId

from services.ai_service import (
    extract_award_metrics,
    generate_candidate_names,
    generate_search_queries,
    rank_candidates,
)
from services.search_service import (
    duckduckgo_search,
    extract_candidate_names_from_results,
    enrich_candidates_with_wikipedia,
    HIGH_PROFILE_TITLE_KEYWORDS,
    EXCLUDE_KEYWORDS,
)
from services.wikipedia_service import fetch_summary

logger = logging.getLogger(__name__)

# ── Filtering constants ───────────────────────────────────────────────────────

# Candidate MUST match at least one of these in their Wikipedia text
MUST_HAVE_SIGNALS = [
    r"\bforbes\b",
    r"\bbillionaire\b",
    r"\bnet worth\b",
    r"\bchairman\b",
    r"\bchairperson\b",
    r"\bchief executive\b",
    r"\bceo\b",
    r"\bfounder\b",
    r"\bco-founder\b",
    r"\bmanaging director\b",
    r"\bindustrialist\b",
    r"\bfortune 500\b",
    r"\bfortune india\b",
    r"\bunicorn\b",
    r"\bconglomerate\b",
    r"\bpublicly listed\b",
    r"\bstock exchange\b",
    r"\bnse\b", r"\bbse\b", r"\bnasdaq\b", r"\bnyse\b",
    r"\bpadma\b",
]

# Candidate MUST also have at least one India signal
INDIA_SIGNALS = [
    r"\bindia\b",
    r"\bindian\b",
    r"\bmumbai\b",
    r"\bdelhi\b",
    r"\bbangalore\b",
    r"\bbengaluru\b",
    r"\bhyderabad\b",
    r"\bchennai\b",
    r"\bkolkata\b",
    r"\bnse\b",
    r"\bbse\b",
    r"\bsebi\b",
    r"\btata\b",
    r"\breliance\b",
    r"\binfosys\b",
    r"\bwipro\b",
    r"\badani\b",
    r"\bbajaj\b",
    r"\bmahindra\b",
    r"\bbiocon\b",
    r"\bairtel\b",
    r"\bhdfc\b",
    r"\bicici\b",
]

MIN_CONFIDENCE  = 0.45
MIN_WIKI_LEN    = 200


# ── Helpers ───────────────────────────────────────────────────────────────────

def _passes_filter(candidate: dict) -> bool:
    text = " ".join([
        candidate.get("wikipedia_summary", ""),
        candidate.get("description", ""),
        candidate.get("role", ""),
        candidate.get("organization", ""),
    ]).lower()

    # Must have at least one high-profile business signal
    if not any(re.search(p, text) for p in MUST_HAVE_SIGNALS):
        return False

    # Must have at least one India signal
    if not any(re.search(p, text) for p in INDIA_SIGNALS):
        logger.debug("Filtered out non-Indian candidate: %s", candidate.get("name", ""))
        return False

    # Must NOT be a small/local business
    if any(kw in text for kw in EXCLUDE_KEYWORDS):
        return False

    # Wikipedia summary must be substantial
    if len(candidate.get("wikipedia_summary", "")) < MIN_WIKI_LEN:
        return False

    return True


def _deduplicate(candidates: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out:  list[dict] = []
    for c in candidates:
        key = re.sub(r"\s+", " ", c.get("name", "").lower().strip())
        if key and key not in seen:
            seen.add(key)
            out.append(c)
    return out


def _build_payload(candidate: dict, award_id: str) -> dict:
    sources  = list(candidate.get("source_links", []))
    wiki_url = candidate.get("wikipedia_url", "")
    if wiki_url and wiki_url not in sources:
        sources.insert(0, wiki_url)

    reason = candidate.get("relevance_reason", "")
    wiki_s  = candidate.get("wikipedia_summary", "")
    rationale = f"{reason}\n\n{wiki_s[:600]}".strip() if wiki_s else reason

    return {
        "award_id":     award_id,
        "name":         candidate.get("name", ""),
        "designation":  candidate.get("role", "Business Leader"),
        "organisation": candidate.get("organization", ""),
        "photo_url":    candidate.get("photo_url", ""),
        "rationale":    rationale,
        "rationale_data": {
            "confidence_score": candidate.get("confidence_score", 0.0),
            "relevance_reason": candidate.get("relevance_reason", ""),
            "wikipedia_url":    wiki_url,
            "source_links":     sources,
            "ai_generated":     True,
        },
        "ai_generated": True,
        "sources":      sources,
    }


# ── Track A: AI-direct Wikipedia validation ───────────────────────────────────

async def _track_a(award_title: str, metrics: list[str], num_candidates: int) -> list[dict]:
    """
    Llama generates names → fetch each from Wikipedia → filter.
    This is the primary, reliable track.
    """
    ai_names = await generate_candidate_names(award_title, metrics, num_candidates * 2)
    if not ai_names:
        logger.warning("Track A: Llama returned no candidate names")
        return []

    logger.info("Track A: validating %d AI-generated names via Wikipedia", len(ai_names))

    # Fetch Wikipedia summaries for all names concurrently
    tasks   = [fetch_summary(item["name"]) for item in ai_names]
    summaries = await asyncio.gather(*tasks, return_exceptions=True)

    candidates = []
    for item, summary in zip(ai_names, summaries):
        if isinstance(summary, Exception) or summary is None:
            logger.debug("Track A: no Wikipedia page for '%s'", item["name"])
            continue

        extract     = summary.get("extract", "")
        description = summary.get("description", "")
        wiki_url    = summary.get("wiki_url", "")

        candidate = {
            "name":              summary["title"],   # canonical Wikipedia name
            "role":              item["role"],
            "organization":      item["organization"],
            "wikipedia_summary": extract[:800],
            "wikipedia_url":     wiki_url,
            "photo_url":         summary.get("thumbnail_url", ""),
            "description":       description,
            "source_links":      [wiki_url] if wiki_url else [],
            "confidence_score":  0.0,
            "relevance_reason":  "",
        }
        candidates.append(candidate)

    logger.info("Track A: %d candidates passed Wikipedia validation", len(candidates))
    return candidates


# ── Track B: Web-search supplementary ────────────────────────────────────────

async def _track_b(award_title: str, metrics: list[str]) -> list[dict]:
    """
    DuckDuckGo queries → extract names → Wikipedia enrichment.
    Best-effort; failures are silently swallowed.
    """
    try:
        queries = await generate_search_queries(award_title, metrics, num_queries=6)
        logger.info("Track B: running %d DuckDuckGo queries", len(queries))

        ddgo_results = await asyncio.gather(
            *[duckduckgo_search(q, max_results=8) for q in queries],
            return_exceptions=True,
        )

        combined = []
        for r in ddgo_results:
            if isinstance(r, list):
                combined.extend(r)

        names = extract_candidate_names_from_results(combined)
        # Deduplicate names
        seen: set[str] = set()
        unique = []
        for n in names:
            k = n.lower().strip()
            if k not in seen and len(n.split()) >= 2:
                seen.add(k)
                unique.append(n)

        logger.info("Track B: %d unique names extracted from web results", len(unique))

        if not unique:
            return []

        candidates = await enrich_candidates_with_wikipedia(unique[:30])
        logger.info("Track B: %d candidates enriched via Wikipedia", len(candidates))
        return candidates

    except Exception as exc:
        logger.warning("Track B failed (non-fatal): %s", exc)
        return []


# ── Main orchestration ────────────────────────────────────────────────────────

async def run_ai_nominee_search(
    db,
    award_id: str,
    num_results: int = 5,
) -> list[dict]:
    """
    Full pipeline:
      1. Fetch award + metrics
      2. Track A (AI-direct) + Track B (web search) in parallel
      3. Merge, deduplicate, filter
      4. Rank with Llama 3.3
      5. Return top-N payloads
    """
    # ── 1. Fetch award ────────────────────────────────────────────────────────
    award = await db.awards.find_one({"_id": ObjectId(award_id)})
    if not award:
        raise ValueError(f"Award {award_id} not found")

    award_title = award.get("name") or award.get("title") or "Business Excellence Award"
    award_desc  = award.get("description", "")

    # ── 2. Get or extract metrics ─────────────────────────────────────────────
    metrics: list[str] = award.get("ai_metrics", [])
    if not metrics:
        logger.info("Extracting metrics for award '%s'", award_title)
        metrics = await extract_award_metrics(award_title, award_desc)
        await db.awards.update_one(
            {"_id": ObjectId(award_id)},
            {"$set": {"ai_metrics": metrics}},
        )
        logger.info("Stored %d metrics: %s", len(metrics), metrics)

    # ── 3. Run both tracks in parallel ────────────────────────────────────────
    track_a_result, track_b_result = await asyncio.gather(
        _track_a(award_title, metrics, num_results),
        _track_b(award_title, metrics),
        return_exceptions=True,
    )

    all_candidates: list[dict] = []

    if isinstance(track_a_result, Exception):
        logger.error("Track A raised an exception: %s", track_a_result)
    elif track_a_result:
        all_candidates.extend(track_a_result)

    if isinstance(track_b_result, Exception):
        logger.warning("Track B raised an exception (non-fatal): %s", track_b_result)
    elif track_b_result:
        all_candidates.extend(track_b_result)

    logger.info("Combined pool before filtering: %d candidates", len(all_candidates))

    if not all_candidates:
        raise ValueError(
            "No candidates found. Ensure GROQ_KEY is valid and the award has a descriptive description."
        )

    # ── 4. Filter + deduplicate ───────────────────────────────────────────────
    filtered = _deduplicate([c for c in all_candidates if _passes_filter(c)])
    logger.info("After filter + dedup: %d candidates", len(filtered))

    if not filtered:
        # Relax the high-profile signal check but still enforce India + wiki length
        filtered = _deduplicate([
            c for c in all_candidates
            if len(c.get("wikipedia_summary", "")) >= MIN_WIKI_LEN
            and any(
                re.search(p, " ".join([
                    c.get("wikipedia_summary", ""),
                    c.get("description", ""),
                    c.get("organization", ""),
                ]).lower())
                for p in INDIA_SIGNALS
            )
        ])
        logger.info("Relaxed filter (India + wiki length only): %d candidates", len(filtered))

    if not filtered:
        raise ValueError(
            "No high-profile candidates found. Try adding more detail to the award description."
        )

    # ── 5. Rank with Llama 3.3 ────────────────────────────────────────────────
    ranked = await rank_candidates(filtered, award_title, metrics)
    ranked = [c for c in ranked if c.get("confidence_score", 0) >= MIN_CONFIDENCE]
    logger.info("After confidence filter (>= %.2f): %d candidates", MIN_CONFIDENCE, len(ranked))

    if not ranked:
        # Last resort: return top candidates by Wikipedia summary length
        ranked = sorted(filtered, key=lambda c: len(c.get("wikipedia_summary", "")), reverse=True)
        for c in ranked:
            c.setdefault("confidence_score", 0.5)
            c.setdefault("relevance_reason", "Recognised business leader")

    # ── 6. Build payloads ─────────────────────────────────────────────────────
    return [_build_payload(c, award_id) for c in ranked[:num_results]]


# ── Award creation helper ─────────────────────────────────────────────────────

async def extract_and_store_metrics(
    db, award_id: str, award_title: str, award_description: str
) -> list[str]:
    """Extract metrics from award description and persist to DB."""
    if not award_description.strip():
        return []
    try:
        metrics = await extract_award_metrics(award_title, award_description)
        await db.awards.update_one(
            {"_id": ObjectId(award_id)},
            {"$set": {"ai_metrics": metrics}},
        )
        logger.info("Stored %d metrics for award '%s'", len(metrics), award_title)
        return metrics
    except Exception as exc:
        logger.warning("Failed to extract metrics for '%s': %s", award_title, exc)
        return []
