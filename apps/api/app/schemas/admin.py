from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

AdminRole = Literal["member", "admin"]


class AdminStatsRead(BaseModel):
    users_count: int
    admins_count: int
    shots_count: int
    image_shots_count: int
    image_bytes: int


class AdminUserRead(BaseModel):
    id: int
    display_name: str
    username: str
    email: EmailStr
    role: AdminRole
    reputation: int
    shots_count: int
    created_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserRead]
    total: int
    limit: int
    offset: int


class AdminUserCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: AdminRole = "member"


class AdminUserRoleUpdate(BaseModel):
    role: AdminRole


class AdminUserDeleteResponse(BaseModel):
    deleted_user_id: int
    deleted_shots_count: int


class AdminClearShotsResponse(BaseModel):
    deleted_count: int
