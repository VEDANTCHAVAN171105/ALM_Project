import time
import uuid
from pathlib import Path

import librosa
import noisereduce as nr
import numpy as np
import soundfile as sf

from config import MAX_AUDIO_DURATION_SEC, TARGET_SAMPLE_RATE, TEMP_DIR
from utils.logger import get_logger


logger = get_logger(__name__)


def _estimate_snr_db(signal: np.ndarray) -> float:
    abs_signal = np.abs(signal)
    signal_level = float(np.percentile(abs_signal, 95))
    noise_floor = float(np.percentile(abs_signal, 20))
    return float(20 * np.log10((signal_level + 1e-8) / (noise_floor + 1e-8)))


def _quality_from_snr(snr_db: float) -> str:
    if snr_db > 20:
        return "Excellent"
    if snr_db > 10:
        return "Good"
    if snr_db > 0:
        return "Fair"
    return "Poor"


def process_audio(file_path: str) -> dict:
    started = time.perf_counter()
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    try:
        audio, original_sr = librosa.load(file_path, sr=None, mono=True)
    except Exception as exc:
        raise ValueError("Cannot read audio file") from exc

    if audio is None or audio.size == 0:
        raise ValueError("Audio file is empty")
    if not original_sr:
        raise ValueError("Cannot read audio file")

    duration_seconds = float(len(audio) / original_sr)
    if duration_seconds < 0.5:
        raise ValueError("Audio too short")

    warnings = []
    if duration_seconds > MAX_AUDIO_DURATION_SEC:
        logger.warning("Audio exceeded max duration and was truncated: %s", file_path)
        max_samples = int(MAX_AUDIO_DURATION_SEC * original_sr)
        audio = audio[:max_samples]
        duration_seconds = float(len(audio) / original_sr)
        warnings.append(f"Audio exceeded {MAX_AUDIO_DURATION_SEC} seconds and was truncated for analysis.")

    if original_sr != TARGET_SAMPLE_RATE:
        audio = librosa.resample(audio, orig_sr=original_sr, target_sr=TARGET_SAMPLE_RATE)

    processed_sr = TARGET_SAMPLE_RATE
    reduced_noise = nr.reduce_noise(y=audio, sr=processed_sr, stationary=False, prop_decrease=0.8)

    rms_energy = float(np.sqrt(np.mean(np.square(reduced_noise))))
    peak = float(np.max(np.abs(reduced_noise))) if reduced_noise.size else 0.0
    clipping_ratio = float(np.mean(np.abs(reduced_noise) >= 0.98)) if reduced_noise.size else 0.0
    is_silent = bool(rms_energy < 0.002 or peak < 0.01)
    snr_db = _estimate_snr_db(reduced_noise)
    quality_rating = "Poor" if is_silent else _quality_from_snr(snr_db)

    if clipping_ratio > 0.02:
        quality_rating = "Poor"
        warnings.append("Audio appears clipped or excessively loud, which may reduce analysis accuracy.")

    processed_path = TEMP_DIR / f"processed_{uuid.uuid4().hex}.wav"
    sf.write(str(processed_path), reduced_noise, processed_sr)

    return {
        "processed_path": str(processed_path),
        "duration_seconds": round(duration_seconds, 2),
        "original_sr": int(original_sr),
        "sample_rate": int(processed_sr),
        "snr_db": round(float(snr_db), 2),
        "rms_energy": round(rms_energy, 6),
        "quality_rating": quality_rating,
        "is_silent": is_silent,
        "processing_time_ms": round((time.perf_counter() - started) * 1000, 2),
        "warnings": warnings,
    }

