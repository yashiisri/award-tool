from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from database import get_database
from auth import get_password_hash, verify_password, create_access_token
from models import UserRole

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole

@router.post("/register")
async def register(req: RegisterRequest):
    # Admin accounts can only be created directly in DB or via this endpoint once
    # Jury/head_jury must be created by admin via /admin/create-user
    db = get_database()
    existing = await db.users.find_one({"username": req.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    if req.role in ["jury", "head_jury"]:
        # Check if any admin exists — if yes, jury/head_jury must be created by admin
        admin_exists = await db.users.find_one({"role": "admin"})
        if admin_exists:
            raise HTTPException(status_code=403, detail="Jury and Head Jury accounts must be created by an Admin.")
    user = {
        "username": req.username,
        "email": req.email,
        "role": req.role,
        "hashed_password": get_password_hash(req.password)
    }
    await db.users.insert_one(user)
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(req: LoginRequest):
    db = get_database()
    user = await db.users.find_one({"username": req.username})
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}
