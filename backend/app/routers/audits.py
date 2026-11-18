from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.audit import Audit
from app.models.user import User
from app.schemas.audit import AuditCreate, AuditResponse

router = APIRouter(prefix="/audits", tags=["Content Audits"])


@router.get("/", response_model=list[AuditResponse])
def list_audits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(Audit)
        .where(Audit.user_id == current_user.id)
        .order_by(Audit.id.desc())
        .limit(100)
    )
    return db.scalars(statement).all()


@router.post("/", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
def create_audit(
    payload: AuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = Audit(
        user_id=current_user.id,
        content=payload.content,
        corrected_content=payload.corrected_content,
        score=payload.score,
        issues=payload.issues,
        checked_guidelines=payload.checked_guidelines,
        audited_at=payload.audited_at,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
