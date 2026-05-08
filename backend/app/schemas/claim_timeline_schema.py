"""
Pydantic schemas for claim timeline responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

from app.models.claim_timeline import ClaimAction


class ClaimTimelineResponse(BaseModel):
    """Schema for claim timeline entries."""
    id: int
    claim_id: int
    action: ClaimAction
    action_description: str
    actor_id: Optional[int] = None
    actor_role: Optional[str] = None
    actor_name: Optional[str] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    action_metadata: Dict[str, Any] = Field(default_factory=dict)
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
