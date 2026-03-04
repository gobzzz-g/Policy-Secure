"""
Quick database table creation script.
"""

import sys
import os

# Add parent directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.core.database import engine, Base
from app.models import User, Policy, Claim, ClaimTimeline, Document

print("Creating all database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")
print("\nNew tables created:")
print("  - users")
print("  - policies") 
print("  - claims (with new columns: settlement_breakdown, confidence_score)")
print("  - claim_timeline (NEW)")
print("  - documents (NEW)")
print("\nYou can now run init_db.py to populate with sample data.")
