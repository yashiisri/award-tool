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

    model_config = {
        "env_file": str(ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()
