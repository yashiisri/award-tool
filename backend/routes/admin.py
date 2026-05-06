from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import get_database
from auth import get_current_user, get_password_hash
from bson import ObjectId
from datetime import datetime
from config import settings
import json

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

class AISearchRequest(BaseModel):
    award_id: str
    num_results: int = 5

# ── Awards ─────────────────────────────────────────────────────────────────────

@router.post("/awards")
async def create_award(award: AwardCreate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    doc = {**award.dict(), "created_by": user["sub"], "created_at": datetime.utcnow(),
           "aima_criteria": AIMA_CRITERIA, "results_published": False}
    result = await db.awards.insert_one(doc)
    await log_action(db, user, "create_award", {"award_name": award.name})
    return {"id": str(result.inserted_id), "message": "Award created"}

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

@router.put("/nominees/{nominee_id}")
async def update_nominee(nominee_id: str, update: NomineeUpdate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    data = {k: v for k, v in update.dict().items() if v is not None}
    await db.nominees.update_one({"_id": ObjectId(nominee_id)}, {"$set": data})
    await log_action(db, user, "update_nominee", {"nominee_id": nominee_id})
    return {"message": "Updated"}

@router.delete("/nominees/{nominee_id}")
async def delete_nominee(nominee_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    nom = await db.nominees.find_one({"_id": ObjectId(nominee_id)})
    await db.nominees.delete_one({"_id": ObjectId(nominee_id)})
    await log_action(db, user, "delete_nominee", {"nominee_id": nominee_id, "name": nom.get("name", "") if nom else ""})
    return {"message": "Deleted"}

@router.post("/red-flag")
async def red_flag_nominee(req: RedFlagRequest, user=Depends(get_current_user)):
    if user["role"] not in ["admin", "head_jury"]:
        raise HTTPException(status_code=403)
    db = get_database()
    await db.nominees.update_one({"_id": ObjectId(req.nominee_id)},
        {"$set": {"red_flagged": True, "red_flag_reason": req.reason, "red_flagged_by": user["sub"]}})
    await log_action(db, user, "red_flag_nominee", {"nominee_id": req.nominee_id, "reason": req.reason})
    return {"message": "Flagged"}

# ── AI Search (mock data) ──────────────────────────────────────────────────────

MOCK_NOMINEES = [
    {"name": "Roshni Nadar Malhotra", "designation": "Chairperson", "organisation": "HCLTech",
     "photo_url": "",
     "sources": ["Economic Times", "Forbes", "Business Today", "LinkedIn India"],
     "rationale": "Under Roshni's leadership, HCLTech recorded revenue of INR 1.2 lakh crore (USD 13.7 billion) in FY25, a growth of 6.5% y-o-y. She launched multiple AI platforms including AI Force, AI Labs and AI Foundry. HCLTech's market capitalisation exceeded INR 5.2 lakh crore in 2025. She was conferred with the Chevalier de la Légion d'Honneur by France in 2024."},
    {"name": "N. Chandrasekaran", "designation": "Chairman", "organisation": "Tata Sons",
     "photo_url": "",
     "sources": ["Fortune India", "Economic Times", "Reuters", "Bloomberg"],
     "rationale": "Chandrasekaran has steered the Tata Group to become India's most valuable conglomerate with a combined market cap exceeding $365 billion. Under his leadership, Tata Motors' EV division and Air India's transformation have been landmark achievements contributing significantly to India's manufacturing and aviation sectors."},
    {"name": "Kiran Mazumdar-Shaw", "designation": "Executive Chairperson", "organisation": "Biocon",
     "photo_url": "",
     "sources": ["Business Today", "Indian Express", "Fortune India", "SEBI Disclosures"],
     "rationale": "Kiran Mazumdar-Shaw built Biocon into India's largest biopharmaceutical company, pioneering affordable biosimilars that have reached millions of patients globally. Her contributions to India's biotech ecosystem and commitment to affordable healthcare exemplify the AIMA criteria for societal responsibility and organisational excellence."},
    {"name": "Sajjan Jindal", "designation": "Chairman & MD", "organisation": "JSW Group",
     "photo_url": "",
     "sources": ["Economic Times", "Money Control", "MCA (Regulatory)", "Bloomberg"],
     "rationale": "Sajjan Jindal has grown JSW Group into a $23 billion conglomerate with leadership in steel, energy, infrastructure, and sports. His commitment to sustainability through green steel initiatives and investment in renewable energy demonstrates exemplary corporate governance and contribution to India's industrial growth."},
    {"name": "Deepinder Goyal", "designation": "CEO & Co-Founder", "organisation": "Zomato",
     "photo_url": "",
     "sources": ["Economic Times", "News18", "LinkedIn India", "SEBI Disclosures"],
     "rationale": "Deepinder Goyal transformed Zomato from a restaurant discovery platform into India's leading food delivery and quick commerce giant. Under his leadership, Zomato achieved profitability and expanded into Blinkit, redefining quick commerce in India and creating thousands of jobs."},
    {"name": "Falguni Nayar", "designation": "Founder & CEO", "organisation": "Nykaa",
     "photo_url": "",
     "sources": ["Fortune India", "Business Today", "Forbes", "Economic Times"],
     "rationale": "Falguni Nayar founded Nykaa at 49 and built it into India's first woman-led unicorn to go public. Nykaa's IPO in 2021 was one of India's most successful, with a market cap exceeding ₹1 lakh crore, inspiring a generation of entrepreneurs."},
    {"name": "Mukesh Ambani", "designation": "Chairman & MD", "organisation": "Reliance Industries",
     "photo_url": "",
     "sources": ["Fortune 500", "Forbes", "Bloomberg", "Money Control"],
     "rationale": "Mukesh Ambani has transformed Reliance into a diversified conglomerate spanning telecom, retail, and green energy. Jio brought affordable internet to 450 million users. His $75 billion green energy investment plan positions India as a global clean energy leader."},
]

@router.post("/ai-search-nominees")
async def ai_search_nominees(req: AISearchRequest, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403)
    db = get_database()
    award = await db.awards.find_one({"_id": ObjectId(req.award_id)})
    if not award:
        raise HTTPException(status_code=404)
    return MOCK_NOMINEES[:req.num_results]

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
