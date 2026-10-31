from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import declarative_base

from config import DATABASE_URL


Base = declarative_base()
engine = create_async_engine(DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    import database.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"]
                for column in inspect(sync_conn).get_columns("analysis_sessions")
            }
        )
        if "owner_id" not in columns:
            await conn.execute(text("ALTER TABLE analysis_sessions ADD COLUMN owner_id VARCHAR(36)"))
        if "report_json" not in columns:
            await conn.execute(text("ALTER TABLE analysis_sessions ADD COLUMN report_json TEXT"))
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_analysis_sessions_owner_id "
                "ON analysis_sessions (owner_id)"
            )
        )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
