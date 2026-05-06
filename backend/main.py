from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, admin, jury, head_jury, audit
from database import connect_db, close_db

app = FastAPI(title="KPMG Award Management Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(jury.router, prefix="/api/jury", tags=["Jury"])
app.include_router(head_jury.router, prefix="/api/head-jury", tags=["Head Jury"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Trail"])

@app.get("/")
def root():
    return {"message": "KPMG Award Management Tool API"}
