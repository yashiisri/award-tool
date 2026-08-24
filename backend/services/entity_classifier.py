"""
entity_classifier.py  —  Chunk 1
─────────────────────────────────
Classifies whether an award is for persons, companies, or both.
Uses Groq Llama 3.3-70b-versatile with a tight deterministic prompt.
"""

import logging
import re

from groq import AsyncGroq
from config import settings
from services.aima_historical_seed import CATEGORY_PROFILE, match_category
from services.groq_fallback import call_with_fallback

logger = logging.getLogger(__name__)

_PERSON_SIGNALS = [
    "ceo", "founder", "leader", "entrepreneur", "executive", "cxo",
    "individual", "personality", "manager", "director", "chairman",
    "chairperson", "managing director", "person", "professional",
    "business leader", "industrialist", "billionaire",
    # Non-business person-award vocabulary — without these, an award like
    # "Outstanding Contribution to Media" scores zero on both signal lists and
    # falls through to the "both" tie-break default, letting companies leak
    # into a person-only award.
    "journalist", "editor", "anchor", "author", "writer", "columnist",
    "broadcaster", "scientist", "researcher", "artist", "sportsperson",
    "athlete", "philanthropist", "academic", "professor",
]

_COMPANY_SIGNALS = [
    "startup", "firm", "enterprise", "brand", "organisation", "organization",
    "corporation", "business", "company", "venture", "unicorn",
    "psu", "public sector", "undertaking", "mnc", "multinational", "pse",
]


def _groq_client() -> AsyncGroq:
    key = settings.GROQ_KEY
    if not key:
        import os
        key = os.environ.get("GROQ_KEY", "")
    if not key:
        raise RuntimeError("GROQ_KEY not configured.")
    return AsyncGroq(api_key=key)


async def classify_entity_type(
    award_name: str,
    award_description: str,
    groq_client: AsyncGroq | None = None,
) -> str:
    """
    Returns "person", "company", or "both".

    Checks the curated AIMA category profiles first — real historical data
    already states unambiguously whether e.g. "Outstanding Contribution to
    Media" is a person award, and that's strictly more reliable than an LLM
    call that can waffle into "both" on an award whose description doesn't
    happen to contain an obvious business-entity keyword (a media award
    talking about "journalists and editors" has no company-ish words in it,
    but is just as unambiguously person-only as any business award). Only
    awards that don't match a known category fall through to the LLM, with
    the keyword heuristic as its own fallback if that call fails.
    """
    matched_category = match_category(award_name, award_description)
    if matched_category:
        profile_entity_type = CATEGORY_PROFILE.get(matched_category, {}).get("entity_type")
        if profile_entity_type:
            logger.info(
                "Entity type from curated category '%s': %s", matched_category, profile_entity_type,
            )
            return profile_entity_type

    client = groq_client or _groq_client()

    prompt = f"""You are classifying what type of entity an award is for.

Award Name: {award_name}
Award Description: {award_description}

Person signals: CEO, founder, leader, entrepreneur, executive, CXO, individual, personality
Company signals: startup, firm, enterprise, brand, organisation, corporation, business, PSU, public sector undertaking, MNC

Reply with EXACTLY one word — no punctuation, no explanation:
- "person"  if the award is for individual people
- "company" if the award is for organisations or businesses
- "both"    if it could be either, or the description mixes both types

Your answer (one word only):"""

    try:
        resp = await call_with_fallback(
            client,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=20,
            extra_body={"reasoning_effort": "low"},
        )
        answer = resp.choices[0].message.content or ""
        # Strip qwen thinking blocks and punctuation
        answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
        answer = re.sub(r"[^a-z]", "", answer.lower())
        if answer in ("person", "company", "both"):
            logger.info("Entity type classified: %s", answer)
            return answer
    except Exception as exc:
        logger.warning("classify_entity_type LLM failed: %s — using heuristic", exc)

    # Keyword heuristic fallback
    combined = f"{award_name} {award_description}".lower()
    person_score  = sum(1 for s in _PERSON_SIGNALS  if s in combined)
    company_score = sum(1 for s in _COMPANY_SIGNALS if s in combined)

    if person_score > company_score:
        return "person"
    if company_score > person_score:
        return "company"
    return "both"
