import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database.crud import count_analyses, delete_analysis, get_all_analyses, get_analysis_by_id
from database.db import get_db
from database.models import User
from utils.auth import get_current_user


router = APIRouter(tags=["history"])


def _serialize_session(session) -> dict:
    report = json.loads(session.report_json or "{}")
    report.update({
        "id": session.id,
        "session_id": session.id,
        "filename": session.filename,
        "file_size_bytes": session.file_size_bytes,
        "duration_seconds": session.duration_seconds,
        "quality_rating": session.quality_rating,
        "audio_quality": {
            "duration_seconds": session.duration_seconds,
            "quality_rating": session.quality_rating,
            "sample_rate": 16000,
            "snr_db": 0,
            "rms_energy": 0,
            "is_silent": False,
        },
        "transcript": session.transcript,
        "emotion": {
            "primary": session.emotion_primary or "neutral",
            "confidence": session.emotion_confidence or 0,
            "reasoning": "No emotion reasoning was stored.",
        },
        "emotion_primary": session.emotion_primary,
        "emotion_confidence": session.emotion_confidence,
        "detected_sounds": json.loads(session.detected_sounds or "[]"),
        "warnings": [],
        "anomaly_detected": session.anomaly_detected,
        "anomaly_details": session.anomaly_details,
        "scene_description": session.scene_description,
        "reasoning_summary": session.reasoning_summary,
        "audio_type": session.audio_type,
        "confidence_overall": session.confidence_overall,
        "total_processing_time_ms": session.total_processing_time_ms,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    })
    return report


@router.get("/history")
async def list_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sessions = await get_all_analyses(db, owner_id=user.id, limit=limit, offset=offset)
    total = await count_analyses(db, owner_id=user.id)
    return {
        "sessions": [_serialize_session(session) for session in sessions],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/history/{session_id}")
async def get_history_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = await get_analysis_by_id(db, session_id, user.id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail={"message": "Session not found", "suggestion": "Select a valid session from the history list."},
        )
    return _serialize_session(session)


@router.delete("/history/{session_id}")
async def delete_history_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted = await delete_analysis(db, session_id, user.id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail={"message": "Session not found", "suggestion": "The requested session may already have been deleted."},
        )
    return {"status": "success", "message": "Session deleted"}
