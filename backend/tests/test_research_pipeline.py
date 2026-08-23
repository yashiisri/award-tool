"""
Tests for the evidence-based AI nominee research engine.

Everything here is mocked — no test depends on a live Tavily/Brave/Groq/
Wikipedia/MongoDB call. Run with:

    pytest backend/tests/test_research_pipeline.py -v
"""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from services.research.search_provider import SearchProvider, SearchResult, run_bounded_searches
from services.research import candidate_extractor, entity_resolver, source_quality, ranking_service, query_generator


# ── Fakes ───────────────────────────────────────────────────────────────────────

class FakeProvider(SearchProvider):
    """A configurable in-memory provider — no network calls."""
    def __init__(self, name="fake", results_by_query=None, configured=True, error_on=None, delay=0):
        self.name = name
        self._results = results_by_query or {}
        self._configured = configured
        self._error_on = error_on or set()
        self._delay = delay
        self.call_count = 0

    @property
    def is_configured(self):
        return self._configured

    async def search(self, query, max_results=8):
        self.call_count += 1
        if query in self._error_on:
            raise RuntimeError(f"simulated failure for {query}")
        if self._delay:
            await asyncio.sleep(self._delay)
        return self._results.get(query, [])


class FakeCollection:
    """Minimal in-memory stand-in for a Motor collection."""
    def __init__(self):
        self.store = {}

    async def find_one(self, query):
        return self.store.get(query.get("_id"))

    async def update_one(self, query, update, upsert=False):
        doc = {"_id": query["_id"], **update.get("$set", {})}
        self.store[query["_id"]] = doc

    async def create_index(self, *a, **kw):
        return None


class FakeDB:
    def __init__(self):
        self._collections = {}

    def __getitem__(self, name):
        return self._collections.setdefault(name, FakeCollection())


def sr(title, url, snippet, published_date=None):
    return SearchResult(title=title, url=url, snippet=snippet, published_date=published_date)


# ── Query generation ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_discovery_queries_use_plan_not_hardcoded_geography():
    plan = {"industry": "", "geography": "Japan", "leadership_requirements": "", "keywords": ["robotics pioneers"], "award_title": "x"}
    queries = await query_generator.generate_discovery_queries(plan, max_queries=10)
    assert queries, "expected at least one query"
    assert any("Japan" in q for q in queries), "geography from the award should drive queries, not a hardcoded country"
    assert not any("india" in q.lower() for q in queries), "must not hardcode India when the award specifies another geography"


@pytest.mark.asyncio
async def test_discovery_queries_expand_industry_via_mocked_llm():
    plan = {"industry": "Technology", "geography": "Global", "leadership_requirements": "", "keywords": [], "award_title": "x"}
    with patch("services.research.query_generator.expand_industry_terms", new=AsyncMock(return_value=["software", "AI"])):
        queries = await query_generator.generate_discovery_queries(plan, max_queries=20)
    assert any("software" in q or "AI" in q for q in queries)


def test_candidate_queries_are_targeted_and_deduplicated():
    queries = query_generator.generate_candidate_queries("Jane Smith", "Acme Corp", "Leader Award")
    assert '"Jane Smith" Acme Corp' in queries
    assert len(queries) == len(set(q.lower() for q in queries))


# ── Candidate extraction (no hallucination) ──────────────────────────────────────

def test_extractor_only_returns_names_present_in_evidence():
    results = [sr("Jane Smith, CEO of Acme Corp, unveils new strategy", "https://reuters.com/a", "Jane Smith said Acme Corp would expand.")]
    candidates = candidate_extractor.extract_candidates(results)
    assert len(candidates) == 1
    assert candidates[0]["name"] == "Jane Smith"
    assert candidates[0]["evidence"][0]["source_url"] == "https://reuters.com/a"


def test_extractor_rejects_results_with_no_leadership_signal():
    results = [sr("Local bakery wins community prize", "https://example.com/a", "A small bakery run by John Baker won a prize.")]
    candidates = candidate_extractor.extract_candidates(results)
    assert candidates == [], "no leadership-role keyword present — must not extract a candidate"


def test_extractor_never_invents_a_name_not_in_the_text():
    results = [sr("CEO announces record profits", "https://example.com/b", "The company's CEO announced record profits this quarter.")]
    candidates = candidate_extractor.extract_candidates(results)
    # No proper-noun person name appears anywhere in title/snippet -> nothing should be extracted.
    assert candidates == []


# ── Entity resolution ─────────────────────────────────────────────────────────────

def test_resolver_merges_same_person_same_org():
    mentions = [
        {"name": "Roshni Nadar", "designation": "Chairperson", "organization": "HCLTech",
         "location": "", "industry": "", "candidate_sources": [{"url": "https://a.com/1", "title": "t1", "domain": "a.com"}],
         "evidence": [{"source_url": "https://a.com/1"}]},
        {"name": "Roshni Nadar Malhotra", "designation": "Chairperson", "organization": "HCLTech",
         "location": "", "industry": "", "candidate_sources": [{"url": "https://b.com/1", "title": "t2", "domain": "b.com"}],
         "evidence": [{"source_url": "https://b.com/1"}]},
    ]
    resolved = entity_resolver.resolve_entities(mentions)
    assert len(resolved) == 1
    assert resolved[0]["name"] == "Roshni Nadar Malhotra"  # fuller variant wins
    assert len(resolved[0]["candidate_sources"]) == 2


def test_resolver_does_not_merge_same_name_different_org():
    mentions = [
        {"name": "John Smith", "designation": "CEO", "organization": "Acme Corp",
         "location": "", "industry": "", "candidate_sources": [{"url": "https://a.com/1", "domain": "a.com"}], "evidence": []},
        {"name": "John Smith", "designation": "Founder", "organization": "Globex Inc",
         "location": "", "industry": "", "candidate_sources": [{"url": "https://b.com/1", "domain": "b.com"}], "evidence": []},
    ]
    resolved = entity_resolver.resolve_entities(mentions)
    assert len(resolved) == 2, "two different people sharing a name must never be merged solely on name similarity"


def test_resolver_merges_thin_evidence_only_on_exact_name():
    mentions = [
        {"name": "Ana Silva", "designation": "", "organization": "", "location": "", "industry": "",
         "candidate_sources": [{"url": "https://a.com/1", "domain": "a.com"}], "evidence": []},
        {"name": "Ana Silva", "designation": "", "organization": "", "location": "", "industry": "",
         "candidate_sources": [{"url": "https://b.com/1", "domain": "b.com"}], "evidence": []},
    ]
    resolved = entity_resolver.resolve_entities(mentions)
    assert len(resolved) == 1


# ── Source quality ────────────────────────────────────────────────────────────────

def test_source_quality_tiers():
    assert source_quality.score_domain("https://reuters.com/article") >= 0.8
    assert source_quality.score_domain("https://en.wikipedia.org/wiki/X") < source_quality.score_domain("https://reuters.com/x")
    assert source_quality.score_domain("https://randomblog.blogspot.com/x") <= 0.2
    assert source_quality.tier_label("https://reuters.com/x") == "major_publication"


# ── Verification + scoring (deterministic) ────────────────────────────────────────

def test_verify_candidate_unverified_with_no_evidence():
    status, confidence = ranking_service.verify_candidate({"evidence": []})
    assert status == "unverified"
    assert confidence == 0.0


def test_verify_candidate_verified_with_two_independent_quality_sources():
    candidate = {"evidence": [
        {"source_domain": "reuters.com", "source_quality": 0.8},
        {"source_domain": "forbes.com", "source_quality": 0.8},
    ]}
    status, confidence = ranking_service.verify_candidate(candidate)
    assert status == "verified"
    assert confidence > 0.5


def test_verify_candidate_partially_verified_with_single_source():
    candidate = {"evidence": [{"source_domain": "example.com", "source_quality": 0.3}]}
    status, _ = ranking_service.verify_candidate(candidate)
    assert status == "partially_verified"


def test_score_candidate_rewards_keyword_and_achievement_evidence():
    plan = {"keywords": ["fintech innovation"], "leadership_requirements": "CEO", "industry": "Fintech"}
    candidate = {
        "designation": "CEO", "organization": "PaySafe",
        "evidence": [{"evidence_text": "As CEO, she launched a fintech innovation platform and led PaySafe to profitability.",
                      "claim": "", "source_quality": 0.8, "source_domain": "reuters.com"}],
    }
    result = ranking_service.score_candidate(candidate, plan)
    assert result["scores"]["award_relevance"] > 0
    assert result["scores"]["achievement_strength"] > 0
    assert 0 <= result["overall_score"] <= 1


def test_deterministic_rationale_never_requires_llm():
    candidate = {"name": "Jane Smith", "designation": "CEO", "organization": "Acme",
                 "evidence": [{"source_domain": "reuters.com", "source_quality": 0.8}]}
    rationale = ranking_service.deterministic_rationale(candidate)
    assert "Jane Smith" in rationale


# ── Bounded search runner: caching, dedup, timeout/failure isolation ─────────────

@pytest.mark.asyncio
async def test_run_bounded_searches_returns_empty_when_no_provider_configured():
    provider = FakeProvider(configured=False)
    results = await run_bounded_searches(FakeDB(), [provider], ["query one"])
    assert results["query one"] == []
    assert provider.call_count == 0


@pytest.mark.asyncio
async def test_run_bounded_searches_deduplicates_identical_queries():
    provider = FakeProvider(results_by_query={"q": [sr("t", "https://x.com", "s")]})
    await run_bounded_searches(FakeDB(), [provider], ["q", "q", "q"])
    assert provider.call_count == 1


@pytest.mark.asyncio
async def test_run_bounded_searches_isolates_one_provider_failure():
    good = FakeProvider(name="good", results_by_query={"q": [sr("t", "https://x.com", "s")]})
    bad = FakeProvider(name="bad", error_on={"q"})
    results = await run_bounded_searches(FakeDB(), [good, bad], ["q"])
    assert len(results["q"]) == 1, "a failing provider must not prevent results from a working one"


@pytest.mark.asyncio
async def test_run_bounded_searches_uses_cache_on_second_call():
    provider = FakeProvider(results_by_query={"q": [sr("t", "https://x.com", "s")]})
    db = FakeDB()
    await run_bounded_searches(db, [provider], ["q"])
    await run_bounded_searches(db, [provider], ["q"])
    assert provider.call_count == 1, "second call should be served from cache, not hit the provider again"


# ── End-to-end pipeline (mocked provider) ────────────────────────────────────────

@pytest.mark.asyncio
async def test_orchestrator_end_to_end_with_mocked_provider():
    from services.research import research_orchestrator

    discovery_result = sr(
        "Jane Smith, CEO of Acme Robotics, drives industry growth",
        "https://reuters.com/jane-smith", "Jane Smith is CEO of Acme Robotics and led major expansion.",
    )
    evidence_result = sr(
        "Jane Smith named to Forbes list", "https://forbes.com/jane-smith",
        "Forbes profiles Jane Smith, CEO of Acme Robotics, for her leadership achievements.",
    )

    fake_tavily = FakeProvider(name="tavily", configured=True, results_by_query={})
    # Every discovery query returns the same result set; every candidate query returns the evidence result.
    for i in range(50):
        fake_tavily._results[f"discovery_{i}"] = [discovery_result]
    fake_tavily.search = AsyncMock(side_effect=lambda query, max_results=8: (
        [discovery_result] if "robotics" in query.lower() or "leaders" in query.lower() or "innovation" in query.lower()
        else [evidence_result] if "Jane Smith" in query
        else []
    ))

    fake_brave = FakeProvider(name="brave", configured=False)

    with patch.object(research_orchestrator, "TavilyProvider", return_value=fake_tavily), \
         patch.object(research_orchestrator, "BraveProvider", return_value=fake_brave):
        award = {"name": "Robotics Leader Award", "description": "For leaders driving robotics industry growth."}
        result = await research_orchestrator.run_research(FakeDB(), award, "award123", num_results=3)

    assert result["research_metadata"]["providers_used"] == ["tavily"]
    names = [c["name"] for c in result["candidates"]]
    assert names, "expected at least one candidate discovered from mocked evidence"
    assert all(n == "Jane Smith" for n in names), "no candidate should appear that wasn't present in the mocked search results"
    for c in result["candidates"]:
        assert c["verification_status"] in ("verified", "partially_verified", "unverified")
        assert 0 <= c["overall_score"] <= 1
        assert c["organisation"]  # British spelling, matches existing DB/frontend field


@pytest.mark.asyncio
async def test_orchestrator_returns_diagnostic_when_no_provider_configured():
    from services.research import research_orchestrator

    with patch.object(research_orchestrator, "TavilyProvider", return_value=FakeProvider(configured=False)), \
         patch.object(research_orchestrator, "BraveProvider", return_value=FakeProvider(configured=False)):
        award = {"name": "Any Award", "description": "desc"}
        result = await research_orchestrator.run_research(FakeDB(), award, "award123", num_results=3)

    assert result["candidates"] == []
    assert result["research_metadata"]["diagnostic"]
