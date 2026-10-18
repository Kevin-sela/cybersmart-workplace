from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.v1.auth import serialize_user
from app.db.session import get_db
from app.models.entities import User
from app.repositories.users import save_profile
from app.schemas.auth import UserRead
from app.schemas.profile import ProfileUpdate

router = APIRouter(prefix="/users", tags=["profile"])


@router.get("/me", response_model=UserRead)
def read_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> UserRead:
    return serialize_user(db, user)


@router.patch("/me", response_model=UserRead)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> UserRead:
    save_profile(db, user, full_name=payload.full_name, bio=payload.bio, locale=payload.locale)
    return serialize_user(db, user)
