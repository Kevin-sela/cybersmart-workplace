import re
import unicodedata

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.entities import DiscussionChannel
from app.repositories import learning as repository


def _channel_slug(label: str) -> str:
    ascii_label = unicodedata.normalize("NFKD", label).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_label).strip("-")[:50].rstrip("-") or "channel"


def create_discussion_channel(db: Session, label: str, description: str) -> DiscussionChannel:
    course = repository.get_course(db, "cybersmart-workplace")
    if course is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Discussion channels are not available yet.")

    base = _channel_slug(label)
    slug = base
    suffix = 2
    while repository.get_channel(db, course.id, slug) is not None:
        slug = f"{base[:54]}-{suffix}"
        suffix += 1

    return repository.create_channel(db, course.id, slug, label, description)
