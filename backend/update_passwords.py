"""
Update user passwords with new hashing scheme
"""
import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User

def update_passwords():
    """Update all user passwords with new hashing."""
    db = SessionLocal()
    
    # Password mappings
    passwords = {
        "admin@insurance.com": "admin123",
        "fraud@insurance.com": "fraud123",
        "support@insurance.com": "support123",
        "user@example.com": "user123",
        "bob@example.com": "user123"
    }
    
    print("Updating user passwords...")
    updated = 0
    
    for email, password in passwords.items():
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.hashed_password = get_password_hash(password)
            updated += 1
            print(f"  ✓ Updated password for: {email}")
        else:
            print(f"  ! User not found: {email}")
    
    db.commit()
    db.close()
    
    print(f"\n✓ Updated {updated} user passwords")
    print("\nLogin Credentials:")
    print("  Admin:       admin@insurance.com / admin123")
    print("  Investigator: fraud@insurance.com / fraud123")
    print("  Support:     support@insurance.com / support123")
    print("  Policyholder: user@example.com / user123")

if __name__ == "__main__":
    update_passwords()
