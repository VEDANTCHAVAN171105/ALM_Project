import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")


def _resolve_path(raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return (BASE_DIR / path).resolve()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
JWT_SECRET = os.getenv("JWT_SECRET", "local-development-only-change-this-secret")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "25"))
MAX_AUDIO_DURATION_SEC = int(os.getenv("MAX_AUDIO_DURATION_SEC", "120"))
TEMP_DIR = _resolve_path(os.getenv("TEMP_DIR", "./temp_uploads"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
TARGET_SAMPLE_RATE = int(os.getenv("TARGET_SAMPLE_RATE", "16000"))
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".webm"}
RAW_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if RAW_DATABASE_URL.startswith("postgres://"):
    RAW_DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif RAW_DATABASE_URL.startswith("postgresql://"):
    RAW_DATABASE_URL = RAW_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

DATABASE_URL = RAW_DATABASE_URL or f"sqlite+aiosqlite:///{(BASE_DIR / 'alm_sessions.db').resolve()}"
FRONTEND_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
