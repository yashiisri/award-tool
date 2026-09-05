import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_database
from auth import get_current_user
from bson import ObjectId
from datetime import datetime
# Imported at module load (server startup), not inside the request handler —
# this pulls in a deep dependency chain (bs4, groq, httpx research pipeline)
# that's slow to import cold; doing it lazily meant the FIRST suggest-nominee
# request after every server restart ate that whole cost as request latency.
from services.nominee_suggestion import enrich_suggested_nominee
from services.vote_status import compute_award_vote_stats, get_my_confirmed_awards

router = APIRouter()

def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    for k in ["created_at", "updated_at", "timestamp"]:
        if k in doc and doc[k]:
            doc[k] = doc[k].isoformat()
    return doc

async def log_action(db, user, action, details):
    await db.audit_logs.insert_one({
        "user_id": user["sub"], "user_role": user["role"],
        "action": action, "details": details, "timestamp": datetime.utcnow()
    })

class ValidateNominee(BaseModel):
    nominee_id: str

class ConfirmNominationsRequest(BaseModel):
    award_id: str

class CommentRequest(BaseModel):
    nominee_id: str
    award_id: str
    comment: str

class FlagRequest(BaseModel):
    nominee_id: str
    reason: str

RANK_LABELS = ["first", "second"]

class SubmitRankingRequest(BaseModel):
    award_id: str
    choices: list[str]  # ordered nominee_ids, index 0 = 1st choice, index 1 = 2nd choice

class SuggestNomineeRequest(BaseModel):
    award_id: str
    name: str
    designation: str
    organisation: Optional[str] = ""

@router.get("/awards")
async def get_awards(user=Depends(get_current_user)):
    """Each award also carries computed nomination/voting-readiness fields
    (see services/vote_status.py for the rule) so the awards list, the
    nominees screen, and the vote-ranked gate all agree on the same numbers.
    Head Jury's own GET /head-jury/awards uses the same shared helper."""
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    awards = await db.awards.find().to_list(100)
    award_ids = [str(a["_id"]) for a in awards]
    stats_by_award = await compute_award_vote_stats(db, award_ids)
    my_confirmed = await get_my_confirmed_awards(db, user["sub"], award_ids)

    result = []
    for a in awards:
        d = serialize(a)  # mutates in place — d["id"] is the same string used as award_ids' keys above
        d.update(stats_by_award.get(d["id"], {
            "total_nominees": 0, "pending_nominations": 0, "nominations_ready": False,
            "voting_enabled": False, "nomination_enabled": False, "total_reviewers": 0,
            "confirmed_reviewers": 0, "all_confirmed": False, "voting_open": False,
        }))
        d["my_confirmed"] = d["id"] in my_confirmed
        result.append(d)
    return result

@router.get("/awards/{award_id}/nominees")
async def get_nominees_for_award(award_id: str, user=Depends(get_current_user)):
    """Nominees available for browsing/voting — unfiltered, same as
    GET /head-jury/nominees/{award_id} and GET /admin/nominees/{award_id}, so
    a jury member sees their own just-suggested nominee immediately instead
    of it being hidden pending Head Jury approval."""
    db = get_database()
    nominees = await db.nominees.find({"award_id": award_id}).to_list(100)
    return [serialize(n) for n in nominees]

@router.post("/suggest-nominee")
async def suggest_nominee(req: SuggestNomineeRequest, user=Depends(get_current_user)):
    """Jury or Head Jury suggest a name — the profile is looked up and built
    automatically in the background; nobody types in a bio by hand."""
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()

    award = await db.awards.find_one({"_id": ObjectId(req.award_id)})
    if not award:
        raise HTTPException(status_code=404, detail="Award not found")

    doc = {
        "award_id": req.award_id,
        "name": req.name,
        "designation": req.designation,
        "organisation": req.organisation or "",
        "photo_url": "",
        "rationale": "",
        "rationale_data": {},
        "validated_by": [],
        "red_flagged": False,
        "ai_generated": False,
        "suggested_by": user["sub"],
        "suggested_by_role": user["role"],
        "enrichment_status": "pending",
        "created_at": datetime.utcnow(),
    }
    result = await db.nominees.insert_one(doc)
    nominee_id = str(result.inserted_id)

    asyncio.create_task(enrich_suggested_nominee(
        nominee_id=nominee_id,
        name=req.name,
        designation=req.designation,
        organisation=req.organisation or "",
        award_name=award.get("name", ""),
        award_description=award.get("description", ""),
        evaluation_criteria=award.get("criteria", []),
    ))

    await log_action(db, user, "suggest_nominee", {"award_id": req.award_id, "name": req.name})
    return {"id": nominee_id, "message": "Nominee suggested — profile is being built"}

@router.post("/validate-nominee")
async def validate_nominee(req: ValidateNominee, user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    await db.nominees.update_one(
        {"_id": ObjectId(req.nominee_id)},
        {"$addToSet": {"validated_by": user["sub"]}}
    )
    await log_action(db, user, "validate_nominee", {"nominee_id": req.nominee_id})
    return {"message": "Nominee validated"}

@router.post("/confirm-nominations")
async def confirm_nominations(req: ConfirmNominationsRequest, user=Depends(get_current_user)):
    """Toggle: each jury/head-jury user marks themselves done reviewing an
    award's nominees. Voting can't open until every jury AND head_jury user
    in the system has confirmed (see services/vote_status.py) — this is a
    real, tracked requirement, not just a personal reminder."""
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    existing = await db.nomination_confirmations.find_one({"award_id": req.award_id, "username": user["sub"]})
    if existing:
        await db.nomination_confirmations.delete_one({"_id": existing["_id"]})
        confirmed = False
    else:
        await db.nomination_confirmations.insert_one({
            "award_id": req.award_id, "username": user["sub"], "role": user["role"],
            "confirmed_at": datetime.utcnow(),
        })
        confirmed = True
    await log_action(db, user, "confirm_nominations" if confirmed else "unconfirm_nominations", {"award_id": req.award_id})
    return {"confirmed": confirmed}

@router.post("/comment")
async def add_comment(req: CommentRequest, user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    doc = {**req.dict(), "jury_id": user["sub"], "jury_role": user["role"], "created_at": datetime.utcnow()}
    result = await db.comments.insert_one(doc)
    await log_action(db, user, "add_comment", {"nominee_id": req.nominee_id, "award_id": req.award_id})
    return {"id": str(result.inserted_id), "message": "Comment added"}

@router.post("/flag-nominee")
async def flag_nominee(req: FlagRequest, user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    await db.nominees.update_one(
        {"_id": ObjectId(req.nominee_id)},
        {"$set": {"red_flagged": True, "red_flag_reason": req.reason, "red_flagged_by": user["sub"]}}
    )
    await log_action(db, user, "red_flag_nominee", {"nominee_id": req.nominee_id, "reason": req.reason})
    return {"message": "Nominee flagged"}

@router.get("/vote-control/{award_id}")
async def get_vote_control(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    control = await db.vote_controls.find_one({"award_id": award_id})
    if not control:
        return {"voting_enabled": False, "nomination_enabled": False}
    return serialize(control)

@router.get("/results/{award_id}")
async def get_results(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    # Check if results are published
    award = await db.awards.find_one({"_id": ObjectId(award_id)})
    if not award or not award.get("results_published"):
        raise HTTPException(status_code=403, detail="Results not published yet")
    nominees = await db.nominees.find({"award_id": award_id}).sort("total_score", -1).to_list(100)
    return [serialize(n) for n in nominees]

@router.get("/nominees/{award_id}")
async def get_nominees_legacy(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    nominees = await db.nominees.find({"award_id": award_id}).to_list(100)
    return [serialize(n) for n in nominees]


# ── Jury Voting (ranked choice, one-time, no visible points) ───────────────────
#
# Every jury member (regular and head jury alike) ranks their top 2 nominees —
# a 1st and 2nd choice. Every ranked slot counts as one vote each toward
# that nominee's total (no point weighting by rank position — rank only breaks
# ties via first_choice_votes). Once submitted, a vote is final and cannot be
# resubmitted. The winner is whoever has the most total votes.
#
# Voting-open rule: always requires every jury-suggested nominee for the
# award approved by Head Jury (no pending ones left, at least one nominee
# exists). On top of that, EITHER path opens voting: (A) every jury/head_jury
# user has tapped "Confirm Nominations" for this award, or (B) Admin has
# explicitly opened voting via Vote Control (vote_controls.voting_enabled) —
# Admin's own direct authority, works even without full confirmation. Same
# rule computed in GET /awards above (services/vote_status.py) — kept in
# sync by hand since this one needs single-award queries instead of the list
# endpoint's batch aggregation.

async def _voting_open_for_award(db, award_id: str) -> bool:
    total = await db.nominees.count_documents({"award_id": award_id})
    if total == 0:
        return False
    pending = await db.nominees.count_documents({
        "award_id": award_id,
        "suggested_by": {"$nin": [None, ""]},
        "validated_by": {"$size": 0},
    })
    if pending > 0:
        return False

    control = await db.vote_controls.find_one({"award_id": award_id})
    if control and control.get("voting_enabled"):
        return True

    total_reviewers = await db.users.count_documents({"role": {"$in": ["jury", "head_jury"]}})
    if total_reviewers == 0:
        return False
    confirmed_usernames = await db.nomination_confirmations.distinct("username", {"award_id": award_id})
    return len(confirmed_usernames) >= total_reviewers


@router.post("/vote-ranked")
async def submit_ranking(req: SubmitRankingRequest, user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403, detail="Only jury members can vote")

    if len(req.choices) != 2:
        raise HTTPException(status_code=400, detail="Rank exactly 2 nominees")
    if len(set(req.choices)) != len(req.choices):
        raise HTTPException(status_code=400, detail="Each choice must be a different nominee")

    db = get_database()

    if not await _voting_open_for_award(db, req.award_id):
        raise HTTPException(
            status_code=403,
            detail="Voting is not open for this award yet — all jury-suggested nominees must be approved by Head Jury first.",
        )

    jury_id = user["sub"]

    existing = await db.jury_rankings.find_one({"award_id": req.award_id, "jury_id": jury_id})
    if existing:
        raise HTTPException(status_code=400, detail="You have already voted for this award")

    for nominee_id in req.choices:
        nom = await db.nominees.find_one({"_id": ObjectId(nominee_id), "award_id": req.award_id})
        if not nom:
            raise HTTPException(status_code=404, detail="Nominee not found for this award")

    now = datetime.utcnow()
    docs = [
        {
            "award_id":   req.award_id,
            "nominee_id": nominee_id,
            "jury_id":    jury_id,
            "jury_role":  user["role"],
            "choice":     RANK_LABELS[i],
            "created_at": now,
        }
        for i, nominee_id in enumerate(req.choices)
    ]
    await db.jury_rankings.insert_many(docs)

    for nominee_id in req.choices:
        await db.nominees.update_one(
            {"_id": ObjectId(nominee_id)},
            {"$inc": {"total_score": 1}, "$addToSet": {"voted_by": jury_id}},
        )

    await log_action(db, user, "submit_vote", {
        "award_id": req.award_id,
        "choices": req.choices,
    })

    return {"message": "Vote submitted"}


@router.get("/my-vote/{award_id}")
async def get_my_vote(award_id: str, user=Depends(get_current_user)):
    """Returns this jury member's submitted vote for an award (ordered 1st -> 2nd
    choice nominee_ids), or null if not yet voted."""
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)

    db = get_database()
    rows = await db.jury_rankings.find({"award_id": award_id, "jury_id": user["sub"]}).to_list(10)
    if not rows:
        return None

    by_label = {r["choice"]: r["nominee_id"] for r in rows}
    choices = [by_label[label] for label in RANK_LABELS if label in by_label]

    return {
        "award_id":     award_id,
        "choices":      choices,
        "submitted_at": rows[0].get("created_at", "").isoformat() if rows[0].get("created_at") else "",
    }
