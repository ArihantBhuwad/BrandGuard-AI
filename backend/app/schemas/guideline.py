
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GuidelineCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=2)


class GuidelineUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=150)
    category: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, min_length=2)
    is_active: bool | None = None


class GuidelineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    category: str
    description: str
    is_active: bool
    created_at: datetime
    updated_at: datetime | None
