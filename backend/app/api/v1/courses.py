from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.learning import CourseRead, LessonRead
from app.services.learning_service import get_course, get_lesson, list_courses

router = APIRouter(tags=["courses"])


@router.get("/courses", response_model=list[CourseRead])
def courses(db: Session = Depends(get_db)) -> list[CourseRead]:
    return list_courses(db)


@router.get("/courses/{slug}", response_model=CourseRead)
def course(slug: str, db: Session = Depends(get_db)) -> CourseRead:
    return get_course(db, slug)


@router.get("/lessons/{slug}", response_model=LessonRead)
def lesson(slug: str, db: Session = Depends(get_db)) -> LessonRead:
    return get_lesson(db, slug)
