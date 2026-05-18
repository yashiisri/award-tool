"""
ai_service.py
─────────────
Groq Llama-3.3-70b-versatile wrapper.

Functions:
  extract_award_metrics()    – award description  → evaluation metrics list
  generate_candidate_names() – award + metrics    → real high-profile names (PRIMARY source)
  generate_search_queries()  – award + metrics    → DuckDuckGo query strings (supplementary)
  rank_candidates()          – candidates + metrics → scored & sorted list
"""

import json
import logging
import re
from typing import Any

from groq import AsyncGroq
from config import settings

logger = logging.getLogger(__name__)

MODEL = "llama-3.3-70b-versatile"


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


async def generate_candidate_names(
    award_title: str,
    metrics: list[str],
    num_candidates: int = 20,
) -> list[dict]:
    """
    PRIMARY candidate source.

    Ask Llama 3.3 to produce a list of real, verifiable high-profile INDIAN
    business leaders who are strong fits for this award. Each entry includes
    the person's name, role, and organisation so Wikipedia can validate them.

    Returns list of dicts: [{name, role, organization}, ...]
    """
    client = _get_client()
    metrics_str = ", ".join(metrics)

    prompt = f"""You are a senior research analyst compiling nominees for the award:
"{award_title}"

Evaluation metrics: {metrics_str}

List {num_candidates} REAL, verifiable, high-profile INDIAN business leaders who are \
strong candidates for this award.

MANDATORY — every person MUST:
- Be Indian (born in India or leading an Indian company / Indian-origin globally recognised)
- Have a Wikipedia page (they must be nationally or internationally recognised)
- Be a billionaire, or CEO/Chairperson/Founder/MD of a major Indian publicly listed company
- Lead companies with significant revenue, market cap, or global presence
- Be an industrialist, conglomerate head, or unicorn founder based in India

Good examples of the calibre required:
Mukesh Ambani, Ratan Tata, N. Chandrasekaran, Kiran Mazumdar-Shaw, Sajjan Jindal,
Gautam Adani, Azim Premji, Uday Kotak, Deepinder Goyal, Falguni Nayar,
Kumar Mangalam Birla, Anand Mahindra, Sunil Bharti Mittal, Shiv Nadar

STRICT EXCLUSIONS — do NOT include:
- Non-Indian business leaders
- Small or local Indian business owners
- Unknown entrepreneurs without public recognition
- Anyone without a verifiable Wikipedia page
- Fictional or uncertain names

For each person return their EXACT real name as it appears on Wikipedia.

Return ONLY a JSON array. No explanation, no markdown fences.
Format:
[
  {{"name": "Full Name", "role": "CEO / Chairman / Founder / etc.", "organization": "Company Name"}},
  ...
]"""

    resp = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2048,
    )
    raw = resp.choices[0].message.content.strip()
    try:
        result = _extract_json(raw)
        if isinstance(result, list):
            cleaned = []
            for item in result:
                if not isinstance(item, dict):
                    continue
                name = str(item.get("name", "")).strip()
                role = str(item.get("role", "Business Leader")).strip()
                org  = str(item.get("organization", "")).strip()
                if name and len(name.split()) >= 2:
                    cleaned.append({"name": name, "role": role, "organization": org})
            logger.info("generate_candidate_names → %d names from Llama", len(cleaned))
            return cleaned
    except (ValueError, TypeError) as exc:
        logger.warning("generate_candidate_names parse failed: %s | raw=%s", exc, raw[:300])

    return []


async def generate_search_queries(
    award_title: str,
    metrics: list[str],
    num_queries: int = 6,
) -> list[str]:
    """
    SUPPLEMENTARY source.
    Generate DuckDuckGo search queries to discover additional candidates
    beyond what Llama already knows.
    """
    client = _get_client()
    metrics_str = ", ".join(metrics)

    prompt = f"""Generate {num_queries} web search queries to find high-profile INDIAN \
business leaders for the award "{award_title}" (metrics: {metrics_str}).

Every query MUST be India-specific. Target:
- Forbes India billionaires and industrialists
- CEOs / Chairpersons of NSE/BSE-listed major Indian companies
- Founders of Indian unicorn startups
- India-based conglomerate heads and corporate leaders
- Recipients of Padma Bhushan / Padma Vibhushan for business

Return ONLY a JSON array of query strings. No explanation, no markdown.
Example: ["Forbes India billionaires 2024 CEO", "top Indian chairpersons conglomerate NSE listed"]"""

    resp = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=512,
    )
    raw = resp.choices[0].message.content.strip()
    try:
        result = _extract_json(raw)
        if isinstance(result, list):
            return [str(q).strip() for q in result if q][:num_queries]
    except (ValueError, TypeError) as exc:
        logger.warning("generate_search_queries parse failed: %s | raw=%s", exc, raw[:200])

    return [
        f"Forbes India billionaires {award_title} 2024",
        f"top Indian CEOs {metrics[0] if metrics else 'leadership'} NSE BSE listed",
        "India conglomerate chairman industrialist Forbes list",
        "Indian unicorn founders billionaires Padma award business",
        "top Indian business leaders Economic Times Forbes 2024",
        "India CEO chairman major company publicly listed",
    ]


async def rank_candidates(
    candidates: list[dict],
    award_title: str,
    metrics: list[str],
) -> list[dict]:
    """
    Score and rank candidates against the award metrics using Llama 3.3.

    Populates confidence_score (0.0-1.0) and relevance_reason on each dict.
    Returns the list sorted descending by confidence_score.
    """
    if not candidates:
        return []

    client = _get_client()
    metrics_str = ", ".join(metrics)

    candidate_list = [
        {
            "index":        i,
            "name":         c.get("name", ""),
            "role":         c.get("role", ""),
            "organization": c.get("organization", ""),
            "summary":      (c.get("wikipedia_summary") or "")[:400],
        }
        for i, c in enumerate(candidates)
    ]

    prompt = f"""You are an expert awards jury analyst scoring INDIAN business leader nominees for:
"{award_title}"

Evaluation metrics: {metrics_str}

Candidates:
{json.dumps(candidate_list, indent=2)}

For EACH candidate assign:
1. confidence_score: float 0.0-1.0
   0.85-1.0  = exceptional (Indian billionaire, major conglomerate head, globally recognised Indian leader)
   0.65-0.84 = strong (CEO/Chairman of major NSE/BSE-listed Indian company, Indian unicorn founder)
   0.40-0.64 = moderate (recognised Indian industry leader, Padma award recipient for business)
   0.0       = non-Indian or unverifiable — assign 0.0 immediately, no exceptions
2. relevance_reason: one sentence explaining their fit to this award

CRITICAL RULE: This award is exclusively for Indian business leaders.
Score any non-Indian candidate 0.0 regardless of their global stature.

Return ONLY a JSON array. No explanation, no markdown fences.
Format:
[{{"index": 0, "confidence_score": 0.92, "relevance_reason": "..."}}, ...]"""

    resp = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=2048,
    )
    raw = resp.choices[0].message.content.strip()
    try:
        rankings = _extract_json(raw)
        if isinstance(rankings, list):
            score_map = {
                r["index"]: {
                    "confidence_score": float(r.get("confidence_score", 0.5)),
                    "relevance_reason": str(r.get("relevance_reason", "")),
                }
                for r in rankings
                if isinstance(r, dict) and "index" in r
            }
            for i, c in enumerate(candidates):
                if i in score_map:
                    c["confidence_score"] = score_map[i]["confidence_score"]
                    c["relevance_reason"]  = score_map[i]["relevance_reason"]
                else:
                    c.setdefault("confidence_score", 0.5)
                    c.setdefault("relevance_reason",  "Recognised business leader")
    except (ValueError, TypeError, KeyError) as exc:
        logger.warning("rank_candidates parse failed: %s | raw=%s", exc, raw[:300])
        for c in candidates:
            c.setdefault("confidence_score", 0.6)
            c.setdefault("relevance_reason",  "Recognised business leader")

    candidates.sort(key=lambda x: x.get("confidence_score", 0), reverse=True)
    return candidates
