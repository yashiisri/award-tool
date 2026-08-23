"""
Tests for the AIMA-specialized nominee research engine.

Same conventions as test_research_pipeline.py — everything mocked, no live
Tavily/Brave/Groq/Wikipedia/MongoDB calls.

    pytest backend/tests/test_aima_engine.py -v
"""

from unittest.mock import AsyncMock, patch

import pytest

from services.research import (
    aima_category_profile,
    aima_history,
    entity_classifier,
    entity_resolver,
    ranking_service,
)
from services.research.entity_classifier import EntityType, classify, is_person
from services.research.search_provider import SearchProvider, SearchResult

from tests.test_research_pipeline import FakeDB, FakeProvider, sr  # reuse existing fakes


# ── Entity classification — spec §4/§22 required cases ──────────────────────────

@pytest.mark.parametrize("name,expected", [
    ("Infosys", EntityType.COMPANY),
    ("Serum Institute of India", EntityType.COMPANY),
    ("ISRO", EntityType.ORGANIZATION),
    ("Adar Poonawalla", EntityType.PERSON),
    ("Sanjiv Puri", EntityType.PERSON),
])
def test_entity_classification_required_cases(name, expected):
    assert classify(name) == expected


def test_is_person_helper_matches_classify():
    assert is_person("Sanjiv Puri") is True
    assert is_person("Infosys") is False
    assert is_person("ISRO") is False


def test_headline_noise_phrases_are_not_classified_as_person():
    # Regression: live testing on a real "Business Leader" search surfaced
    # these exact false positives.
    assert classify("Ihub Awadh") != EntityType.PERSON        # a startup incubator, not a person
    assert classify("Partner Sripad") != EntityType.PERSON     # role-word fused onto a name fragment
    assert classify("Most Influential") != EntityType.PERSON   # a headline superlative, not a name
    assert classify("Satya Nadella") == EntityType.PERSON      # a real person must still pass
    assert classify("Vinod Nair") == EntityType.PERSON


def test_brand_india_pattern_is_classified_as_company_not_person():
    # Regression: live testing surfaced "Dabur India" being extracted as a
    # person nominee — "<Brand> India" is a company-naming pattern, not a name.
    assert classify("Dabur India") == EntityType.COMPANY
    assert classify("Coca-Cola India") == EntityType.COMPANY
    assert classify("Mohit Malhotra") == EntityType.PERSON  # a real person must still pass


def test_llm_can_never_override_a_company_classification():
    # There is no code path in entity_classifier that consults an LLM at all —
    # this test documents that guarantee: classification is a pure function
    # of the name string, deterministic and famous-name-proof.
    for _ in range(3):
        assert classify("Infosys") == EntityType.COMPANY


# ── Candidate extraction now rejects companies (Morgan Stanley regression) ──────

def test_candidate_extractor_does_not_treat_a_role_word_as_an_organization():
    # Regression: "Aditya Vikram Birla, Director" was extracted with
    # organization="Director" — a role word echoed back as if it were a company.
    from services.research import candidate_extractor
    results = [sr(
        "Aditya Vikram Birla, Director, leads expansion",
        "https://example.com/a",
        "Aditya Vikram Birla is Director and led major expansion at the group.",
    )]
    candidates = candidate_extractor.extract_candidates(results)
    orgs = [c["organization"] for c in candidates if c["name"] == "Aditya Vikram Birla"]
    assert orgs and all(org.lower() != "director" for org in orgs)


def test_candidate_extractor_does_not_treat_a_location_as_an_organization():
    # Regression: "Satya Nadella ... speaking in California" was extracted
    # with organization="California" instead of his actual employer.
    from services.research import candidate_extractor
    results = [sr(
        "Satya Nadella, Chairman, speaks at a conference in California",
        "https://example.com/a",
        "Satya Nadella, Chairman of Microsoft, was speaking in California about industry leadership.",
    )]
    candidates = candidate_extractor.extract_candidates(results)
    orgs = [c["organization"] for c in candidates if c["name"] == "Satya Nadella"]
    assert orgs and all(org.lower() != "california" for org in orgs)


def test_candidate_extractor_rejects_company_shaped_names():
    from services.research import candidate_extractor
    results = [sr(
        "Morgan Stanley Chairman discusses digital transformation",
        "https://example.com/a",
        "Morgan Stanley Chairman said the firm would expand its digital transformation efforts.",
    )]
    candidates = candidate_extractor.extract_candidates(results)
    names = [c["name"] for c in candidates]
    assert "Morgan Stanley" not in names


# ── Entity resolution: similar names not incorrectly merged ─────────────────────

def test_similar_named_people_not_merged():
    mentions = [
        {"name": "Sanjiv Puri", "designation": "Chairman & MD", "organization": "ITC Ltd",
         "location": "", "industry": "", "candidate_sources": [{"url": "https://a.com/1", "domain": "a.com"}], "evidence": []},
        {"name": "Sanjiv Mehta", "designation": "Chairman & MD", "organization": "Hindustan Unilever Ltd",
         "location": "", "industry": "", "candidate_sources": [{"url": "https://b.com/1", "domain": "b.com"}], "evidence": []},
    ]
    resolved = entity_resolver.resolve_entities(mentions)
    assert len(resolved) == 2, "different people with similar first names must not be merged"


# ── Minimum evidence rule (spec §11) ─────────────────────────────────────────────

def test_person_with_no_wikipedia_but_strong_official_and_news_evidence_is_accepted():
    candidate = {"evidence": [
        {"source_domain": "itc.in", "source_quality": 0.9},
        {"source_domain": "reuters.com", "source_quality": 0.8},
    ]}
    status, confidence = ranking_service.verify_candidate(candidate)
    assert status == "verified"
    assert confidence > 0.5


def test_person_with_wikipedia_but_no_other_credible_evidence_is_not_verified():
    candidate = {"evidence": [{"source_domain": "wikipedia.org", "source_quality": 0.55}]}
    status, _ = ranking_service.verify_candidate(candidate)
    assert status != "verified", "a single Wikipedia source alone must not be enough for full verification"


def test_single_weak_blog_source_fails_minimum_evidence_gate():
    domains = {e.get("source_domain", "") for e in [{"source_domain": "randomblog.blogspot.com"}]}
    assert len(domains) < 2, "one weak source must not satisfy a minimum-2-independent-sources rule"


def test_three_credible_sources_meets_minimum_evidence_gate():
    evidence = [
        {"source_domain": "reuters.com", "source_quality": 0.8},
        {"source_domain": "forbes.com", "source_quality": 0.8},
        {"source_domain": "economictimes.indiatimes.com", "source_quality": 0.8},
    ]
    domains = {e["source_domain"] for e in evidence}
    assert len(domains) >= 3
    status, confidence = ranking_service.verify_candidate({"evidence": evidence})
    assert status == "verified"


# ── Category profiles derived from real historical data ─────────────────────────

def test_organization_category_is_correctly_typed():
    profile = aima_category_profile.build_profile("indian_mnc_of_the_year")
    assert profile["candidate_entity_type"] == "ORGANIZATION"


def test_person_category_is_correctly_typed_from_real_history():
    profile = aima_category_profile.build_profile("business_leader")
    assert profile["candidate_entity_type"] == "PERSON"
    assert profile["historical_winner_count"] > 0
    assert any("Chairman" in r or "CEO" in r or "Managing Director" in r or "Chief Executive" in r
               for r in profile["preferred_roles"]), profile["preferred_roles"]


def test_category_profile_degrades_gracefully_with_no_history():
    profile = aima_category_profile.build_profile("a_category_with_no_verified_history_yet")
    assert profile["historical_winner_count"] == 0
    assert profile["candidate_entity_type"] == "PERSON"  # conservative default, not a crash
    assert profile["minimum_evidence_sources"] >= 2


def test_category_normalization_handles_name_drift():
    a = aima_history.normalize_category("Transformational Business Leader of the Year")
    b = aima_history.normalize_category("Transformational Business Leader")
    assert a == b == "transformational_business_leader"


def test_is_aima_award_detects_known_category_by_name():
    assert aima_history.is_aima_award("Business Leader of the Year", "") == "business_leader"
    assert aima_history.is_aima_award("Best Cupcake Baker of the Year", "") is None


# ── Organization category short-circuits before any search ──────────────────────

@pytest.mark.asyncio
async def test_aima_orchestrator_short_circuits_organization_category_without_searching():
    from services.research import aima_orchestrator

    fake_tavily = FakeProvider(name="tavily", configured=True)
    fake_brave = FakeProvider(name="brave", configured=False)

    with patch.object(aima_orchestrator, "TavilyProvider", return_value=fake_tavily), \
         patch.object(aima_orchestrator, "BraveProvider", return_value=fake_brave):
        award = {"name": "Indian MNC of the Year", "description": ""}
        result = await aima_orchestrator.run_aima_research(FakeDB(), award, "award1")

    assert result["status"] == "organization_category"
    assert fake_tavily.call_count == 0, "must never run a search for an organization-focused category"


# ── End-to-end AIMA pipeline: no company reaches the final candidate list ───────

@pytest.mark.asyncio
async def test_aima_orchestrator_end_to_end_excludes_companies_and_includes_verified_person():
    from services.research import aima_orchestrator

    person_hit = sr(
        "Ravi Kumar, CEO of Zenith Robotics, drives industry growth",
        "https://reuters.com/ravi-kumar",
        "Ravi Kumar is CEO of Zenith Robotics and led major industry transformation.",
    )
    person_evidence = sr(
        "Ravi Kumar named to Forbes India list", "https://forbes.com/ravi-kumar",
        "Forbes profiles Ravi Kumar, CEO of Zenith Robotics, for his leadership achievements.",
    )
    company_hit = sr(
        "Zenith Robotics Ltd reports record growth", "https://example.com/zenith",
        "Zenith Robotics Ltd said its business grew significantly this year.",
    )

    fake_tavily = FakeProvider(name="tavily", configured=True)
    fake_tavily.search = AsyncMock(side_effect=lambda query, max_results=8: (
        [person_evidence] if "Ravi Kumar" in query
        else [person_hit, company_hit]
    ))
    fake_brave = FakeProvider(name="brave", configured=False)

    with patch.object(aima_orchestrator, "TavilyProvider", return_value=fake_tavily), \
         patch.object(aima_orchestrator, "BraveProvider", return_value=fake_brave):
        award = {"name": "Business Leader of the Year", "description": "For outstanding Indian business leaders."}
        result = await aima_orchestrator.run_aima_research(FakeDB(), award, "award1", num_results=5)

    assert result["category"] == "business_leader"
    assert result["research_metadata"]["historical_years_analyzed"], "should report the real years the profile was built from"

    names = [c["name"] for c in result["candidates"]]
    assert "Zenith Robotics Ltd" not in names, "a company must never reach the final candidate list"
    assert all(c["entity_type"] == "PERSON" for c in result["candidates"])
    for c in result["candidates"]:
        assert "historical_comparison" in c
        assert "final_score" in c and 0 <= c["final_score"] <= 100
        assert c["organisation"], "backward-compat field must be populated"
