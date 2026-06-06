import uuid
from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.content_item import ContentItem
from models.portfolio_change import PortfolioChange


async def list_content_items(
    db: AsyncSession,
    investor_id: uuid.UUID,
    content_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[ContentItem]:
    q = select(ContentItem).where(ContentItem.investor_id == investor_id)
    if content_type:
        q = q.where(ContentItem.content_type == content_type)
    q = q.order_by(desc(ContentItem.published_at)).limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_portfolio_changes(
    db: AsyncSession, investor_id: uuid.UUID, filing_period: str | None = None
) -> list[PortfolioChange]:
    q = select(PortfolioChange).where(PortfolioChange.investor_id == investor_id)
    if filing_period:
        q = q.where(PortfolioChange.filing_period == filing_period)
    q = q.order_by(desc(PortfolioChange.created_at))
    result = await db.execute(q)
    return list(result.scalars().all())


def chunk_documents(docs):
    """Split LangChain Documents into chunks preserving metadata."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=4000,
        chunk_overlap=400,
        separators=["\n\n", "\n", ". ", " "],
    )
    return splitter.split_documents(docs)
