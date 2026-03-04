"""
Pydantic schemas for policy-related requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.policy import InsuranceType, PremiumFrequency


class PolicyBase(BaseModel):
    """Base policy schema."""
    insurance_type: InsuranceType
    sum_insured: float = Field(..., gt=0)
    per_claim_limit: float = Field(..., gt=0)
    deductible: float = Field(default=0.0, ge=0)
    premium_amount: float = Field(..., gt=0)
    premium_frequency: PremiumFrequency
    start_date: datetime
    end_date: datetime
    type_specific_data: Dict[str, Any] = {}


class PolicyCreate(PolicyBase):
    """Schema for creating a new policy."""
    pass


class PolicyUpdate(BaseModel):
    """Schema for updating policy."""
    per_claim_limit: Optional[float] = Field(None, gt=0)
    deductible: Optional[float] = Field(None, ge=0)
    premium_amount: Optional[float] = Field(None, gt=0)
    premium_frequency: Optional[PremiumFrequency] = None
    type_specific_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class PolicyResponse(PolicyBase):
    """Schema for policy response."""
    id: int
    policy_number: str
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PolicySummary(BaseModel):
    """Schema for policy summary (lightweight)."""
    id: int
    policy_number: str
    insurance_type: InsuranceType
    sum_insured: float
    is_active: bool
    
    class Config:
        from_attributes = True
