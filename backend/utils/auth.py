import base64
import hashlib
import hmac
import json
import secrets
import time
import uuid

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import APP_ENV, JWT_SECRET
from database.db import get_db
from database.models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
_PASSWORD_ITERATIONS = 600_000
_TOKEN_LIFETIME_SECONDS = 60 * 60 * 12
_LOCAL_JWT_SECRET = "local-development-only-change-this-secret"


def _secret_bytes() -> bytes:
    if APP_ENV == "production" and (
        JWT_SECRET == _LOCAL_JWT_SECRET or len(JWT_SECRET) < 32
    ):
        raise RuntimeError("Set JWT_SECRET to a random value of at least 32 characters in production.")
    return JWT_SECRET.encode("utf-8")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PASSWORD_ITERATIONS)
    return f"{_PASSWORD_ITERATIONS}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        iterations_raw, salt_raw, digest_raw = stored_hash.split("$", 2)
        iterations = int(iterations_raw)
        expected = _b64decode(digest_raw)
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            _b64decode(salt_raw),
            iterations,
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, expected)


def create_access_token(user_id: str) -> str:
    header = _b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64encode(
        json.dumps(
            {"sub": user_id, "exp": int(time.time()) + _TOKEN_LIFETIME_SECONDS},
            separators=(",", ":"),
        ).encode()
    )
    signing_input = f"{header}.{payload}".encode("ascii")
    signature = hmac.new(_secret_bytes(), signing_input, hashlib.sha256).digest()
    return f"{header}.{payload}.{_b64encode(signature)}"


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=401,
        detail="Authentication required. Sign in and try again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        header_raw, payload_raw, signature_raw = token.split(".")
        header = json.loads(_b64decode(header_raw))
        payload = json.loads(_b64decode(payload_raw))
        if header.get("alg") != "HS256":
            raise unauthorized
        signing_input = f"{header_raw}.{payload_raw}".encode("ascii")
        expected = hmac.new(_secret_bytes(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64decode(signature_raw)):
            raise unauthorized
        if int(payload.get("exp", 0)) <= int(time.time()):
            raise unauthorized
        user_id = str(uuid.UUID(payload["sub"]))
    except HTTPException:
        raise
    except (ValueError, TypeError, KeyError, UnicodeDecodeError, json.JSONDecodeError):
        raise unauthorized from None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise unauthorized
    return user
