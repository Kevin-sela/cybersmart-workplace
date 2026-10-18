from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.learning import ProgressRead, ProgressUpdate
from app.services.learning_service import get_progress, update_progress

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/me", response_model=ProgressRead)
def my_progress(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ProgressRead:
    return get_progress(db, user)


@router.put("/lessons/{lesson_id}", response_model=ProgressRead)
def mark_lesson(lesson_id: UUID, payload: ProgressUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ProgressRead:
    return update_progress(db, user, lesson_id, payload)
