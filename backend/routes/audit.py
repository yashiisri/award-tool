from fastapi import APIRouter, Depends, HTTPException
from database import get_database
from auth import get_current_user

router = APIRouter()

def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    if "timestamp" in doc and doc["timestamp"]:
        doc["timestamp"] = doc["timestamp"].isoformat()
    if "created_at" in doc and doc["created_at"]:
        doc["created_at"] = doc["created_at"].isoformat()
    return doc

@router.get("/logs")
async def get_audit_logs(user=Depends(get_current_user)):
    if user["role"] not in ["admin", "head_jury"]:
        raise HTTPException(status_code=403, detail="Admin or Head Jury access required")
    db = get_database()
    logs = await db.audit_logs.find().sort("timestamp", -1).to_list(1000)
    return [serialize(log) for log in logs]
