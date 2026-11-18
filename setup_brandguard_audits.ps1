$ErrorActionPreference = 'Stop'
$root = Get-Location
$backend = Join-Path $root 'backend'
if (-not (Test-Path (Join-Path $backend 'app\main.py'))) {
    throw 'Run this script from your BrandGuard project root (the folder containing docker-compose.yml and backend).'
}

$modelsDir = Join-Path $backend 'app\models'
$schemasDir = Join-Path $backend 'app\schemas'
$routersDir = Join-Path $backend 'app\routers'
New-Item -ItemType Directory -Force -Path $modelsDir, $schemasDir, $routersDir | Out-Null

@'
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_content: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    issues: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    checked_guidelines: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    audited_at: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
'@ | Set-Content -Encoding utf8 (Join-Path $modelsDir 'audit.py')

@'
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AuditCreate(BaseModel):
    content: str = Field(min_length=1)
    corrected_content: str
    score: int = Field(ge=0, le=100)
    issues: list[dict[str, Any]] = Field(default_factory=list)
    checked_guidelines: list[str] = Field(default_factory=list)
    audited_at: str = Field(min_length=1, max_length=80)


class AuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    user_id: int
    content: str
    corrected_content: str = Field(serialization_alias="correctedContent")
    score: int
    issues: list[dict[str, Any]]
    checked_guidelines: list[str] = Field(serialization_alias="checkedGuidelines")
    audited_at: str = Field(serialization_alias="auditedAt")
    created_at: datetime
'@ | Set-Content -Encoding utf8 (Join-Path $schemasDir 'audit.py')

@'
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
'@ | Set-Content -Encoding utf8 (Join-Path $routersDir 'audits.py')

# Register the model so SQLAlchemy creates its table at startup.
$modelsInit = Join-Path $modelsDir '__init__.py'
$modelsText = Get-Content $modelsInit -Raw
if ($modelsText -notmatch 'from app\.models\.audit import Audit') {
    Add-Content -Encoding utf8 $modelsInit "`nfrom app.models.audit import Audit`n"
}
if ((Get-Content $modelsInit -Raw) -notmatch '"Audit"') {
    $modelsText = Get-Content $modelsInit -Raw
    if ($modelsText -match '__all__\s*=\s*\[(.*?)\]') {
        $modelsText = [regex]::Replace($modelsText, '__all__\s*=\s*\[(.*?)\]', {
            param($m)
            $inside = $m.Groups[1].Value.Trim()
            if ($inside -and -not $inside.EndsWith(',')) { $inside += ',' }
            "__all__ = [$inside`n    'Audit',`n]"
        }, 1)
        Set-Content -Encoding utf8 $modelsInit $modelsText
    }
}

# Register the API router without duplicating existing imports.
$mainPath = Join-Path $backend 'app\main.py'
$mainText = Get-Content $mainPath -Raw
if ($mainText -notmatch 'from app\.routers\.audits import router as audits_router') {
    $mainText = $mainText -replace '(from app\.routers\.auth import router as auth_router\r?\n)', ('$1from app.routers.audits import router as audits_router' + "`r`n")
}
if ($mainText -notmatch 'app\.include_router\(audits_router\)') {
    $mainText = $mainText -replace '(app\.include_router\(auth_router\)\r?\n)', ('$1app.include_router(audits_router)' + "`r`n")
}
Set-Content -Encoding utf8 $mainPath $mainText

Write-Host ''
Write-Host 'BrandGuard audit storage files created and router registered.' -ForegroundColor Green
Write-Host 'Next run: docker compose up --build -d' -ForegroundColor Cyan
Write-Host 'Then open http://localhost:8000/docs and confirm GET/POST /audits/ appear.' -ForegroundColor Cyan
