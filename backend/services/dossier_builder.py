"""
dossier_builder.py  —  Chunk 4
────────────────────────────────
Feed enriched raw data to Groq Llama.
Returns exactly num_nominees dossiers sorted by confidence_score desc.
Handles both person and company schemas.
Retries up to 3 times on JSON parse failure.
"""

import asyncio
import json
import logging
import re
import time

from groq import AsyncGroq
from services.enrichment import RawEnrichment
from config import settings

logger = logging.getLogger(__name__)
MODEL = "llama-3.3-70b-versatile"


def _groq_client() -> AsyncGroq:
    key = settings.GROQ_KEY or __import__("os").environ.get("GROQ_KEY", "")
    if not key:
        raise RuntimeError("GROQ_KEY not configured.")
    return AsyncGroq(api_key=key)


def _strip_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    i, j = text.find("["), text.rfind("]")
    if i != -1 and j != -1:
        try:
            return json.loads(text[i: j + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No JSON array found:\n{text[:300]}")


def _build_brief(r: RawEnrichment) -> str:
    parts = [f"NAME: {r.name}"]
    if r.wiki_desc:
        parts.append(f"DESCRIPTION: {r.wiki_desc}")
    if r.wiki_extract:
        parts.append(f"WIKIPEDIA BIO: {r.wiki_extract[:600]}")
    if r.forbes_text:
        parts.append(f"FORBES DATA: {r.forbes_text[:300]}")
    if r.fortune_text:
        parts.append(f"FORTUNE DATA: {r.fortune_text[:300]}")
    if r.crunchbase_text:
        parts.append(f"CRUNCHBASE DATA: {r.crunchbase_text[:300]}")
    if r.ddg_text:
        parts.append(f"NEWS/WEB: {r.ddg_text[:300]}")
    return "\n".join(parts)


_PERSON_SCHEMA = """{
  "name": "Full Name",
  "entity_type": "person",
  "designation": "Current job title",
  "organisation": "Current employer",
  "photo_url": "from Wikipedia or empty string",
  "wikipedia_url": "page URL or empty string",
  "bio": "2-3 sentence professional biography",
  "about_nominee": [
    "Bullet point 1 — establishment, background, or founding story",
    "Bullet point 2 — sector classification, key recognition or award",
    "Bullet point 3 — key operational detail or scale"
  ],
  "selection_rationale": [
    "Bullet point 1 — specific financial metric or contract value (e.g. INR/USD figures)",
    "Bullet point 2 — recent achievement, growth stat, or major milestone",
    "Bullet point 3 — CSR, governance, or national impact detail"
  ],
  "key_achievements": ["achievement 1", "achievement 2", "achievement 3"],
  "financials": {
    "net_worth": "e.g. $1.2B or empty string",
    "revenue_led": "e.g. $40B annual revenue or empty string",
    "company_valuation": "e.g. $500M or empty string"
  },
  "awards_recognitions": ["Forbes 40 Under 40", "TIME 100"],
  "confidence_score": 0.87,
  "relevance_reason": "1-2 sentences on why they fit this award",
  "source_links": ["url1"]
}"""

_COMPANY_SCHEMA = """{
  "name": "Company Name",
  "entity_type": "company",
  "designation": "",
  "organisation": "Company Name",
  "photo_url": "logo URL from Wikipedia or empty string",
  "wikipedia_url": "page URL or empty string",
  "bio": "2-3 sentence company overview",
  "about_nominee": [
    "Bullet point 1 — when established, by whom, under which ministry/body if PSU",
    "Bullet point 2 — classification, certifications, or industry recognition",
    "Bullet point 3 — manufacturing locations, subsidiaries, or operational scale"
  ],
  "selection_rationale": [
    "Bullet point 1 — specific financial metric (revenue in INR/USD, contracts, order book)",
    "Bullet point 2 — recent milestone, contract win, or growth achievement",
    "Bullet point 3 — CSR initiatives, national impact, or govt/industry recognition"
  ],
  "key_achievements": ["milestone 1", "milestone 2", "milestone 3"],
  "financials": {
    "funding_total": "e.g. $50M Series B or empty string",
    "revenue": "e.g. INR 2369 crore or empty string",
    "valuation": "e.g. $1B unicorn or empty string"
  },
  "awards_recognitions": ["Fortune 500", "Governance Now PSU Award"],
  "founding_year": "2015 or empty string",
  "founders": ["Founder 1", "Founder 2"],
  "sector": "Defence / Energy / FinTech or empty string",
  "team_size": "e.g. 500+ employees or empty string",
  "hq": "City, Country or empty string",
  "confidence_score": 0.82,
  "relevance_reason": "1-2 sentences on why they fit this award",
  "source_links": ["url1"]
}"""


def _build_prompt(
    enriched: list[RawEnrichment],
    award_name: str,
    award_description: str,
    evaluation_criteria: list[str],
    entity_type: str,
    num_nominees: int,
) -> str:
    schema   = _PERSON_SCHEMA if entity_type == "person" else _COMPANY_SCHEMA
    criteria = ", ".join(evaluation_criteria) if evaluation_criteria else "leadership, impact"
    briefs   = "\n\n---\n".join(_build_brief(r) for r in enriched)

    return f"""You are an expert awards research analyst building structured dossiers for an award programme.

Award: "{award_name}"
Description: {award_description}
Criteria: {criteria}
Requested nominees: {num_nominees}

RAW RESEARCH DATA (use ONLY this — do NOT invent any facts):
{briefs}

INSTRUCTIONS:
1. Build exactly {num_nominees} dossiers for the BEST candidates based on relevance to this award.
2. Use ONLY the raw data above — if a field is not found, use empty string "".
3. Do NOT invent names, titles, numbers, or facts not present in the data.
4. confidence_score: 0.0-1.0 based on how well the candidate fits this specific award.
5. Sort by confidence_score descending (best first).

RATIONALE FORMAT — match this document style exactly:

about_nominee: 3 bullet points covering:
  - Establishment/founding background, parent body or ministry (for PSUs/govt entities)
  - Sector classification, certifications, or major industry recognition
  - Operational scale — locations, subsidiaries, key products/services

selection_rationale: 3-5 bullet points covering:
  - Specific financial figures (revenue in INR/USD crore, order book, contracts won)
  - Recent growth milestone or major contract/project achievement
  - National impact or strategic importance
  - CSR initiatives or governance highlights (if data available)

EXAMPLE of good selection_rationale bullet:
"BDL is targeting new orders worth INR 20,000 crore (USD 2.4 billion) over the next two to three years."
"In FY24, BDL recorded revenue of INR 2,369 crore and made net profit of INR 612 crore, a growth of 74 per cent in profit."

Return ONLY a valid JSON array. No markdown fences, no preamble, no explanation.
Each object must follow this exact schema:
{schema}

JSON array:"""


async def build_dossiers(
    enriched: list[RawEnrichment],
    award_name: str,
    award_description: str,
    evaluation_criteria: list[str],
    entity_type: str,
    num_nominees: int,
    groq_client: AsyncGroq | None = None,
) -> list[dict]:
    """
    Calls Groq to build structured dossiers from raw enrichment data.
    Retries up to 3 times with exponential backoff on JSON parse failure.
    Returns at most num_nominees dossiers sorted by confidence_score desc.
    """
    if not enriched:
        return []

    client = groq_client or _groq_client()

    # Handle "both" entity type — build separate batches
    if entity_type == "both":
        persons   = [r for r in enriched if r.entity_type == "person"]
        companies = [r for r in enriched if r.entity_type == "company"]
        half_p    = (num_nominees + 1) // 2
        half_c    = num_nominees - half_p

        person_dossiers = await build_dossiers(
            persons, award_name, award_description,
            evaluation_criteria, "person", half_p, client,
        )
        company_dossiers = await build_dossiers(
            companies, award_name, award_description,
            evaluation_criteria, "company", half_c, client,
        )
        combined = person_dossiers + company_dossiers
        combined.sort(key=lambda x: x.get("confidence_score", 0), reverse=True)
        return combined[:num_nominees]

    prompt = _build_prompt(
        enriched, award_name, award_description,
        evaluation_criteria, entity_type, num_nominees,
    )

    last_exc = None
    for attempt in range(1, 4):
        try:
            resp = await client.chat.completions.create(
                model=MODEL,
                messages=[
                    {
                        "role":    "system",
                        "content": "You are a JSON-only API. Return ONLY a valid JSON array. No markdown, no explanation.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=6000,
            )
            raw      = resp.choices[0].message.content.strip()
            dossiers = _strip_json(raw)

            if not isinstance(dossiers, list):
                raise ValueError("Response is not a JSON array")

            # Validate and clean each dossier
            cleaned = []
            for d in dossiers:
                if not isinstance(d, dict) or not d.get("name"):
                    continue
                # Ensure required fields exist
                d.setdefault("entity_type",   entity_type)
                d.setdefault("designation",   "")
                d.setdefault("organisation",  "")
                d.setdefault("photo_url",     "")
                d.setdefault("wikipedia_url", "")
                d.setdefault("bio",           "")
                d.setdefault("about_nominee",       [])
                d.setdefault("selection_rationale", [])
                d.setdefault("key_achievements", [])
                d.setdefault("financials",    {})
                d.setdefault("awards_recognitions", [])
                d.setdefault("confidence_score",    0.5)
                d.setdefault("relevance_reason",    "")
                d.setdefault("source_links",        [])

                # Company-only fields
                if entity_type == "company":
                    d.setdefault("founding_year", "")
                    d.setdefault("founders",      [])
                    d.setdefault("sector",        "")
                    d.setdefault("team_size",     "")
                    d.setdefault("hq",            "")

                # Inject Wikipedia URLs from raw enrichment if Groq left them empty
                match = next((r for r in enriched if r.name.lower() == d["name"].lower()), None)
                if match:
                    if not d["photo_url"]     and match.photo_url:
                        d["photo_url"]     = match.photo_url
                    if not d["wikipedia_url"] and match.wiki_url:
                        d["wikipedia_url"] = match.wiki_url

                try:
                    d["confidence_score"] = float(d["confidence_score"])
                except (TypeError, ValueError):
                    d["confidence_score"] = 0.5

                cleaned.append(d)

            cleaned.sort(key=lambda x: x.get("confidence_score", 0), reverse=True)
            result = cleaned[:num_nominees]
            logger.info(
                "build_dossiers: %d dossiers (attempt %d, entity=%s)",
                len(result), attempt, entity_type,
            )
            return result

        except Exception as exc:
            last_exc = exc
            logger.warning(
                "build_dossiers attempt %d failed: %s", attempt, exc
            )
            if attempt < 3:
                await asyncio.sleep(2 ** attempt)

    logger.error("build_dossiers: all 3 attempts failed. Last error: %s", last_exc)
    return []
