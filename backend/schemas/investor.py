import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InvestorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    cik_number: str | None = Field(None, pattern=r"^\d{1,10}$")


class InvestorUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    cik_number: str | None = None
    is_active: bool | None = None


class InvestorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None
    cik_number: str | None
    is_active: bool
    last_synced_at: datetime | None
    created_at: datetime
    updated_at: datetime
    sources_count: int = 0


class InvestorDetailResponse(InvestorResponse):
    stats: dict = {}
