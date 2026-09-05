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
    fetch_photo_via_tavily, fetch_photo_via_serpapi, fetch_recent_activity, fetch_financial_trend,
    _mentions_full_name, _disambiguate_mentions,
)
from services.google_search_source import fetch_photo_via_google
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
        #
        # Every query anchors to organisation (when known), not just this first one —
        # confirmed live that leaving the other three name-only let a common name
        # (e.g. "Sumit Kapoor") get swamped by unrelated same-named people (an airline
        # pilot, a doctor, a CFO elsewhere), so disambiguation had almost nothing real
        # left to keep. Anchoring every query to "KPMG India" instead of just one of
        # four surfaced his actual LinkedIn profile, several KPMG service pages with
        # his real title, and real work content — dramatically more real signal for
        # a person who isn't independently famous enough to dominate a bare-name search.
        org_anchor = f" {organisation}" if organisation else ""
        queries = [
            base,
            f"{name} biography career{org_anchor}",
            f"{name} revenue results financial performance{org_anchor}",
            f"{name} achievements awards recognition{org_anchor}",
        ]

        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            wiki = await fetch_wikipedia(name, client)
        chunks, controversy_chunks, activity_chunks, financial_chunks = await asyncio.gather(
            web_search(queries),
            fetch_controversy_chunks(name),
            fetch_recent_activity(name, "person"),
            fetch_financial_trend(name, "person"),
        )

        brief = RawEnrichment(name=name, entity_type="person")
        brief.known_designation = designation
        brief.known_organisation = organisation
        if wiki:
            brief.wiki_extract = wiki.get("extract", "")
            brief.wiki_desc = wiki.get("desc", "")
            brief.wiki_url = wiki.get("url", "")
            brief.photo_url = wiki.get("photo", "")
            if brief.wiki_url:
                brief.source_urls.append(brief.wiki_url)
        if not brief.photo_url:
            # No Wikipedia thumbnail — try Google image search, then Tavily's, then
            # SerpApi (real Google Images, but quota-limited to 250/month on the
            # free plan, so tried last) before the nominee card falls back to initials.
            context = f"{designation} {organisation}"
            brief.photo_url = (
                await fetch_photo_via_google(name, context)
                or await fetch_photo_via_tavily(name, context)
                or await fetch_photo_via_serpapi(name, context)
            )
        # Filter to chunks that actually mention this candidate's full name — chunks
        # were previously used unfiltered, meaning a name collision (a different real
        # person who happens to share this name) could contaminate the bio/source
        # list with zero check. For a candidate with no Wikipedia page (no other
        # identity signal), also cross-check consistency via Groq, using the
        # designation/organisation the jury member actually supplied as context —
        # stronger disambiguation than the bulk AI-search path has available.
        name_matched_chunks = [c for c in chunks if _mentions_full_name(name, c)]
        if not brief.wiki_extract and len(name_matched_chunks) >= 2:
            name_matched_chunks = await _disambiguate_mentions(
                name, name_matched_chunks, context=f"{designation} at {organisation}".strip(),
                organisation=organisation,
            )
        brief.ddg_text = " | ".join(f"{c['title']}: {c['content'][:350]}" for c in name_matched_chunks[:8])
        brief.source_urls.extend(c["url"] for c in name_matched_chunks[:8] if c.get("url"))
        controversy_chunks = [c for c in controversy_chunks if _mentions_full_name(name, c)]
        activity_chunks = [c for c in activity_chunks if _mentions_full_name(name, c)]
        financial_chunks = [c for c in financial_chunks if _mentions_full_name(name, c)]
        # Same disambiguation as controversy_chunks below — a same-full-name collision
        # (e.g. "Sumit Kapoor" the KPMG partner vs. an unrelated airline pilot who
        # died in a crash, both literally named "Sumit Kapoor") isn't caught by the
        # name filter alone, and confirmed live: it slipped through into "Recent
        # Activity" specifically because this field was missed the first time this
        # fix went in — only controversy_chunks had the disambiguation call wired up.
        if not brief.wiki_extract:
            person_context = f"{designation} at {organisation}".strip()
            if len(controversy_chunks) >= 2:
                controversy_chunks = await _disambiguate_mentions(
                    name, controversy_chunks, context=person_context, organisation=organisation
                )
            if len(activity_chunks) >= 2:
                activity_chunks = await _disambiguate_mentions(
                    name, activity_chunks, context=person_context, organisation=organisation
                )
            if len(financial_chunks) >= 2:
                financial_chunks = await _disambiguate_mentions(
                    name, financial_chunks, context=person_context, organisation=organisation
                )
        if controversy_chunks:
            # 16, not 8 — real signal can rank behind generic same-name "Biography"/
            # "Latest News" aggregator pages; confirmed live an 8-chunk cap fed the AI
            # nothing but noise while the real story sat at position 9. No extra API
            # cost, just uses more of what fetch_controversy_chunks already returns.
            brief.controversy_text = " | ".join(
                f"{c['title']}: {c['content'][:250]}" for c in controversy_chunks[:16]
            )[:3000]
            brief.source_urls.extend(c["url"] for c in controversy_chunks[:16] if c.get("url"))
        if activity_chunks:
            brief.recent_activity_text = " | ".join(
                f"{c['title']}: {c['content'][:400]}" for c in activity_chunks[:8]
            )[:1400]
            brief.source_urls.extend(c["url"] for c in activity_chunks[:8] if c.get("url"))
        if financial_chunks:
            brief.financial_trend_text = " | ".join(
                f"{c['title']}: {c['content'][:400]}" for c in financial_chunks[:8]
            )[:1400]
            brief.source_urls.extend(c["url"] for c in financial_chunks[:8] if c.get("url"))
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
                    "recent_activity":     dossier.get("recent_activity", []),
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
