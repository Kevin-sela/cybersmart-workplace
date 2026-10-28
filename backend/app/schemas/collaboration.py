import unicodedata
from datetime import datetime
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.common import ApiSchema


def normalize_message(value: str) -> str:
    value = unicodedata.normalize("NFC", value).strip()
    if not value or len(value) > 2000:
        raise ValueError("Message must contain between 1 and 2,000 characters.")
    if any(unicodedata.category(char) == "Cc" and char not in "\n\t" for char in value):
        raise ValueError("Message contains unsupported control characters.")
    return value


class ForumChannel(ApiSchema):
    id: str
    label: str
    description: str
    module_week: int


class ForumChannelCreate(ApiSchema):
    label: str = Field(min_length=1, max_length=60)
    description: str = Field(min_length=1, max_length=240)

    @field_validator("label")
    @classmethod
    def validate_channel_label(cls, value: str) -> str:
        value = unicodedata.normalize("NFC", value).strip()
        if not value or any(unicodedata.category(char) == "Cc" for char in value):
            raise ValueError("Channel names must be one line and contain no control characters.")
        return value

    @field_validator("description")
    @classmethod
    def validate_channel_description(cls, value: str) -> str:
        value = unicodedata.normalize("NFC", value).strip()
        if not value or any(unicodedata.category(char) == "Cc" and char not in "\n\t" for char in value):
            raise ValueError("Channel text must not be empty or contain control characters.")
        return value


class ForumPostInput(ApiSchema):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        return normalize_message(value)


class ForumPostRead(ApiSchema):
    id: UUID
    author_id: UUID
    author: str
    role: str
    body: str
    created_at: datetime


class ChecklistInput(ApiSchema):
    steps: list[str] = Field(min_length=1, max_length=12)
    reflection: str | None = Field(default=None, max_length=1000)

    @field_validator("steps")
    @classmethod
    def validate_steps(cls, value: list[str]) -> list[str]:
        cleaned = [normalize_message(step) for step in value]
        if len({step.casefold() for step in cleaned}) != len(cleaned):
            raise ValueError("Checklist steps must be unique.")
        return cleaned

    @field_validator("reflection")
    @classmethod
    def validate_reflection(cls, value: str | None) -> str | None:
        return normalize_message(value) if value and value.strip() else None


class ChecklistRead(ApiSchema):
    task_id: UUID
    title: str
    brief: str
    steps: list[str]
    saved_at: datetime | None = None
