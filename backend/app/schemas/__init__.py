"""
Schemas package initialization.
"""

from app.schemas.user_schema import (
    UserCreate, UserUpdate, UserResponse, UserLogin, Token, TokenData
)
from app.schemas.policy_schema import (
    PolicyCreate, PolicyUpdate, PolicyResponse, PolicySummary
)
from app.schemas.claim_schema import (
    ClaimCreate, ClaimUpdate, ClaimReview, ClaimFraudReview,
    ClaimResponse, ClaimSummary, FraudAnalysisResult, SettlementRecommendation
)

__all__ = [
    "UserCreate", "UserUpdate", "UserResponse", "UserLogin", "Token", "TokenData",
    "PolicyCreate", "PolicyUpdate", "PolicyResponse", "PolicySummary",
    "ClaimCreate", "ClaimUpdate", "ClaimReview", "ClaimFraudReview",
    "ClaimResponse", "ClaimSummary", "FraudAnalysisResult", "SettlementRecommendation",
]
