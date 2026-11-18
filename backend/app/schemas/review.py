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
