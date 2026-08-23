from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

# Resolve .env relative to this file so it works regardless of cwd
ENV_FILE = Path(__file__).parent / ".env"

class Settings(BaseSettings):
    MONGODB_URL: str
    DATABASE_NAME: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: Optional[str] = None
    GROQ_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None
    BRAVE_API_KEY: Optional[str] = None

    # Research engine tuning — all overridable via .env, sensible defaults otherwise
    RESEARCH_MAX_CONCURRENCY: int = 8
    RESEARCH_SEARCH_TIMEOUT: float = 15.0
    RESEARCH_CACHE_TTL_SEARCH: int = 21600       # 6h
    RESEARCH_CACHE_TTL_EVIDENCE: int = 86400     # 24h
    RESEARCH_MIN_CONFIDENCE: float = 0.35
    RESEARCH_STAGE1_DISCOVERY_LIMIT: int = 40    # unique candidates kept after entity resolution
    RESEARCH_STAGE2_VERIFY_LIMIT: int = 20       # candidates that get a basic verification pass
    RESEARCH_STAGE3_DEEP_LIMIT: int = 10         # candidates that get deep per-candidate evidence search

    # Scoring weights — must sum to 1.0
    WEIGHT_AWARD_RELEVANCE: float = 0.30
    WEIGHT_LEADERSHIP_IMPACT: float = 0.20
    WEIGHT_INDUSTRY_RELEVANCE: float = 0.15
    WEIGHT_ACHIEVEMENT_STRENGTH: float = 0.15
    WEIGHT_SOURCE_QUALITY: float = 0.10
    WEIGHT_RECENCY: float = 0.10

    # AIMA-specialized engine tuning
    AIMA_STAGE1_DISCOVERY_TARGET: int = 80   # raw mentions targeted before dedup, per spec §8
    AIMA_STAGE2_VERIFY_LIMIT: int = 25
    AIMA_STAGE3_DEEP_LIMIT: int = 10
    AIMA_FINAL_RESULTS: int = 8

    # AIMA scoring weights — must sum to 1.0 (spec §15)
    AIMA_WEIGHT_AWARD_ELIGIBILITY: float = 0.25
    AIMA_WEIGHT_HISTORICAL_FIT: float = 0.20
    AIMA_WEIGHT_LEADERSHIP_IMPACT: float = 0.15
    AIMA_WEIGHT_ACHIEVEMENT_STRENGTH: float = 0.15
    AIMA_WEIGHT_EVIDENCE_STRENGTH: float = 0.10
    AIMA_WEIGHT_SOURCE_QUALITY: float = 0.10
    AIMA_WEIGHT_RECENCY: float = 0.05

    model_config = {
        "env_file": str(ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()
