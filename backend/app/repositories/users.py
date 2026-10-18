from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.entities import Course, Enrollment, EnrollmentStatus, OAuthIdentity, RefreshToken, User, UserProfile


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def find_user(db: Session, user_id: UUID) -> User | None:
    return db.get(User, user_id)


def find_profile(db: Session, user_id: UUID) -> UserProfile | None:
    return db.get(UserProfile, user_id)


def create_learner(db: Session, *, email: str, full_name: str, password_hash: str) -> User:
    user = User(email=email, full_name=full_name, password_hash=password_hash)
    db.add(user)
    db.flush()
    db.add(UserProfile(user_id=user.id))
    course = db.scalar(select(Course).where(Course.slug == "cybersmart-workplace"))
    if course:
        db.add(Enrollment(user_id=user.id, course_id=course.id, status=EnrollmentStatus.ACTIVE))
    db.commit()
    db.refresh(user)
    return user


def get_or_link_google_user(db: Session, *, subject: str, email: str, full_name: str, password_hash: str) -> User:
    identity = db.scalar(select(OAuthIdentity).where(OAuthIdentity.provider == "google", OAuthIdentity.provider_subject == subject))
    if identity:
        user = find_user(db, identity.user_id)
        if user is None or not user.is_active:
            raise ValueError("This learner account is unavailable.")
        return user

    user = find_user_by_email(db, email)
    if user is None:
        user = User(email=email, full_name=full_name, password_hash=password_hash)
        db.add(user)
        db.flush()
        db.add(UserProfile(user_id=user.id))
        course = db.scalar(select(Course).where(Course.slug == "cybersmart-workplace"))
        if course:
            db.add(Enrollment(user_id=user.id, course_id=course.id, status=EnrollmentStatus.ACTIVE))
    elif not user.is_active:
        raise ValueError("This learner account is unavailable.")

    db.add(OAuthIdentity(user_id=user.id, provider="google", provider_subject=subject))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        linked = db.scalar(select(OAuthIdentity).where(OAuthIdentity.provider == "google", OAuthIdentity.provider_subject == subject))
        if linked:
            linked_user = find_user(db, linked.user_id)
            if linked_user and linked_user.is_active:
                return linked_user
        raise
    db.refresh(user)
    return user


def save_profile(db: Session, user: User, *, full_name: str, bio: str | None, locale: str) -> UserProfile:
    profile = find_profile(db, user.id)
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    user.full_name = full_name
    profile.bio = bio
    profile.locale = locale
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


def store_refresh_token(db: Session, user_id: UUID, raw_token: str, expires_at: datetime) -> None:
    db.add(RefreshToken(user_id=user_id, token_hash=sha256(raw_token.encode()).hexdigest(), expires_at=expires_at))
    db.commit()


def rotate_refresh_token(db: Session, raw_token: str, replacement: str, expires_at: datetime) -> UUID | None:
    token_hash = sha256(raw_token.encode()).hexdigest()
    record = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash).with_for_update())
    now = datetime.now(timezone.utc)
    if record is None or record.revoked_at is not None:
        return None
    expiry = record.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= now:
        record.revoked_at = now
        db.commit()
        return None
    user_id = record.user_id
    record.revoked_at = now
    db.add(RefreshToken(user_id=user_id, token_hash=sha256(replacement.encode()).hexdigest(), expires_at=expires_at))
    db.commit()
    return user_id


def revoke_refresh_token(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    record = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256(raw_token.encode()).hexdigest()))
    if record and record.revoked_at is None:
        record.revoked_at = datetime.now(timezone.utc)
        db.commit()
