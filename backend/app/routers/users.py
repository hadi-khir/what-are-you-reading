from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Follow, Like, User, UserBook
from ..schemas import BookSchema, FeedItemSchema, UserBookSchema, UserPublic

router = APIRouter(prefix="/users", tags=["users"])


def _serialize_user(user: User, current_user: User, db: Session) -> UserPublic:
    is_following = db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == user.id)
    ).scalar_one_or_none() is not None
    return UserPublic(
        id=user.id,
        username=user.username,
        created_at=user.created_at,
        followers_count=len(user.followers),
        following_count=len(user.following),
        is_following=is_following,
    )


def _get_user_or_404(username: str, db: Session) -> User:
    user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/search", response_model=list[UserPublic])
def search_users(
    q: str = Query(max_length=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = db.execute(
        select(User).where(User.username.ilike(f"%{q}%"), User.id != current_user.id).limit(20)
    ).scalars().all()
    return [_serialize_user(u, current_user, db) for u in users]


@router.get("/feed", response_model=list[FeedItemSchema])
def get_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    following_ids = [f.following_id for f in current_user.following]
    if not following_ids:
        return []

    user_books = (
        db.execute(
            select(UserBook)
            .where(UserBook.user_id.in_(following_ids))
            .order_by(UserBook.added_at.desc())
            .limit(50)
        )
        .scalars()
        .all()
    )

    ub_ids = [ub.id for ub in user_books]

    # Bulk-fetch like counts and current-user likes in two queries
    like_counts: dict[int, int] = {}
    if ub_ids:
        rows = db.execute(
            select(Like.user_book_id, func.count(Like.id))
            .where(Like.user_book_id.in_(ub_ids))
            .group_by(Like.user_book_id)
        ).all()
        like_counts = {row[0]: row[1] for row in rows}

    my_likes: set[int] = set()
    if ub_ids:
        rows2 = db.execute(
            select(Like.user_book_id)
            .where(Like.user_id == current_user.id, Like.user_book_id.in_(ub_ids))
        ).scalars().all()
        my_likes = set(rows2)

    result = []
    for ub in user_books:
        user_pub = _serialize_user(ub.user, current_user, db)
        result.append(
            FeedItemSchema(
                user=user_pub,
                user_book=UserBookSchema(
                    id=ub.id,
                    book=BookSchema.model_validate(ub.book),
                    status=ub.status,
                    rating=ub.rating,
                    started_at=ub.started_at,
                    finished_at=ub.finished_at,
                    added_at=ub.added_at,
                    year=ub.year,
                ),
                likes_count=like_counts.get(ub.id, 0),
                liked_by_me=ub.id in my_likes,
            )
        )
    return result


@router.get("/{username}", response_model=UserPublic)
def get_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(username, db)
    return _serialize_user(user, current_user, db)


@router.get("/{username}/shelf", response_model=list[UserBookSchema])
def get_user_shelf(
    username: str,
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(username, db)
    query = select(UserBook).where(UserBook.user_id == user.id)
    if year is not None:
        query = query.where(UserBook.year == year)
    query = query.order_by(UserBook.added_at.desc())
    user_books = db.execute(query).scalars().all()
    return [
        UserBookSchema(
            id=ub.id,
            book=BookSchema.model_validate(ub.book),
            status=ub.status,
            rating=ub.rating,
            started_at=ub.started_at,
            finished_at=ub.finished_at,
            added_at=ub.added_at,
            year=ub.year,
        )
        for ub in user_books
    ]


@router.post("/{username}/follow", status_code=status.HTTP_201_CREATED)
def follow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = _get_user_or_404(username, db)
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")

    existing = db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == target.id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already following")

    follow = Follow(follower_id=current_user.id, following_id=target.id)
    db.add(follow)
    db.commit()
    return {"message": f"Now following {username}"}


@router.delete("/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = _get_user_or_404(username, db)
    follow = db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == target.id)
    ).scalar_one_or_none()
    if follow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not following")
    db.delete(follow)
    db.commit()


@router.post("/likes/{user_book_id}", status_code=status.HTTP_201_CREATED)
def like_user_book(
    user_book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ub = db.get(UserBook, user_book_id)
    if ub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    existing = db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.user_book_id == user_book_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already liked")
    db.add(Like(user_id=current_user.id, user_book_id=user_book_id))
    db.commit()
    count = db.execute(
        select(func.count(Like.id)).where(Like.user_book_id == user_book_id)
    ).scalar_one()
    return {"likes_count": count, "liked_by_me": True}


@router.delete("/likes/{user_book_id}", status_code=status.HTTP_200_OK)
def unlike_user_book(
    user_book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    like = db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.user_book_id == user_book_id)
    ).scalar_one_or_none()
    if like is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not liked")
    db.delete(like)
    db.commit()
    count = db.execute(
        select(func.count(Like.id)).where(Like.user_book_id == user_book_id)
    ).scalar_one()
    return {"likes_count": count, "liked_by_me": False}
