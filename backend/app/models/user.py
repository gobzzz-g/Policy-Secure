"""
User model for authentication and authorization.
Supports multiple user roles with different permissions.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    POLICYHOLDER = "policyholder"
    CLAIMS_OFFICER = "claims_officer"
    FRAUD_INVESTIGATOR = "fraud_investigator"
    ADMIN = "admin"
    CUSTOMER_SUPPORT = "customer_support"


class User(Base):
    """User model for all system users."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    policies = relationship("Policy", back_populates="user", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="user", foreign_keys="[Claim.user_id]", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
    
    @property
    def is_policyholder(self) -> bool:
        return self.role == UserRole.POLICYHOLDER
    
    @property
    def is_fraud_investigator(self) -> bool:
        return self.role == UserRole.FRAUD_INVESTIGATOR
    
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
    
    @property
    def is_customer_support(self) -> bool:
        return self.role == UserRole.CUSTOMER_SUPPORT
