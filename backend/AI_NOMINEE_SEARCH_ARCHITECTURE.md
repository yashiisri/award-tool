# AI Nominee Search Engine — Architecture

## Problem Solved
- **Before**: Mock data with 8 hardcoded nominees
- **After**: Real AI-powered research engine that discovers high-profile business leaders

## Core Strategy: Two-Track Approach

### Track A: AI-Direct (Primary, Reliable)
1. **Llama 3.3** generates 20+ real candidate names with roles/orgs
2. **Wikipedia** validates each name (fetches summary, photo, description)
3. Only candidates with substantial Wikipedia pages pass through

**Why this works:**
- Llama 3.3 knows Forbes/Fortune 500 leaders from training data
- Wikipedia validation ensures they're real, verifiable people
- No dependency on fragile web scraping

### Track B: Web-Search (Supplementary, Best-Effort)
1. **Llama 3.3** generates targeted DuckDuckGo queries
2. **DuckDuckGo** HTML scraping extracts candidate names from results
3. **Wikipedia** enriches each name with full profile data

**Why this is supplementary:**
- Web scraping is brittle (HTML changes, rate limits, parsing failures)
- If Track B fails entirely, Track A still succeeds
- Provides additional candidates beyond Llama's training cutoff

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  nominee_service.py (Orchestration)                         │
│  • run_ai_nominee_search()                                  │
│  • extract_and_store_metrics()                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──► ai_service.py (Groq Llama 3.3)
             │    • extract_award_metrics()
             │    • generate_candidate_names()  ◄── PRIMARY
             │    • generate_search_queries()
             │    • rank_candidates()
             │
             ├──► wikipedia_service.py (Wikipedia API)
             │    • fetch_summary()
             │    • search_pages()
             │    • batch_fetch_summaries()
             │    ✓ User-Agent header (fixes 403)
             │    ✓ Retry logic with backoff
             │    ✓ Graceful error handling
             │
             └──► search_service.py (DuckDuckGo + helpers)
                  • duckduckgo_search()
                  • extract_candidate_names_from_results()
                  • enrich_candidates_with_wikipedia()
```

## Pipeline Flow

```
1. Award Selected
   ↓
2. Fetch/Extract Metrics (Llama 3.3)
   ↓
3. ┌─ Track A: Llama → Names → Wikipedia ─┐
   │                                        │
   └─ Track B: Queries → DDG → Wikipedia ──┤
                                            ↓
4. Merge + Deduplicate
   ↓
5. Strict High-Profile Filter
   • Must have Forbes/CEO/Chairman/billionaire signals
   • Must have ≥200 char Wikipedia summary
   • Must NOT have small/local business keywords
   ↓
6. AI Ranking (Llama 3.3)
   • Confidence score 0.0–1.0
   • Relevance reason per candidate
   ↓
7. Return Top-N Payloads
```

## Key Fixes Applied

### 1. Wikipedia 403 Errors — FIXED ✓
**Problem:** `api.php` returned 403 Forbidden without User-Agent header

**Solution:**
- Created `wikipedia_service.py` with proper headers:
  ```python
  USER_AGENT = "AwardsNomineeAI/1.0 (support@awardsai.com)"
  ```
- All Wikipedia requests now include this header
- Added retry logic with exponential backoff
- Graceful fallback on failures

### 2. Unreliable Name Extraction — FIXED ✓
**Problem:** DuckDuckGo HTML scraping couldn't reliably extract names

**Solution:**
- **Primary source**: Llama 3.3 directly generates candidate names
- **Supplementary**: DuckDuckGo results (failures don't crash pipeline)
- Wikipedia validates all names regardless of source

### 3. Hallucination Prevention — FIXED ✓
**Safeguards:**
- Every candidate MUST have a Wikipedia page (≥200 chars)
- Must match high-profile signals (Forbes, CEO, billionaire, etc.)
- Exclude small/local business keywords
- Confidence score ≥0.45 threshold
- Admin previews results before saving

## Configuration

### Environment Variables
```bash
GROQ_KEY=your_groq_api_key_here  # Required — get from console.groq.com
```

### Dependencies (already installed)
```
groq==0.11.0
httpx==0.27.2
```

## API Endpoints

### POST /api/admin/ai-search-nominees
**Request:**
```json
{
  "award_id": "6a02ccc1b8f6fcf1b0620b96",
  "num_results": 5
}
```

**Response:**
```json
[
  {
    "name": "Roshni Nadar Malhotra",
    "designation": "Chairperson",
    "organisation": "HCLTech",
    "photo_url": "https://...",
    "rationale": "Under her leadership, HCLTech...",
    "rationale_data": {
      "confidence_score": 0.92,
      "relevance_reason": "Leads major IT conglomerate...",
      "wikipedia_url": "https://en.wikipedia.org/...",
      "source_links": ["https://..."],
      "ai_generated": true
    },
    "sources": ["https://..."],
    "ai_generated": true
  }
]
```

### GET /api/admin/awards/{award_id}/metrics
Returns the AI-extracted evaluation metrics for an award.

## Frontend Integration

**ViewNominees.jsx** now shows:
- AI search loading state with animated brain icon
- Preview modal with confidence badges before saving
- Selectable candidates (admin can deselect any)
- Wikipedia links + source attribution
- "AI" badge on generated nominees

## Error Handling

All failures are gracefully handled:
- **Wikipedia 403** → Retry with backoff, then skip that candidate
- **DuckDuckGo timeout** → Log warning, continue with Track A only
- **Llama API error** → Raise 503 with clear message to user
- **No candidates found** → Return 404 with actionable message

## Logging

All services use Python's `logging` module:
- `INFO`: Pipeline progress, candidate counts
- `WARNING`: Recoverable failures (Wikipedia 404, DDG timeout)
- `ERROR`: Critical failures (Wikipedia 403 after retries)
- `DEBUG`: Detailed trace (query results, name extraction)

## Testing the Fix

1. Ensure `GROQ_KEY` is set in `backend/.env`
2. Start backend: `uvicorn main:app --reload`
3. Create an award with a descriptive description
4. Click "AI Search Nominees"
5. Verify:
   - No Wikipedia 403 errors in logs
   - Candidates appear in preview modal
   - Each has confidence score + Wikipedia link
   - Can select/deselect before saving

## Performance

- **Track A**: ~3-5 seconds (Llama + 20 Wikipedia fetches)
- **Track B**: ~4-6 seconds (6 DDG queries + Wikipedia enrichment)
- **Total**: ~5-8 seconds (tracks run in parallel)
- **Caching**: Metrics stored in DB after first extraction

## Future Enhancements

- [ ] Cache Wikipedia summaries in Redis (reduce API calls)
- [ ] Add more sources (LinkedIn, Crunchbase APIs)
- [ ] Support region-specific searches (US, EU, Asia)
- [ ] Admin feedback loop (mark candidates as good/bad to improve ranking)
