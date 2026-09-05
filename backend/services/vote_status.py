"""
vote_status.py
────────────────
Shared nomination/voting-phase computation for GET /jury/awards and
GET /head-jury/awards, so Jury and Head Jury always see the same phase
status for the same award. jury.py's submit_ranking() has the authoritative
single-award version of this same rule (_voting_open_for_award) — kept
separate because vote-ranked needs single-award queries, not a batch
aggregation across every award.

Voting for an award always requires nominations_ready — every jury-suggested
nominee approved by Head Jury (no pending ones left), and at least one
nominee exists. On top of that, EITHER of two independent paths opens
voting — not both required:
  A. all_confirmed — every user with role jury or head_jury has tapped
     "Confirm Nominations" for this award (POST /confirm-nominations,
     nomination_confirmations collection). The normal, no-admin-action-
     needed path.
  B. voting_enabled — Admin has explicitly opened voting for the award via
     Vote Control. Admin's own direct authority — works even if not
     everyone has confirmed yet.

voting_open = nominations_ready AND (all_confirmed OR voting_enabled)
"""


async def compute_award_vote_stats(db, award_ids: list[str]) -> dict[str, dict]:
    pipeline = [
        {"$match": {"award_id": {"$in": award_ids}}},
        {"$group": {
            "_id": "$award_id",
            "total": {"$sum": 1},
            "pending": {"$sum": {"$cond": [
                {"$and": [
                    # $ifNull (not $in/$nin) — aggregation-expression comparison
                    # operators don't treat a genuinely-missing field the same as an
                    # explicit null the way query-filter operators do, and AI-generated
                    # nominees have no suggested_by key at all. Without normalizing
                    # missing/null/"" to "" first, every AI-generated nominee gets
                    # miscounted as an unapproved jury suggestion.
                    {"$ne": [{"$ifNull": ["$suggested_by", ""]}, ""]},
                    {"$eq": [{"$size": {"$ifNull": ["$validated_by", []]}}, 0]},
                ]},
                1, 0,
            ]}},
        }},
    ]
    nominee_stats = {row["_id"]: row async for row in db.nominees.aggregate(pipeline)}
    controls = {c["award_id"]: c async for c in db.vote_controls.find({"award_id": {"$in": award_ids}})}

    total_reviewers = await db.users.count_documents({"role": {"$in": ["jury", "head_jury"]}})
    confirm_pipeline = [
        {"$match": {"award_id": {"$in": award_ids}}},
        {"$group": {"_id": "$award_id", "confirmed": {"$addToSet": "$username"}}},
    ]
    confirm_stats = {row["_id"]: row async for row in db.nomination_confirmations.aggregate(confirm_pipeline)}

    result = {}
    for aid in award_ids:
        stats = nominee_stats.get(aid, {"total": 0, "pending": 0})
        nominations_ready = stats["total"] > 0 and stats["pending"] == 0
        control = controls.get(aid, {})
        voting_enabled = bool(control.get("voting_enabled"))
        nomination_enabled = bool(control.get("nomination_enabled"))
        confirmed_count = len(confirm_stats.get(aid, {}).get("confirmed", []))
        all_confirmed = total_reviewers > 0 and confirmed_count >= total_reviewers
        result[aid] = {
            "total_nominees": stats["total"],
            "pending_nominations": stats["pending"],
            "nominations_ready": nominations_ready,
            "voting_enabled": voting_enabled,
            "nomination_enabled": nomination_enabled,
            "total_reviewers": total_reviewers,
            "confirmed_reviewers": confirmed_count,
            "all_confirmed": all_confirmed,
            "voting_open": nominations_ready and (all_confirmed or voting_enabled),
        }
    return result


async def get_my_confirmed_awards(db, username: str, award_ids: list[str]) -> set[str]:
    """award_ids (subset of the given list) this user has already confirmed."""
    rows = await db.nomination_confirmations.find(
        {"award_id": {"$in": award_ids}, "username": username}, {"award_id": 1},
    ).to_list(None)
    return {r["award_id"] for r in rows}
