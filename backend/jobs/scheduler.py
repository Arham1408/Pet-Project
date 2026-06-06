"""
APScheduler setup.
Runs in-process (no Celery/Redis required) using AsyncIOScheduler.
Jobs:
  1. ingest_sec_13f        — daily at 06:00 UTC
  2. ingest_websites       — every 4 hours
  3. ingest_rss            — every 2 hours
  4. ingest_youtube        — every 6 hours
  5. process_pending       — every 5 minutes
  6. daily_digest          — daily at 07:00 UTC
"""
import asyncio

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.config import get_settings

logger = structlog.get_logger()

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="UTC")
    return _scheduler


def start_scheduler() -> None:
    settings = get_settings()
    if not settings.scheduler_enabled:
        logger.info("Scheduler disabled via config, skipping")
        return

    scheduler = get_scheduler()
    if scheduler.running:
        logger.warning("Scheduler already running")
        return

    # ── Ingestion jobs ──────────────────────────────────────────────────────
    scheduler.add_job(
        _run_sec_ingestion,
        trigger=CronTrigger(hour=6, minute=0),
        id="ingest_sec_13f",
        name="SEC 13F Ingestion",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.add_job(
        _run_website_ingestion,
        trigger=IntervalTrigger(hours=4),
        id="ingest_websites",
        name="Website Ingestion",
        replace_existing=True,
        misfire_grace_time=900,
    )

    scheduler.add_job(
        _run_rss_ingestion,
        trigger=IntervalTrigger(hours=2),
        id="ingest_rss",
        name="RSS Ingestion",
        replace_existing=True,
        misfire_grace_time=600,
    )

    scheduler.add_job(
        _run_youtube_ingestion,
        trigger=IntervalTrigger(hours=6),
        id="ingest_youtube",
        name="YouTube Ingestion",
        replace_existing=True,
        misfire_grace_time=1800,
    )

    # ── Processing job (runs frequently) ────────────────────────────────────
    scheduler.add_job(
        _run_processing,
        trigger=IntervalTrigger(minutes=5),
        id="process_pending",
        name="Process Pending Content",
        replace_existing=True,
        misfire_grace_time=120,
    )

    # ── Daily digest ─────────────────────────────────────────────────────────
    scheduler.add_job(
        _run_daily_digest,
        trigger=CronTrigger(hour=7, minute=0),
        id="daily_digest",
        name="Daily Digest",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.start()
    logger.info("Scheduler started", job_count=len(scheduler.get_jobs()))


def stop_scheduler() -> None:
    scheduler = get_scheduler()
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")


# ── Job wrappers (sync → async bridge) ──────────────────────────────────────

async def _run_sec_ingestion() -> None:
    try:
        from jobs.ingestion_job import run_ingestion_for_source_type
        result = await run_ingestion_for_source_type("sec_13f")
        logger.info("SEC ingestion complete", **result)
    except Exception as e:
        logger.error("SEC ingestion job failed", error=str(e))


async def _run_website_ingestion() -> None:
    try:
        from jobs.ingestion_job import run_ingestion_for_source_type
        result = await run_ingestion_for_source_type("website")
        logger.info("Website ingestion complete", **result)
    except Exception as e:
        logger.error("Website ingestion job failed", error=str(e))


async def _run_rss_ingestion() -> None:
    try:
        from jobs.ingestion_job import run_ingestion_for_source_type
        result = await run_ingestion_for_source_type("rss")
        logger.info("RSS ingestion complete", **result)
    except Exception as e:
        logger.error("RSS ingestion job failed", error=str(e))


async def _run_youtube_ingestion() -> None:
    try:
        from jobs.ingestion_job import run_ingestion_for_source_type
        result = await run_ingestion_for_source_type("youtube")
        logger.info("YouTube ingestion complete", **result)
    except Exception as e:
        logger.error("YouTube ingestion job failed", error=str(e))


async def _run_processing() -> None:
    try:
        from jobs.processing_job import process_pending_content
        result = await process_pending_content()
        if result["processed"] or result["failed"]:
            logger.info("Processing job complete", **result)
    except Exception as e:
        logger.error("Processing job failed", error=str(e))


async def _run_daily_digest() -> None:
    try:
        from jobs.digest_job import generate_daily_digests
        result = await generate_daily_digests()
        logger.info("Digest job complete", **result)
    except Exception as e:
        logger.error("Digest job failed", error=str(e))
