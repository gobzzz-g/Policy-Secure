"""
Claims API endpoints.
Handles claim submission, review, and processing.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import os

from app.core.database import get_db, get_mongodb
from app.core.security import get_current_user, require_role
from app.models import User, Claim, Policy, ClaimStatus, UserRole
from app.schemas import (
    ClaimCreate, ClaimUpdate, ClaimResponse, ClaimSummary,
    ClaimReview, ClaimFraudReview
)
from app.services import gemini_service, FraudDetectionService, SettlementCalculator

router = APIRouter(prefix="/api/claims", tags=["Claims"])


@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(require_role(UserRole.POLICYHOLDER)),
    db: Session = Depends(get_db)
):
    """
    Create a new insurance claim.
    
    Args:
        claim_data: Claim details
        current_user: Current authenticated policyholder
        db: Database session
        
    Returns:
        Created claim
    """
    # Verify policy exists and belongs to user
    policy = db.query(Policy).filter(
        Policy.id == claim_data.policy_id,
        Policy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found or does not belong to you"
        )
    
    # Check if policy is active
    if not policy.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy is not currently active"
        )
    
    # Validate claim amount
    is_valid, message = SettlementCalculator.validate_claim_amount(
        type('Claim', (), {
            'claimed_amount': claim_data.claimed_amount,
            'estimated_loss': claim_data.estimated_loss
        })(),
        policy
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Generate unique claim number
    claim_number = f"CLM-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    # Create claim
    new_claim = Claim(
        claim_number=claim_number,
        user_id=current_user.id,
        policy_id=policy.id,
        incident_date=claim_data.incident_date,
        incident_description=claim_data.incident_description,
        claimed_amount=claim_data.claimed_amount,
        estimated_loss=claim_data.estimated_loss,
        incident_location=claim_data.incident_location,
        witnesses=claim_data.witnesses,
        claim_specific_data=claim_data.claim_specific_data,
        status=ClaimStatus.DRAFT
    )
    
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)
    
    return new_claim


@router.post("/{claim_id}/submit", response_model=ClaimResponse)
async def submit_claim(
    claim_id: int,
    current_user: User = Depends(require_role(UserRole.POLICYHOLDER)),
    db: Session = Depends(get_db)
):
    """
    Submit a draft claim for processing.
    Triggers fraud analysis and settlement calculation.
    
    Args:
        claim_id: ID of the claim to submit
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated claim with fraud analysis and settlement
    """
    # Get claim
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    if claim.status != ClaimStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit claim with status: {claim.status.value}"
        )
    
    # Get policy
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    
    # Run fraud detection
    fraud_service = FraudDetectionService(db)
    fraud_signals, user_history = fraud_service.analyze_claim(claim, policy, current_user)
    
    # Prepare data for Gemini analysis
    claim_dict = {
        'claim_number': claim.claim_number,
        'claimed_amount': claim.claimed_amount,
        'estimated_loss': claim.estimated_loss,
        'incident_date': claim.incident_date.isoformat(),
        'incident_description': claim.incident_description,
        'incident_location': claim.incident_location
    }
    
    policy_dict = {
        'insurance_type': policy.insurance_type.value,
        'sum_insured': policy.sum_insured,
        'per_claim_limit': policy.per_claim_limit,
        'deductible': policy.deductible,
        'days_since_start': policy.days_since_start,
        'is_active': policy.is_active
    }
    
    # Get Gemini fraud analysis
    fraud_result = await gemini_service.analyze_fraud_risk(
        claim_dict, policy_dict, user_history, fraud_signals
    )
    
    # Update claim with fraud analysis
    claim.fraud_risk_score = fraud_result.fraud_risk_score
    claim.fraud_risk_level = fraud_result.fraud_risk_level
    claim.fraud_explanation = fraud_result.fraud_explanation
    claim.fraud_signals = fraud_result.fraud_signals
    claim.is_flagged_for_investigation = fraud_service.should_flag_for_investigation(
        fraud_result.fraud_risk_score, fraud_result.fraud_signals
    )
    
    # Calculate settlement
    settlement_amount, breakdown = SettlementCalculator.calculate_settlement(
        claim, policy, fraud_result.fraud_risk_score
    )
    
    # Get Gemini settlement justification
    settlement_result = await gemini_service.generate_settlement_justification(
        claim_dict, policy_dict, settlement_amount
    )
    
    claim.recommended_settlement = settlement_amount
    claim.settlement_justification = settlement_result.justification
    
    # Update status
    claim.status = ClaimStatus.UNDER_REVIEW
    claim.submitted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(claim)
    
    return claim


@router.get("", response_model=List[ClaimSummary])
async def list_claims(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List claims based on user role.
    
    Args:
        status: Optional filter by status
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of claims
    """
    query = db.query(Claim)
    
    # Filter by user role
    if current_user.is_policyholder:
        query = query.filter(Claim.user_id == current_user.id)
    elif current_user.is_fraud_investigator:
        query = query.filter(Claim.is_flagged_for_investigation == True)
    # Officers, admins, and support can see all
    
    # Filter by status if provided
    if status:
        try:
            claim_status = ClaimStatus(status)
            query = query.filter(Claim.status == claim_status)
        except ValueError:
            pass
    
    # Order by creation date (newest first)
    claims = query.order_by(Claim.created_at.desc()).limit(100).all()
    
    return claims


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed claim information.
    
    Args:
        claim_id: Claim ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Claim details
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Check permissions
    if current_user.is_policyholder and claim.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return claim


@router.put("/{claim_id}/review", response_model=ClaimResponse)
async def review_claim(
    claim_id: int,
    review_data: ClaimReview,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Review and update claim status (Claims Officer/Admin only).
    
    Args:
        claim_id: Claim ID
        review_data: Review details
        current_user: Current authenticated officer/admin
        db: Database session
        
    Returns:
        Updated claim
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Update claim
    claim.status = review_data.status
    claim.officer_remarks = review_data.officer_remarks
    claim.assigned_officer_id = current_user.id
    claim.reviewed_at = datetime.utcnow()
    
    if review_data.approved_settlement is not None:
        claim.approved_settlement = review_data.approved_settlement
    
    if review_data.status == ClaimStatus.APPROVED:
        claim.approved_at = datetime.utcnow()
    elif review_data.status == ClaimStatus.REJECTED:
        claim.rejected_at = datetime.utcnow()
    
    db.commit()
    db.refresh(claim)
    
    return claim


@router.put("/{claim_id}/fraud-review", response_model=ClaimResponse)
async def fraud_review_claim(
    claim_id: int,
    review_data: ClaimFraudReview,
    current_user: User = Depends(require_role(UserRole.FRAUD_INVESTIGATOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Fraud investigation review (Fraud Investigator/Admin only).
    
    Args:
        claim_id: Claim ID
        review_data: Fraud review details
        current_user: Current authenticated investigator/admin
        db: Database session
        
    Returns:
        Updated claim
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Update fraud investigation
    claim.investigator_remarks = review_data.investigator_remarks
    claim.assigned_investigator_id = current_user.id
    
    if review_data.fraud_risk_level:
        claim.fraud_risk_level = review_data.fraud_risk_level
    
    # If marked as genuine, reduce fraud score
    if review_data.is_genuine:
        claim.fraud_risk_score = min(claim.fraud_risk_score, 30.0)
        claim.is_flagged_for_investigation = False
        claim.status = ClaimStatus.UNDER_REVIEW
    else:
        # If confirmed fraud, reject
        claim.status = ClaimStatus.REJECTED
        claim.rejected_at = datetime.utcnow()
    
    db.commit()
    db.refresh(claim)
    
    return claim


@router.delete("/{claim_id}")
async def delete_claim(
    claim_id: int,
    current_user: User = Depends(require_role(UserRole.POLICYHOLDER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Delete a draft claim (Policyholder can delete their own drafts, Admin can delete any).
    
    Args:
        claim_id: Claim ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Success message
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Check permissions
    if current_user.is_policyholder:
        if claim.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own claims"
            )
        if claim.status != ClaimStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only delete draft claims"
            )
    
    db.delete(claim)
    db.commit()
    
    return {"message": "Claim deleted successfully"}
