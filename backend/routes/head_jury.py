from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_database
from auth import get_current_user, get_password_hash
from bson import ObjectId
from datetime import datetime

router = APIRouter()

AIMA_CRITERIA = [
    {"id": "governance", "title": "Governance & Societal Responsibilities"},
    {"id": "org_performance", "title": "Organisational Performance"},
    {"id": "general", "title": "General Eligibility"},
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

class NomineeCreate(BaseModel):
    award_id: str
    name: str
    designation: str
    organisation: str
    photo_url: Optional[str] = ""
    rationale: str

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
    doc = {**award.dict(), "created_by": user["sub"], "created_at": datetime.utcnow(), "aima_criteria": AIMA_CRITERIA}
    result = await db.awards.insert_one(doc)
    await log_action(db, user, "create_award", {"award_name": award.name})
    return {"id": str(result.inserted_id), "message": "Award created"}

@router.get("/awards")
async def get_awards(user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    awards = await db.awards.find().to_list(100)
    return [serialize(a) for a in awards]

# ── Nominees ───────────────────────────────────────────────────────────────────

@router.post("/nominees")
async def add_nominee(nominee: NomineeCreate, user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    doc = {**nominee.dict(), "validated_by": [], "red_flagged": False, "added_by": user["sub"], "created_at": datetime.utcnow()}
    result = await db.nominees.insert_one(doc)
    await log_action(db, user, "add_nominee", {"nominee_name": nominee.name, "award_id": nominee.award_id})
    return {"id": str(result.inserted_id), "message": "Nominee added"}

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
            "nominee_name": nominees_map.get(nid, {}).get("name", nid),
            "nominee_org":  nominees_map.get(nid, {}).get("organisation", ""),
            "rank":         r["rank"],
            "points":       r["points"],
            "created_at":   r["created_at"].isoformat() if r.get("created_at") else "",
        })

    return result

@router.get("/audit-logs")
async def get_audit_logs(user=Depends(get_current_user)):
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()
    logs = await db.audit_logs.find().sort("timestamp", -1).to_list(500)
    return [serialize(l) for l in logs]


# ── Head Jury Results (their own ranking = the official result) ────────────────

@router.get("/my-results/{award_id}")
async def get_hj_results(award_id: str, user=Depends(get_current_user)):
    """
    Return the head jury's own ranking for an award as the official result.
    Nominees are sorted by the head jury's submitted rank (1 = winner).
    Returns [] if head jury hasn't submitted a ranking yet.
    """
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()

    # Get head jury's own rankings for this award
    hj_rankings = await db.jury_rankings.find(
        {"award_id": award_id, "jury_id": user["sub"]}
    ).sort("rank", 1).to_list(100)

    if not hj_rankings:
        return []

    # Resolve nominee details
    results = []
    for r in hj_rankings:
        try:
            nom = await db.nominees.find_one({"_id": ObjectId(r["nominee_id"])})
            if nom:
                results.append({
                    "rank":         r["rank"],
                    "points":       r["points"],
                    "nominee_id":   r["nominee_id"],
                    "name":         nom.get("name", ""),
                    "designation":  nom.get("designation", ""),
                    "organisation": nom.get("organisation", ""),
                    "photo_url":    nom.get("photo_url", ""),
                })
        except Exception:
            pass

    return results


@router.get("/my-results")
async def get_all_hj_results(user=Depends(get_current_user)):
    """
    Return head jury's rankings for ALL awards they have submitted.
    """
    if user["role"] != "head_jury":
        raise HTTPException(status_code=403)
    db = get_database()

    # Get all awards
    awards = await db.awards.find().to_list(100)
    all_results = []

    for award in awards:
        award_id = str(award["_id"])
        hj_rankings = await db.jury_rankings.find(
            {"award_id": award_id, "jury_id": user["sub"]}
        ).sort("rank", 1).to_list(100)

        if not hj_rankings:
            continue

        nominees_ranked = []
        for r in hj_rankings:
            try:
                nom = await db.nominees.find_one({"_id": ObjectId(r["nominee_id"])})
                if nom:
                    nominees_ranked.append({
                        "rank":         r["rank"],
                        "points":       r["points"],
                        "nominee_id":   r["nominee_id"],
                        "name":         nom.get("name", ""),
                        "designation":  nom.get("designation", ""),
                        "organisation": nom.get("organisation", ""),
                        "photo_url":    nom.get("photo_url", ""),
                    })
            except Exception:
                pass

        if nominees_ranked:
            all_results.append({
                "award_id":   award_id,
                "award_name": award.get("name") or award.get("title") or award_id,
                "nominees":   nominees_ranked,
            })

    return all_results
