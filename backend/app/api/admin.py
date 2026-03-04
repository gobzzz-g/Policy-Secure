"""
Admin API endpoints.
Provides analytics and administrative functions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from app.core.database import get_db
from app.core.security import require_role
from app.models import User, Claim, Policy, UserRole, ClaimStatus, FraudRiskLevel, InsuranceType

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/analytics/overview")
async def get_analytics_overview(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive analytics overview.
    
    Args:
        current_user: Current authenticated admin/officer
        db: Database session
        
    Returns:
        Analytics data
    """
    # Total counts
    total_users = db.query(func.count(User.id)).scalar()
    total_policies = db.query(func.count(Policy.id)).scalar()
    total_claims = db.query(func.count(Claim.id)).scalar()
    
    # Claims by status
    claims_by_status = {}
    for status in ClaimStatus:
        count = db.query(func.count(Claim.id)).filter(Claim.status == status).scalar()
        claims_by_status[status.value] = count
    
    # Claims by fraud risk
    claims_by_risk = {}
    for risk in FraudRiskLevel:
        count = db.query(func.count(Claim.id)).filter(Claim.fraud_risk_level == risk).scalar()
        claims_by_risk[risk.value] = count
    
    # Flagged claims
    flagged_claims = db.query(func.count(Claim.id)).filter(
        Claim.is_flagged_for_investigation == True
    ).scalar()
    
    # Total claim amounts
    total_claimed = db.query(func.sum(Claim.claimed_amount)).scalar() or 0
    total_recommended = db.query(func.sum(Claim.recommended_settlement)).scalar() or 0
    total_approved = db.query(func.sum(Claim.approved_settlement)).scalar() or 0
    
    # Claims by insurance type
    claims_by_type = {}
    for ins_type in InsuranceType:
        count = db.query(func.count(Claim.id)).join(Policy).filter(
            Policy.insurance_type == ins_type
        ).scalar()
        claims_by_type[ins_type.value] = count
    
    # Average processing time (claims with both submitted_at and reviewed_at)
    reviewed_claims = db.query(Claim).filter(
        Claim.submitted_at.isnot(None),
        Claim.reviewed_at.isnot(None)
    ).all()
    
    avg_processing_days = 0
    if reviewed_claims:
        total_days = sum(
            (claim.reviewed_at - claim.submitted_at).days 
            for claim in reviewed_claims
        )
        avg_processing_days = total_days / len(reviewed_claims)
    
    return {
        "totals": {
            "users": total_users,
            "policies": total_policies,
            "claims": total_claims,
            "flagged_claims": flagged_claims
        },
        "claims_by_status": claims_by_status,
        "claims_by_fraud_risk": claims_by_risk,
        "claims_by_insurance_type": claims_by_type,
        "financial_summary": {
            "total_claimed_amount": round(total_claimed, 2),
            "total_recommended_settlement": round(total_recommended, 2),
            "total_approved_settlement": round(total_approved, 2)
        },
        "performance": {
            "average_processing_days": round(avg_processing_days, 1)
        }
    }


@router.get("/analytics/fraud-trends")
async def get_fraud_trends(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FRAUD_INVESTIGATOR)),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get fraud detection trends and statistics.
    
    Args:
        current_user: Current authenticated admin/investigator
        db: Database session
        
    Returns:
        Fraud analytics
    """
    # Get all claims with fraud data
    all_claims = db.query(Claim).filter(Claim.fraud_risk_score > 0).all()
    
    if not all_claims:
        return {
            "total_analyzed": 0,
            "average_fraud_score": 0,
            "fraud_detection_rate": 0,
            "top_fraud_signals": []
        }
    
    # Calculate statistics
    total_analyzed = len(all_claims)
    avg_score = sum(c.fraud_risk_score for c in all_claims) / total_analyzed
    
    high_risk_count = sum(
        1 for c in all_claims 
        if c.fraud_risk_level in [FraudRiskLevel.HIGH, FraudRiskLevel.CRITICAL]
    )
    fraud_detection_rate = (high_risk_count / total_analyzed) * 100
    
    # Aggregate fraud signals
    signal_counts = {}
    for claim in all_claims:
        for signal in claim.fraud_signals:
            signal_counts[signal] = signal_counts.get(signal, 0) + 1
    
    # Sort and get top signals
    top_signals = sorted(
        signal_counts.items(), 
        key=lambda x: x[1], 
        reverse=True
    )[:10]
    
    return {
        "total_analyzed": total_analyzed,
        "average_fraud_score": round(avg_score, 2),
        "fraud_detection_rate": round(fraud_detection_rate, 2),
        "high_risk_claims": high_risk_count,
        "top_fraud_signals": [
            {"signal": signal, "count": count} 
            for signal, count in top_signals
        ]
    }


@router.get("/users", response_model=List[Dict[str, Any]])
async def list_all_users(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    List all users (Admin only).
    
    Args:
        current_user: Current authenticated admin
        db: Database session
        
    Returns:
        List of all users
    """
    users = db.query(User).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
        for user in users
    ]


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Activate or deactivate a user account.
    
    Args:
        user_id: User ID to toggle
        current_user: Current authenticated admin
        db: Database session
        
    Returns:
        Updated user status
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow admin to deactivate themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "user_id": user.id,
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully"
    }
