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
from services.research_engine import RawEnrichment
from services.groq_fallback import call_with_fallback
from config import settings

logger = logging.getLogger(__name__)


def _groq_client() -> AsyncGroq:
    key = settings.GROQ_KEY or __import__("os").environ.get("GROQ_KEY", "")
    if not key:
        raise RuntimeError("GROQ_KEY not configured.")
    return AsyncGroq(api_key=key)


def _strip_json(text: str):
    # Strip qwen thinking blocks
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
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
    if r.news_text:
        parts.append(f"RECENT NEWS: {r.news_text[:600]}")
    if r.ddg_text:
        parts.append(f"NEWS/WEB: {r.ddg_text[:300]}")
    if r.controversy_text:
        parts.append(f"CONTROVERSY/CRITICAL COVERAGE SEARCH RESULTS: {r.controversy_text[:800]}")
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
  "points_of_concern": [],
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
  "points_of_concern": [],
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

    from services import tier_router
    tier_info = tier_router.classify(award_name, award_description, entity_type)
    tier_block = ""
    if tier_info.seniority or tier_info.examples or tier_info.org_scale:
        tier_block = f"""
CALIBRATION — this award sits at: {tier_info.label}
{f"Expected seniority: {', '.join(tier_info.seniority)}" if tier_info.seniority else ""}
{f"Expected scale: {tier_info.org_scale}" if tier_info.org_scale else ""}
{f"Comparable past AIMA winners: {', '.join(tier_info.examples)}" if tier_info.examples else ""}
{f"Do NOT rank highly: {', '.join(tier_info.exclude)}" if tier_info.exclude else ""}
{f"Age constraint: {tier_info.age_constraint}" if tier_info.age_constraint else ""}
A candidate who doesn't match this seniority/scale should score LOWER even if they are
independently well-known — confidence_score measures fit to THIS award, not general fame.
This calibration is for SCORING ONLY — it never means you should return an empty array;
see INSTRUCTIONS below, which always take priority over this section.
"""

    return f"""You are an expert awards research analyst building structured dossiers for an award programme.

Award: "{award_name}"
Description: {award_description}
Criteria: {criteria}
Requested nominees: {num_nominees}
{tier_block}
RAW RESEARCH DATA (use ONLY this — do NOT invent any facts):
{briefs}

INSTRUCTIONS:
1. Build exactly one dossier for EVERY candidate listed in the raw research data above — {len(enriched)} in
   total. Never skip a candidate and never return an empty array, even if none of them are a strong fit for
   the calibration above — a weak fit still gets a dossier, just with a low confidence_score. Returning
   fewer dossiers than candidates given, or an empty array, is always wrong; the caller ranks and trims the
   list afterward, that is not your job here.
2. Use ONLY the raw data above — if a field is not found, use empty string "".
3. Do NOT invent names, titles, numbers, or facts not present in the data.
4. confidence_score: 0.0-1.0 based on how well the candidate fits this specific award AND tier (see CALIBRATION above).
   A poor fit still gets a real dossier — just score it low (e.g. 0.1-0.3), never omit it.
5. Sort by confidence_score descending (best first).

RATIONALE FORMAT — match this document style exactly:

about_nominee: 3 bullet points covering:
  - Establishment/founding background, parent body or ministry (for PSUs/govt entities) — state the founding
    year explicitly when the data gives one
  - Sector classification, certifications, or major industry recognition
  - Operational scale — locations, subsidiaries, key products/services

selection_rationale: 3-5 bullet points covering:
  - Specific financial figures (revenue in INR/USD crore, order book, contracts won)
  - Recent growth milestone or major contract/project achievement
  - National impact or strategic importance
  - CSR initiatives or governance highlights (if data available)

HARD REQUIREMENT for every about_nominee and selection_rationale bullet: it must contain at least one
specific number, date, or named achievement drawn from the raw data — never a bare qualitative claim.
"Demonstrated strong leadership" is not acceptable on its own; say what was led, when, and with what
result (e.g. "Led the company's 2019 international expansion into 12 new markets, growing export revenue
40% over two years"). Where the raw data gives a financial figure, format it as "INR X,XX,XXX crore (USD
X.X billion)" — both currencies when both are derivable, INR alone if that's all the data supports. If a
bullet genuinely has no number/date/named achievement available in the raw data, it is better to omit that
bullet than to pad it with vague language — a shorter, fully-grounded list beats a padded one.

EXAMPLE of good selection_rationale bullet:
"BDL is targeting new orders worth INR 20,000 crore (USD 2.4 billion) over the next two to three years."
"In FY24, BDL recorded revenue of INR 2,369 crore and made net profit of INR 612 crore, a growth of 74 per cent in profit."

points_of_concern — due-diligence check, for the CONTROVERSY/CRITICAL COVERAGE SEARCH RESULTS section only:
  - Populate ONLY if that section above contains a real, specific, sourced controversy, criticism, lawsuit,
    regulatory action, or other negative coverage about THIS candidate.
  - Each bullet must restate a concrete claim that is actually present in that data — quote or closely
    paraphrase it, do not generalize, speculate, infer, or invent one.
  - If the CONTROVERSY/CRITICAL COVERAGE section is absent, empty, or only contains unrelated/neutral
    results, return an empty array. An empty array is the normal, expected result for most candidates —
    never manufacture a concern just to fill the field, and never treat an ordinary business setback
    (e.g. a stock dip, a missed target) as a "concern" unless the source text itself frames it that way.

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

    # Start with a reasonable-sized slice — the prompt token budget is shared with
    # the response, and this account's free-tier TPM limit is small (8000
    # tokens/minute) — but keep the rest of the verified pool in reserve. If some
    # batches fail outright (rate limit, bad JSON after 3 retries), those slots
    # get topped up from the reserve below instead of just being lost — the
    # caller asked for an exact count and real, already-verified candidates for
    # it may just be sitting in the untried remainder of `enriched`.
    capped = enriched[: max(num_nominees * 2, 6)]
    reserve = enriched[len(capped):]

    # Write dossiers in small batches, not all at once — a single call asking for
    # several full, richly-structured dossiers reliably exceeds this account's
    # per-request token budget and gets silently truncated into invalid JSON. Each
    # batch gets its own call; final ranking/truncation to num_nominees happens
    # after merging. BATCH_SIZE=2 (not 3) because each candidate's brief now also
    # carries NewsAPI + Wikipedia text, so a 3-candidate batch's prompt+response
    # can approach this account's entire 8000 tokens/minute budget by itself.
    BATCH_SIZE = 2
    all_cleaned: list[dict] = []
    batches_run = 0

    async def _run_batches(candidates: list[RawEnrichment]) -> None:
        nonlocal batches_run
        batches = [candidates[i : i + BATCH_SIZE] for i in range(0, len(candidates), BATCH_SIZE)]
        for batch in batches:
            if batches_run > 0:
                # Small gap between sequential calls so the rolling TPM window has
                # room to recover — without this, batches queue up back-to-back and
                # each new one hits 429 before the last minute's usage has cleared.
                await asyncio.sleep(1.5)
            cleaned = await _build_batch(
                batch, enriched, award_name, award_description,
                evaluation_criteria, entity_type, client,
            )
            all_cleaned.extend(cleaned)
            batches_run += 1

    await _run_batches(capped)

    # Top-up from the reserve if some batches failed and real candidates are still
    # sitting untried — bounded (max 2 extra rounds, capped total candidates) so a
    # persistently-failing account doesn't retry forever and burn the budget.
    top_up_rounds = 0
    while len(all_cleaned) < num_nominees and reserve and top_up_rounds < 2:
        shortfall = num_nominees - len(all_cleaned)
        next_chunk = reserve[: max(shortfall * 2, BATCH_SIZE)]
        reserve = reserve[len(next_chunk):]
        logger.info(
            "build_dossiers: only %d/%d after %d batches — topping up with %d more candidates",
            len(all_cleaned), num_nominees, batches_run, len(next_chunk),
        )
        await _run_batches(next_chunk)
        top_up_rounds += 1

    all_cleaned.sort(key=lambda x: x.get("confidence_score", 0), reverse=True)
    result = all_cleaned[:num_nominees]
    logger.info("build_dossiers: %d dossiers from %d batches (entity=%s)",
                len(result), batches_run, entity_type)
    return result


async def _build_batch(
    batch: list[RawEnrichment],
    all_enriched: list[RawEnrichment],
    award_name: str,
    award_description: str,
    evaluation_criteria: list[str],
    entity_type: str,
    client: AsyncGroq,
) -> list[dict]:
    """Write a dossier for every candidate in one small batch. Retries up to 3
    times with exponential backoff on JSON parse / rate-limit failure."""
    prompt = _build_prompt(
        batch, award_name, award_description,
        evaluation_criteria, entity_type, len(batch),
    )

    last_exc = None
    for attempt in range(1, 3):
        try:
            resp = await call_with_fallback(
                client,
                messages=[
                    {
                        "role":    "system",
                        "content": "You are a JSON-only API. Return ONLY a valid JSON array. No markdown, no explanation, no thinking.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=1200 * len(batch),
                extra_body={"reasoning_effort": "low"},
                attempts_per_model=1,
            )
            raw = resp.choices[0].message.content or ""
            # Strip any thinking blocks
            raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
            dossiers = _strip_json(raw)

            if not isinstance(dossiers, list):
                raise ValueError("Response is not a JSON array")

            cleaned = []
            for d in dossiers:
                if not isinstance(d, dict) or not d.get("name"):
                    continue
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
                d.setdefault("points_of_concern", [])
                d.setdefault("confidence_score",    0.5)
                d.setdefault("relevance_reason",    "")
                d.setdefault("source_links",        [])

                if entity_type == "company":
                    d.setdefault("founding_year", "")
                    d.setdefault("founders",      [])
                    d.setdefault("sector",        "")
                    d.setdefault("team_size",     "")
                    d.setdefault("hq",            "")

                match = next((r for r in all_enriched if r.name.lower() == d["name"].lower()), None)
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

            if not cleaned:
                # A technically-valid empty/no-name JSON array used to be treated as
                # success and returned immediately — silently, with zero dossiers and
                # no retry. Treat it as a failure instead so the retry loop below
                # actually gets a chance to try again.
                raise ValueError(f"Parsed 0 usable dossiers from response (raw len={len(raw)}): {raw[:200]!r}")

            return cleaned

        except Exception as exc:
            last_exc = exc
            logger.warning("_build_batch attempt %d failed: %s", attempt, exc)
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)

    logger.error("_build_batch: all model/attempt combinations failed for batch of %d. Last error: %s",
                 len(batch), last_exc)
    return []
