from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import APP_ENV, FRONTEND_ORIGINS, JWT_SECRET, TEMP_DIR
from database.db import init_db
from routers import analyze, auth, health, history
from utils.logger import get_logger


logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if APP_ENV == "production" and (
        JWT_SECRET == "local-development-only-change-this-secret" or len(JWT_SECRET) < 32
    ):
        raise RuntimeError("Set JWT_SECRET to a random value of at least 32 characters in production.")
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    await init_db()
    logger.info("ALM API startup complete.")
    yield


app = FastAPI(title="ALM — Audio Language Model API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(analyze.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(health.router, prefix="/api")


def _error_payload(message: str, detail=None, suggestion: str | None = None):
    return {
        "status": "error",
        "message": message,
        "detail": detail,
        "suggestion": suggestion,
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        payload = _error_payload(
            message=detail.get("message", "Request failed."),
            detail=detail.get("detail"),
            suggestion=detail.get("suggestion"),
        )
    else:
        payload = _error_payload(message=str(detail), detail=None, suggestion="Review the request and try again.")
    return JSONResponse(status_code=exc.status_code, content=payload, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=_error_payload(
            message="Validation error",
            detail=exc.errors(),
            suggestion="Ensure the request includes a multipart field named 'audio_file'.",
        ),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content=_error_payload(
            message="Internal server error",
            detail=str(exc),
            suggestion="Check the server logs and confirm the Gemini API key is configured correctly.",
        ),
    )


@app.get("/")
async def root():
    return {
        "message": "Welcome to ALM — Audio Language Model API",
        "version": "1.0.0",
        "health": "/api/health",
        "history": "/api/history",
        "analyze": "/api/analyze",
        "docs": "/docs",
    }
