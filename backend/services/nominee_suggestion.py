"""
nominee_suggestion.py
──────────────────────
Enriches a single jury/head-jury-suggested nominee in the background.

Unlike the award-wide AI search pipeline (research_engine.discover_all), this
never rejects the candidate — the person was named by a jury member, not
picked out of noisy open web search, so there's nothing to filter out. It only
tries to fill in a bio/photo/sources; if nothing turns up, the nominee simply
keeps the name + designation the jury supplied (the profile card only needs
those two fields anyway).
"""

import asyncio
import logging

import httpx
from bson import ObjectId

from database import get_database
from services.research_engine import (
    RawEnrichment, TIMEOUT, fetch_wikipedia, fetch_controversy_chunks, web_search,
)
from services.dossier_builder import build_dossiers

logger = logging.getLogger(__name__)


async def enrich_suggested_nominee(
    nominee_id: str,
    name: str,
    designation: str,
    organisation: str,
    award_name: str,
    award_description: str,
    evaluation_criteria: list[str] | None = None,
) -> None:
    db = get_database()
    try:
        base = " ".join(p for p in [name, designation, organisation] if p)
        # Several targeted queries, not one generic one — this is what actually
        # surfaces concrete numbers (revenue, growth, named initiatives) instead
        # of just a Wikipedia-style summary for the dossier writer to work with.
        queries = [
            base,
            f"{name} biography career",
            f"{name} revenue results financial performance",
            f"{name} achievements awards recognition",
        ]

        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            wiki = await fetch_wikipedia(name, client)
        chunks, controversy_chunks = await asyncio.gather(
            web_search(queries),
            fetch_controversy_chunks(name),
        )

        brief = RawEnrichment(name=name, entity_type="person")
        if wiki:
            brief.wiki_extract = wiki.get("extract", "")
            brief.wiki_desc = wiki.get("desc", "")
            brief.wiki_url = wiki.get("url", "")
            brief.photo_url = wiki.get("photo", "")
            if brief.wiki_url:
                brief.source_urls.append(brief.wiki_url)
        brief.ddg_text = " | ".join(f"{c['title']}: {c['content'][:250]}" for c in chunks[:8])
        brief.source_urls.extend(c["url"] for c in chunks[:8] if c.get("url"))
        if controversy_chunks:
            brief.controversy_text = " | ".join(
                f"{c['title']}: {c['content'][:200]}" for c in controversy_chunks[:5]
            )[:800]
            brief.source_urls.extend(c["url"] for c in controversy_chunks[:5] if c.get("url"))
        brief.has_data = bool(brief.wiki_extract or brief.ddg_text)

        if not brief.has_data:
            await db.nominees.update_one(
                {"_id": ObjectId(nominee_id)},
                {"$set": {"enrichment_status": "no_data_found"}},
            )
            return

        dossiers = await build_dossiers(
            enriched=[brief],
            award_name=award_name,
            award_description=award_description,
            evaluation_criteria=evaluation_criteria or [],
            entity_type="person",
            num_nominees=1,
        )
        if not dossiers:
            await db.nominees.update_one(
                {"_id": ObjectId(nominee_id)},
                {"$set": {"enrichment_status": "no_data_found"}},
            )
            return

        dossier = dossiers[0]
        await db.nominees.update_one(
            {"_id": ObjectId(nominee_id)},
            {"$set": {
                "photo_url": dossier.get("photo_url") or brief.photo_url or "",
                "rationale": dossier.get("bio", ""),
                "rationale_data": {
                    "confidence_score":    dossier.get("confidence_score", 0.5),
                    "relevance_reason":    dossier.get("relevance_reason", ""),
                    "source_links":        dossier.get("source_links") or brief.source_urls,
                    "about_nominee":       dossier.get("about_nominee", []),
                    "selection_rationale": dossier.get("selection_rationale", []),
                    "key_achievements":    dossier.get("key_achievements", []),
                    "financials":          dossier.get("financials", {}),
                    "awards_recognitions": dossier.get("awards_recognitions", []),
                    "points_of_concern":   dossier.get("points_of_concern", []),
                    "wikipedia_url":       brief.wiki_url,
                    "bio":                 dossier.get("bio", ""),
                },
                "enrichment_status": "done",
            }},
        )
    except Exception:
        logger.exception("Enrichment failed for suggested nominee %s (%s)", nominee_id, name)
        try:
            await db.nominees.update_one(
                {"_id": ObjectId(nominee_id)},
                {"$set": {"enrichment_status": "failed"}},
            )
        except Exception:
            pass
