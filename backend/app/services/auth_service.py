from datetime import datetime, timedelta, timezone
import secrets

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.entities import User
from app.repositories import users as user_repository
from app.schemas.auth import GoogleIdentity, LoginRequest, RegisterRequest

_DUMMY_PASSWORD_HASH = hash_password("not-a-real-account-password")


def register(db: Session, payload: RegisterRequest) -> User:
    if user_repository.find_user_by_email(db, str(payload.email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
    user = user_repository.create_learner(
        db,
        email=str(payload.email),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    return user


def authenticate_google(db: Session, identity: GoogleIdentity) -> User:
    if not identity.email_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google did not verify this email address.")
    name = identity.name or "Learner"
    return user_repository.get_or_link_google_user(
        db, subject=identity.sub, email=str(identity.email), full_name=name,
        password_hash=hash_password(secrets.token_urlsafe(48)),
    )


def authenticate(db: Session, payload: LoginRequest) -> User:
    user = user_repository.find_user_by_email(db, str(payload.email))
    password_hash = user.password_hash if user else _DUMMY_PASSWORD_HASH
    valid = verify_password(payload.password, password_hash)
    if not user or not valid or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect.")
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def issue_session(db: Session, user: User) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.refresh_token_days)
    refresh_token = secrets.token_urlsafe(48)
    user_repository.store_refresh_token(db, user.id, refresh_token, expires_at)
    access_token = create_access_token(user.id, user.role.value)
    return access_token, refresh_token, expires_at


def refresh_session(db: Session, raw_token: str) -> tuple[User, str, str, datetime] | None:
    replacement = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)
    user_id = user_repository.rotate_refresh_token(db, raw_token, replacement, expires_at)
    if not user_id:
        return None
    user = user_repository.find_user(db, user_id)
    if not user or not user.is_active:
        return None
    return user, create_access_token(user.id, user.role.value), replacement, expires_at
