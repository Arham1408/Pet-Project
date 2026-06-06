import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    investor_id: uuid.UUID | None = None
    limit: int = Field(10, ge=1, le=50)


class SearchResult(BaseModel):
    content_item_id: str
    chunk_text: str
    investor_name: str | None
    source_url: str | None
    published_at: datetime | None
    similarity: float


class SearchResponse(BaseModel):
    data: list[SearchResult]
    query: str
