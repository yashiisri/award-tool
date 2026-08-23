# AI Nominee Research Engine — Architecture

## Problem Solved

The previous implementation asked an LLM (Groq Llama 3.3) to *invent* real people's
names from its training data, then tried to fuzzy-match those invented names against
scraped RSS feeds. The LLM was the source of candidate identity — a direct
hallucination risk, and hardcoded to Indian business leaders regardless of the award's
actual criteria.

This version discovers candidates from **real web evidence** and uses AI only to
structure the award's criteria and (optionally) phrase a rationale — never to
originate a person's identity.

## Core Principle

```
Old:  LLM → names → fuzzy-match against scraped pages → LLM scores its own invented list

New:  award criteria → research plan → broad web search → candidate discovery
      → entity resolution → evidence collection → verification → deterministic scoring
```

## Pipeline

```
backend/services/
├── ai_service.py                    Groq Llama 3.3 — criteria extraction & rationale only
├── nominee_service.py               Entry point (POST /admin/ai-search-nominees)
├── wikipedia_service.py             Wikipedia REST API — enrichment only, never a gate
└── research/
    ├── research_orchestrator.py     Top-level pipeline, ties every stage together
    ├── search_provider.py           Provider-agnostic interface + bounded-concurrency runner
    ├── tavily_provider.py           Tavily Search API (primary)
    ├── brave_provider.py            Brave Search API (optional secondary)
    ├── query_generator.py           Criteria → dynamic discovery/candidate queries
    ├── candidate_extractor.py       Extracts person mentions from real search results only
    ├── entity_resolver.py           Multi-signal merge of mentions into unique people
    ├── evidence_service.py          Stage-2 targeted per-candidate evidence collection
    ├── ranking_service.py           Deterministic verification + transparent scoring
    ├── source_quality.py            Domain-tier scoring (official > major press > Wikipedia > blogs)
    └── cache_service.py             Mongo-backed cache with native TTL index
```

## Flow

1. **Research plan** — `ai_service.extract_research_criteria()` structures the award's
   own title/description into `{industry, geography, leadership_requirements,
   company_size, achievement_requirements, time_period, keywords, exclusions}`.
   Nothing here is invented — only what's already in the award's text.
2. **Discovery queries** — `query_generator.generate_discovery_queries()` expands the
   plan into up to 16 queries via deterministic templates × industry-synonym expansion
   (one LLM call to widen terminology, e.g. "Technology" → software/IT/AI/cloud/...).
   No query is hardcoded to a specific geography.
3. **Parallel search** — `search_provider.run_bounded_searches()` runs every query
   against Tavily (and Brave, if configured) with bounded concurrency
   (`RESEARCH_MAX_CONCURRENCY`), a Mongo-backed cache, and per-provider timeouts. A
   provider without a key is skipped; a provider that errors is logged and ignored —
   the pipeline never crashes because one external call failed.
4. **Candidate discovery** — `candidate_extractor.extract_candidates()` pulls person
   mentions directly from real search results (title/snippet/content). A name is only
   a candidate if it appears in retrieved evidence near a leadership-role keyword.
5. **Entity resolution** — `entity_resolver.resolve_entities()` merges mentions into
   unique people using name + at least one corroborating signal (shared organization,
   shared designation family, or overlapping source domain). Two people are never
   merged on name similarity alone.
6. **Evidence collection** — for the strongest ~10 candidates, `evidence_service`
   runs targeted per-candidate queries (`"<name>" <org>`, `"<name>" CEO`,
   `"<name>" Forbes`, etc.) and records structured `Evidence` items (source URL,
   domain, quality tier, snippet, published date). Wikipedia is consulted here purely
   as enrichment (photo, biography) — its absence never disqualifies a candidate.
7. **Verification + scoring** — `ranking_service.py` is fully deterministic:
   - `verify_candidate()` → `verified` / `partially_verified` / `unverified`, based on
     independent source-domain count and average source quality.
   - `score_candidate()` → six explainable 0–1 component scores
     (`award_relevance`, `leadership_impact`, `industry_relevance`,
     `achievement_strength`, `source_quality`, `recency`), combined into a weighted
     `overall_score` (weights configurable in `config.py`, default 30/20/15/15/10/10).
   - None of these numbers depend on the LLM, so scoring keeps working even if the
     rationale-writing step fails.
8. **Grounded rationale** — a best-effort LLM call writes a sentence explaining fit,
   constrained to only use the collected evidence text. On failure, a deterministic
   template (`ranking_service.deterministic_rationale()`) takes over — the admin
   always sees a real, evidence-traceable explanation.

## Honesty over quota

The old pipeline retried until it had *exactly* N nominees, which is exactly the
pressure that invites hallucination. This version returns however many candidates
genuinely pass verification (up to N) and reports why if it finds fewer — via
`research_metadata.diagnostic` — rather than silently backfilling with fabricated
people.

## API

`POST /admin/ai-search-nominees` (unchanged path, admin-only, same request body):

```json
{ "award_id": "...", "num_results": 5 }
```

Response:

```json
{
  "candidates": [
    {
      "name": "...", "designation": "...", "organisation": "...", "photo_url": null,
      "rationale": "...", "overall_score": 0.82,
      "verification_status": "verified", "verification_confidence": 0.9,
      "scores": { "award_relevance": 0.9, "leadership_impact": 0.8, "industry_relevance": 0.85,
                  "achievement_strength": 0.7, "source_quality": 0.8, "recency": 1.0 },
      "evidence": [ { "source_url": "...", "source_domain": "reuters.com", "source_type": "major_publication",
                      "evidence_text": "...", "source_quality": 0.8 } ],
      "sources": ["https://..."], "wikipedia_url": "https://...", "ai_generated": true,
      "rationale_data": { "confidence_score": 0.82, "relevance_reason": "...", "source_links": [...], "ai_generated": true }
    }
  ],
  "research_metadata": {
    "queries_executed": 21, "sources_examined": 84, "candidates_discovered": 34,
    "candidates_verified": 12, "research_duration_ms": 9840,
    "providers_used": ["tavily"], "diagnostic": null
  }
}
```

`rationale_data` is kept alongside the new fields purely for backward compatibility —
the frontend's `AIResultsModal` reads both.

## Configuration

```bash
GROQ_KEY=...            # criteria extraction & rationale writing
TAVILY_API_KEY=...      # required — primary search provider, get one at tavily.com
BRAVE_API_KEY=          # optional secondary provider
```

Tuning knobs (all in `config.py`, overridable via `.env`):
`RESEARCH_MAX_CONCURRENCY`, `RESEARCH_SEARCH_TIMEOUT`, `RESEARCH_CACHE_TTL_SEARCH`,
`RESEARCH_CACHE_TTL_EVIDENCE`, `RESEARCH_MIN_CONFIDENCE`,
`RESEARCH_STAGE1_DISCOVERY_LIMIT`, `RESEARCH_STAGE2_VERIFY_LIMIT`,
`RESEARCH_STAGE3_DEEP_LIMIT`, and the six `WEIGHT_*` scoring weights.

## Failure handling

- No search provider configured → 503 with a clear message, before any work starts
- One query fails → logged, other queries continue
- One evidence source fails → logged, other sources continue
- Wikipedia unavailable → enrichment skipped, candidate unaffected
- Grounded-rationale LLM call fails → deterministic template rationale used instead
- No candidates found → 404 with a diagnostic explaining which stage produced nothing

## Observability

Every stage logs via Python's `logging` module, tagged with a short `request_id` so a
single research run's log lines can be grepped together: queries generated, results
per query, candidates extracted/resolved/verified, and total duration. API keys are
never logged.

## Testing

See `backend/tests/test_research_pipeline.py` — query generation, entity resolution
(merge and no-merge cases), source-quality scoring, verification status logic, and an
end-to-end pipeline run against a mocked search provider. No test depends on a live
API call.

## Future enhancements

- [ ] Brave as a fully independent live second provider (works today once
      `BRAVE_API_KEY` is set — not yet exercised in production)
- [ ] LLM-assisted claim summarization per evidence item (currently template-based,
      for cost/latency)
- [ ] Admin feedback loop (mark candidates as good/bad to tune weights over time)
- [ ] Region-specific provider routing (e.g. prefer Indian publications for
      India-scoped awards) beyond query-level geography hints
