import unicodedata

from pydantic import Field, field_validator

from app.schemas.auth import UserRead, clean_name
from app.schemas.common import ApiSchema


class ProfileUpdate(ApiSchema):
    full_name: str = Field(min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=280)
    locale: str = Field(default="en", min_length=2, max_length=16)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return clean_name(value)

    @field_validator("bio")
    @classmethod
    def normalize_bio(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = unicodedata.normalize("NFC", value).strip()
        if any(unicodedata.category(char) == "Cc" and char not in "\n\t" for char in normalized):
            raise ValueError("Bio contains unsupported control characters.")
        return normalized or None

    @field_validator("locale")
    @classmethod
    def validate_locale(cls, value: str) -> str:
        value = value.strip().replace("_", "-")
        if not value.replace("-", "").isalnum():
            raise ValueError("Enter a valid language code.")
        return value.lower()


class ProfileResponse(ApiSchema):
    user: UserRead
    created_at: str
