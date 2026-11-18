from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Review & Approval"])

@router.get("/", response_model=list[ReviewResponse])
def list_reviews(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    statement = select(Review).where(Review.user_id == current_user.id).order_by(Review.id.desc()).limit(200)
    return db.scalars(statement).all()

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = Review(user_id=current_user.id, title=payload.title, content=payload.content, issue=payload.issue, status="Pending")
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.patch("/{review_id}", response_model=ReviewResponse)
def update_review(review_id: int, payload: ReviewUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = db.scalar(select(Review).where(Review.id == review_id, Review.user_id == current_user.id))
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found.")
    review.status = payload.status
    db.commit()
    db.refresh(review)
    return review
