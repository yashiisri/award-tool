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
    known = getattr(r, "known_designation", "") or getattr(r, "known_organisation", "")
    if known:
        # Ground truth the jury member typed in directly — authoritative, not
        # something to re-derive from noisy search text. Shown first and flagged
        # as verified so it isn't just one more competing signal among the rest.
        parts.append(
            f"VERIFIED DESIGNATION/ORGANISATION (confirmed by the nominator, use exactly as given, "
            f"never contradict or replace with something inferred from search text below): "
            f"{r.known_designation or '(not specified)'} at {r.known_organisation or '(not specified)'}"
        )
    if r.wiki_desc:
        parts.append(f"DESCRIPTION: {r.wiki_desc}")
    if r.wiki_extract:
        parts.append(f"WIKIPEDIA BIO: {r.wiki_extract[:1400]}")
    if r.forbes_text:
        parts.append(f"FORBES DATA: {r.forbes_text[:600]}")
    if r.fortune_text:
        parts.append(f"FORTUNE DATA: {r.fortune_text[:600]}")
    if r.crunchbase_text:
        parts.append(f"CRUNCHBASE DATA: {r.crunchbase_text[:600]}")
    if r.news_text:
        parts.append(f"RECENT NEWS: {r.news_text[:900]}")
    if r.ddg_text:
        parts.append(f"NEWS/WEB: {r.ddg_text[:2400]}")
    if r.recent_activity_text:
        parts.append(f"LAST 12 MONTHS ACTIVITY (dated search results): {r.recent_activity_text[:1200]}")
    if r.financial_trend_text:
        parts.append(f"LAST 12 MONTHS FINANCIAL/PERFORMANCE COVERAGE (dated search results): {r.financial_trend_text[:1200]}")
    if r.controversy_text:
        parts.append(f"CONTROVERSY/CRITICAL COVERAGE SEARCH RESULTS: {r.controversy_text[:3000]}")
    return "\n".join(parts)


_PERSON_SCHEMA = """{
  "name": "Full Name",
  "entity_type": "person",
  "designation": "Current job title",
  "organisation": "Current employer",
  "photo_url": "from Wikipedia or empty string",
  "wikipedia_url": "page URL or empty string",
  "bio": "4-6 sentence comprehensive professional biography — background, career trajectory (earlier roles, not just the current one, when the data covers them), and current role",
  "about_nominee": [
    "Bullet point — establishment, background, or founding story",
    "Bullet point — education or early career, when the data covers it",
    "Bullet point — career trajectory: earlier roles/companies before the current one, if the data supports it",
    "Bullet point — sector classification, key recognition or award",
    "Bullet point — key operational detail or scale",
    "Bullet point — any additional grounded biographical detail the data supports (board memberships, public roles, notable affiliations)"
  ],
  "selection_rationale": [
    "Bullet point — specific financial metric or contract value (e.g. INR/USD figures)",
    "Bullet point — a second, distinct financial metric if the data supports one (e.g. revenue AND separately valuation/funding)",
    "Bullet point — recent achievement, growth stat, or major milestone",
    "Bullet point — a second recent achievement or milestone, if the data supports one",
    "Bullet point — CSR, governance, or national impact detail",
    "Bullet point — industry standing or competitive position, if the data supports it",
    "Bullet point — a closing reasoning/validation bullet that explicitly ties the candidate's record back to the award's stated evaluation criteria"
  ],
  "key_achievements": ["achievement 1", "achievement 2", "achievement 3", "achievement 4 if available", "achievement 5 if available"],
  "recent_activity": [
    "Bullet — a specific, dated event/achievement from roughly the last 12 months",
    "Bullet — another recent dated event, if the data supports one",
    "Bullet — a third, if the data supports one",
    "Bullet — a fourth, if the data supports one"
  ],
  "financials": {
    "net_worth": "e.g. $1.2B or empty string",
    "revenue_led": "e.g. $40B annual revenue or empty string",
    "company_valuation": "e.g. $500M or empty string",
    "compensation": "annual compensation/salary figure if reported, or empty string",
    "stock_holdings": "equity stake or shareholding figure if reported, or empty string"
  },
  "awards_recognitions": ["Forbes 40 Under 40", "TIME 100"],
  "points_of_concern": [],
  "confidence_score": 0.87,
  "relevance_reason": "3-4 sentences of in-depth reasoning that validates why this person is a strong candidate for THIS SPECIFIC award — explicitly connect their record to the award's evaluation criteria, name the criteria being satisfied, and explain the judgement, not just restate their achievements",
  "source_links": ["url1"]
}"""

_COMPANY_SCHEMA = """{
  "name": "Company Name",
  "entity_type": "company",
  "designation": "",
  "organisation": "Company Name",
  "photo_url": "logo URL from Wikipedia or empty string",
  "wikipedia_url": "page URL or empty string",
  "bio": "4-6 sentence comprehensive company overview — origin, what it does, market position, and current standing",
  "about_nominee": [
    "Bullet point — when established, by whom, under which ministry/body if PSU",
    "Bullet point — classification, certifications, or industry recognition",
    "Bullet point — manufacturing locations, subsidiaries, or operational scale",
    "Bullet point — product/service lines or business segments, if the data supports it",
    "Bullet point — market position or competitive standing, if the data supports it",
    "Bullet point — any additional grounded detail the data supports (ownership structure, major partnerships)"
  ],
  "selection_rationale": [
    "Bullet point — specific financial metric (revenue in INR/USD, contracts, order book)",
    "Bullet point — a second, distinct financial metric if the data supports one",
    "Bullet point — recent milestone, contract win, or growth achievement",
    "Bullet point — a second recent milestone, if the data supports one",
    "Bullet point — CSR initiatives, national impact, or govt/industry recognition",
    "Bullet point — market/industry standing, if the data supports it",
    "Bullet point — a closing reasoning/validation bullet that explicitly ties the company's record back to the award's stated evaluation criteria"
  ],
  "key_achievements": ["milestone 1", "milestone 2", "milestone 3", "milestone 4 if available", "milestone 5 if available"],
  "recent_activity": [
    "Bullet — a specific, dated event/milestone from roughly the last 12 months",
    "Bullet — another recent dated event, if the data supports one",
    "Bullet — a third, if the data supports one",
    "Bullet — a fourth, if the data supports one"
  ],
  "financials": {
    "funding_total": "e.g. $50M Series B or empty string",
    "revenue": "e.g. INR 2369 crore or empty string",
    "valuation": "e.g. $1B unicorn or empty string",
    "profit": "net profit figure if reported, or empty string",
    "growth_rate": "YoY growth percentage if reported, or empty string"
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
3. Do NOT invent names, titles, numbers, or facts not present in the data. This applies most when the
   data is thin: if the raw research data for a candidate is sparse (a name and little else), the correct
   "designation"/"organisation" output is the VERIFIED DESIGNATION/ORGANISATION line when one is given
   above, or empty string "" when it isn't — never fill the gap with a plausible-sounding but ungrounded
   guess. A short, honest, low-detail bio using only what's actually there is correct; a longer, more
   specific-sounding bio built partly from invented detail is a factual error in a document a jury will
   act on, even if no single sentence looks obviously wrong.
   This also applies inside about_nominee/selection_rationale/key_achievements/recent_activity bullets,
   not just the top-level designation/organisation fields: when a VERIFIED DESIGNATION/ORGANISATION line
   is given above, do not write a bullet naming a DIFFERENT employer/company for this person unless the
   source text explicitly frames it as PRIOR employment before their verified current role. Raw web text
   about a real company can be noisy — a scraped page listing many employees can blend fragments from a
   DIFFERENT person at the same company into the same snippet (a pronoun or an unrelated employer name
   that doesn't match the verified person is the tell). If a specific detail in a snippet contradicts the
   verified designation/organisation rather than adding to it, that detail is about someone else — leave
   it out rather than repeat it as this candidate's own achievement.
4. confidence_score: 0.0-1.0 based on how well the candidate fits this specific award AND tier (see CALIBRATION above).
   A poor fit still gets a real dossier — just score it low (e.g. 0.1-0.3), never omit it.
5. Sort by confidence_score descending (best first).

DEPTH — this is the single most important instruction in this prompt: write the MOST comprehensive,
detailed dossier the raw data actually supports. The bullet counts in the schema above are a MINIMUM
floor when data is thin, not a target to stop at. If the raw research data contains 10 distinct grounded
facts about a candidate's finances, career, and achievements, the dossier should contain 10 bullets
across the relevant fields, not a token 3. A jury making a real decision needs a full picture — biography,
career trajectory, company/organisational background, and financial detail — not a highlights reel. Mine
every section of the raw data (WIKIPEDIA BIO, FORBES/FORTUNE/CRUNCHBASE DATA, NEWS/WEB, LAST 12 MONTHS
ACTIVITY, LAST 12 MONTHS FINANCIAL/PERFORMANCE COVERAGE) for every distinct, grounded fact before writing —
do not stop after the first two or three obvious ones. The only real ceiling is instruction 3 above: never
invent a fact that isn't in the raw data. Thin source data still means a short dossier; rich source data
must produce a rich dossier — do not compress real, available detail into a handful of bullets for brevity.

RATIONALE FORMAT — match this document style exactly:

about_nominee: as many bullet points as the data grounds (schema shows 6 slots; use fewer only if the
  data is genuinely thin) covering:
  - Establishment/founding background, parent body or ministry (for PSUs/govt entities) — state the founding
    year explicitly when the data gives one
  - Education or early career, when the data covers it
  - Career trajectory — earlier roles/companies before the current one, if the data supports it
  - Sector classification, certifications, or major industry recognition
  - Operational scale — locations, subsidiaries, key products/services
  - Any other grounded biographical or organisational detail the data supports

selection_rationale: as many bullet points as the data grounds (schema shows 7 slots; use fewer only if
  the data is genuinely thin) covering:
  - Specific financial figures (revenue in INR/USD crore, order book, contracts won, valuation, funding,
    compensation) — include every distinct financial figure the data provides, not just one
  - Recent growth milestone or major contract/project achievement
  - A second recent achievement or milestone, if the data supports one
  - National impact or strategic importance
  - Industry standing or competitive position
  - CSR initiatives or governance highlights (if data available)
  - A closing reasoning/validation bullet that explicitly ties the candidate's record back to the
    award's stated evaluation criteria — name which criteria they satisfy and why, so the bullet reads
    as a judgement ("this qualifies them for X because Y"), not a restatement of an earlier bullet

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

recent_activity — as many bullet points as the data grounds (up to 4-5) drawn ONLY from the LAST 12 MONTHS
ACTIVITY and LAST 12 MONTHS FINANCIAL/PERFORMANCE COVERAGE sections above (when present):
  - Each bullet must be a specific event, achievement, or figure actually present in those two sections —
    a funding round, a quarterly result, a new contract, a leadership move, an award, etc.
  - Only state an actual date/month/quarter when the source text gives one explicitly. Never write a
    placeholder like "(date within last 12 months)" or "(recently)" — if no specific date is given, just
    describe the event itself without a date qualifier. The section heading already establishes the
    roughly-last-year window; a vague in-line date phrase adds nothing and reads as filler.
  - Do NOT pull from the general WIKIPEDIA BIO or older RECENT NEWS text for this field — those can span
    a whole career; this field is specifically the last-year window.
  - If neither of those two sections is present or contains nothing datable/specific, return an empty
    array — do not backfill with older achievements or invented recency.

points_of_concern — due-diligence check, for the CONTROVERSY/CRITICAL COVERAGE SEARCH RESULTS section only:
  - Populate ONLY if that section above contains a real, specific, sourced controversy, criticism, lawsuit,
    regulatory action, or other negative coverage about THIS candidate.
  - Each bullet must restate a concrete claim that is actually present in that data — quote or closely
    paraphrase it, do not generalize, speculate, infer, or invent one.
  - If the CONTROVERSY/CRITICAL COVERAGE section is absent, empty, or only contains unrelated/neutral
    results, return an empty array. An empty array is the normal, expected result for most candidates —
    never manufacture a concern just to fill the field, and never treat an ordinary business setback
    (e.g. a stock dip, a missed target) as a "concern" unless the source text itself frames it that way.
  - MATERIALITY BAR — being real and sourced is necessary but not sufficient. This dossier goes directly
    to a jury voting on a live national award; the bar is FRAUD/LEGAL/REGULATORY, not "any negative press."
    Ask: is this specifically a fraud, legal, or regulatory matter — not just something critical that was
    said or written about the person.
      INCLUDE ONLY: fraud or bribery charges/indictments, regulatory action (SEBI/CBI/ED/court), arrests,
      criminal or civil legal proceedings naming this person, formal investigations, proven financial
      misconduct, a regulator-imposed penalty. If it wouldn't show up in a court filing, an FIR, or a
      regulator's order, it does not belong here.
      DO NOT INCLUDE, even though each of these is real, sourced, and about the right person — these are
      confirmed real examples of the WRONG kind of item to include, not hypotheticals:
        "Customers criticized [X]'s vehicles and service" — a product/customer complaint, not legal.
        "[X] faced criticism from [Y] for a scene in [film] perceived as [offensive]" — creative/artistic
          criticism, not legal.
        "[X] was criticized for casting choices in [project]" — entertainment-press opinion, not legal.
        "Criticism over [X]'s product, with doctors/influencers questioning its validity" — public
          skepticism or debate, not a regulatory finding, UNLESS a regulator or court is actually named
          as having acted on it.
        A single negative tweet/review, a hiring-policy complaint, a pricing complaint, a policy
          disagreement with employees/customers that never escalated into a legal or regulatory matter.
      If the CONTROVERSY section only contains this kind of item and nothing that clears the fraud/legal/
      regulatory bar, that is equivalent to no real concern — return an empty array. Do not include a weak
      item just because it's the only thing available; an empty array is the correct, expected answer for
      most candidates, since most real people have no fraud or legal history to report.

Return ONLY a valid JSON array. No markdown fences, no preamble, no explanation.
Each object must follow this exact schema:
{schema}

JSON array:"""


def _dedupe_by_name(dossiers: list[dict]) -> list[dict]:
    """Belt-and-suspenders name dedup on the final LLM output — research_engine's
    _dedupe_briefs() already dedupes raw candidates by Wikipedia URL, but two raw
    briefs that never shared a wiki_url (e.g. one from the curated seed list, one
    from live search, slightly different spelling/spacing) can still both reach
    here and get written up as two separate dossiers for the same real person.
    Call sites sort by confidence_score desc first, so the higher-confidence
    (usually more complete) dossier for a given name wins."""
    seen: set[str] = set()
    out = []
    for d in dossiers:
        key = (d.get("name") or "").strip().lower()
        if key and key in seen:
            continue
        seen.add(key)
        out.append(d)
    return out


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
        return _dedupe_by_name(combined)[:num_nominees]

    # Start with a reasonable-sized slice — the prompt token budget is shared with
    # the response, and this account's free-tier TPM limit is small (8000
    # tokens/minute) — but keep the rest of the verified pool in reserve. If some
    # batches fail outright (rate limit, bad JSON after 3 retries), those slots
    # get topped up from the reserve below instead of just being lost — the
    # caller asked for an exact count and real, already-verified candidates for
    # it may just be sitting in the untried remainder of `enriched`.
    capped = enriched[: max(num_nominees * 2, 6)]
    reserve = enriched[len(capped):]

    # Write dossiers ONE candidate per call, not batched — dossiers are now asked
    # to be genuinely comprehensive (full career trajectory, multiple financial
    # figures, up to 6-7 bullets per section), and this account's free-tier Groq
    # budget is a tight 8000 tokens/minute shared across prompt + response. A
    # batch of 2+ richer dossiers in one call reliably blew that budget and came
    # back truncated into invalid JSON — worse than thin content. One candidate
    # per call keeps each request's tokens well inside the ceiling; the
    # sleep(1.5) between calls below lets the per-minute window recover.
    BATCH_SIZE = 1
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
    result = _dedupe_by_name(all_cleaned)[:num_nominees]
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
                max_tokens=2400 * len(batch),
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
                d.setdefault("recent_activity", [])
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
