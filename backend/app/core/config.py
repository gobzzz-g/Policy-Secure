"""
Configuration module for the Insurance Claims Platform.
Handles all environment variables and application settings.
"""

from pydantic import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Policy Secure - Insurance Claims Platform"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database - with defaults to prevent crashes
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/insurance_claims"
    MONGODB_URL: str = "mongodb://localhost:27017/"
    MONGODB_DB_NAME: str = "insurance_claims_docs"
    
    # Security - with default values
    SECRET_KEY: str = "default-secret-key-change-in-production-minimum-32-characters-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated ALLOWED_ORIGINS string to list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    # Gemini API
    GEMINI_API_KEY: str = "your-gemini-api-key-here"
    GEMINI_MODEL: str = "gemini-pro"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "/tmp/uploads"  # Use /tmp for serverless environments
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"]
    
    # Fraud Detection Thresholds
    FRAUD_RISK_HIGH_THRESHOLD: int = 70
    FRAUD_RISK_MEDIUM_THRESHOLD: int = 40
    
    # Claims Processing
    MAX_CLAIMS_PER_DAY: int = 5
    EARLY_CLAIM_DAYS_THRESHOLD: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create upload directory if it doesn't exist
        try:
            os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        except Exception as e:
            # In serverless environments, this might fail
            # Log the error but don't crash
            import logging
            logging.warning(f"Could not create upload directory {self.UPLOAD_DIR}: {e}")


# Global settings instance
settings = Settings()
