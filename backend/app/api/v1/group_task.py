from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.repositories.learning import get_group_task, get_user_submission, save_user_submission
from app.schemas.collaboration import ChecklistInput, ChecklistRead

router = APIRouter(prefix="/group-task", tags=["group task"])


def read_task(db: Session, user: User) -> ChecklistRead:
    task = get_group_task(db)
    if task is None:
        raise HTTPException(status_code=404, detail="The group activity is not available yet.")
    steps = [str(entry.get("criterion", "")) for entry in task.rubric if entry.get("criterion")]
    saved = get_user_submission(db, task.id, user.id)
    content = saved[1].content if saved else {}
    return ChecklistRead(task_id=task.id, title=task.title, brief=task.brief, steps=list(content.get("steps", steps)), saved_at=saved[1].submitted_at if saved else None)


@router.get("", response_model=ChecklistRead)
def group_task(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChecklistRead:
    return read_task(db, user)


@router.put("", response_model=ChecklistRead)
def save_checklist(payload: ChecklistInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChecklistRead:
    task = get_group_task(db)
    if task is None:
        raise HTTPException(status_code=404, detail="The group activity is not available yet.")
    allowed = {str(entry.get("criterion", "")) for entry in task.rubric if entry.get("criterion")}
    if not set(payload.steps).issubset(allowed):
        raise HTTPException(status_code=422, detail="Checklist steps must come from the course activity.")
    save_user_submission(db, task, user.id, {"steps": payload.steps, "reflection": payload.reflection})
    return read_task(db, user)
