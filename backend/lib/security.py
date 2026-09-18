"""Password hashing + signed session tokens for the admin area.

Sessions ride an httpOnly cookie (never a token in JSON) — see routers/auth.py.
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

SESSION_COOKIE = "admin_session"
SESSION_TTL_DAYS = 7

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], pbkdf2_sha256__deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(password, password_hash)
    except Exception:
        return False


def _secret() -> str:
    secret = os.environ.get("SESSION_SECRET")
    if not secret:
        # .env carries a real secret; this fallback only keeps dev boot alive
        return "dev-insecure-secret"
    return secret


def create_session_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def verify_session_token(token: str) -> str | None:
    """Return the admin email the token was issued for, or None."""
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
