"""
Claim Timeline model for tracking all actions and status changes.
Provides complete audit trail for compliance and transparency.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ClaimAction(str, enum.Enum):
    """Claim action enumeration for audit trail."""
    CREATED = "created"
    SUBMITTED = "submitted"
    ASSIGNED = "assigned"
    REASSIGNED = "reassigned"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    PARTIALLY_APPROVED = "partially_approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    FRAUD_FLAGGED = "fraud_flagged"
    FRAUD_CLEARED = "fraud_cleared"
    INVESTIGATION_STARTED = "investigation_started"
    INVESTIGATION_COMPLETED = "investigation_completed"
    DOCUMENTS_REQUESTED = "documents_requested"
    DOCUMENTS_UPLOADED = "documents_uploaded"
    SETTLEMENT_CALCULATED = "settlement_calculated"
    SETTLEMENT_MODIFIED = "settlement_modified"
    STATUS_CHANGED = "status_changed"
    REMARKED = "remarked"
    CLOSED = "closed"
    REOPENED = "reopened"


class ClaimTimeline(Base):
    """
    Tracks every action performed on a claim.
    Creates a complete audit trail for compliance.
    """
    
    __tablename__ = "claim_timeline"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False, index=True)
    
    # Action Details
    action = Column(SQLEnum(ClaimAction), nullable=False)
    action_description = Column(Text, nullable=False)  # Human-readable description
    
    # Actor Information
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who performed the action
    actor_role = Column(String, nullable=True)  # Role at time of action
    actor_name = Column(String, nullable=True)  # Name cached for history
    
    # Status Change
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    
    # Additional Context
    action_metadata = Column(JSON, default={})  # Any additional data (before/after values, reasons, etc.)
    remarks = Column(Text, nullable=True)  # Optional notes
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    claim = relationship("Claim", backref="timeline_entries")
    actor = relationship("User", foreign_keys=[actor_id])
    
    def __repr__(self):
        return f"<ClaimTimeline(id={self.id}, claim_id={self.claim_id}, action={self.action})>"
    
    @classmethod
    def create_entry(cls, db, claim_id: int, action: ClaimAction, description: str,
                     actor=None, old_status=None, new_status=None, action_metadata=None, remarks=None):
        """
        Helper method to create a timeline entry.
        
        Args:
            db: Database session
            claim_id: ID of the claim
            action: Action performed
            description: Human-readable description
            actor: User who performed the action
            old_status: Previous status
            new_status: New status
            action_metadata: Additional context data
            remarks: Optional notes
            
        Returns:
            Created timeline entry
        """
        entry = cls(
            claim_id=claim_id,
            action=action,
            action_description=description,
            actor_id=actor.id if actor else None,
            actor_role=actor.role.value if actor else None,
            actor_name=actor.full_name if actor else "System",
            old_status=old_status,
            new_status=new_status,
            action_metadata=action_metadata or {},
            remarks=remarks
        )
        db.add(entry)
        return entry
