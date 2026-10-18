from datetime import datetime, timezone
from authlib.integrations.base_client.errors import OAuthError
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import ValidationError
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.entities import User
from app.repositories import users as user_repository
from app.schemas.auth import AuthResponse, GoogleIdentity, LoginRequest, RegisterRequest, UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id or None,
    client_secret=settings.google_client_secret or None,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def frontend_redirect(path: str) -> RedirectResponse:
    return RedirectResponse(f"{settings.frontend_origin.rstrip('/')}{path}", status_code=status.HTTP_303_SEE_OTHER)


def serialize_user(db: Session, user: User) -> UserRead:
    profile = user_repository.find_profile(db, user.id)
    return UserRead(
        id=str(user.id), email=user.email, full_name=user.full_name, role=user.role,
        bio=profile.bio if profile else None, locale=profile.locale if profile else "en",
    )


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    common = {"httponly": True, "secure": settings.cookie_secure, "samesite": "lax"}
    response.set_cookie("cybersmart_access", access, max_age=settings.access_token_minutes * 60, path="/api", **common)
    response.set_cookie("cybersmart_refresh", refresh, max_age=settings.refresh_token_days * 86400, path="/api/session", **common)


@router.get("/google/login", name="google_login")
@limiter.limit("20/minute")
async def google_login(request: Request):
    if not settings.google_oauth_enabled:
        return frontend_redirect("/sign-in?error=google_unavailable")
    destination = request.query_params.get("next", "/dashboard")
    if not destination.startswith("/dashboard") or destination.startswith("//"):
        destination = "/dashboard"
    request.session["google_next"] = destination
    try:
        return await oauth.google.authorize_redirect(request, settings.google_redirect_uri, prompt="select_account")
    except Exception:
        request.session.clear()
        return frontend_redirect("/sign-in?error=google")


@router.get("/google/callback", name="google_callback")
@limiter.limit("20/minute")
async def google_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        claims = token.get("userinfo") or {}
        profile = GoogleIdentity.model_validate({key: claims.get(key) for key in ("sub", "email", "email_verified", "name")})
        user = auth_service.authenticate_google(db, profile)
    except (OAuthError, ValidationError, HTTPException, ValueError, IntegrityError):
        db.rollback()
        request.session.clear()
        return frontend_redirect("/sign-in?error=google")
    destination = request.session.pop("google_next", "/dashboard")
    if not isinstance(destination, str) or not destination.startswith("/dashboard") or destination.startswith("//"):
        destination = "/dashboard"
    access, refresh, _expires = auth_service.issue_session(db, user)
    response = frontend_redirect(destination)
    set_auth_cookies(response, access, refresh)
    request.session.clear()
    return response


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        user = auth_service.register(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from None
    access, refresh, _expires = auth_service.issue_session(db, user)
    set_auth_cookies(response, access, refresh)
    return AuthResponse(user=serialize_user(db, user), message="Your learner account is ready.")


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    user = auth_service.authenticate(db, payload)
    access, refresh, _expires = auth_service.issue_session(db, user)
    set_auth_cookies(response, access, refresh)
    return AuthResponse(user=serialize_user(db, user), message="You are signed in.")


@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("20/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    raw_refresh = request.cookies.get("cybersmart_refresh")
    session = auth_service.refresh_session(db, raw_refresh) if raw_refresh else None
    if session is None:
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Your session expired. Please sign in again.")
    user, access, replacement, _expires = session
    set_auth_cookies(response, access, replacement)
    return AuthResponse(user=serialize_user(db, user), message="Session renewed.")


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("cybersmart_access", path="/api", secure=settings.cookie_secure, httponly=True, samesite="lax")
    response.delete_cookie("cybersmart_refresh", path="/api/session", secure=settings.cookie_secure, httponly=True, samesite="lax")


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> dict[str, str]:
    user_repository.revoke_refresh_token(db, request.cookies.get("cybersmart_refresh"))
    clear_auth_cookies(response)
    return {"message": "You are signed out."}


@router.get("/me", response_model=UserRead)
def auth_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> UserRead:
    return serialize_user(db, user)
