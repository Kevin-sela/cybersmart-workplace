from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.learning import QuizRead, QuizResult, QuizSubmit
from app.services.learning_service import get_final_quiz, submit_final_quiz

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/final", response_model=QuizRead)
def final_quiz(db: Session = Depends(get_db)) -> QuizRead:
    return get_final_quiz(db)


@router.post("/final/attempts", response_model=QuizResult)
def submit_quiz(payload: QuizSubmit, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> QuizResult:
    return submit_final_quiz(db, user, payload)
