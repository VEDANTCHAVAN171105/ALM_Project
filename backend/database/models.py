from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    quality_rating: Mapped[str] = mapped_column(String(50), nullable=False)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    emotion_primary: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emotion_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    detected_sounds: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    anomaly_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    anomaly_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    scene_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reasoning_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confidence_overall: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_processing_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    report_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
