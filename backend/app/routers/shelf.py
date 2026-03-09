from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Book, User, UserBook
from ..schemas import AddToShelfRequest, BookSchema, UpdateShelfRequest, UserBookSchema

router = APIRouter(prefix="/shelf", tags=["shelf"])


def _get_or_create_book(db: Session, req: AddToShelfRequest) -> Book:
    book = db.execute(select(Book).where(Book.open_library_key == req.open_library_key)).scalar_one_or_none()
    if book is None:
        book = Book(
            open_library_key=req.open_library_key,
            title=req.title,
            author=req.author,
            cover_url=req.cover_url,
            publish_year=req.publish_year,
        )
        db.add(book)
        db.flush()
    return book


def _serialize(ub: UserBook) -> UserBookSchema:
    return UserBookSchema(
        id=ub.id,
        book=BookSchema.model_validate(ub.book),
        status=ub.status,
        rating=ub.rating,
        started_at=ub.started_at,
        finished_at=ub.finished_at,
        added_at=ub.added_at,
        year=ub.year,
    )


@router.get("", response_model=list[UserBookSchema])
def get_my_shelf(
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(UserBook).where(UserBook.user_id == current_user.id)
    if year is not None:
        query = query.where(UserBook.year == year)
    query = query.order_by(UserBook.added_at.desc())
    user_books = db.execute(query).scalars().all()
    return [_serialize(ub) for ub in user_books]


@router.post("", response_model=UserBookSchema, status_code=status.HTTP_201_CREATED)
def add_to_shelf(
    body: AddToShelfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = _get_or_create_book(db, body)

    existing = db.execute(
        select(UserBook).where(UserBook.user_id == current_user.id, UserBook.book_id == book.id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Book already on shelf")

    now = datetime.utcnow()
    user_book = UserBook(
        user_id=current_user.id,
        book_id=book.id,
        status=body.status,
        rating=body.rating,
        year=body.year,
        started_at=now if body.status == "reading" else None,
        finished_at=now if body.status == "read" else None,
    )
    db.add(user_book)
    db.commit()
    db.refresh(user_book)
    return _serialize(user_book)


@router.patch("/{user_book_id}", response_model=UserBookSchema)
def update_shelf_entry(
    user_book_id: int,
    body: UpdateShelfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_book = db.execute(
        select(UserBook).where(UserBook.id == user_book_id, UserBook.user_id == current_user.id)
    ).scalar_one_or_none()
    if user_book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    now = datetime.utcnow()
    if body.status is not None:
        prev_status = user_book.status
        user_book.status = body.status
        if body.status == "reading" and prev_status != "reading":
            user_book.started_at = now
        if body.status == "read" and prev_status != "read":
            user_book.finished_at = now
    if body.rating is not None:
        user_book.rating = body.rating

    db.commit()
    db.refresh(user_book)
    return _serialize(user_book)


@router.delete("/{user_book_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_shelf(
    user_book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_book = db.execute(
        select(UserBook).where(UserBook.id == user_book_id, UserBook.user_id == current_user.id)
    ).scalar_one_or_none()
    if user_book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    db.delete(user_book)
    db.commit()
