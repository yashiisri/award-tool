import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import get_database
from auth import get_current_user, get_password_hash
from bson import ObjectId
from datetime import datetime
from config import settings
import json
import logging
# Imported at module load (server startup), not inside the request handler —
# these pull in a deep dependency chain (bs4, groq, httpx research pipeline)
# that's slow to import cold; doing it lazily meant the FIRST request that
# hit one of these endpoints after every server restart ate that whole
# import cost as extra request latency.
from services.nominee_service import extract_and_store_metrics
from services.nominee_suggestion import enrich_suggested_nominee

logger = logging.getLogger(__name__)

router = APIRouter()

AIMA_CRITERIA = [
    {"id": "governance", "title": "Governance & Societal Responsibilities",
     "points": ["Contribution to society and nation at large", "Personal values, ethics and corporate integrity",
                "Contribution to positive evolution of government policy",
                "Contribution towards globalisation of Indian economy and industry"]},
    {"id": "org_performance", "title": "Organisational Performance",
     "points": ["Display of corporate courage and leadership",
                "Contribution towards evolving appropriate management culture",
                "Contribution towards development of management profession",
                "Vision and support for innovation and new ideas"]},
    {"id": "general", "title": "General",
     "points": ["Organisation must be operating in India",
                "Business must have contributed substantially to Indian economy",
                "Nominations of individuals from their own organisations will be considered"]},
    {"id": "innovation", "title": "Innovation & Strategic Partnership",
     "points": ["Innovativeness in approach and tangible contribution to sustained growth",
                "Developed, managed and sustained strategic partnerships across sectors",
                "Adoption of new technology or business models to stay ahead of the curve"]},
    {"id": "leadership", "title": "Leadership",
     "points": ["A distinguished and acknowledged leader and achiever within the organisation",
                "Upheld high ethical values and behavioural standards",
                "Inspired and mentored the next generation of leadership"]},
    {"id": "impact", "title": "Impact on Workforce & Environment",
     "points": ["Concern for employee welfare, safety and professional growth",
                "Commitment to environmental preservation and sustainability",
                "Exceptional performance and resilience under adverse conditions"]},
]

AI_SOURCES = [
    "Fortune India", "Business Today", "Indian Express", "Economic Times",
    "LinkedIn India", "Times of India", "Money Control", "News18",
    "Bloomberg", "Fortune 500", "Forbes", "Reuters",
    "MCA (Regulatory)", "SEBI Disclosures",
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

# ── Models ─────────────────────────────────────────────────────────────────────

class AwardCreate(BaseModel):
    name: str
    description: str
    num_nominees: int = 5
    criteria: List[str] = []

class NomineeCreate(BaseModel):
    award_id: str
    name: str
    designation: str
    organisation: str
    photo_url: Optional[str] = ""
    rationale: str

class NomineeUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    organisation: Optional[str] = None
    photo_url: Optional[str] = None
    rationale: Optional[str] = None

class VoteControlUpdate(BaseModel):
    award_id: str
    voting_enabled: bool
    nomination_enabled: bool
    voting_start: Optional[str] = None
    voting_end: Optional[str] = None

class RedFlagRequest(BaseModel):
    nominee_id: str
    reason: str

class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str

class ValidateNomineeRequest(BaseModel):
    nominee_id: str

class UnflagNomineeRequest(BaseModel):
    nominee_id: str

class SuggestNomineeRequest(BaseModel):
    award_id: str
    name: str
    designation: str
    organisation: Optional[str] = ""

# ── Awards ─────────────────────────────────────────────────────────────────────

@router.post("/awards")
async def create_award(award: AwardCreate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    doc = {**award.dict(), "created_by": user["sub"], "created_at": datetime.utcnow(),
           "aima_criteria": AIMA_CRITERIA, "results_published": False, "ai_metrics": []}
    result = await db.awards.insert_one(doc)
    award_id = str(result.inserted_id)
    await log_action(db, user, "create_award", {"award_name": award.name})

    # Async metric extraction — fire and forget so award creation is instant
    if award.description.strip():
        asyncio.create_task(
            extract_and_store_metrics(db, award_id, award.name, award.description)
        )

    return {"id": award_id, "message": "Award created"}

@router.get("/awards")
async def get_awards(user=Depends(get_current_user)):
    db = get_database()
    awards = await db.awards.find().to_list(100)
    return [serialize(a) for a in awards]

@router.get("/awards/{award_id}")
async def get_award(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    award = await db.awards.find_one({"_id": ObjectId(award_id)})
    if not award:
        raise HTTPException(status_code=404)
    return serialize(award)

@router.delete("/awards/{award_id}")
async def delete_award(award_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    await db.awards.delete_one({"_id": ObjectId(award_id)})
    await db.nominees.delete_many({"award_id": award_id})
    await log_action(db, user, "delete_award", {"award_id": award_id})
    return {"message": "Award deleted"}

@router.post("/awards/{award_id}/publish-results")
async def publish_results(award_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    await db.awards.update_one({"_id": ObjectId(award_id)}, {"$set": {"results_published": True}})
    await log_action(db, user, "publish_results", {"award_id": award_id})
    return {"message": "Results published"}

# ── Nominees ───────────────────────────────────────────────────────────────────

@router.post("/nominees")
async def add_nominee(nominee: NomineeCreate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    doc = {**nominee.dict(), "validated_by": [], "red_flagged": False,
           "total_score": 0, "voted_by": [], "added_by": user["sub"], "created_at": datetime.utcnow()}
    result = await db.nominees.insert_one(doc)
    await log_action(db, user, "add_nominee", {"nominee_name": nominee.name, "award_id": nominee.award_id})
    return {"id": str(result.inserted_id), "message": "Nominee added"}

@router.get("/nominees/{award_id}")
async def get_nominees(award_id: str, user=Depends(get_current_user)):
    db = get_database()
    nominees = await db.nominees.find({"award_id": award_id}).to_list(100)
    return [serialize(n) for n in nominees]

@router.post("/nominees/suggest")
async def suggest_nominee(req: SuggestNomineeRequest, user=Depends(get_current_user)):
    """Admin equivalent of the jury 'Suggest Nominee' flow — admin only supplies
    the name, designation and organisation; the profile (photo, bio, rationale,
    sources) is built automatically in the background."""
    if user["role"] != "admin":
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
        "added_by": user["sub"],
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

    await log_action(db, user, "add_nominee", {"nominee_name": req.name, "award_id": req.award_id})
    return {"id": nominee_id, "message": "Nominee added — profile is being built"}

@router.put("/nominees/{nominee_id}")
async def update_nominee(nominee_id: str, update: NomineeUpdate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    data = {k: v for k, v in update.dict().items() if v is not None}
    await db.nominees.update_one({"_id": ObjectId(nominee_id)}, {"$set": data})
    await log_action(db, user, "update_nominee", {"nominee_id": nominee_id})
    return {"message": "Updated"}

@router.post("/nominees/{nominee_id}/validate")
async def validate_nominee(nominee_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    nom = await db.nominees.find_one({"_id": ObjectId(nominee_id)})
    if not nom:
        raise HTTPException(status_code=404, detail="Nominee not found")
    await db.nominees.update_one(
        {"_id": ObjectId(nominee_id)},
        {"$set": {"validated": True, "validated_by_admin": user["sub"], "validated_at": datetime.utcnow()}}
    )
    await log_action(db, user, "validate_nominee", {"nominee_id": nominee_id, "name": nom.get("name", "")})
    return {"message": "Nominee approved"}

@router.post("/nominees/{nominee_id}/unflag")
async def unflag_nominee(nominee_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    await db.nominees.update_one(
        {"_id": ObjectId(nominee_id)},
        {"$set": {"red_flagged": False, "red_flag_reason": None, "red_flagged_by": None}}
    )
    await log_action(db, user, "unflag_nominee", {"nominee_id": nominee_id})
    return {"message": "Flag cleared"}

@router.get("/rankings/top3/{award_id}")
async def get_top3_rankings(award_id: str, user=Depends(get_current_user)):
    """Aggregate all jury votes for an award and return the top-3 nominees by vote count.
    Each jury member's 1st and 2nd choice both count as one vote."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()

    pipeline = [
        {"$match": {"award_id": award_id}},
        {"$group": {
            "_id": "$nominee_id",
            "total_votes": {"$sum": 1},
            "first_choice_votes": {"$sum": {"$cond": [{"$eq": ["$choice", "first"]}, 1, 0]}},
        }},
        {"$sort": {"total_votes": -1, "first_choice_votes": -1}},
        {"$limit": 3},
    ]
    ranked = await db.jury_rankings.aggregate(pipeline).to_list(3)

    result = []
    for i, r in enumerate(ranked):
        nom = await db.nominees.find_one({"_id": ObjectId(r["_id"])})
        if nom:
            result.append({
                "position": i + 1,
                "nominee_id": r["_id"],
                "name": nom.get("name", ""),
                "designation": nom.get("designation", ""),
                "organisation": nom.get("organisation", ""),
                "photo_url": nom.get("photo_url", ""),
                "total_votes": r["total_votes"],
                "first_choice_votes": r["first_choice_votes"],
            })
    return result


@router.delete("/nominees/{nominee_id}")
async def delete_nominee(nominee_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    nom = await db.nominees.find_one({"_id": ObjectId(nominee_id)})
    await db.nominees.delete_one({"_id": ObjectId(nominee_id)})
    await log_action(db, user, "delete_nominee", {"nominee_id": nominee_id, "name": nom.get("name", "") if nom else ""})
    return {"message": "Deleted"}

@router.get("/rankings/by-jury/{award_id}")
async def get_rankings_by_jury(award_id: str, user=Depends(get_current_user)):
    """Return each jury member's top-2 vote for an award, hydrated with nominee details."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()

    rows = await db.jury_rankings.find({"award_id": award_id}).to_list(1000)

    nominees_list = await db.nominees.find({"award_id": award_id}).to_list(200)
    nominee_map = {str(n["_id"]): n for n in nominees_list}

    by_jury = {}
    for row in rows:
        jid = row["jury_id"]
        if jid not in by_jury:
            by_jury[jid] = {
                "jury_id": jid,
                "jury_role": row.get("jury_role", "jury"),
                "submitted_at": row.get("created_at", "").isoformat() if row.get("created_at") else "",
                "choices": [],
            }
        nom = nominee_map.get(row["nominee_id"], {})
        by_jury[jid]["choices"].append({
            "choice": row.get("choice", ""),
            "nominee_id": row["nominee_id"],
            "name": nom.get("name", "Unknown"),
            "designation": nom.get("designation", ""),
            "organisation": nom.get("organisation", ""),
            "photo_url": nom.get("photo_url", ""),
        })

    order = {"first": 0, "second": 1, "third": 2, "fourth": 3, "fifth": 4}
    for jid in by_jury:
        by_jury[jid]["choices"].sort(key=lambda c: order.get(c["choice"], 2))

    return list(by_jury.values())

@router.post("/red-flag")
async def red_flag_nominee(req: RedFlagRequest, user=Depends(get_current_user)):
    if user["role"] not in ["admin", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    await db.nominees.update_one({"_id": ObjectId(req.nominee_id)},
        {"$set": {"red_flagged": True, "red_flag_reason": req.reason, "red_flagged_by": user["sub"]}})
    await log_action(db, user, "red_flag_nominee", {"nominee_id": req.nominee_id, "reason": req.reason})
    return {"message": "Flagged"}

@router.get("/awards/{award_id}/metrics")
async def get_award_metrics(award_id: str, user=Depends(get_current_user)):
    """Return the AI-extracted evaluation metrics for an award."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    award = await db.awards.find_one({"_id": ObjectId(award_id)})
    if not award:
        raise HTTPException(status_code=404, detail="Award not found")

    metrics = award.get("ai_metrics", [])

    # If metrics not yet extracted, do it now
    if not metrics and award.get("description", "").strip():
        award_title = award.get("name") or award.get("title") or "Award"
        metrics = await extract_and_store_metrics(
            db, award_id, award_title, award.get("description", "")
        )

    return {"award_id": award_id, "metrics": metrics}

# ── Vote Control ───────────────────────────────────────────────────────────────

@router.post("/vote-control")
async def update_vote_control(control: VoteControlUpdate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    await db.vote_controls.update_one({"award_id": control.award_id},
        {"$set": {**control.dict(), "updated_by": user["sub"], "updated_at": datetime.utcnow()}}, upsert=True)
    await log_action(db, user, "update_vote_control", control.dict())
    return {"message": "Updated"}

@router.get("/vote-control")
async def get_vote_controls(user=Depends(get_current_user)):
    db = get_database()
    controls = await db.vote_controls.find().to_list(100)
    return [serialize(c) for c in controls]

# ── Users ──────────────────────────────────────────────────────────────────────

@router.post("/create-user")
async def create_user(req: CreateUserRequest, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    if req.role not in ["jury", "head_jury"]:
        raise HTTPException(status_code=400, detail="Can only create jury or head_jury roles")
    db = get_database()
    if await db.users.find_one({"username": req.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    await db.users.insert_one({
        "username": req.username, "email": req.email, "role": req.role,
        "hashed_password": get_password_hash(req.password),
        "created_by": user["sub"], "created_at": datetime.utcnow()
    })
    await log_action(db, user, "create_user", {"username": req.username, "role": req.role})
    return {"message": "User created"}

@router.get("/users")
async def get_users(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    users = await db.users.find({"role": {"$in": ["jury", "head_jury"]}}).to_list(100)
    return [{"id": str(u["_id"]), "username": u["username"], "email": u["email"], "role": u["role"]} for u in users]

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404)
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await log_action(db, user, "delete_user", {"username": target.get("username"), "role": target.get("role")})
    return {"message": "User deleted"}

# ── Jury data views ────────────────────────────────────────────────────────────

@router.get("/jury-comments")
async def get_jury_comments(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    comments = await db.comments.find().sort("created_at", -1).to_list(200)
    return [serialize(c) for c in comments]

@router.delete("/jury-comments/{comment_id}")
async def delete_jury_comment(comment_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    await db.comments.delete_one({"_id": ObjectId(comment_id)})
    await log_action(db, user, "delete_comment", {"comment_id": comment_id, "jury_id": comment.get("jury_id", "")})
    return {"message": "Comment deleted"}

@router.get("/jury-vote-status")
async def get_jury_vote_status(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    votes = await db.votes.find().sort("created_at", -1).to_list(500)
    return [serialize(v) for v in votes]

# ── Legacy ─────────────────────────────────────────────────────────────────────

@router.get("/categories")
async def get_categories(user=Depends(get_current_user)):
    db = get_database()
    awards = await db.awards.find().to_list(100)
    return [serialize(a) for a in awards]

@router.post("/categories")
async def create_category_legacy(body: dict, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    doc = {**body, "created_by": user["sub"], "created_at": datetime.utcnow(), "results_published": False}
    result = await db.awards.insert_one(doc)
    return {"id": str(result.inserted_id)}
