"""
Models package initialization.
Exports all models for easy importing.
"""

from app.models.user import User, UserRole
from app.models.policy import Policy, InsuranceType, PremiumFrequency
from app.models.claim import Claim, ClaimStatus, FraudRiskLevel
from app.models.claim_timeline import ClaimTimeline, ClaimAction
from app.models.document import Document, DocumentType, DocumentStatus

__all__ = [
    "User",
    "UserRole",
    "Policy",
    "InsuranceType",
    "PremiumFrequency",
    "Claim",
    "ClaimStatus",
    "FraudRiskLevel",
    "ClaimTimeline",
    "ClaimAction",
    "Document",
    "DocumentType",
    "DocumentStatus",
]
