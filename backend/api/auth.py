import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from supabase import create_client

from api.deps import get_current_user, get_session
from app.config import get_settings
from models.user import User

logger = structlog.get_logger()
settings = get_settings()
router = APIRouter()

supabase = create_client(settings.supabase_url, settings.supabase_service_key)


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None


class SessionData(BaseModel):
    access_token: str
    refresh_token: str | None = None


class AuthResponse(BaseModel):
    user: UserResponse
    session: SessionData


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequest, db: AsyncSession = Depends(get_session)):
    try:
        resp = supabase.auth.sign_up({"email": body.email, "password": body.password})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not resp.user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signup failed")

    # Upsert local user record
    user = User(
        id=uuid.UUID(resp.user.id),
        email=body.email,
        full_name=body.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return AuthResponse(
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name),
        session=SessionData(
            access_token=resp.session.access_token if resp.session else "",
            refresh_token=resp.session.refresh_token if resp.session else None,
        ),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_session)):
    try:
        resp = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not resp.user or not resp.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    result = await db.execute(select(User).where(User.id == uuid.UUID(resp.user.id)))
    user = result.scalar_one_or_none()
    if not user:
        # Auto-create user record if missing (e.g. first login after manual Supabase signup)
        user = User(id=uuid.UUID(resp.user.id), email=body.email)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return AuthResponse(
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name),
        session=SessionData(
            access_token=resp.session.access_token,
            refresh_token=resp.session.refresh_token,
        ),
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "logged out"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email, full_name=current_user.full_name)
