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
    criteria_str = ", ".join(evaluation_criteria) if evaluation_criteria else "impact, excellence"

    prompt = f"""You are a senior research analyst. Your job is to find nominees for this specific award.

Award Name: "{award_name}"
Award Description: {award_description}
Evaluation Criteria: {criteria_str}

READ THE AWARD NAME AND DESCRIPTION CAREFULLY.
The award is specifically for: {award_name}
Description says: {award_description}

Generate exactly {count} REAL, verifiable people who EXACTLY fit what this award is about.

CRITICAL RULES:
1. Only suggest people who match the EXACT category of this award
2. If the award is for "content creators" → suggest YouTubers, bloggers, influencers, social media creators
3. If the award is for "business leaders" → suggest CEOs, founders, chairpersons
4. If the award is for "entrepreneurs" → suggest startup founders
5. If the award is for "scientists" → suggest scientists and researchers
6. If the award is for "women leaders" → suggest women only
7. If the award mentions a specific age (e.g. "under 30") → only suggest people of that age
8. If the award mentions "India" or "Indian" → only suggest Indian people
9. Do NOT default to generic business leaders if the award is about something else

People must be:
- Real, verifiable, with online presence (Wikipedia, social media, or news coverage)
- Currently active in 2025
- Genuinely relevant to "{award_name}"
- MUST BE INDIAN — born in India OR of Indian origin and primarily known for work in India
- Do NOT suggest people primarily based outside India (e.g. Sundar Pichai is Google CEO in USA — only include if award is specifically about global Indian diaspora)

Return ONLY a JSON array of full names. No explanation.
["Name 1", "Name 2", ...]"""

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
    buffer  = num_nominees  # generate exactly what's asked for
    results = []

    if entity_type == "person":
        names = await _generate_person_names(
            award_name, award_description, evaluation_criteria, num_nominees, client
        )
        results = [{"name": n, "entity_type": "person"} for n in names]

    elif entity_type == "company":
        names = await _generate_company_names(
            award_name, award_description, evaluation_criteria, num_nominees, client
        )
        results = [{"name": n, "entity_type": "company"} for n in names]

    else:  # "both" — split 50/50
        half_persons   = (num_nominees + 1) // 2
        half_companies = num_nominees - half_persons

        person_names = await _generate_person_names(
            award_name, award_description, evaluation_criteria,
            half_persons, client,
        )
        company_names = await _generate_company_names(
            award_name, award_description, evaluation_criteria,
            half_companies, client,
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
