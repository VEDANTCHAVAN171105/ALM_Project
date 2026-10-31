import base64
import json
import re
import time
from pathlib import Path

import google.generativeai as genai

from config import GEMINI_API_KEY, GEMINI_MODEL
from utils.logger import get_logger


logger = get_logger(__name__)

QUOTA_BLOCK_UNTIL = 0.0


class GeminiQuotaExceededError(RuntimeError):
    def __init__(self, message: str, retry_after_seconds: int | None = None):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


class GeminiAccessDeniedError(PermissionError):
    pass

SYSTEM_PROMPT = """
You are an advanced Audio Language Model (ALM). Your job is to deeply
analyze audio and return a structured JSON response. Analyze the provided
audio and return ONLY a valid JSON object (no markdown, no backticks)
with exactly these fields:

{
  "transcript": "Full verbatim speech transcription. If no speech, write null.",
  "language_detected": "Language of speech (e.g. English, Hindi). null if no speech.",
  "detected_sounds": [
    {"label": "Sound event name", "confidence": 0.0-1.0, "timestamp": "approx time"}
  ],
  "emotion": {
    "primary": "One of: happy/sad/angry/anxious/calm/neutral/fearful/surprised",
    "secondary": "second emotion or null",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation of why"
  },
  "scene_description": "1-2 sentence vivid description of the environment",
  "intent": "What the speaker is trying to communicate. null if no speech.",
  "anomaly_detected": true or false,
  "anomaly_details": "Explanation of what is unusual. null if no anomaly.",
  "severity": "One of: low/medium/high/critical. null if no anomaly.",
  "reasoning_summary": "2-3 sentence paragraph - human-like holistic understanding
                        of the entire audio, combining speech + sounds + emotion.",
  "suggested_action": "Practical recommendation based on content. null if routine.",
  "audio_type": "One of: speech_only/non_speech_only/mixed/silence",
  "confidence_overall": 0.0-1.0
}

Be precise. Be analytical. Return ONLY the JSON object.
""".strip()


def _parse_retry_delay_seconds(error_text: str) -> int | None:
    match = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", error_text, re.IGNORECASE | re.DOTALL)
    if match:
        return int(match.group(1))
    return None


def _quota_fallback_result(error_text: str) -> dict:
    retry_after_seconds = _parse_retry_delay_seconds(error_text)
    lowered = error_text.lower()
    exceeded_daily = "generaterequestsperdayperprojectpermodel-freetier" in lowered
    exceeded_minute = "generaterequestsperminuteperprojectpermodel-freetier" in lowered

    if exceeded_daily:
        reasoning_summary = (
            "Audio preprocessing completed successfully, but Gemini rejected the request because the free-tier daily "
            "quota for this model and project appears to be exhausted."
        )
        suggested_action = "Wait until the quota resets at midnight Pacific time, or switch to a billed Gemini project."
    elif exceeded_minute:
        reasoning_summary = (
            "Audio preprocessing completed successfully, but Gemini rejected the request because the free-tier "
            "per-minute request quota for this model and project was exceeded."
        )
        suggested_action = (
            f"Wait about {retry_after_seconds} seconds and retry."
            if retry_after_seconds
            else "Wait a short while and retry the analysis."
        )
    else:
        reasoning_summary = (
            "Audio preprocessing completed successfully, but Gemini rejected the request because the API quota "
            "for this project was exceeded."
        )
        suggested_action = "Retry later or switch to a billed Gemini project with higher limits."

    return {
        "status": "partial",
        "message": "Gemini quota exceeded",
        "error_type": "quota_exceeded",
        "rate_limited": True,
        "retry_after_seconds": retry_after_seconds,
        "transcript": None,
        "language_detected": None,
        "detected_sounds": [],
        "emotion": {
            "primary": "neutral",
            "secondary": None,
            "confidence": 0.0,
            "reasoning": "AI interpretation could not be completed because Gemini quota was exceeded.",
        },
        "scene_description": "Audio preprocessing completed, but semantic interpretation was blocked by Gemini API quota limits.",
        "intent": None,
        "anomaly_detected": False,
        "anomaly_details": None,
        "severity": None,
        "reasoning_summary": reasoning_summary,
        "suggested_action": suggested_action,
        "audio_type": "mixed",
        "confidence_overall": 0.0,
    }


def _extract_json_from_text(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _response_text(response) -> str:
    text = getattr(response, "text", "") or ""
    if text.strip():
        return text.strip()

    fragments = []
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            fragment = getattr(part, "text", None)
            if fragment:
                fragments.append(fragment)
    return "\n".join(fragments).strip()


def _fallback_result(message: str) -> dict:
    return {
        "status": "partial",
        "transcript": None,
        "language_detected": None,
        "detected_sounds": [],
        "emotion": {
            "primary": "neutral",
            "secondary": None,
            "confidence": 0.0,
            "reasoning": "AI interpretation could not be completed.",
        },
        "scene_description": "Audio preprocessing completed, but the semantic analysis service did not return a usable response.",
        "intent": None,
        "anomaly_detected": False,
        "anomaly_details": None,
        "severity": None,
        "reasoning_summary": message,
        "suggested_action": "Retry the analysis in a few moments.",
        "audio_type": "mixed",
        "confidence_overall": 0.0,
    }


def analyze_with_gemini(audio_path: str, audio_metadata: dict) -> dict:
    global QUOTA_BLOCK_UNTIL

    if not GEMINI_API_KEY:
        raise PermissionError("Gemini API key configuration is invalid or missing.")

    now = time.time()
    if QUOTA_BLOCK_UNTIL > now:
        remaining = max(1, int(QUOTA_BLOCK_UNTIL - now))
        logger.warning("Gemini calls are temporarily paused due to quota cooldown. %ss remaining.", remaining)
        raise GeminiQuotaExceededError(
            f"Gemini quota cooldown active. Retry after about {remaining} seconds.",
            retry_after_seconds=remaining,
        )

    genai.configure(api_key=GEMINI_API_KEY)

    started = time.perf_counter()
    audio_bytes = Path(audio_path).read_bytes()
    encoded_audio = base64.b64encode(audio_bytes).decode("utf-8")
    audio_part = {"inline_data": {"mime_type": "audio/wav", "data": encoded_audio}}
    metadata_text = json.dumps(audio_metadata, ensure_ascii=True)
    user_prompt = (
        "Analyze this processed audio sample and follow the JSON schema exactly. "
        f"Audio metadata: {metadata_text}"
    )

    model = genai.GenerativeModel(model_name=GEMINI_MODEL, system_instruction=SYSTEM_PROMPT)

    for attempt in range(1, 4):
        call_started = time.perf_counter()
        try:
            logger.info("Gemini API call attempt %s using model %s for %s", attempt, GEMINI_MODEL, audio_path)
            response = model.generate_content(
                [{"role": "user", "parts": [{"text": user_prompt}, audio_part]}],
                request_options={"timeout": 60},
            )
            elapsed_ms = round((time.perf_counter() - call_started) * 1000, 2)
            logger.info("Gemini API response received from %s in %sms", GEMINI_MODEL, elapsed_ms)
            parsed = _extract_json_from_text(_response_text(response))
            parsed["status"] = parsed.get("status", "success")
            parsed["response_time_ms"] = elapsed_ms
            parsed["model_used"] = GEMINI_MODEL
            logger.info(
                "Gemini analysis completed with %s in %sms total",
                GEMINI_MODEL,
                round((time.perf_counter() - started) * 1000, 2),
            )
            return parsed
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - call_started) * 1000, 2)
            lowered = str(exc).lower()
            logger.warning(
                "Gemini attempt %s failed with model %s after %sms: %s",
                attempt,
                GEMINI_MODEL,
                elapsed_ms,
                exc,
            )
            if any(token in lowered for token in ("api key", "permission", "unauthorized", "authentication")):
                raise PermissionError("Gemini API key configuration is invalid or missing.") from exc
            if "denied access" in lowered or ("403" in lowered and "project" in lowered):
                raise GeminiAccessDeniedError(
                    "Gemini project access has been denied for this Google AI Studio / Google Cloud project."
                ) from exc
            if "quota" in lowered or "429" in lowered or "rate limit" in lowered or "resource_exhausted" in lowered:
                logger.warning("Gemini quota/rate limit detected for model %s.", GEMINI_MODEL)
                retry_after = _parse_retry_delay_seconds(str(exc)) or 40
                QUOTA_BLOCK_UNTIL = max(QUOTA_BLOCK_UNTIL, time.time() + retry_after)
                raise GeminiQuotaExceededError(
                    "Gemini quota exceeded for this project and model. Please retry later or use a different project.",
                    retry_after_seconds=retry_after,
                ) from exc
            if "not found" in lowered or "404" in lowered:
                logger.error("Configured Gemini model %s is unavailable.", GEMINI_MODEL)
                raise ValueError(
                    f"The configured Gemini model '{GEMINI_MODEL}' is unavailable for this API version."
                ) from exc
            if attempt < 3:
                time.sleep(2)
            else:
                logger.warning("Gemini retries exhausted for model %s.", GEMINI_MODEL)

    logger.error("Gemini analysis failed after exhausting retries for %s", audio_path)
    raise RuntimeError("Gemini analysis failed after multiple retry attempts.")
