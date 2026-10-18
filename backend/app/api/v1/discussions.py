from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.repositories import learning as repository
from app.repositories.learning import create_channel_post, get_channel, list_channel_posts, list_channels
from app.repositories.learning import get_course
from app.schemas.collaboration import ForumChannel, ForumPostInput, ForumPostRead

router = APIRouter(prefix="/forum", tags=["discussions"])


def course_id(db: Session):
    course = get_course(db, "cybersmart-workplace")
    if course is None:
        raise HTTPException(status_code=503, detail="Discussion channels are not available yet.")
    return course.id


@router.get("/channels", response_model=list[ForumChannel])
def channels(db: Session = Depends(get_db), _user: User = Depends(get_current_user)) -> list[ForumChannel]:
    course = get_course(db, "cybersmart-workplace")
    if course is None:
        return []
    return [ForumChannel(id=channel.slug, label=channel.title, description=channel.description, module_week=channel.position) for channel in list_channels(db, course.id)]


@router.get("/channels/{slug}/posts", response_model=list[ForumPostRead])
def posts(slug: str, db: Session = Depends(get_db), _user: User = Depends(get_current_user)) -> list[ForumPostRead]:
    channel = get_channel(db, course_id(db), slug)
    if channel is None:
        raise HTTPException(status_code=404, detail="Discussion channel not found.")
    return [ForumPostRead(id=post.id, author=user.full_name, role=user.role.value.title(), body=post.body, created_at=post.created_at) for post, user in list_channel_posts(db, channel)]


@router.post("/channels/{slug}/posts", response_model=ForumPostRead, status_code=201)
def add_post(slug: str, payload: ForumPostInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ForumPostRead:
    channel = get_channel(db, course_id(db), slug)
    if channel is None:
        raise HTTPException(status_code=404, detail="Discussion channel not found.")
    post = create_channel_post(db, channel, user, payload.body)
    return ForumPostRead(id=post.id, author=user.full_name, role=user.role.value.title(), body=post.body, created_at=post.created_at)
