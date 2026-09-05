from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_database
from auth import get_current_user, get_password_hash
from bson import ObjectId
from datetime import datetime
from services.vote_status import compute_award_vote_stats, get_my_confirmed_awards

router = APIRouter()

AIMA_CRITERIA = [
    {"id": "governance", "title": "Governance & Societal Responsibilities"},
    {"id": "org_performance", "title": "Organisational Performance"},
    {"id": "general", "title": "General Eligibility"},
    {"id": "innovation", "title": "Innovation & Strategic Partnership"},
    {"id": "leadership", "title": "Leadership"},
    {"id": "impact", "title": "Impact on Workforce & Environment"},
]

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

class AwardCreate(BaseModel):
    name: str
    description: str
    num_nominees: int = 5
    criteria: list = []

class ValidateNominee(BaseModel):
    nominee_id: str

class RedFlagRequest(BaseModel):
    nominee_id: str
    reason: str

# ── Awards ─────────────────────────────────────────────────────────────────────

@router.post("/awards")
async def create_award(award: AwardCreate, user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    doc = {**award.dict(), "created_by": user["sub"], "created_at": datetime.utcnow(), "aima_criteria": AIMA_CRITERIA,
           "results_published": False}
    result = await db.awards.insert_one(doc)
    await log_action(db, user, "create_award", {"award_name": award.name})
    return {"id": str(result.inserted_id), "message": "Award created"}

@router.get("/awards")
async def get_awards(user=Depends(get_current_user)):
    """Each award also carries computed nomination/voting-readiness fields —
    see services/vote_status.py for the rule. Same shared helper as
    GET /jury/awards, so Jury and Head Jury always see the same phase status."""
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    awards = await db.awards.find().to_list(100)
    award_ids = [str(a["_id"]) for a in awards]
    stats_by_award = await compute_award_vote_stats(db, award_ids)
    my_confirmed = await get_my_confirmed_awards(db, user["sub"], award_ids)

    result = []
    for a in awards:
        d = serialize(a)
        d.update(stats_by_award.get(d["id"], {
            "total_nominees": 0, "pending_nominations": 0, "nominations_ready": False,
            "voting_enabled": False, "nomination_enabled": False, "total_reviewers": 0,
            "confirmed_reviewers": 0, "all_confirmed": False, "voting_open": False,
        }))
        d["my_confirmed"] = d["id"] in my_confirmed
        result.append(d)
    return result

# ── Nominees ───────────────────────────────────────────────────────────────────
# Manual "add nominee" is gone — Head Jury (like Jury) can only suggest a name via
# POST /jury/suggest-nominee, which builds the profile automatically. Head Jury
# reviews suggestions here via red-flag / delete below.

@router.get("/nominees/{award_id}")
async def get_nominees(award_id: str, user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    nominees = await db.nominees.find({"award_id": award_id}).to_list(100)
    return [serialize(n) for n in nominees]

@router.post("/validate-nominee")
async def validate_nominee(req: ValidateNominee, user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    await db.nominees.update_one({"_id": ObjectId(req.nominee_id)}, {"$addToSet": {"validated_by": user["sub"]}})
    await log_action(db, user, "validate_nominee", {"nominee_id": req.nominee_id})
    return {"message": "Nominee validated"}

@router.post("/red-flag")
async def red_flag(req: RedFlagRequest, user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    await db.nominees.update_one(
        {"_id": ObjectId(req.nominee_id)},
        {"$set": {"red_flagged": True, "red_flag_reason": req.reason, "red_flagged_by": user["sub"]}}
    )
    await log_action(db, user, "red_flag_nominee", {"nominee_id": req.nominee_id, "reason": req.reason})
    return {"message": "Nominee flagged"}

@router.delete("/nominees/{nominee_id}")
async def delete_nominee(nominee_id: str, user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    nom = await db.nominees.find_one({"_id": ObjectId(nominee_id)})
    await db.nominees.delete_one({"_id": ObjectId(nominee_id)})
    await log_action(db, user, "delete_nominee", {"nominee_id": nominee_id, "name": nom.get("name", "") if nom else ""})
    return {"message": "Nominee deleted"}

# ── Jury data views ────────────────────────────────────────────────────────────

@router.get("/jury-comments")
async def get_jury_comments(user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    comments = await db.comments.find().sort("created_at", -1).to_list(200)
    return [serialize(c) for c in comments]

@router.get("/vote-status")
async def get_vote_status(user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    votes = await db.votes.find().sort("created_at", -1).to_list(500)
    return [serialize(v) for v in votes]


@router.get("/ranking-status")
async def get_ranking_status(user=Depends(get_current_user)):
    """
    Return all jury rankings grouped by award, with nominee names resolved.
    Used by Head Jury to see how each jury member ranked nominees.
    """
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()

    rankings = await db.jury_rankings.find().sort("created_at", -1).to_list(1000)

    # Resolve nominee names
    nominee_ids = list({r["nominee_id"] for r in rankings})
    nominees_map = {}
    for nid in nominee_ids:
        try:
            nom = await db.nominees.find_one({"_id": ObjectId(nid)})
            if nom:
                nominees_map[nid] = {
                    "name":         nom.get("name", ""),
                    "designation":  nom.get("designation", ""),
                    "organisation": nom.get("organisation", ""),
                }
        except Exception:
            pass

    # Resolve award names
    award_ids = list({r["award_id"] for r in rankings})
    awards_map = {}
    for aid in award_ids:
        try:
            award = await db.awards.find_one({"_id": ObjectId(aid)})
            if award:
                awards_map[aid] = award.get("name") or award.get("title") or aid
        except Exception:
            pass

    result = []
    for r in rankings:
        nid = r["nominee_id"]
        result.append({
            "id":           str(r["_id"]),
            "award_id":     r["award_id"],
            "award_name":   awards_map.get(r["award_id"], r["award_id"]),
            "jury_id":      r["jury_id"],
            "nominee_id":   nid,
            "nominee_name": nominees_map.get(nid, {}).get("name") or "Nominee no longer available",
            "nominee_org":  nominees_map.get(nid, {}).get("organisation", ""),
            "choice":       r.get("choice", ""),
            "created_at":   r["created_at"].isoformat() if r.get("created_at") else "",
        })

    return result

# ── Voting progress dashboard ─────────────────────────────────────────────────
# Per award: completion percentage against all eligible voters (jury + head
# jury), plus the names of who has voted so far — not who's ahead or how
# anyone voted (that's the old, removed "Jury Vote Status" view).

@router.get("/voting-progress")
async def get_voting_progress(user=Depends(get_current_user)):
    """For every award, what fraction of all eligible voters (jury + head jury)
    have submitted their ranking so far, and who they are."""
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()

    all_voter_docs = await db.users.find(
        {"role": {"$in": ["jury", "head_jury"]}}, {"username": 1}
    ).to_list(500)
    all_voter_names = sorted({u["username"] for u in all_voter_docs})
    total_voters = len(all_voter_names)

    pipeline = [
        {"$group": {"_id": {"award_id": "$award_id", "jury_id": "$jury_id"}}},
        {"$group": {"_id": "$_id.award_id", "voters": {"$addToSet": "$_id.jury_id"}}},
    ]
    voters_by_award = {row["_id"]: sorted(row["voters"]) async for row in db.jury_rankings.aggregate(pipeline)}

    awards = await db.awards.find().sort("name", 1).to_list(200)
    result = []
    for a in awards:
        award_id = str(a["_id"])
        voters = voters_by_award.get(award_id, [])
        voted_count = len(voters)
        percentage = round((voted_count / total_voters) * 100) if total_voters else 0
        remaining = [name for name in all_voter_names if name not in voters]
        result.append({
            "award_id": award_id,
            "award_name": a.get("name", ""),
            "voted_count": voted_count,
            "total_voters": total_voters,
            "percentage": percentage,
            "voters": voters,
            "remaining": remaining,
        })
    return result


# ── Head Jury Results ────────────────────────────────────────────────────────
# Head jury votes the same way as regular jury now — no special "official
# result" override. Results are the shared, published leaderboard, same as
# jury.get_results() — see GET /jury/results/{award_id}.
