from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BASE_DIR.parent

class Settings(BaseSettings):
    APP_NAME: str = "DataLens"
    APP_ENV: str = "development"
    SECRET_KEY: str = "datalens-super-secret-key-change-in-production-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = f"sqlite:///{WORKSPACE_ROOT / 'data' / 'datalens.db'}"

    # File storage paths
    UPLOAD_DIR: Path = WORKSPACE_ROOT / "data" / "uploads"
    SAMPLE_DIR: Path = WORKSPACE_ROOT / "data" / "samples"
    REPORTS_DIR: Path = WORKSPACE_ROOT / "reports"
    MAX_UPLOAD_SIZE_MB: int = 50

    # AI Configuration
    AI_PROVIDER: str = "demo"  # demo | openai | anthropic | groq | ollama
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-4o-mini"
    AI_BASE_URL: Optional[str] = None

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)

