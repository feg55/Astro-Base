from pydantic import BaseModel


class CelestialObjectRead(BaseModel):
    id: int
    slug: str
    name: str
    type: str
    parent_id: int | None
    sort_order: int
    texture_path: str | None
