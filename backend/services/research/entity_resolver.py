"""
entity_resolver.py
─────────────────────
Merges raw candidate mentions into unique people.

Two mentions are merged only when their normalized core name matches AND at
least one corroborating signal agrees (shared organization, shared
designation family, or overlapping source domain). Name similarity alone
is never sufficient — this avoids merging two different people who happen
to share a name.
"""

import re

_HONORIFICS = {"mr", "mrs", "ms", "dr", "shri", "smt", "sir", "prof"}

_DESIGNATION_FAMILIES = [
    {"ceo", "chief executive", "chief executive officer"},
    {"chairman", "chairperson", "chair", "executive chairman", "group chairman"},
    {"founder", "co-founder"},
    {"managing director", "md"},
    {"president"},
    {"director"},
]


def _normalize_name(name: str) -> str:
    words = [w.strip(".,") for w in name.split()]
    words = [w for w in words if w.lower() not in _HONORIFICS]
    return " ".join(words).lower()


def _names_compatible(name_a: str, name_b: str) -> bool:
    """
    True if two names could plausibly be the same person once middle names/
    suffixes are accounted for: same first token, and the shorter name's
    last token appears somewhere in the longer name's tokens. This is what
    makes 'Roshni Nadar' match 'Roshni Nadar Malhotra' without requiring an
    exact 'first + last token' key match (which breaks when a middle name
    shifts which token is 'last').
    """
    words_a = _normalize_name(name_a).split()
    words_b = _normalize_name(name_b).split()
    if not words_a or not words_b:
        return False
    if words_a[0] != words_b[0]:
        return False
    if len(words_a) <= len(words_b):
        shorter, longer = words_a, words_b
    else:
        shorter, longer = words_b, words_a
    return shorter[-1] in longer[1:] or shorter[-1] == longer[-1]


def _designation_family(designation: str) -> str | None:
    d = designation.lower()
    for family in _DESIGNATION_FAMILIES:
        if any(term in d for term in family):
            return next(iter(family))
    return None


def _orgs_match(a: str, b: str) -> bool:
    if not a or not b:
        return False
    a, b = a.lower().strip(), b.lower().strip()
    return a == b or a in b or b in a


def _domains_overlap(a: list[dict], b: list[dict]) -> bool:
    da = {s.get("domain", "") for s in a if s.get("domain")}
    db = {s.get("domain", "") for s in b if s.get("domain")}
    return bool(da & db)


def _should_merge(existing: dict, mention: dict) -> bool:
    if not _names_compatible(existing["name"], mention["name"]):
        return False

    same_org = _orgs_match(existing.get("organization", ""), mention.get("organization", ""))
    fam_a, fam_b = _designation_family(existing.get("designation", "")), _designation_family(mention.get("designation", ""))
    same_designation_family = bool(fam_a and fam_a == fam_b)
    overlapping_sources = _domains_overlap(existing.get("candidate_sources", []), mention.get("candidate_sources", []))

    # Require at least one corroborating signal beyond name match, unless
    # neither mention has any organization/designation info at all — in that
    # thin-evidence case a matching full name is the only signal available.
    if not existing.get("organization") and not mention.get("organization") and not existing.get("designation") and not mention.get("designation"):
        return existing["name"].lower() == mention["name"].lower()

    return same_org or same_designation_family or overlapping_sources


def _merge_into(existing: dict, mention: dict) -> None:
    # Prefer the more complete (longer) organization/designation string.
    if len(mention.get("organization", "")) > len(existing.get("organization", "")):
        existing["organization"] = mention["organization"]
    if len(mention.get("designation", "")) > len(existing.get("designation", "")):
        existing["designation"] = mention["designation"]
    # Prefer the longer/fuller name variant (e.g. "Roshni Nadar Malhotra" over "Roshni Nadar").
    if len(mention.get("name", "")) > len(existing.get("name", "")):
        existing["name"] = mention["name"]

    existing_urls = {s["url"] for s in existing["candidate_sources"] if s.get("url")}
    for s in mention.get("candidate_sources", []):
        if s.get("url") not in existing_urls:
            existing["candidate_sources"].append(s)
            existing_urls.add(s.get("url"))

    existing.setdefault("evidence", [])
    existing_ev_urls = {e.get("source_url") for e in existing["evidence"]}
    for e in mention.get("evidence", []):
        if e.get("source_url") not in existing_ev_urls:
            existing["evidence"].append(e)
            existing_ev_urls.add(e.get("source_url"))


def resolve_entities(mentions: list[dict]) -> list[dict]:
    """
    Merge raw mentions into unique candidates. Order-preserving greedy merge —
    fine at the scale of a few hundred mentions per research run.
    """
    resolved: list[dict] = []

    for mention in mentions:
        merged = False
        for existing in resolved:
            if _should_merge(existing, mention):
                _merge_into(existing, mention)
                merged = True
                break
        if not merged:
            resolved.append({
                "name": mention["name"],
                "designation": mention.get("designation", ""),
                "organization": mention.get("organization", ""),
                "location": mention.get("location", ""),
                "industry": mention.get("industry", ""),
                "candidate_sources": list(mention.get("candidate_sources", [])),
                "evidence": list(mention.get("evidence", [])),
            })

    return resolved
