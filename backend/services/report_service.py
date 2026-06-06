import uuid
from datetime import datetime, timedelta

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.report import Report


async def list_reports(
    db: AsyncSession,
    user_id: uuid.UUID,
    investor_id: uuid.UUID | None = None,
    report_type: str | None = None,
    unread_only: bool = False,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Report], int]:
    from sqlalchemy import func
    q = select(Report).where(Report.user_id == user_id)
    count_q = select(func.count()).select_from(Report).where(Report.user_id == user_id)
    if investor_id:
        q = q.where(Report.investor_id == investor_id)
        count_q = count_q.where(Report.investor_id == investor_id)
    if report_type:
        q = q.where(Report.report_type == report_type)
        count_q = count_q.where(Report.report_type == report_type)
    if unread_only:
        q = q.where(Report.is_read == False)  # noqa: E712
        count_q = count_q.where(Report.is_read == False)  # noqa: E712
    total = (await db.execute(count_q)).scalar_one()
    q = q.order_by(desc(Report.generated_at)).limit(limit).offset(offset)
    reports = list((await db.execute(q)).scalars().all())
    return reports, total


async def get_report(db: AsyncSession, report_id: uuid.UUID, user_id: uuid.UUID) -> Report | None:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def mark_report_read(db: AsyncSession, report_id: uuid.UUID, user_id: uuid.UUID) -> Report | None:
    report = await get_report(db, report_id, user_id)
    if not report:
        return None
    report.is_read = True
    await db.commit()
    await db.refresh(report)
    return report


async def generate_investor_report(
    investor_id: uuid.UUID,
    user_id: uuid.UUID,
    period_days: int = 30,
) -> None:
    """Trigger async report generation. Full implementation in agents/nodes/report_generator.py."""
    from jobs.processing_job import trigger_report_generation
    await trigger_report_generation(investor_id, user_id, period_days)
