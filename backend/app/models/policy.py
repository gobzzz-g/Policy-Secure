"""
Policy model for insurance policies.
Supports all insurance types with modular structure.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class InsuranceType(str, enum.Enum):
    """Insurance type enumeration."""
    HEALTH = "health"
    MOTOR = "motor"
    PROPERTY = "property"
    TRAVEL = "travel"
    CROP = "crop"
    PERSONAL_ACCIDENT = "personal_accident"
    COMMERCIAL = "commercial"


class PremiumFrequency(str, enum.Enum):
    """Premium payment frequency."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"


class Policy(Base):
    """Insurance policy model."""
    
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Policy Details
    insurance_type = Column(SQLEnum(InsuranceType), nullable=False)
    sum_insured = Column(Float, nullable=False)  # Total insurance amount
    per_claim_limit = Column(Float, nullable=False)  # Maximum per claim
    deductible = Column(Float, default=0.0)  # Amount deducted from claims
    premium_amount = Column(Float, nullable=False)
    premium_frequency = Column(SQLEnum(PremiumFrequency), nullable=False)
    
    # Policy Period
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    
    # Type-specific parameters (stored as JSON)
    # Examples:
    # - Health: {"hospital_coverage": true, "pre_existing_covered": false}
    # - Motor: {"vehicle_type": "car", "vehicle_value": 500000}
    # - Property: {"property_type": "home", "property_value": 2000000}
    type_specific_data = Column(JSON, default={})
    
    # Status
    is_active = Column(String, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="policies")
    claims = relationship("Claim", back_populates="policy", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Policy(id={self.id}, number={self.policy_number}, type={self.insurance_type})>"
    
    @property
    def is_valid(self) -> bool:
        """Check if policy is currently valid."""
        from datetime import datetime
        now = datetime.now()
        return self.is_active and self.start_date <= now <= self.end_date
    
    @property
    def days_since_start(self) -> int:
        """Calculate days since policy started."""
        from datetime import datetime
        if self.start_date:
            return (datetime.now() - self.start_date).days
        return 0
