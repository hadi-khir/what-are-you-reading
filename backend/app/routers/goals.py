from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ReadingGoal, User, UserBook
from ..schemas import GoalSchema, SetGoalRequest

router = APIRouter(prefix="/goals", tags=["goals"])


def _books_read_count(db: Session, user_id: int, year: int) -> int:
    result = db.execute(
        select(func.count()).where(
            UserBook.user_id == user_id,
            UserBook.year == year,
            UserBook.status == "read",
        )
    ).scalar_one()
    return result


@router.get("", response_model=list[GoalSchema])
def get_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.execute(select(ReadingGoal).where(ReadingGoal.user_id == current_user.id)).scalars().all()
    return [
        GoalSchema(
            id=g.id,
            year=g.year,
            goal_count=g.goal_count,
            books_read=_books_read_count(db, current_user.id, g.year),
        )
        for g in goals
    ]


@router.put("/{year}", response_model=GoalSchema)
def set_goal(
    year: int,
    body: SetGoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.execute(
        select(ReadingGoal).where(ReadingGoal.user_id == current_user.id, ReadingGoal.year == year)
    ).scalar_one_or_none()

    if goal is None:
        goal = ReadingGoal(user_id=current_user.id, year=year, goal_count=body.goal_count)
        db.add(goal)
    else:
        goal.goal_count = body.goal_count

    db.commit()
    db.refresh(goal)
    return GoalSchema(
        id=goal.id,
        year=goal.year,
        goal_count=goal.goal_count,
        books_read=_books_read_count(db, current_user.id, year),
    )
