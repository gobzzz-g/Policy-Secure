"""
Claim model for insurance claims processing.
Tracks complete claim lifecycle from submission to settlement.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ClaimStatus(str, enum.Enum):
    """Claim status enumeration."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    ASSIGNED_TO_OFFICER = "assigned_to_officer"
    UNDER_REVIEW = "under_review"
    PENDING_DOCUMENTS = "pending_documents"
    FRAUD_INVESTIGATION = "fraud_investigation"
    APPROVED = "approved"
    PARTIALLY_APPROVED = "partially_approved"
    REJECTED = "rejected"
    READY_FOR_FINANCE = "ready_for_finance"
    CLOSED = "closed"


class FraudRiskLevel(str, enum.Enum):
    """Fraud risk level enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Claim(Base):
    """Insurance claim model."""
    
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    
    # Claim Details
    incident_date = Column(DateTime(timezone=True), nullable=False)
    incident_description = Column(Text, nullable=False)
    claimed_amount = Column(Float, nullable=False)
    estimated_loss = Column(Float, nullable=False)
    
    # Location & Context
    incident_location = Column(String, nullable=True)
    witnesses = Column(JSON, default=[])  # List of witness information
    
    # Type-specific claim data (modular by insurance type)
    # Examples:
    # - Health: {"hospital_name": "XYZ", "doctor": "Dr. ABC", "diagnosis": "..."}
    # - Motor: {"vehicle_damage": "front bumper", "garage": "ABC Motors"}
    claim_specific_data = Column(JSON, default={})
    
    # Status & Processing
    status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.DRAFT)
    
    # Fraud Detection
    fraud_risk_score = Column(Float, default=0.0)  # 0-100
    fraud_risk_level = Column(SQLEnum(FraudRiskLevel), default=FraudRiskLevel.LOW)
    fraud_explanation = Column(Text, nullable=True)
    fraud_signals = Column(JSON, default=[])  # List of detected fraud signals
    is_flagged_for_investigation = Column(String, default=False)
    
    # Settlement
    recommended_settlement = Column(Float, nullable=True)
    approved_settlement = Column(Float, nullable=True)
    settlement_justification = Column(Text, nullable=True)
    settlement_breakdown = Column(JSON, default={})  # Detailed breakdown: coverage, deductible, depreciation, etc.
    confidence_score = Column(Float, default=0.0)  # AI confidence in analysis (0-100)
    
    # Reviews & Remarks
    officer_remarks = Column(Text, nullable=True)
    investigator_remarks = Column(Text, nullable=True)
    admin_remarks = Column(Text, nullable=True)
    
    # Assigned Personnel
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_investigator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Documents (stored in MongoDB, references here)
    document_ids = Column(JSON, default=[])  # List of MongoDB document IDs
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="claims", foreign_keys=[user_id])
    policy = relationship("Policy", back_populates="claims")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    assigned_investigator = relationship("User", foreign_keys=[assigned_investigator_id])
    
    def __repr__(self):
        return f"<Claim(id={self.id}, number={self.claim_number}, status={self.status})>"
    
    @property
    def days_since_submission(self) -> int:
        """Calculate days since claim was submitted."""
        if self.submitted_at:
            from datetime import datetime
            return (datetime.now() - self.submitted_at).days
        return 0
    
    @property
    def is_high_risk(self) -> bool:
        """Check if claim is high fraud risk."""
        return self.fraud_risk_level in [FraudRiskLevel.HIGH, FraudRiskLevel.CRITICAL]
