"""
Database configuration and session management.
Handles PostgreSQL and MongoDB connections.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pymongo import MongoClient
from typing import Generator

from app.core.config import settings

# PostgreSQL Setup
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# MongoDB Setup
mongo_client = MongoClient(settings.MONGODB_URL)
mongodb = mongo_client[settings.MONGODB_DB_NAME]


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    Automatically handles session lifecycle.
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_mongodb():
    """
    Get MongoDB database instance.
    
    Returns:
        MongoDB database
    """
    return mongodb


# Initialize database tables
def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


# Close database connections
def close_db():
    """Close all database connections."""
    engine.dispose()
    mongo_client.close()
