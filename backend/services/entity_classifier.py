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

logger = logging.getLogger(__name__)

MODEL = "llama-3.3-70b-versatile"

_PERSON_SIGNALS = [
    "ceo", "founder", "leader", "entrepreneur", "executive", "cxo",
    "individual", "personality", "manager", "director", "chairman",
    "chairperson", "managing director", "person", "professional",
    "business leader", "industrialist", "billionaire",
]

_COMPANY_SIGNALS = [
    "startup", "firm", "enterprise", "brand", "organisation", "organization",
    "corporation", "business", "company", "venture", "unicorn",
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
    Falls back to keyword heuristic if Groq fails.
    """
    client = groq_client or _groq_client()

    prompt = f"""You are classifying what type of entity an award is for.

Award Name: {award_name}
Award Description: {award_description}

Person signals: CEO, founder, leader, entrepreneur, executive, CXO, individual, personality
Company signals: startup, firm, enterprise, brand, organisation, corporation, business

Reply with EXACTLY one word — no punctuation, no explanation:
- "person"  if the award is for individual people
- "company" if the award is for organisations or businesses
- "both"    if it could be either, or the description mixes both types

Your answer (one word only):"""

    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=5,
        )
        answer = resp.choices[0].message.content.strip().lower()
        # Strip any punctuation
        answer = re.sub(r"[^a-z]", "", answer)
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
