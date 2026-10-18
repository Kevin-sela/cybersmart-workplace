import unicodedata
from datetime import datetime
from typing import Self

from pydantic import EmailStr, Field, field_validator, model_validator

from app.models.entities import UserRole
from app.schemas.common import ApiSchema


def clean_name(value: str) -> str:
    value = unicodedata.normalize("NFC", value).strip()
    if len(value) < 2 or not all(
        char.isalpha() or char in " .'-" for char in value
    ):
        raise ValueError("Use a name with letters, spaces, apostrophes, periods, or hyphens.")
    return value


class RegisterRequest(ApiSchema):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=12, max_length=128)
    confirm_password: str = Field(min_length=12, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().casefold()

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return clean_name(value)

    @model_validator(mode="after")
    def passwords_match(self) -> Self:
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(ApiSchema):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().casefold()


class UserRead(ApiSchema):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    bio: str | None = None
    locale: str = "en"
    created_at: datetime
    profile_updated_at: datetime | None = None


class AuthResponse(ApiSchema):
    user: UserRead
    message: str


class GoogleIdentity(ApiSchema):
    sub: str = Field(min_length=1, max_length=255)
    email: EmailStr
    email_verified: bool
    name: str | None = Field(default=None, max_length=120)

    @field_validator("email")
    @classmethod
    def normalize_google_email(cls, value: EmailStr) -> str:
        return str(value).strip().casefold()

    @field_validator("name")
    @classmethod
    def validate_google_name(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return clean_name(value)
