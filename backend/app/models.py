from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    books: Mapped[list["UserBook"]] = relationship("UserBook", back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["ReadingGoal"]] = relationship("ReadingGoal", back_populates="user", cascade="all, delete-orphan")
    # follows where this user is the follower
    following: Mapped[list["Follow"]] = relationship(
        "Follow", foreign_keys="Follow.follower_id", back_populates="follower", cascade="all, delete-orphan"
    )
    # follows where this user is being followed
    followers: Mapped[list["Follow"]] = relationship(
        "Follow", foreign_keys="Follow.following_id", back_populates="following", cascade="all, delete-orphan"
    )


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    open_library_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[str] = mapped_column(String(500), nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(500))
    publish_year: Mapped[int | None] = mapped_column(Integer)

    user_books: Mapped[list["UserBook"]] = relationship("UserBook", back_populates="book")


class UserBook(Base):
    __tablename__ = "user_books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    book_id: Mapped[int] = mapped_column(Integer, ForeignKey("books.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # reading | read | want_to_read
    rating: Mapped[int | None] = mapped_column(Integer)  # 1-5, only set when status=read
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_user_book"),)

    user: Mapped["User"] = relationship("User", back_populates="books")
    book: Mapped["Book"] = relationship("Book", back_populates="user_books")


class ReadingGoal(Base):
    __tablename__ = "reading_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    goal_count: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "year", name="uq_user_goal_year"),)

    user: Mapped["User"] = relationship("User", back_populates="goals")


class Follow(Base):
    __tablename__ = "follows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    follower_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    following_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow"),)

    follower: Mapped["User"] = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following: Mapped["User"] = relationship("User", foreign_keys=[following_id], back_populates="followers")


class Like(Base):
    __tablename__ = "likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    user_book_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_books.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "user_book_id", name="uq_like"),)

    user: Mapped["User"] = relationship("User")
    user_book: Mapped["UserBook"] = relationship("UserBook")
