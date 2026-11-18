
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.guideline import Guideline
from app.models.user import User
from app.schemas.guideline import (
    GuidelineCreate,
    GuidelineUpdate,
    GuidelineResponse,
)

router = APIRouter(prefix="/guidelines", tags=["Brand Guidelines"])


@router.get("/", response_model=list[GuidelineResponse])
def get_guidelines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(Guideline)
        .where(Guideline.user_id == current_user.id)
        .order_by(Guideline.created_at.desc())
    )
    return db.scalars(statement).all()


@router.post(
    "/",
    response_model=GuidelineResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_guideline(
    payload: GuidelineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    guideline = Guideline(
        **payload.model_dump(),
        user_id=current_user.id,
    )

    db.add(guideline)
    db.commit()
    db.refresh(guideline)

    return guideline


@router.put("/{guideline_id}", response_model=GuidelineResponse)
def update_guideline(
    guideline_id: int,
    payload: GuidelineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    guideline = db.scalar(
        select(Guideline).where(
            Guideline.id == guideline_id,
            Guideline.user_id == current_user.id,
        )
    )

    if guideline is None:
        raise HTTPException(status_code=404, detail="Guideline not found.")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if value is not None:
            setattr(guideline, field, value)

    db.commit()
    db.refresh(guideline)

    return guideline


@router.delete("/{guideline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guideline(
    guideline_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    guideline = db.scalar(
        select(Guideline).where(
            Guideline.id == guideline_id,
            Guideline.user_id == current_user.id,
        )
    )

    if guideline is None:
        raise HTTPException(status_code=404, detail="Guideline not found.")

    db.delete(guideline)
    db.commit()
