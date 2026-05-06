from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    JURY = "jury"
    HEAD_JURY = "head_jury"

class User(BaseModel):
    username: str
    email: str
    role: UserRole
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EvaluationCriteria(BaseModel):
    governance_societal: str = ""
    organizational_performance: str = ""
    general: str = ""

class Award(BaseModel):
    title: str
    description: str
    num_nominees: int
    criteria: EvaluationCriteria
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Nominee(BaseModel):
    name: str
    designation: str
    organization: str
    photo_url: Optional[str] = ""
    award_id: str
    category_id: Optional[str] = ""
    rationale: str
    rationale_data: dict = {}
    validated_by: List[str] = []
    red_flagged: bool = False
    red_flag_reason: Optional[str] = None
    red_flagged_by: Optional[str] = None
    ai_generated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Vote(BaseModel):
    nominee_id: str
    jury_id: str
    award_id: str
    score: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    nominee_id: str
    award_id: str
    jury_id: str
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoteControl(BaseModel):
    award_id: str
    voting_enabled: bool = False
    nomination_enabled: bool = False
    voting_start: Optional[datetime] = None
    voting_end: Optional[datetime] = None
    updated_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(BaseModel):
    user_id: str
    user_role: UserRole
    action: str
    details: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)
