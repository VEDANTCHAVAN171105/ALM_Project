import os
import time
from datetime import datetime, timezone
from pathlib import Path

from config import MAX_FILE_SIZE_MB
from pipeline.audio_processor import process_audio
from pipeline.gemini_analyzer import analyze_with_gemini


def _iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def run_pipeline(file_path: str) -> dict:
    overall_started = time.perf_counter()
    pipeline_stages = []
    processed_path = None

    if not os.path.exists(file_path):
        raise ValueError("Cannot read audio file")

    file_size_bytes = os.path.getsize(file_path)
    if file_size_bytes > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File too large. Max {MAX_FILE_SIZE_MB}MB.")

    try:
        processor_result = process_audio(file_path)
        processed_path = processor_result["processed_path"]
        pipeline_stages.append(
            {
                "name": "Audio Processing",
                "status": "success",
                "time_ms": processor_result["processing_time_ms"],
            }
        )

        audio_quality = {
            "duration_seconds": processor_result["duration_seconds"],
            "sample_rate": processor_result["sample_rate"],
            "snr_db": processor_result["snr_db"],
            "rms_energy": processor_result["rms_energy"],
            "quality_rating": processor_result["quality_rating"],
            "is_silent": processor_result["is_silent"],
        }

        if processor_result["is_silent"]:
            report_started = time.perf_counter()
            pipeline_stages.append(
                {
                    "name": "Gemini Analysis",
                    "status": "skipped",
                    "time_ms": 0,
                }
            )
            report_time_ms = round((time.perf_counter() - report_started) * 1000, 2)
            pipeline_stages.append(
                {
                    "name": "Generating Report",
                    "status": "success",
                    "time_ms": report_time_ms,
                }
            )
            return {
                "status": "success",
                "message": "No audio content detected",
                "audio_quality": audio_quality,
                "transcript": None,
                "language_detected": None,
                "detected_sounds": [],
                "emotion": {
                    "primary": "neutral",
                    "secondary": None,
                    "confidence": 1.0,
                    "reasoning": "Signal energy is below the silence threshold after preprocessing.",
                },
                "scene_description": "The recording contains near-silence or no discernible acoustic events.",
                "intent": None,
                "anomaly_detected": False,
                "anomaly_details": None,
                "severity": None,
                "reasoning_summary": "The uploaded clip does not contain enough audible content to infer speech, events, or environmental context.",
                "suggested_action": "Record again in a quieter setup with the microphone closer to the source.",
                "audio_type": "silence",
                "confidence_overall": 1.0,
                "warnings": processor_result.get("warnings", []),
                "pipeline_stages": pipeline_stages,
                "total_processing_time_ms": round((time.perf_counter() - overall_started) * 1000, 2),
                "timestamp": _iso_timestamp(),
            }

        ai_started = time.perf_counter()
        gemini_result = analyze_with_gemini(processed_path, audio_quality)
        gemini_time_ms = gemini_result.pop("response_time_ms", round((time.perf_counter() - ai_started) * 1000, 2))
        pipeline_stages.append(
            {
                "name": "Gemini Analysis",
                "status": "success" if gemini_result.get("status", "success") == "success" else "partial",
                "time_ms": gemini_time_ms,
            }
        )

        report_started = time.perf_counter()
        final_result = {
            "status": gemini_result.get("status", "success"),
            "message": gemini_result.get("message"),
            "error_type": gemini_result.get("error_type"),
            "rate_limited": gemini_result.get("rate_limited", False),
            "retry_after_seconds": gemini_result.get("retry_after_seconds"),
            "model_used": gemini_result.get("model_used"),
            "audio_quality": audio_quality,
            "transcript": gemini_result.get("transcript"),
            "language_detected": gemini_result.get("language_detected"),
            "detected_sounds": gemini_result.get("detected_sounds", []),
            "emotion": gemini_result.get(
                "emotion",
                {
                    "primary": "neutral",
                    "secondary": None,
                    "confidence": 0.0,
                    "reasoning": "Emotion could not be inferred.",
                },
            ),
            "scene_description": gemini_result.get("scene_description"),
            "intent": gemini_result.get("intent"),
            "anomaly_detected": bool(gemini_result.get("anomaly_detected", False)),
            "anomaly_details": gemini_result.get("anomaly_details"),
            "severity": gemini_result.get("severity"),
            "reasoning_summary": gemini_result.get("reasoning_summary"),
            "suggested_action": gemini_result.get("suggested_action"),
            "audio_type": gemini_result.get("audio_type", "mixed"),
            "confidence_overall": gemini_result.get("confidence_overall", 0.0),
            "warnings": processor_result.get("warnings", []),
        }

        pipeline_stages.append(
            {
                "name": "Generating Report",
                "status": "success",
                "time_ms": round((time.perf_counter() - report_started) * 1000, 2),
            }
        )
        final_result["pipeline_stages"] = pipeline_stages
        final_result["total_processing_time_ms"] = round((time.perf_counter() - overall_started) * 1000, 2)
        final_result["timestamp"] = _iso_timestamp()
        return final_result
    finally:
        for candidate in {file_path, processed_path}:
            if candidate and Path(candidate).exists():
                try:
                    Path(candidate).unlink()
                except OSError:
                    pass
