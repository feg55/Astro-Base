from pydantic import BaseModel, EmailStr, Field


class UserRead(BaseModel):
    id: int
    display_name: str
    username: str
    email: EmailStr
    shots_count: int
    reputation: int
    role: str


class RegisterRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
