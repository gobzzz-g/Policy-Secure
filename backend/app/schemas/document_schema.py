"""
Pydantic schemas for document-related requests and responses.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models.document import DocumentType, DocumentStatus


class DocumentResponse(BaseModel):
    """Schema for document responses."""
    id: int
    claim_id: Optional[int] = None
    policy_id: Optional[int] = None
    user_id: int
    original_filename: str
    document_type: DocumentType
    status: DocumentStatus
    file_size: int
    mime_type: str
    uploaded_at: datetime
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    is_sensitive: bool = False
    download_url: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentVerifyRequest(BaseModel):
    """Schema for document verification updates."""
    status: DocumentStatus
    verification_notes: Optional[str] = None
