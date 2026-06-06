import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    investor_id: uuid.UUID | None
    content_item_id: uuid.UUID | None
    report_id: uuid.UUID | None
    alert_type: str
    title: str
    summary: str | None
    severity: str
    score: int
    is_read: bool
    email_sent: bool
    metadata: dict
    created_at: datetime
    investor_name: str | None = None


class AlertListResponse(BaseModel):
    data: list[AlertResponse]
    unread_count: int
    total: int
