"""
Script to create a superuser/admin account.
"""

import sys
import os

# Add parent directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User, UserRole


def create_superuser():
    """Create a superuser with admin privileges."""
    
    print("\n" + "="*60)
    print("CREATE SUPERUSER")
    print("="*60 + "\n")
    
    # Get user input
    email = input("Email address: ").strip()
    if not email:
        print("❌ Email is required!")
        return
    
    full_name = input("Full name: ").strip()
    if not full_name:
        print("❌ Full name is required!")
        return
    
    password = input("Password: ").strip()
    if not password:
        print("❌ Password is required!")
        return
    
    confirm_password = input("Confirm password: ").strip()
    if password != confirm_password:
        print("❌ Passwords don't match!")
        return
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"\n❌ User with email {email} already exists!")
            print(f"   Current role: {existing_user.role}")
            
            upgrade = input("\nUpgrade to admin? (yes/no): ").strip().lower()
            if upgrade in ['yes', 'y']:
                existing_user.role = UserRole.ADMIN
                existing_user.full_name = full_name
                existing_user.hashed_password = get_password_hash(password)
                db.commit()
                print(f"\n✓ Successfully upgraded {email} to admin!")
            return
        
        # Create new superuser
        superuser = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(superuser)
        db.commit()
        db.refresh(superuser)
        
        print("\n" + "="*60)
        print("✓ SUPERUSER CREATED SUCCESSFULLY!")
        print("="*60)
        print(f"\nEmail:     {superuser.email}")
        print(f"Name:      {superuser.full_name}")
        print(f"Role:      {superuser.role}")
        print(f"User ID:   {superuser.id}")
        print(f"Active:    {superuser.is_active}")
        print("\n" + "="*60)
        print("\nYou can now login with these credentials at:")
        print("  http://localhost:3000")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error creating superuser: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_superuser()
