import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.investor import Investor
from models.source import Source
from schemas.source import SourceCreate, SourceUpdate


async def list_sources(db: AsyncSession, investor_id: uuid.UUID, user_id: uuid.UUID) -> list[Source]:
    # Verify investor ownership
    investor = await db.execute(
        select(Investor).where(Investor.id == investor_id, Investor.user_id == user_id)
    )
    if not investor.scalar_one_or_none():
        return []
    result = await db.execute(
        select(Source).where(Source.investor_id == investor_id).order_by(Source.created_at)
    )
    return list(result.scalars().all())


async def get_source(db: AsyncSession, source_id: uuid.UUID, investor_id: uuid.UUID) -> Source | None:
    result = await db.execute(
        select(Source).where(Source.id == source_id, Source.investor_id == investor_id)
    )
    return result.scalar_one_or_none()


async def create_source(
    db: AsyncSession, investor_id: uuid.UUID, user_id: uuid.UUID, data: SourceCreate
) -> Source | None:
    investor = (await db.execute(
        select(Investor).where(Investor.id == investor_id, Investor.user_id == user_id)
    )).scalar_one_or_none()
    if not investor:
        return None

    source = Source(
        investor_id=investor_id,
        source_type=data.source_type,
        url=data.url,
        label=data.label,
        check_frequency_hours=data.check_frequency_hours,
        config=data.config,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


async def update_source(
    db: AsyncSession, source_id: uuid.UUID, investor_id: uuid.UUID, data: SourceUpdate
) -> Source | None:
    source = await get_source(db, source_id, investor_id)
    if not source:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(source, field, value)
    source.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(source)
    return source


async def delete_source(db: AsyncSession, source_id: uuid.UUID, investor_id: uuid.UUID) -> bool:
    source = await get_source(db, source_id, investor_id)
    if not source:
        return False
    await db.delete(source)
    await db.commit()
    return True
