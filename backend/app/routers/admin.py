from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_password_hash
from app.deps import get_current_admin
from app.models import AstroShot, User
from app.schemas.admin import (
    AdminClearShotsResponse,
    AdminStatsRead,
    AdminUserCreate,
    AdminUserDeleteResponse,
    AdminUserListResponse,
    AdminUserRead,
    AdminUserRoleUpdate,
)
from app.services.auth_service import _unique_username

router = APIRouter()

RoleFilter = Literal["member", "admin"]
CLEAR_SHOTS_CONFIRMATION = "DELETE_ALL_PHOTOS"


def _user_filters(q: str | None, role: RoleFilter | None) -> list:
    filters = []

    if role is not None:
        filters.append(User.role == role)

    if q:
        pattern = f"%{q.strip()}%"
        filters.append(
            or_(
                User.display_name.ilike(pattern),
                User.username.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    return filters


def _to_admin_user_read(user: User, shots_count: int) -> AdminUserRead:
    return AdminUserRead(
        id=user.id,
        display_name=user.display_name,
        username=user.username,
        email=user.email,
        role="admin" if user.role == "admin" else "member",
        reputation=user.reputation,
        shots_count=shots_count,
        created_at=user.created_at,
    )


async def _get_user_or_404(session: AsyncSession, user_id: int) -> User:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


async def _admin_count(session: AsyncSession) -> int:
    count = await session.scalar(select(func.count(User.id)).where(User.role == "admin"))
    return count or 0


async def _ensure_not_last_admin(session: AsyncSession, user: User) -> None:
    if user.role != "admin":
        return

    if await _admin_count(session) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the last admin",
        )


@router.get("/stats", response_model=AdminStatsRead)
async def get_admin_stats(
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(get_current_admin),
) -> AdminStatsRead:
    users_count = await session.scalar(select(func.count(User.id)))
    admins_count = await session.scalar(select(func.count(User.id)).where(User.role == "admin"))
    shots_count = await session.scalar(select(func.count(AstroShot.id)))
    image_shots_count = await session.scalar(
        select(func.count(AstroShot.id)).where(AstroShot.image_data.is_not(None))
    )
    image_bytes = await session.scalar(
        select(func.coalesce(func.sum(func.octet_length(AstroShot.image_data)), 0))
    )

    return AdminStatsRead(
        users_count=users_count or 0,
        admins_count=admins_count or 0,
        shots_count=shots_count or 0,
        image_shots_count=image_shots_count or 0,
        image_bytes=int(image_bytes or 0),
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_admin_users(
    q: str | None = None,
    role: RoleFilter | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(get_current_admin),
) -> AdminUserListResponse:
    filters = _user_filters(q, role)
    count_statement = select(func.count(User.id))
    if filters:
        count_statement = count_statement.where(*filters)

    total = await session.scalar(count_statement)

    shot_counts = (
        select(AstroShot.user_id, func.count(AstroShot.id).label("shots_count"))
        .where(AstroShot.user_id.is_not(None))
        .group_by(AstroShot.user_id)
        .subquery()
    )
    shots_count = func.coalesce(shot_counts.c.shots_count, 0).label("shots_count")
    statement = (
        select(User, shots_count)
        .outerjoin(shot_counts, shot_counts.c.user_id == User.id)
        .order_by(User.created_at.desc(), User.id.desc())
        .limit(limit)
        .offset(offset)
    )
    if filters:
        statement = statement.where(*filters)

    rows = (await session.execute(statement)).all()

    return AdminUserListResponse(
        items=[_to_admin_user_read(user, int(count)) for user, count in rows],
        total=total or 0,
        limit=limit,
        offset=offset,
    )


@router.post("/users", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    payload: AdminUserCreate,
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(get_current_admin),
) -> AdminUserRead:
    email = payload.email.lower()
    existing_user = await session.scalar(select(User.id).where(User.email == email))
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
        role=payload.role,
        reputation=0,
    )
    session.add(user)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        ) from exc

    await session.refresh(user)
    return _to_admin_user_read(user, 0)


@router.patch("/users/{user_id}/role", response_model=AdminUserRead)
async def update_admin_user_role(
    user_id: int,
    payload: AdminUserRoleUpdate,
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
) -> AdminUserRead:
    user = await _get_user_or_404(session, user_id)
    if user.id == current_admin.id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself",
        )

    if payload.role != "admin":
        await _ensure_not_last_admin(session, user)

    user.role = payload.role
    await session.commit()
    await session.refresh(user)

    shots_count = await session.scalar(select(func.count(AstroShot.id)).where(AstroShot.user_id == user.id))
    return _to_admin_user_read(user, shots_count or 0)


@router.delete("/users/{user_id}", response_model=AdminUserDeleteResponse)
async def delete_admin_user(
    user_id: int,
    delete_shots: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
    current_admin: User = Depends(get_current_admin),
) -> AdminUserDeleteResponse:
    user = await _get_user_or_404(session, user_id)
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )

    await _ensure_not_last_admin(session, user)

    deleted_shots_count = 0
    if delete_shots:
        result = await session.execute(delete(AstroShot).where(AstroShot.user_id == user.id))
        deleted_shots_count = result.rowcount or 0

    await session.execute(delete(User).where(User.id == user.id))
    await session.commit()

    return AdminUserDeleteResponse(
        deleted_user_id=user_id,
        deleted_shots_count=deleted_shots_count,
    )


@router.delete("/shots", response_model=AdminClearShotsResponse)
async def clear_all_shots(
    confirm: str = Query(default=""),
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(get_current_admin),
) -> AdminClearShotsResponse:
    if confirm != CLEAR_SHOTS_CONFIRMATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation phrase",
        )

    result = await session.execute(delete(AstroShot))
    await session.commit()

    return AdminClearShotsResponse(deleted_count=result.rowcount or 0)
