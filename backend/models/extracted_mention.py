import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

EntityTypeEnum = Enum(
    "company", "ticker", "person", "theme", "sector", "macro_theme",
    name="entity_type",
)

SentimentEnum = Enum("bullish", "bearish", "neutral", "mixed", name="sentiment")

ConvictionLevelEnum = Enum("high", "medium", "low", "unknown", name="conviction_level")


class ExtractedMention(Base):
    __tablename__ = "extracted_mentions"
    __table_args__ = (
        Index("idx_mentions_content", "content_item_id"),
        Index("idx_mentions_investor", "investor_id"),
        Index("idx_mentions_ticker", "ticker_symbol", postgresql_where="ticker_symbol IS NOT NULL"),
        Index("idx_mentions_entity", "entity_type", "entity_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False)
    investor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    entity_type: Mapped[str] = mapped_column(EntityTypeEnum, nullable=False)
    entity_name: Mapped[str] = mapped_column(String, nullable=False)
    ticker_symbol: Mapped[str | None] = mapped_column(String, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(SentimentEnum, nullable=True)
    conviction_level: Mapped[str | None] = mapped_column(ConvictionLevelEnum, nullable=True)
    context_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    content_item: Mapped["ContentItem"] = relationship("ContentItem", back_populates="extracted_mentions")
    investor: Mapped["Investor"] = relationship("Investor", back_populates="extracted_mentions")
