import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from config import GEMINI_API_KEY
from database.db import get_db


router = APIRouter(tags=["health"])
START_TIME = time.time()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "version": "1.0.0",
        "gemini_configured": bool(GEMINI_API_KEY),
        "database": "connected",
        "uptime_seconds": round(time.time() - START_TIME, 2),
    }

