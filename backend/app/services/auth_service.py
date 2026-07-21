import re

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models import AstroShot, User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead


def _make_username_source(display_name: str, email: str) -> str:
    source = display_name or email.split("@")[0] or "astro"
    username = re.sub(r"[^0-9a-zа-я]+", "_", source.strip().lower(), flags=re.IGNORECASE)
    username = username.strip("_")
    return username or "astro"


async def _unique_username(session: AsyncSession, display_name: str, email: str) -> str:
    base_username = _make_username_source(display_name, email)
    username = base_username
    suffix = 1

    while await session.scalar(select(User.id).where(User.username == username)):
        suffix += 1
        username = f"{base_username}_{suffix}"

    return username


async def user_to_read(session: AsyncSession, user: User) -> UserRead:
    shots_count = await session.scalar(
        select(func.count(AstroShot.id)).where(AstroShot.user_id == user.id)
    )
    return UserRead(
        id=user.id,
        display_name=user.display_name,
        username=user.username,
        email=user.email,
        shots_count=shots_count or 0,
        reputation=user.reputation,
        role=user.role,
    )


async def register_user(session: AsyncSession, payload: RegisterRequest) -> TokenResponse:
    email = payload.email.lower()
    existing_user = await session.scalar(select(User).where(User.email == email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    user = User(
        display_name=payload.display_name.strip(),
        email=email,
        username=await _unique_username(session, payload.display_name, email),
        password_hash=get_password_hash(payload.password),
        role="member",
        reputation=0,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        user=await user_to_read(session, user),
    )


async def login_user(session: AsyncSession, payload: LoginRequest) -> TokenResponse:
    email = payload.email.lower()
    user = await session.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        user=await user_to_read(session, user),
    )
