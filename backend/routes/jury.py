from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_database
from auth import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter()

RANK_POINTS = {1: 10, 2: 7, 3: 5, 4: 3, 5: 1}

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

class RankVoteRequest(BaseModel):
    award_id: str
    nominee_id: str
    rank: int  # 1-5

# Jury/head jury only ever pick a 1st and 2nd choice — points are a server-side
# scoring detail never exposed to (or trusted from) the client.
RANKING_POINTS = {1: 10, 2: 5}

class RankingEntry(BaseModel):
    nominee_id: str
    rank: int  # 1 or 2 only

class SubmitRankingRequest(BaseModel):
    award_id: str
    rankings: list[RankingEntry]

@router.get("/awards")
async def get_awards(user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    awards = await db.awards.find().to_list(100)
    return [serialize(a) for a in awards]

@router.get("/awards/{award_id}/nominees")
async def get_nominees_for_award(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    nominees = await db.nominees.find({"award_id": award_id}).to_list(100)
    return [serialize(n) for n in nominees]

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

@router.post("/vote")
async def rank_vote(req: RankVoteRequest, user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    if req.rank not in RANK_POINTS:
        raise HTTPException(status_code=400, detail="Rank must be 1-5")
    db = get_database()

    # Check voting is enabled
    control = await db.vote_controls.find_one({"award_id": req.award_id})
    if not control or not control.get("voting_enabled"):
        raise HTTPException(status_code=403, detail="Voting is not open for this award")

    # Check if already voted for this nominee
    existing = await db.votes.find_one({"award_id": req.award_id, "nominee_id": req.nominee_id, "jury_id": user["sub"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already voted for this nominee")

    points = RANK_POINTS[req.rank]
    doc = {
        "award_id": req.award_id, "nominee_id": req.nominee_id,
        "jury_id": user["sub"], "jury_role": user["role"],
        "rank": req.rank, "points": points, "created_at": datetime.utcnow()
    }
    await db.votes.insert_one(doc)

    # Update nominee total score
    await db.nominees.update_one(
        {"_id": ObjectId(req.nominee_id)},
        {"$inc": {"total_score": points}, "$addToSet": {"voted_by": user["sub"]}}
    )

    await log_action(db, user, "vote", {"award_id": req.award_id, "nominee_id": req.nominee_id, "rank": req.rank, "points": points})
    return {"message": "Vote recorded", "points": points}

@router.get("/my-votes/{award_id}")
async def get_my_votes(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    votes = await db.votes.find({"award_id": award_id, "jury_id": user["sub"]}).to_list(100)
    return [serialize(v) for v in votes]

@router.get("/vote-control/{award_id}")
async def get_vote_control(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    control = await db.vote_controls.find_one({"award_id": award_id})
    if not control:
        return {"voting_enabled": False, "nomination_enabled": False}
    return serialize(control)

@router.get("/results/{award_id}")
async def get_results(award_id: str, user=Depends(get_current_user)):
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    # Check if results are published
    award = await db.awards.find_one({"_id": ObjectId(award_id)})
    if not award or not award.get("results_published"):
        raise HTTPException(status_code=403, detail="Results not published yet")
    nominees = await db.nominees.find({"award_id": award_id}).sort("total_score", -1).to_list(100)
    # Rank order comes from total_score, but the score itself is an internal
    # scoring detail — jury/head jury see final placement, not points.
    results = []
    for n in nominees:
        doc = serialize(n)
        doc.pop("total_score", None)
        results.append(doc)
    return results

@router.get("/nominees/{award_id}")
async def get_nominees_legacy(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    nominees = await db.nominees.find({"award_id": award_id}).to_list(100)
    return [serialize(n) for n in nominees]


# ── Jury Ranking (drag-and-drop) ───────────────────────────────────────────────

@router.post("/ranking")
async def submit_ranking(req: SubmitRankingRequest, user=Depends(get_current_user)):
    """
    Jury submits their top choices for an award: at most a 1st and a 2nd
    pick, each naming a distinct nominee. Points are computed here from
    RANKING_POINTS and are never accepted from the client — a juror's own
    request is not a trustworthy source for how many points their pick is
    worth. Replaces any previous ranking by this jury member for this award.
    """
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403, detail="Only jury members can submit rankings")

    if len(req.rankings) > 2:
        raise HTTPException(status_code=400, detail="You may only rank a 1st and 2nd choice")

    ranks_used = [entry.rank for entry in req.rankings]
    if any(r not in RANKING_POINTS for r in ranks_used):
        raise HTTPException(status_code=400, detail="Rank must be 1 (1st choice) or 2 (2nd choice)")
    if len(set(ranks_used)) != len(ranks_used):
        raise HTTPException(status_code=400, detail="You cannot assign the same rank to two nominees")

    nominee_ids_used = [entry.nominee_id for entry in req.rankings]
    if len(set(nominee_ids_used)) != len(nominee_ids_used):
        raise HTTPException(status_code=400, detail="You cannot rank the same nominee twice")

    db = get_database()

    # Check voting is enabled
    control = await db.vote_controls.find_one({"award_id": req.award_id})
    if not control or not control.get("voting_enabled"):
        raise HTTPException(status_code=403, detail="Voting is not open for this award")

    jury_id = user["sub"]

    # Remove previous ranking by this jury for this award
    old_rankings = await db.jury_rankings.find(
        {"award_id": req.award_id, "jury_id": jury_id}
    ).to_list(100)

    # Reverse old points from nominee totals
    for old in old_rankings:
        await db.nominees.update_one(
            {"_id": ObjectId(old["nominee_id"])},
            {
                "$inc": {"total_score": -old["points"]},
                "$pull": {"voted_by": jury_id},
            }
        )

    # Delete old ranking records
    await db.jury_rankings.delete_many({"award_id": req.award_id, "jury_id": jury_id})

    # Insert new rankings — points computed server-side from rank, never from the client
    now = datetime.utcnow()
    docs = []
    for entry in req.rankings:
        docs.append({
            "award_id":    req.award_id,
            "nominee_id":  entry.nominee_id,
            "jury_id":     jury_id,
            "jury_role":   user["role"],
            "rank":        entry.rank,
            "points":      RANKING_POINTS[entry.rank],
            "created_at":  now,
        })

    if docs:
        await db.jury_rankings.insert_many(docs)

    # Apply new points to nominee totals
    for entry in req.rankings:
        await db.nominees.update_one(
            {"_id": ObjectId(entry.nominee_id)},
            {
                "$inc": {"total_score": RANKING_POINTS[entry.rank]},
                "$addToSet": {"voted_by": jury_id},
            }
        )

    await log_action(db, user, "submit_ranking", {
        "award_id": req.award_id,
        "num_nominees": len(req.rankings),
    })

    return {"message": "Ranking submitted", "rankings": len(req.rankings)}


@router.get("/ranking/{award_id}")
async def get_my_ranking(award_id: str, user=Depends(get_current_user)):
    """
    Get the current jury member's submitted ranking for an award.
    Returns null if not yet submitted.
    """
    if user["role"] not in ["jury", "head_jury"]:
        raise HTTPException(status_code=403)

    db = get_database()
    rankings = await db.jury_rankings.find(
        {"award_id": award_id, "jury_id": user["sub"]}
    ).sort("rank", 1).to_list(100)

    if not rankings:
        return None

    return {
        "award_id":  award_id,
        "jury_id":   user["sub"],
        # Points are a scoring detail for the admin, not shown to the juror who cast the vote.
        "rankings":  [
            {
                "nominee_id": r["nominee_id"],
                "rank":       r["rank"],
            }
            for r in rankings
        ],
        "submitted_at": rankings[0].get("created_at", "").isoformat()
            if rankings[0].get("created_at") else "",
    }
