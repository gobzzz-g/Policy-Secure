"""
Document model for file management and tracking.
Supports various document types for claims and policies.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class DocumentType(str, enum.Enum):
    """Document type enumeration."""
    POLICY_DOCUMENT = "policy_document"
    CLAIM_FORM = "claim_form"
    MEDICAL_BILL = "medical_bill"
    PRESCRIPTION = "prescription"
    DIAGNOSTIC_REPORT = "diagnostic_report"
    ACCIDENT_REPORT = "accident_report"
    VEHICLE_DAMAGE_PHOTO = "vehicle_damage_photo"
    REPAIR_ESTIMATE = "repair_estimate"
    POLICE_REPORT = "police_report"
    WITNESS_STATEMENT = "witness_statement"
    PROPERTY_DAMAGE_PHOTO = "property_damage_photo"
    INVOICE = "invoice"
    RECEIPT = "receipt"
    ID_PROOF = "id_proof"
    ADDRESS_PROOF = "address_proof"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    """Document verification status."""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    REQUIRES_CLARIFICATION = "requires_clarification"


class Document(Base):
    """
    Document/file model for storing claim and policy related documents.
    """
    
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Document Identity
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Relative path in storage
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String, nullable=False)
    
    # Classification
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.PENDING)
    
    # Associations
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Verification
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_notes = Column(Text, nullable=True)
    
    # OCR/Extraction (for policy documents)
    extracted_text = Column(Text, nullable=True)  # OCR output
    extracted_data = Column(String, nullable=True)  # Structured data (JSON stored as string)
    
    # Security
    is_sensitive = Column(Boolean, default=False)  # Contains PII
    
    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    claim = relationship("Claim", foreign_keys=[claim_id])
    policy = relationship("Policy", foreign_keys=[policy_id])
    uploader = relationship("User", foreign_keys=[user_id])
    verifier = relationship("User", foreign_keys=[verified_by_id])
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.filename}, type={self.document_type})>"
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in MB."""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_image(self) -> bool:
        """Check if document is an image."""
        image_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
        return self.mime_type in image_types
    
    @property
    def is_pdf(self) -> bool:
        """Check if document is a PDF."""
        return self.mime_type == 'application/pdf'
