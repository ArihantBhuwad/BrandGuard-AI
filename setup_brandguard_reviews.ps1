$ErrorActionPreference = 'Stop'
$root = Get-Location
$backend = Join-Path $root 'backend'
if (-not (Test-Path $backend)) { throw 'Run this script from your BrandGuard AI project root.' }

$modelsInit = @'
from app.models.user import User
from app.models.guideline import Guideline
from app.models.audit import Audit
from app.models.review import Review
__all__ = ["User", "Guideline", "Audit", "Review"]
'@
Set-Content -Path (Join-Path $backend 'app/models/__init__.py') -Value $modelsInit -Encoding utf8

$reviewModel = @'
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    issue: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
'@
Set-Content -Path (Join-Path $backend 'app/models/review.py') -Value $reviewModel -Encoding utf8

$reviewSchema = @'
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class ReviewCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    content: str = Field(min_length=1)
    issue: str = Field(min_length=1)

class ReviewUpdate(BaseModel):
    status: Literal["Approved", "Rejected"]

class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    content: str
    issue: str
    status: str
    created_at: datetime
'@
New-Item -ItemType Directory -Force -Path (Join-Path $backend 'app/schemas') | Out-Null
Set-Content -Path (Join-Path $backend 'app/schemas/review.py') -Value $reviewSchema -Encoding utf8

$reviewRouter = @'
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
'@
New-Item -ItemType Directory -Force -Path (Join-Path $backend 'app/routers') | Out-Null
Set-Content -Path (Join-Path $backend 'app/routers/reviews.py') -Value $reviewRouter -Encoding utf8

$mainPath = Join-Path $backend 'app/main.py'
$main = Get-Content -Path $mainPath -Raw
if ($main -notmatch 'reviews_router') {
  $main = $main -replace '(from app\.routers\.audits import router as audits_router)', ('$1' + "`r`n" + 'from app.routers.reviews import router as reviews_router')
  $main = $main -replace '(app\.include_router\(audits_router\))', ('$1' + "`r`n" + 'app.include_router(reviews_router)')
  Set-Content -Path $mainPath -Value $main -Encoding utf8
}
Write-Host 'Review & Approval API files created.' -ForegroundColor Green
Write-Host 'Next run: docker compose up --build -d' -ForegroundColor Cyan
Write-Host 'Then check GET, POST and PATCH /reviews/ in http://localhost:8000/docs'
