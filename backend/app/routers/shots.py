from typing import Annotated, Literal
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.deps import get_current_user, get_optional_user
from app.models import AstroShot, CelestialObject, ShotLike, User
from app.repositories.shots import get_shot, list_shots
from app.schemas.shots import ShotListResponse, ShotRead, ShotUpdate

router = APIRouter()
MAX_IMAGE_BYTES = 8 * 1024 * 1024


def _ensure_can_manage_shot(shot: AstroShot, user: User) -> None:
    if shot.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own shots",
        )


async def _ensure_object_exists(session: AsyncSession, object_id: int) -> None:
    celestial_object = await session.get(CelestialObject, object_id)
    if celestial_object is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown celestial object",
        )


async def _read_image_upload(image: UploadFile) -> bytes:
    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload an image file",
        )

    content = await image.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is required",
        )

    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image file is too large",
        )

    return content


def _content_disposition(filename: str | None) -> str:
    if not filename:
        return 'inline; filename="shot-image"'

    encoded_filename = quote(filename, safe="")
    return f'inline; filename="shot-image"; filename*=UTF-8\'\'{encoded_filename}'


@router.get("", response_model=ShotListResponse)
async def get_shots(
    q: str | None = None,
    object_ids: list[int] | None = Query(default=None),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort: Literal["latest", "popular", "oldest"] = "latest",
    session: AsyncSession = Depends(get_session),
    current_user: User | None = Depends(get_optional_user),
) -> ShotListResponse:
    items, total = await list_shots(
        session,
        query=q,
        object_ids=object_ids or [],
        limit=limit,
        offset=offset,
        sort=sort,
        current_user_id=current_user.id if current_user else None,
    )
    return ShotListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{shot_id}/image")
async def get_shot_image(
    shot_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    row = (
        await session.execute(
            select(
                AstroShot.image_data,
                AstroShot.image_content_type,
                AstroShot.image_filename,
            ).where(AstroShot.id == shot_id)
        )
    ).one_or_none()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot image not found")

    image_data, image_content_type, image_filename = row
    if image_data is None or image_content_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot image not found")

    return Response(
        content=image_data,
        media_type=image_content_type,
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": _content_disposition(image_filename),
        },
    )


@router.get("/{shot_id}", response_model=ShotRead)
async def get_shot_by_id(
    shot_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User | None = Depends(get_optional_user),
) -> ShotRead:
    shot = await get_shot(session, shot_id, current_user_id=current_user.id if current_user else None)
    if shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot not found")
    return shot


@router.post("", response_model=ShotRead, status_code=status.HTTP_201_CREATED)
async def create_shot(
    title: Annotated[str, Form(min_length=1, max_length=180)],
    object_id: Annotated[int, Form()],
    telescope: Annotated[str, Form(min_length=1, max_length=120)],
    camera: Annotated[str, Form(min_length=1, max_length=120)],
    coordinates: Annotated[str, Form(min_length=1, max_length=120)],
    location: Annotated[str, Form(min_length=1, max_length=160)],
    description: Annotated[str, Form(min_length=1, max_length=5000)],
    image: Annotated[UploadFile, File()],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ShotRead:
    await _ensure_object_exists(session, object_id)
    image_data = await _read_image_upload(image)

    shot = AstroShot(
        title=title,
        author_name=current_user.display_name,
        object_id=object_id,
        user_id=current_user.id,
        image_url="",
        image_data=image_data,
        image_content_type=image.content_type or "application/octet-stream",
        image_filename=image.filename,
        telescope=telescope,
        camera=camera,
        coordinates=coordinates,
        location=location,
        description=description,
    )
    session.add(shot)
    await session.commit()
    await session.refresh(shot)

    created_shot = await get_shot(session, shot.id, current_user_id=current_user.id)
    if created_shot is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Shot was not created")
    return created_shot


@router.patch("/{shot_id}", response_model=ShotRead)
async def update_shot(
    shot_id: int,
    payload: ShotUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ShotRead:
    shot = await session.get(AstroShot, shot_id)
    if shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot not found")

    _ensure_can_manage_shot(shot, current_user)
    data = payload.model_dump(exclude_unset=True)
    if "object_id" in data and data["object_id"] is not None:
        await _ensure_object_exists(session, data["object_id"])

    for key, value in data.items():
        if value is not None:
            setattr(shot, key, value)

    await session.commit()
    await session.refresh(shot)

    updated_shot = await get_shot(session, shot.id, current_user_id=current_user.id)
    if updated_shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot not found")
    return updated_shot


@router.delete("/{shot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shot(
    shot_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    shot = await session.get(AstroShot, shot_id)
    if shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot not found")

    _ensure_can_manage_shot(shot, current_user)
    await session.delete(shot)
    await session.commit()


@router.post("/{shot_id}/like", response_model=ShotRead)
async def like_shot(
    shot_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ShotRead:
    shot = await session.get(AstroShot, shot_id)
    if shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot not found")

    like = await session.get(ShotLike, {"user_id": current_user.id, "shot_id": shot_id})
    if like is None:
        session.add(ShotLike(user_id=current_user.id, shot_id=shot_id))
        await session.commit()

    liked_shot = await get_shot(session, shot_id, current_user_id=current_user.id)
    if liked_shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot not found")
    return liked_shot


@router.delete("/{shot_id}/like", response_model=ShotRead)
async def unlike_shot(
    shot_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ShotRead:
    like = await session.get(ShotLike, {"user_id": current_user.id, "shot_id": shot_id})
    if like is not None:
        await session.delete(like)
        await session.commit()

    shot = await get_shot(session, shot_id, current_user_id=current_user.id)
    if shot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot not found")
    return shot
