import asyncio
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, TEMP_DIR
from database.crud import save_analysis
from database.db import get_db
from database.models import User
from pipeline.gemini_analyzer import GeminiAccessDeniedError, GeminiQuotaExceededError
from pipeline.unified_pipeline import run_pipeline
from utils.auth import get_current_user
from utils.logger import get_logger


router = APIRouter(tags=["analyze"])
logger = get_logger(__name__)


def _http_error(status_code: int, message: str, detail=None, suggestion: str | None = None) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "message": message,
            "detail": detail,
            "suggestion": suggestion,
        },
    )


@router.post("/analyze")
async def analyze_audio(
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    original_filename = audio_file.filename or "audio_input.wav"
    extension = Path(original_filename).suffix.lower()
    temp_path = TEMP_DIR / f"{uuid.uuid4().hex}{extension or '.wav'}"

    if extension not in ALLOWED_EXTENSIONS:
        raise _http_error(
            422,
            "Unsupported file format.",
            suggestion="Upload one of: .wav, .mp3, .ogg, .flac, .webm",
        )

    file_bytes = await audio_file.read()
    file_size = len(file_bytes)
    if file_size == 0:
        raise _http_error(
            400,
            "Audio file is empty",
            suggestion="Upload a valid audio clip that contains speech or environmental sound.",
        )
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise _http_error(
            413,
            f"File too large. Max {MAX_FILE_SIZE_MB}MB.",
            suggestion="Trim the file locally or export it at a lower bitrate before uploading.",
        )

    try:
        await asyncio.to_thread(temp_path.write_bytes, file_bytes)
        result = await asyncio.to_thread(run_pipeline, str(temp_path))
        result["filename"] = original_filename
        result["file_size_bytes"] = file_size
        result["session_id"] = str(uuid.uuid4())

        try:
            session = await save_analysis(db, result, user.id)
            result["session_id"] = session.id
        except Exception as exc:
            logger.exception("Failed to save analysis session: %s", exc)
            result["db_warning"] = "Analysis completed, but history storage failed."

        return result
    except GeminiAccessDeniedError as exc:
        raise _http_error(
            403,
            "Gemini project access denied.",
            detail=str(exc),
            suggestion="Create a new Google AI Studio / Google Cloud project with Gemini access, or contact Google support.",
        ) from exc
    except GeminiQuotaExceededError as exc:
        raise _http_error(
            429,
            "Gemini quota exceeded.",
            detail={
                "reason": str(exc),
                "retry_after_seconds": exc.retry_after_seconds,
            },
            suggestion="Wait for the cooldown or use a different Gemini project with available quota.",
        ) from exc
    except PermissionError as exc:
        raise _http_error(
            403,
            "Gemini API key configuration error.",
            detail=str(exc),
            suggestion="Open backend/.env and verify GEMINI_API_KEY is valid.",
        ) from exc
    except ValueError as exc:
        message = str(exc)
        status_code = 400
        if "too large" in message.lower():
            status_code = 413
        raise _http_error(
            status_code,
            message,
            suggestion="Try another audio clip or verify the recording is not corrupt.",
        ) from exc
    finally:
        if temp_path.exists():
            try:
                temp_path.unlink()
            except OSError:
                logger.warning("Could not delete upload temp file: %s", temp_path)
