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

class CommentRequest(BaseModel):
    nominee_id: str
    award_id: str
    comment: str

class FlagRequest(BaseModel):
    nominee_id: str
    reason: str

RANK_LABELS = ["first", "second", "third", "fourth", "fifth"]

class SubmitRankingRequest(BaseModel):
    award_id: str
    choices: list[str]  # ordered nominee_ids, index 0 = 1st choice ... up to index 4 = 5th choice

class SuggestNomineeRequest(BaseModel):
    award_id: str
    name: str
    designation: str
    organisation: Optional[str] = ""

@router.get("/awards")
async def get_awards(user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    awards = await db.awards.find().to_list(100)
    return [serialize(a) for a in awards]

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
# Every jury member (regular and head jury alike) ranks up to five nominees —
# a 1st through 5th choice. Every ranked slot counts as one vote each toward
# that nominee's total (no point weighting by rank position — rank only breaks
# ties via first_choice_votes). Once submitted, a vote is final and cannot be
# resubmitted. The winner is whoever has the most total votes.

@router.post("/vote-ranked")
async def submit_ranking(req: SubmitRankingRequest, user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403, detail="Only jury members can vote")

    if not (2 <= len(req.choices) <= 5):
        raise HTTPException(status_code=400, detail="Rank between 2 and 5 nominees")
    if len(set(req.choices)) != len(req.choices):
        raise HTTPException(status_code=400, detail="Each choice must be a different nominee")

    db = get_database()

    control = await db.vote_controls.find_one({"award_id": req.award_id})
    if not control or not control.get("voting_enabled"):
        raise HTTPException(status_code=403, detail="Voting is not open for this award")

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
    """Returns this jury member's submitted vote for an award (ordered 1st -> 5th
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
