from collections.abc import Sequence

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AstroShot, CelestialObject, ShotLike
from app.schemas.shots import ShotRead


def _apply_filters(
    statement: Select[tuple],
    query: str | None,
    object_ids: Sequence[int],
) -> Select[tuple]:
    if object_ids:
        statement = statement.where(AstroShot.object_id.in_(object_ids))

    if query:
        pattern = f"%{query.strip()}%"
        statement = statement.where(
            or_(
                AstroShot.title.ilike(pattern),
                AstroShot.author_name.ilike(pattern),
                AstroShot.telescope.ilike(pattern),
                AstroShot.camera.ilike(pattern),
                AstroShot.coordinates.ilike(pattern),
                AstroShot.location.ilike(pattern),
                AstroShot.description.ilike(pattern),
                CelestialObject.name.ilike(pattern),
            )
        )

    return statement


def _to_shot_read(
    shot: AstroShot,
    object_name: str,
    likes_count: int,
    liked_shot_ids: set[int],
) -> ShotRead:
    image_url = f"/shots/{shot.id}/image" if shot.image_content_type else shot.image_url

    return ShotRead(
        id=shot.id,
        title=shot.title,
        author_name=shot.author_name,
        object_id=shot.object_id,
        object_name=object_name,
        image_url=image_url,
        likes_count=shot.base_likes_count + likes_count,
        liked_by_me=shot.id in liked_shot_ids,
        telescope=shot.telescope,
        camera=shot.camera,
        coordinates=shot.coordinates,
        location=shot.location,
        description=shot.description,
        created_at=shot.created_at,
    )


async def _liked_shot_ids(
    session: AsyncSession,
    current_user_id: int | None,
    shot_ids: Sequence[int],
) -> set[int]:
    if current_user_id is None or not shot_ids:
        return set()

    rows = await session.scalars(
        select(ShotLike.shot_id).where(
            ShotLike.user_id == current_user_id,
            ShotLike.shot_id.in_(shot_ids),
        )
    )
    return set(rows.all())


async def list_shots(
    session: AsyncSession,
    *,
    query: str | None,
    object_ids: Sequence[int],
    limit: int,
    offset: int,
    sort: str,
    current_user_id: int | None,
) -> tuple[list[ShotRead], int]:
    count_statement = select(func.count(AstroShot.id)).join(CelestialObject)
    count_statement = _apply_filters(count_statement, query, object_ids)
    total = await session.scalar(count_statement)

    likes_count = func.count(ShotLike.user_id).label("likes_count")
    statement = (
        select(AstroShot, CelestialObject.name, likes_count)
        .join(CelestialObject)
        .outerjoin(ShotLike, ShotLike.shot_id == AstroShot.id)
        .group_by(AstroShot.id, CelestialObject.name)
    )
    statement = _apply_filters(statement, query, object_ids)

    if sort == "popular":
        statement = statement.order_by(likes_count.desc(), AstroShot.created_at.desc())
    elif sort == "oldest":
        statement = statement.order_by(AstroShot.created_at.asc())
    else:
        statement = statement.order_by(AstroShot.created_at.desc())

    statement = statement.limit(limit).offset(offset)
    rows = (await session.execute(statement)).all()
    shot_ids = [shot.id for shot, _object_name, _likes_count in rows]
    liked_ids = await _liked_shot_ids(session, current_user_id, shot_ids)

    return (
        [
            _to_shot_read(shot, object_name, int(likes_count_value), liked_ids)
            for shot, object_name, likes_count_value in rows
        ],
        total or 0,
    )


async def get_shot(
    session: AsyncSession,
    shot_id: int,
    *,
    current_user_id: int | None,
) -> ShotRead | None:
    likes_count = func.count(ShotLike.user_id).label("likes_count")
    statement = (
        select(AstroShot, CelestialObject.name, likes_count)
        .join(CelestialObject)
        .outerjoin(ShotLike, ShotLike.shot_id == AstroShot.id)
        .where(AstroShot.id == shot_id)
        .group_by(AstroShot.id, CelestialObject.name)
    )
    row = (await session.execute(statement)).first()
    if row is None:
        return None

    shot, object_name, likes_count_value = row
    liked_ids = await _liked_shot_ids(session, current_user_id, [shot.id])
    return _to_shot_read(shot, object_name, int(likes_count_value), liked_ids)
