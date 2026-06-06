import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

SourceType = Literal["sec_13f", "website", "youtube", "rss", "twitter", "custom"]


class SourceCreate(BaseModel):
    source_type: SourceType
    url: str = Field(..., min_length=1)
    label: str | None = None
    check_frequency_hours: int = Field(24, ge=1, le=720)
    config: dict = {}

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str, info) -> str:
        source_type = info.data.get("source_type")
        if source_type == "youtube" and "youtube.com" not in v and "youtu.be" not in v:
            raise ValueError("YouTube source URL must contain youtube.com or youtu.be")
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class SourceUpdate(BaseModel):
    label: str | None = None
    is_active: bool | None = None
    check_frequency_hours: int | None = Field(None, ge=1, le=720)
    config: dict | None = None


class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    investor_id: uuid.UUID
    source_type: str
    url: str
    label: str | None
    config: dict
    is_active: bool
    last_checked_at: datetime | None
    last_successful_at: datetime | None
    check_frequency_hours: int
    consecutive_failures: int
    created_at: datetime
    updated_at: datetime
