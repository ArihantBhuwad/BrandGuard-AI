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
