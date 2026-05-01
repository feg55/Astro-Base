from datetime import datetime

from pydantic import BaseModel, Field


class ShotRead(BaseModel):
    id: int
    title: str
    author_name: str
    object_id: int
    object_name: str
    image_url: str
    likes_count: int
    liked_by_me: bool
    telescope: str
    camera: str
    coordinates: str
    location: str
    description: str
    created_at: datetime


class ShotListResponse(BaseModel):
    items: list[ShotRead]
    total: int
    limit: int
    offset: int


class ShotCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    object_id: int
    image_url: str = Field(min_length=1, max_length=255)
    telescope: str = Field(min_length=1, max_length=120)
    camera: str = Field(min_length=1, max_length=120)
    coordinates: str = Field(min_length=1, max_length=120)
    location: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=5000)


class ShotUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    object_id: int | None = None
    image_url: str | None = Field(default=None, min_length=1, max_length=255)
    telescope: str | None = Field(default=None, min_length=1, max_length=120)
    camera: str | None = Field(default=None, min_length=1, max_length=120)
    coordinates: str | None = Field(default=None, min_length=1, max_length=120)
    location: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
