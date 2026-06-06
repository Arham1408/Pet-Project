import uuid
from datetime import datetime

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.alert import Alert
from models.content_item import ContentItem
from models.investor import Investor
from models.report import Report
from models.source import Source
from schemas.investor import InvestorCreate, InvestorUpdate

logger = structlog.get_logger()


async def list_investors(db: AsyncSession, user_id: uuid.UUID) -> list[Investor]:
    result = await db.execute(
        select(Investor)
        .where(Investor.user_id == user_id)
        .order_by(Investor.created_at.desc())
    )
    investors = result.scalars().all()
    # Attach sources_count
    for inv in investors:
        count_result = await db.execute(
            select(func.count()).select_from(Source).where(Source.investor_id == inv.id)
        )
        inv.sources_count = count_result.scalar_one()
    return investors


async def get_investor(db: AsyncSession, investor_id: uuid.UUID, user_id: uuid.UUID) -> Investor | None:
    result = await db.execute(
        select(Investor)
        .options(selectinload(Investor.sources))
        .where(Investor.id == investor_id, Investor.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_investor(db: AsyncSession, user_id: uuid.UUID, data: InvestorCreate) -> Investor:
    investor = Investor(
        user_id=user_id,
        name=data.name,
        description=data.description,
        cik_number=_pad_cik(data.cik_number) if data.cik_number else None,
    )
    db.add(investor)
    await db.commit()
    await db.refresh(investor)
    investor.sources_count = 0
    return investor


async def update_investor(
    db: AsyncSession, investor_id: uuid.UUID, user_id: uuid.UUID, data: InvestorUpdate
) -> Investor | None:
    investor = await get_investor(db, investor_id, user_id)
    if not investor:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(investor, field, value)
    investor.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(investor)
    return investor


async def delete_investor(db: AsyncSession, investor_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    investor = await get_investor(db, investor_id, user_id)
    if not investor:
        return False
    await db.delete(investor)
    await db.commit()
    return True


async def get_investor_stats(db: AsyncSession, investor_id: uuid.UUID) -> dict:
    content_count = (await db.execute(
        select(func.count()).select_from(ContentItem).where(ContentItem.investor_id == investor_id)
    )).scalar_one()
    report_count = (await db.execute(
        select(func.count()).select_from(Report).where(Report.investor_id == investor_id)
    )).scalar_one()
    unread_alerts = (await db.execute(
        select(func.count()).select_from(Alert).where(
            Alert.investor_id == investor_id, Alert.is_read == False  # noqa: E712
        )
    )).scalar_one()
    return {"content_items": content_count, "reports": report_count, "unread_alerts": unread_alerts}


def _pad_cik(cik: str) -> str:
    return cik.zfill(10)
