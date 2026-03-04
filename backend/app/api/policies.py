"""
Policies API endpoints.
Handles policy creation and management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import User, Policy, UserRole
from app.schemas import PolicyCreate, PolicyUpdate, PolicyResponse, PolicySummary

router = APIRouter(prefix="/api/policies", tags=["Policies"])


@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy_data: PolicyCreate,
    current_user: User = Depends(require_role(UserRole.POLICYHOLDER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Create a new insurance policy.
    
    Args:
        policy_data: Policy details
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created policy
    """
    # Validate dates
    if policy_data.end_date <= policy_data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy end date must be after start date"
        )
    
    # Validate per-claim limit doesn't exceed sum insured
    if policy_data.per_claim_limit > policy_data.sum_insured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Per-claim limit cannot exceed sum insured"
        )
    
    # Generate unique policy number
    policy_number = f"POL-{policy_data.insurance_type.value.upper()}-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    # Create policy
    new_policy = Policy(
        policy_number=policy_number,
        user_id=current_user.id,
        insurance_type=policy_data.insurance_type,
        sum_insured=policy_data.sum_insured,
        per_claim_limit=policy_data.per_claim_limit,
        deductible=policy_data.deductible,
        premium_amount=policy_data.premium_amount,
        premium_frequency=policy_data.premium_frequency,
        start_date=policy_data.start_date,
        end_date=policy_data.end_date,
        type_specific_data=policy_data.type_specific_data,
        is_active=True
    )
    
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    
    return new_policy


@router.get("", response_model=List[PolicySummary])
async def list_policies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's policies.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of policies
    """
    query = db.query(Policy)
    
    # Policyholders see only their policies
    if current_user.is_policyholder:
        query = query.filter(Policy.user_id == current_user.id)
    
    # Others can see all policies
    policies = query.order_by(Policy.created_at.desc()).all()
    
    return policies


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed policy information.
    
    Args:
        policy_id: Policy ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Policy details
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Check permissions
    if current_user.is_policyholder and policy.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: int,
    policy_data: PolicyUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Update policy details (Admin only).
    
    Args:
        policy_id: Policy ID
        policy_data: Updated policy data
        current_user: Current authenticated admin
        db: Database session
        
    Returns:
        Updated policy
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Update fields if provided
    if policy_data.per_claim_limit is not None:
        policy.per_claim_limit = policy_data.per_claim_limit
    
    if policy_data.deductible is not None:
        policy.deductible = policy_data.deductible
    
    if policy_data.premium_amount is not None:
        policy.premium_amount = policy_data.premium_amount
    
    if policy_data.premium_frequency is not None:
        policy.premium_frequency = policy_data.premium_frequency
    
    if policy_data.type_specific_data is not None:
        policy.type_specific_data = policy_data.type_specific_data
    
    if policy_data.is_active is not None:
        policy.is_active = policy_data.is_active
    
    db.commit()
    db.refresh(policy)
    
    return policy
