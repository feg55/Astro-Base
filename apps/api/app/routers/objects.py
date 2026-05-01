from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models import CelestialObject
from app.schemas.objects import CelestialObjectRead

router = APIRouter()


@router.get("", response_model=list[CelestialObjectRead])
async def list_objects(session: AsyncSession = Depends(get_session)) -> list[CelestialObjectRead]:
    objects = await session.scalars(
        select(CelestialObject).order_by(CelestialObject.sort_order.asc(), CelestialObject.id.asc())
    )

    return [
        CelestialObjectRead(
            id=celestial_object.id,
            slug=celestial_object.slug,
            name=celestial_object.name,
            type=celestial_object.type,
            parent_id=celestial_object.parent_id,
            sort_order=celestial_object.sort_order,
            texture_path=celestial_object.texture_path,
        )
        for celestial_object in objects.all()
    ]
