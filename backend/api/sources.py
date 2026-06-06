import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

import services.source_service as svc
from api.deps import get_current_user, get_session
from models.user import User
from schemas.source import SourceCreate, SourceResponse, SourceUpdate

router = APIRouter()


@router.get("/{investor_id}/sources", response_model=list[SourceResponse])
async def list_sources(
    investor_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    return await svc.list_sources(db, investor_id, current_user.id)


@router.post("/{investor_id}/sources", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(
    investor_id: uuid.UUID,
    body: SourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    source = await svc.create_source(db, investor_id, current_user.id, body)
    if not source:
        raise HTTPException(status_code=404, detail="Investor not found")
    return source


@router.put("/{investor_id}/sources/{source_id}", response_model=SourceResponse)
async def update_source(
    investor_id: uuid.UUID,
    source_id: uuid.UUID,
    body: SourceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    # Verify investor ownership first
    sources = await svc.list_sources(db, investor_id, current_user.id)
    if not any(s.id == source_id for s in sources):
        raise HTTPException(status_code=404, detail="Source not found")
    source = await svc.update_source(db, source_id, investor_id, body)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.delete("/{investor_id}/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    investor_id: uuid.UUID,
    source_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    sources = await svc.list_sources(db, investor_id, current_user.id)
    if not any(s.id == source_id for s in sources):
        raise HTTPException(status_code=404, detail="Source not found")
    deleted = await svc.delete_source(db, source_id, investor_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Source not found")
