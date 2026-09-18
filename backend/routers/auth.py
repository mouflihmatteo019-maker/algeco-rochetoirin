"""Admin authentication — httpOnly cookie sessions under /api/auth/*."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.security import (
    SESSION_COOKIE,
    SESSION_TTL_DAYS,
    create_session_token,
    verify_session_token,
)
from lib.db import db
from models.booking import LoginRequest, MeResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


async def require_admin(request: Request) -> str:
    """FastAPI dependency: returns the admin email or raises 401."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    email = verify_session_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Session invalide ou expirée")
    return email


@router.post("/login", response_model=MeResponse)
async def login(input: LoginRequest, response: Response) -> MeResponse:
    email = input.email.lower()
    user = await db.admin_users.find_one({"email": email})
    from lib.security import verify_password

    if not user or not verify_password(input.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Identifiants incorrects. Vérifiez votre email et mot de passe.")

    token = create_session_token(email)
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=False,  # terminated behind the preview proxy; flip on behind TLS-only origins
        max_age=SESSION_TTL_DAYS * 24 * 3600,
        path="/",
    )
    return MeResponse(authenticated=True, email=email)


@router.get("/me", response_model=MeResponse)
async def me(request: Request) -> MeResponse:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return MeResponse(authenticated=False, email=None)
    email = verify_session_token(token)
    if not email:
        return MeResponse(authenticated=False, email=None)
    return MeResponse(authenticated=True, email=email)


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"authenticated": False}
