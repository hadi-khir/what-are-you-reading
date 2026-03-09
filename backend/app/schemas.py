from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Users ─────────────────────────────────────────────────────────────────────

class UserPublic(BaseModel):
    id: int
    username: str
    created_at: datetime
    followers_count: int
    following_count: int
    is_following: bool = False

    model_config = {"from_attributes": True}


class UserMe(UserPublic):
    email: str


# ── Books ─────────────────────────────────────────────────────────────────────

class BookSchema(BaseModel):
    id: int
    open_library_key: str
    title: str
    author: str
    cover_url: str | None
    publish_year: int | None

    model_config = {"from_attributes": True}


class BookSearchResult(BaseModel):
    """A book result from Open Library before it's saved locally."""
    open_library_key: str
    title: str
    author: str
    cover_url: str | None
    publish_year: int | None


# ── Shelf ─────────────────────────────────────────────────────────────────────

class AddToShelfRequest(BaseModel):
    open_library_key: str
    title: str
    author: str
    cover_url: str | None = None
    publish_year: int | None = None
    status: Literal["reading", "read", "want_to_read"]
    rating: int | None = Field(default=None, ge=1, le=5)
    year: int


class UpdateShelfRequest(BaseModel):
    status: Literal["reading", "read", "want_to_read"] | None = None
    rating: int | None = Field(default=None, ge=1, le=5)


class UserBookSchema(BaseModel):
    id: int
    book: BookSchema
    status: str
    rating: int | None
    started_at: datetime | None
    finished_at: datetime | None
    added_at: datetime
    year: int

    model_config = {"from_attributes": True}


# ── Goals ─────────────────────────────────────────────────────────────────────

class SetGoalRequest(BaseModel):
    goal_count: int = Field(ge=1, le=500)


class GoalSchema(BaseModel):
    id: int
    year: int
    goal_count: int
    books_read: int

    model_config = {"from_attributes": True}


# ── Feed ──────────────────────────────────────────────────────────────────────

class FeedItemSchema(BaseModel):
    user: UserPublic
    user_book: UserBookSchema
    likes_count: int = 0
    liked_by_me: bool = False
