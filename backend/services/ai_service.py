"""
ai_service.py
─────────────
Groq LLM wrapper. Used ONLY for structuring an award's own text into research
criteria and writing an evidence-grounded rationale — never to originate a
candidate's identity (see services/research/ for the evidence-based pipeline).

Functions:
  extract_award_metrics()      – award description → evaluation metrics list
  extract_research_criteria()  – award text → structured research criteria
  expand_industry_terms()      – industry keyword → related terminology
  generate_grounded_rationale()– evidence snippets → one grounded rationale sentence
"""

import json
import logging
import re
from typing import Any

from groq import AsyncGroq
from config import settings

logger = logging.getLogger(__name__)

# Groq's model lineup changes over time — this was last verified against the
# account's available models via GET /openai/v1/models. If this starts 404ing,
# check that endpoint for a current large general-purpose chat model.
MODEL = "openai/gpt-oss-120b"


# ── Helpers ───────────────────────────────────────────────────────────────────

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


# ── Public API ────────────────────────────────────────────────────────────────

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

    resp = await client.chat.completions.create(
        model=MODEL,
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=512,
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


async def extract_research_criteria(award_title: str, award_description: str) -> dict:
    """
    Structure an award's free-text title/description into research criteria.

    This NEVER invents candidate identities — it only extracts constraints
    that are already present in the award's own text, used later to build
    search queries and score evidence. Falls back to a permissive default
    (no constraints beyond the raw title as a keyword) if the LLM call fails.
    """
    default = {
        "industry": "", "geography": "Global", "leadership_requirements": "",
        "company_size": "", "achievement_requirements": "", "time_period": "",
        "keywords": [award_title], "exclusions": [],
    }
    try:
        client = _get_client()
    except RuntimeError:
        return default

    prompt = f"""Extract structured research criteria from this award. Only use information
present in the text below — do not invent constraints that aren't stated or implied.

Award Title: {award_title}
Award Description: {award_description}

Return ONLY a JSON object with these exact keys:
{{
  "industry": "e.g. Technology, Healthcare, Finance (empty string if not specified)",
  "geography": "e.g. India, United States, Europe, Global (default 'Global' if not specified)",
  "leadership_requirements": "e.g. CEO, Founder, Chairperson (empty string if not specified)",
  "company_size": "e.g. large enterprise, startup, unicorn (empty string if not specified)",
  "achievement_requirements": "short phrase on what achievement qualifies (empty string if generic)",
  "time_period": "e.g. 'last 2 years', 'career' (empty string if not specified)",
  "keywords": ["3-6 short keyword phrases capturing the award's focus"],
  "exclusions": ["anything explicitly excluded, empty array if none"]
}}
No explanation, no markdown fences."""

    resp = await client.chat.completions.create(
        model=MODEL,
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=512,
    )
    raw = resp.choices[0].message.content.strip()
    try:
        result = _extract_json(raw)
        if isinstance(result, dict):
            merged = {**default, **{k: v for k, v in result.items() if k in default and v}}
            if not merged.get("keywords"):
                merged["keywords"] = [award_title]
            return merged
    except (ValueError, TypeError) as exc:
        logger.warning("extract_research_criteria parse failed: %s | raw=%s", exc, raw[:300])

    return default


async def expand_industry_terms(industry: str) -> list[str]:
    """
    Expand a single industry keyword into related terminology for broader
    query coverage (spec §13), e.g. "Technology" -> ["software", "IT", "AI", ...].
    Best-effort: falls back to just the original term on any failure.
    """
    if not industry:
        return []
    try:
        client = _get_client()
    except RuntimeError:
        return [industry]

    prompt = f"""List 5-8 closely related industry/sector terms for "{industry}" that could
appear in news coverage of business leaders in this space. Return ONLY a JSON array of
short strings, no explanation. Example for "Technology": ["software", "IT services", "AI",
"cloud computing", "cybersecurity", "SaaS", "digital transformation"]"""

    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            reasoning_effort="low",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=256,
        )
        raw = resp.choices[0].message.content.strip()
        result = _extract_json(raw)
        if isinstance(result, list):
            return [str(t).strip() for t in result if t][:8] or [industry]
    except Exception as exc:
        logger.warning("expand_industry_terms failed for '%s': %s", industry, exc)

    return [industry]


async def generate_grounded_rationale(
    candidate_name: str,
    designation: str,
    organization: str,
    evidence_texts: list[str],
) -> str:
    """
    Best-effort: write a one/two-sentence rationale grounded ONLY in the
    supplied evidence snippets. Never invents facts not present in the
    evidence. On any failure, callers fall back to a deterministic
    template built directly from the evidence (see ranking_service.py).
    """
    if not evidence_texts:
        return ""
    try:
        client = _get_client()
    except RuntimeError:
        return ""

    joined = "\n".join(f"- {t[:300]}" for t in evidence_texts[:5])
    prompt = f"""Using ONLY the evidence below, write one or two sentences explaining why
{candidate_name} ({designation} at {organization}) qualifies for this award. Do not add any
fact that is not supported by the evidence. If the evidence is too thin to explain fit,
say so plainly instead of inventing detail.

Evidence:
{joined}

Return ONLY the sentence(s), no preamble, no markdown."""

    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            reasoning_effort="low",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=200,
        )
        return resp.choices[0].message.content.strip().strip('"')
    except Exception as exc:
        logger.warning("generate_grounded_rationale failed for '%s': %s", candidate_name, exc)
        return ""
