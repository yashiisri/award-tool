"""
name_generator.py  —  Chunk 2
──────────────────────────────
Generates num_nominees × 3 candidate names using Groq Llama 3.3.
Separate prompts for person vs company. Handles entity_type = "both".
"""

import json
import logging
import re

from groq import AsyncGroq
from config import settings

logger = logging.getLogger(__name__)
MODEL = "llama-3.3-70b-versatile"


def _groq_client() -> AsyncGroq:
    key = settings.GROQ_KEY or __import__("os").environ.get("GROQ_KEY", "")
    if not key:
        raise RuntimeError("GROQ_KEY not configured.")
    return AsyncGroq(api_key=key)


def _parse_json_list(text: str) -> list:
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
    return []


async def _generate_person_names(
    award_name: str,
    award_description: str,
    evaluation_criteria: list[str],
    count: int,
    client: AsyncGroq,
) -> list[str]:
    criteria_str = ", ".join(evaluation_criteria) if evaluation_criteria else "leadership, impact"
    prompt = f"""You are a senior research analyst finding nominees for this award.

Award: "{award_name}"
Description: {award_description}
Evaluation criteria: {criteria_str}

Generate exactly {count} REAL, verifiable individual people who fit this award.

Requirements:
- Real humans with a Wikipedia page (verifiable)
- Relevant to the award's sector and criteria
- Currently active in 2025 (alive, not retired)
- Diverse in geography and gender where possible
- Indian business/industry figures preferred if award is India-focused

Return ONLY a JSON array of full names. No explanation, no numbering.
Example: ["Mukesh Ambani", "Falguni Nayar", "Natarajan Chandrasekaran"]

Your response (JSON array only):"""

    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1500,
        )
        raw   = resp.choices[0].message.content.strip()
        names = _parse_json_list(raw)
        result = [str(n).strip() for n in names if isinstance(n, str) and len(n.strip()) >= 4]
        logger.info("Person name generation: %d names for '%s'", len(result), award_name)
        return result
    except Exception as exc:
        logger.warning("_generate_person_names failed: %s", exc)
        return []


async def _generate_company_names(
    award_name: str,
    award_description: str,
    evaluation_criteria: list[str],
    count: int,
    client: AsyncGroq,
) -> list[str]:
    criteria_str = ", ".join(evaluation_criteria) if evaluation_criteria else "innovation, growth"
    prompt = f"""You are a senior research analyst finding nominees for this award.

Award: "{award_name}"
Description: {award_description}
Evaluation criteria: {criteria_str}

Generate exactly {count} REAL organisations/companies that fit this award.

Requirements:
- Real organisations with a Wikipedia or Crunchbase presence
- Relevant to the award's sector and criteria
- Currently active in 2025
- Include HQ country in brackets if known (e.g. "Reliance Industries (India)")
- Indian companies preferred if award is India-focused

Return ONLY a JSON array of organisation names. No explanation, no numbering.
Example: ["Zepto (India)", "Ola Electric (India)", "Infosys (India)"]

Your response (JSON array only):"""

    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1500,
        )
        raw   = resp.choices[0].message.content.strip()
        names = _parse_json_list(raw)
        result = [str(n).strip() for n in names if isinstance(n, str) and len(n.strip()) >= 2]
        logger.info("Company name generation: %d names for '%s'", len(result), award_name)
        return result
    except Exception as exc:
        logger.warning("_generate_company_names failed: %s", exc)
        return []


async def generate_candidate_names(
    award_name: str,
    award_description: str,
    num_nominees: int,
    evaluation_criteria: list[str],
    entity_type: str,  # "person" | "company" | "both"
    groq_client: AsyncGroq | None = None,
) -> list[dict]:
    """
    Returns list of {"name": "...", "entity_type": "person"|"company"}.
    Generates num_nominees × 3 as buffer (some will fail enrichment).
    """
    client  = groq_client or _groq_client()
    buffer  = num_nominees * 3
    results = []

    if entity_type == "person":
        names = await _generate_person_names(
            award_name, award_description, evaluation_criteria, buffer, client
        )
        results = [{"name": n, "entity_type": "person"} for n in names]

    elif entity_type == "company":
        names = await _generate_company_names(
            award_name, award_description, evaluation_criteria, buffer, client
        )
        results = [{"name": n, "entity_type": "company"} for n in names]

    else:  # "both" — split 50/50
        half_persons   = (num_nominees + 1) // 2  # round up
        half_companies = num_nominees - half_persons

        person_names = await _generate_person_names(
            award_name, award_description, evaluation_criteria,
            half_persons * 3, client,
        )
        company_names = await _generate_company_names(
            award_name, award_description, evaluation_criteria,
            half_companies * 3, client,
        )
        results = (
            [{"name": n, "entity_type": "person"}  for n in person_names] +
            [{"name": n, "entity_type": "company"} for n in company_names]
        )

    # Deduplicate by name (case-insensitive)
    seen: set[str] = set()
    deduped = []
    for item in results:
        key = item["name"].lower()
        if key not in seen:
            seen.add(key)
            deduped.append(item)

    logger.info(
        "generate_candidate_names: %d candidates (entity_type=%s, target=%d)",
        len(deduped), entity_type, num_nominees,
    )
    return deduped
