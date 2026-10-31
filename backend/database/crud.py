import json
import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import AnalysisSession


async def save_analysis(db: AsyncSession, result_dict: dict, owner_id: str) -> AnalysisSession:
    session = AnalysisSession(
        id=result_dict.get("session_id") or str(uuid.uuid4()),
        owner_id=owner_id,
        filename=result_dict["filename"],
        file_size_bytes=int(result_dict.get("file_size_bytes", 0)),
        duration_seconds=float(result_dict["audio_quality"].get("duration_seconds", 0.0)),
        quality_rating=result_dict["audio_quality"].get("quality_rating", "Unknown"),
        transcript=result_dict.get("transcript"),
        emotion_primary=(result_dict.get("emotion") or {}).get("primary"),
        emotion_confidence=(result_dict.get("emotion") or {}).get("confidence"),
        detected_sounds=json.dumps(result_dict.get("detected_sounds", [])),
        anomaly_detected=bool(result_dict.get("anomaly_detected", False)),
        anomaly_details=result_dict.get("anomaly_details"),
        scene_description=result_dict.get("scene_description"),
        reasoning_summary=result_dict.get("reasoning_summary"),
        audio_type=result_dict.get("audio_type"),
        confidence_overall=result_dict.get("confidence_overall"),
        total_processing_time_ms=result_dict.get("total_processing_time_ms"),
        report_json=json.dumps(result_dict),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_all_analyses(
    db: AsyncSession,
    owner_id: str,
    limit: int,
    offset: int,
) -> list[AnalysisSession]:
    statement = (
        select(AnalysisSession)
        .where(AnalysisSession.owner_id == owner_id)
        .order_by(AnalysisSession.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(statement)
    return list(result.scalars().all())


async def get_analysis_by_id(
    db: AsyncSession,
    session_id: str,
    owner_id: str,
) -> AnalysisSession | None:
    result = await db.execute(
        select(AnalysisSession).where(
            AnalysisSession.id == session_id,
            AnalysisSession.owner_id == owner_id,
        )
    )
    return result.scalar_one_or_none()


async def delete_analysis(db: AsyncSession, session_id: str, owner_id: str) -> bool:
    existing = await get_analysis_by_id(db, session_id, owner_id)
    if not existing:
        return False
    await db.execute(
        delete(AnalysisSession).where(
            AnalysisSession.id == session_id,
            AnalysisSession.owner_id == owner_id,
        )
    )
    await db.commit()
    return True


async def count_analyses(db: AsyncSession, owner_id: str) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(AnalysisSession)
        .where(AnalysisSession.owner_id == owner_id)
    )
    return int(result.scalar_one())
