"""
Pydantic schemas for claim-related requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models.claim import ClaimStatus, FraudRiskLevel


class ClaimBase(BaseModel):
    """Base claim schema."""
    policy_id: int
    incident_date: datetime
    incident_description: str = Field(..., min_length=10)
    claimed_amount: float = Field(..., gt=0)
    estimated_loss: float = Field(..., gt=0)
    incident_location: Optional[str] = None
    witnesses: List[Dict[str, str]] = []
    claim_specific_data: Dict[str, Any] = {}


class ClaimCreate(ClaimBase):
    """Schema for creating a new claim."""
    pass


class ClaimUpdate(BaseModel):
    """Schema for updating claim."""
    incident_description: Optional[str] = Field(None, min_length=10)
    claimed_amount: Optional[float] = Field(None, gt=0)
    estimated_loss: Optional[float] = Field(None, gt=0)
    incident_location: Optional[str] = None
    witnesses: Optional[List[Dict[str, str]]] = None
    claim_specific_data: Optional[Dict[str, Any]] = None
    status: Optional[ClaimStatus] = None


class ClaimReview(BaseModel):
    """Schema for claim review by officer."""
    status: ClaimStatus
    officer_remarks: Optional[str] = None
    approved_settlement: Optional[float] = Field(None, ge=0)


class ClaimFraudReview(BaseModel):
    """Schema for fraud investigation review."""
    is_genuine: bool
    investigator_remarks: str
    fraud_risk_level: Optional[FraudRiskLevel] = None


class ClaimResponse(ClaimBase):
    """Schema for claim response."""
    id: int
    claim_number: str
    user_id: int
    status: ClaimStatus
    fraud_risk_score: float
    fraud_risk_level: FraudRiskLevel
    fraud_explanation: Optional[str]
    fraud_signals: List[str]
    is_flagged_for_investigation: bool
    recommended_settlement: Optional[float]
    approved_settlement: Optional[float]
    settlement_justification: Optional[str]
    officer_remarks: Optional[str]
    investigator_remarks: Optional[str]
    document_ids: List[str]
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ClaimSummary(BaseModel):
    """Schema for claim summary (lightweight)."""
    id: int
    claim_number: str
    policy_id: int
    claimed_amount: float
    status: ClaimStatus
    fraud_risk_level: FraudRiskLevel
    submitted_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class FraudAnalysisResult(BaseModel):
    """Schema for fraud analysis results."""
    fraud_risk_score: float
    fraud_risk_level: FraudRiskLevel
    fraud_explanation: str
    fraud_signals: List[str]
    confidence_score: float


class SettlementRecommendation(BaseModel):
    """Schema for settlement recommendation."""
    recommended_amount: float
    justification: str
    breakdown: Dict[str, float]
