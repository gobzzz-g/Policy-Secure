"""
Claims API endpoints.
Handles claim submission, review, and processing.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import os

from app.core.database import get_db, get_mongodb
from app.core.security import get_current_user, require_role
from app.core.config import settings
from app.models import (
    User, Claim, Policy, ClaimStatus, UserRole,
    Document, DocumentType, DocumentStatus,
    ClaimTimeline, ClaimAction
)
from app.schemas import (
    ClaimCreate, ClaimUpdate, ClaimResponse, ClaimSummary,
    ClaimReview, ClaimFraudReview, DocumentResponse, DocumentVerifyRequest,
    ClaimTimelineResponse
)
from app.services import gemini_service, FraudDetectionService, SettlementCalculator

router = APIRouter(prefix="/api/claims", tags=["Claims"])


async def save_uploaded_file(upload_file: UploadFile) -> dict:
    """Persist an uploaded file and return stored metadata."""
    if not upload_file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is missing"
        )

    extension = os.path.splitext(upload_file.filename)[1].lower()
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed"
        )

    contents = await upload_file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds maximum upload size"
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}{extension}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    with open(stored_path, "wb") as file_handle:
        file_handle.write(contents)

    return {
        "stored_filename": stored_filename,
        "stored_path": stored_path,
        "file_size": len(contents),
        "mime_type": upload_file.content_type or "application/octet-stream"
    }


def add_timeline_entry(
    db: Session,
    claim: Claim,
    action: ClaimAction,
    description: str,
    actor: Optional[User] = None,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
    action_metadata: Optional[dict] = None,
    remarks: Optional[str] = None
):
    """Create a claim timeline entry without committing."""
    ClaimTimeline.create_entry(
        db=db,
        claim_id=claim.id,
        action=action,
        description=description,
        actor=actor,
        old_status=old_status,
        new_status=new_status,
        action_metadata=action_metadata,
        remarks=remarks
    )


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
    db.flush()

    add_timeline_entry(
        db=db,
        claim=new_claim,
        action=ClaimAction.CREATED,
        description="Claim created as draft",
        actor=current_user,
        old_status=None,
        new_status=new_claim.status.value,
        action_metadata={"policy_id": policy.id}
    )

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
    old_status = claim.status.value
    if claim.is_flagged_for_investigation:
        claim.status = ClaimStatus.FRAUD_INVESTIGATION
    else:
        claim.status = ClaimStatus.UNDER_REVIEW
    claim.submitted_at = datetime.utcnow()

    add_timeline_entry(
        db=db,
        claim=claim,
        action=ClaimAction.SUBMITTED,
        description="Claim submitted for review",
        actor=current_user,
        old_status=old_status,
        new_status=claim.status.value,
        action_metadata={
            "fraud_risk_score": claim.fraud_risk_score,
            "fraud_risk_level": claim.fraud_risk_level.value if claim.fraud_risk_level else None
        }
    )

    if claim.is_flagged_for_investigation:
        add_timeline_entry(
            db=db,
            claim=claim,
            action=ClaimAction.FRAUD_FLAGGED,
            description="Claim flagged for fraud investigation",
            actor=None,
            old_status=claim.status.value,
            new_status=claim.status.value,
            action_metadata={
                "fraud_signals": claim.fraud_signals,
                "fraud_risk_score": claim.fraud_risk_score
            }
        )
    
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


@router.get("/{claim_id}/timeline", response_model=List[ClaimTimelineResponse])
async def get_claim_timeline(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get claim history timeline entries."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    if current_user.is_policyholder and claim.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    entries = db.query(ClaimTimeline).filter(
        ClaimTimeline.claim_id == claim_id
    ).order_by(ClaimTimeline.created_at.desc()).all()

    return [ClaimTimelineResponse.model_validate(entry) for entry in entries]


@router.post("/{claim_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_claim_document(
    claim_id: int,
    document_type: str = Form("other"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a document for a claim.
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

    try:
        parsed_type = DocumentType(document_type.lower())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document type"
        )

    file_meta = await save_uploaded_file(file)

    document = Document(
        filename=file_meta["stored_filename"],
        original_filename=file.filename,
        file_path=file_meta["stored_filename"],
        file_size=file_meta["file_size"],
        mime_type=file_meta["mime_type"],
        document_type=parsed_type,
        status=DocumentStatus.PENDING,
        claim_id=claim.id,
        policy_id=claim.policy_id,
        user_id=current_user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # Track document IDs on claim for quick access
    document_ids = claim.document_ids or []
    document_id_str = str(document.id)
    if document_id_str not in document_ids:
        document_ids.append(document_id_str)
        claim.document_ids = document_ids
        db.commit()

    add_timeline_entry(
        db=db,
        claim=claim,
        action=ClaimAction.DOCUMENTS_UPLOADED,
        description=f"Document uploaded: {document.original_filename}",
        actor=current_user,
        old_status=claim.status.value,
        new_status=claim.status.value,
        action_metadata={
            "document_id": document.id,
            "document_type": document.document_type.value,
            "status": document.status.value
        }
    )

    db.commit()

    response = DocumentResponse.model_validate(document)
    response.download_url = f"/api/claims/{claim.id}/documents/{document.id}/download"
    return response


@router.get("/{claim_id}/documents", response_model=List[DocumentResponse])
async def list_claim_documents(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List documents for a claim."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    if current_user.is_policyholder and claim.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    documents = db.query(Document).filter(Document.claim_id == claim_id).order_by(Document.uploaded_at.desc()).all()
    response_docs = []
    for doc in documents:
        response = DocumentResponse.model_validate(doc)
        response.download_url = f"/api/claims/{claim.id}/documents/{doc.id}/download"
        response_docs.append(response)
    return response_docs


@router.get("/{claim_id}/documents/{document_id}/download")
async def download_claim_document(
    claim_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a claim document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.claim_id == claim_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if current_user.is_policyholder and document.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    stored_path = os.path.join(settings.UPLOAD_DIR, document.file_path)
    if not os.path.exists(stored_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return FileResponse(
        stored_path,
        media_type=document.mime_type,
        filename=document.original_filename
    )


@router.put("/{claim_id}/documents/{document_id}/verify", response_model=DocumentResponse)
async def verify_claim_document(
    claim_id: int,
    document_id: int,
    verification: DocumentVerifyRequest,
    current_user: User = Depends(require_role(
        UserRole.CLAIMS_OFFICER,
        UserRole.FRAUD_INVESTIGATOR,
        UserRole.ADMIN,
        UserRole.CUSTOMER_SUPPORT
    )),
    db: Session = Depends(get_db)
):
    """Verify or reject a claim document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.claim_id == claim_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    old_claim_status = claim.status.value

    document.status = verification.status
    document.verification_notes = verification.verification_notes
    document.verified_by_id = current_user.id
    document.verified_at = datetime.utcnow()

    db.flush()

    if verification.status in [DocumentStatus.REQUIRES_CLARIFICATION, DocumentStatus.REJECTED]:
        if claim.status != ClaimStatus.PENDING_DOCUMENTS:
            claim.status = ClaimStatus.PENDING_DOCUMENTS
    elif verification.status == DocumentStatus.VERIFIED:
        if claim.status == ClaimStatus.PENDING_DOCUMENTS:
            remaining = db.query(Document).filter(
                Document.claim_id == claim_id,
                Document.status != DocumentStatus.VERIFIED
            ).count()
            if remaining == 0:
                claim.status = ClaimStatus.FRAUD_INVESTIGATION if claim.is_flagged_for_investigation else ClaimStatus.UNDER_REVIEW

    if verification.status == DocumentStatus.REQUIRES_CLARIFICATION:
        action = ClaimAction.DOCUMENTS_REQUESTED
        description = "Document requires clarification"
    elif verification.status == DocumentStatus.REJECTED:
        action = ClaimAction.REVIEWED
        description = "Document rejected"
    else:
        action = ClaimAction.REVIEWED
        description = "Document verified"

    add_timeline_entry(
        db=db,
        claim=claim,
        action=action,
        description=f"{description}: {document.original_filename}",
        actor=current_user,
        old_status=old_claim_status,
        new_status=claim.status.value,
        action_metadata={
            "document_id": document.id,
            "document_type": document.document_type.value,
            "document_status": document.status.value
        }
    )

    db.commit()
    db.refresh(document)

    response = DocumentResponse.model_validate(document)
    response.download_url = f"/api/claims/{claim_id}/documents/{document.id}/download"
    return response


@router.put("/{claim_id}/review", response_model=ClaimResponse)
async def review_claim(
    claim_id: int,
    review_data: ClaimReview,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.CLAIMS_OFFICER)),
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
    
    old_status = claim.status.value

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

    if review_data.status == ClaimStatus.APPROVED:
        action = ClaimAction.APPROVED
        description = "Claim approved"
    elif review_data.status == ClaimStatus.REJECTED:
        action = ClaimAction.REJECTED
        description = "Claim rejected"
    else:
        action = ClaimAction.REVIEWED
        description = "Claim reviewed"

    add_timeline_entry(
        db=db,
        claim=claim,
        action=action,
        description=description,
        actor=current_user,
        old_status=old_status,
        new_status=claim.status.value,
        action_metadata={
            "approved_settlement": review_data.approved_settlement,
            "officer_remarks": review_data.officer_remarks
        }
    )
    
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

    old_status = claim.status.value
    
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
        action = ClaimAction.FRAUD_CLEARED
        description = "Fraud investigation cleared"
    else:
        # If confirmed fraud, reject
        claim.status = ClaimStatus.REJECTED
        claim.rejected_at = datetime.utcnow()
        action = ClaimAction.REJECTED
        description = "Fraud investigation confirmed"

    add_timeline_entry(
        db=db,
        claim=claim,
        action=action,
        description=description,
        actor=current_user,
        old_status=old_status,
        new_status=claim.status.value,
        action_metadata={
            "is_genuine": review_data.is_genuine,
            "fraud_risk_level": review_data.fraud_risk_level.value if review_data.fraud_risk_level else None,
            "investigator_remarks": review_data.investigator_remarks
        }
    )
    
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
