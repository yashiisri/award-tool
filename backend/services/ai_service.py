"""
ai_service.py
─────────────
Groq Llama-3.3-70b-versatile wrapper — award metadata extraction only.

Nominee discovery lives in research_engine.py (search-first, grounded).
This module is for summarizing text the admin already wrote (the award
description), not for inventing nominee facts, so pure-LLM use is fine here.
"""

import json
import logging
import re
from typing import Any

from groq import AsyncGroq
from config import settings
from services.groq_fallback import call_with_fallback

logger = logging.getLogger(__name__)


def _get_client() -> AsyncGroq:
    if not settings.GROQ_KEY:
        raise RuntimeError("GROQ_KEY is not set in environment variables.")
    return AsyncGroq(api_key=settings.GROQ_KEY)


def _extract_json(text: str) -> Any:
    """Pull the first JSON array or object out of an LLM response."""
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for s, e in [("[", "]"), ("{", "}")]:
        i, j = text.find(s), text.rfind(e)
        if i != -1 and j != -1 and j > i:
            try:
                return json.loads(text[i : j + 1])
            except json.JSONDecodeError:
                continue
    raise ValueError(f"No JSON found in LLM output:\n{text[:400]}")


async def extract_award_metrics(award_title: str, award_description: str) -> list[str]:
    """
    Extract 5-10 evaluation metric phrases from an award's description.
    e.g. ["revenue growth", "market influence", "CSR impact"]
    """
    client = _get_client()
    prompt = f"""You are an expert awards analyst.

Award Title: {award_title}
Award Description: {award_description}

Extract 5-10 concise evaluation metric phrases (2-5 words each) for assessing nominees.
Focus on measurable business/leadership qualities such as:
"revenue growth", "market influence", "innovation", "CSR impact",
"leadership excellence", "global expansion", "corporate governance".

Return ONLY a JSON array of strings. No explanation, no markdown fences.
Example: ["revenue growth", "market influence", "innovation"]"""

    resp = await call_with_fallback(
        client,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=512,
        extra_body={"reasoning_effort": "low"},
    )
    raw = resp.choices[0].message.content.strip()
    try:
        result = _extract_json(raw)
        if isinstance(result, list):
            return [str(m).strip() for m in result if m]
    except (ValueError, TypeError) as exc:
        logger.warning("extract_award_metrics parse failed: %s | raw=%s", exc, raw[:200])

    # Fallback: split on commas/newlines
    lines = [l.strip().strip('"-[], ') for l in re.split(r"[\n,]", raw) if l.strip()]
    return [l for l in lines if 2 <= len(l.split()) <= 6][:10] or [
        "leadership excellence", "innovation", "revenue growth", "market influence"
    ]
