from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from api.deps import get_current_user, get_session
from models.content_item import ContentItem
from models.user import User

router = APIRouter()

@router.get("/jobs/status")
async def job_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    pending = (await db.execute(
        select(func.count()).select_from(ContentItem).where(ContentItem.processing_status == "pending")
    )).scalar_one()

    try:
        from jobs.scheduler import get_scheduler
        scheduler = get_scheduler()
        jobs = [{"id": j.id, "next_run": str(j.next_run_time)} for j in scheduler.get_jobs()]
        running = scheduler.running
    except Exception:
        jobs, running = [], False

    return {"data": {"scheduler_running": running, "jobs": jobs, "pending_content_items": pending}}

@router.post("/jobs/trigger")
async def trigger_job(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    job_name = body.get("job", "")
    try:
        from jobs.scheduler import get_scheduler
        scheduler = get_scheduler()
        job = scheduler.get_job(job_name)
        if job:
            job.modify(next_run_time=__import__("datetime").datetime.utcnow())
        return {"message": f"job {job_name} triggered"}
    except Exception as e:
        return {"message": f"trigger attempted: {e}"}
