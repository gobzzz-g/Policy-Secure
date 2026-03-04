"""
Database initialization script.
Creates tables and populates with sample data.
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models import User, UserRole, Policy, InsuranceType, PremiumFrequency, Claim, ClaimStatus


def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def create_sample_users(db):
    """Create sample users for each role."""
    print("\nCreating sample users...")
    
    users_data = [
        {
            "email": "admin@insurance.com",
            "password": "admin123",
            "full_name": "System Administrator",
            "role": UserRole.ADMIN,
            "phone": "+1-555-0001"
        },
        {
            "email": "fraud@insurance.com",
            "password": "fraud123",
            "full_name": "Sarah Investigator",
            "role": UserRole.FRAUD_INVESTIGATOR,
            "phone": "+1-555-0003"
        },
        {
            "email": "support@insurance.com",
            "password": "support123",
            "full_name": "Mike Support",
            "role": UserRole.CUSTOMER_SUPPORT,
            "phone": "+1-555-0004"
        },
        {
            "email": "user@example.com",
            "password": "user123",
            "full_name": "Alice Policyholder",
            "role": UserRole.POLICYHOLDER,
            "phone": "+1-555-1001",
            "address": "123 Main St, New York, NY 10001"
        },
        {
            "email": "bob@example.com",
            "password": "user123",
            "full_name": "Bob Johnson",
            "role": UserRole.POLICYHOLDER,
            "phone": "+1-555-1002",
            "address": "456 Oak Ave, Los Angeles, CA 90001"
        }
    ]
    
    created_users = []
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                phone=user_data["phone"],
                address=user_data.get("address"),
                is_active=True
            )
            db.add(user)
            created_users.append(user)
            print(f"  ✓ Created user: {user_data['email']} ({user_data['role'].value})")
    
    db.commit()
    print(f"✓ Created {len(created_users)} users")
    return created_users


def create_sample_policies(db):
    """Create sample policies."""
    print("\nCreating sample policies...")
    
    # Get policyholders
    policyholders = db.query(User).filter(User.role == UserRole.POLICYHOLDER).all()
    
    if not policyholders:
        print("  ! No policyholders found")
        return []
    
    policies_data = [
        {
            "insurance_type": InsuranceType.HEALTH,
            "sum_insured": 500000,
            "per_claim_limit": 100000,
            "deductible": 5000,
            "premium_amount": 15000,
            "type_specific_data": {
                "hospital_network": "network",
                "pre_existing_covered": True,
                "annual_health_checkup": True
            }
        },
        {
            "insurance_type": InsuranceType.MOTOR,
            "sum_insured": 800000,
            "per_claim_limit": 500000,
            "deductible": 10000,
            "premium_amount": 20000,
            "type_specific_data": {
                "vehicle_type": "car",
                "vehicle_make": "Toyota",
                "vehicle_model": "Camry",
                "vehicle_year": 2020
            }
        },
        {
            "insurance_type": InsuranceType.PROPERTY,
            "sum_insured": 2000000,
            "per_claim_limit": 1000000,
            "deductible": 20000,
            "premium_amount": 25000,
            "type_specific_data": {
                "property_type": "home",
                "property_age_years": 5,
                "security_measures": ["alarm", "cctv"]
            }
        }
    ]
    
    created_policies = []
    for i, user in enumerate(policyholders):
        for policy_data in policies_data[:2]:  # 2 policies per user
            start_date = datetime.now() - timedelta(days=random.randint(60, 365))
            end_date = start_date + timedelta(days=365)
            
            policy_number = f"POL-{policy_data['insurance_type'].value.upper()}-{datetime.now().strftime('%Y%m%d')}-{random.randint(10000, 99999)}"
            
            policy = Policy(
                policy_number=policy_number,
                user_id=user.id,
                insurance_type=policy_data["insurance_type"],
                sum_insured=policy_data["sum_insured"],
                per_claim_limit=policy_data["per_claim_limit"],
                deductible=policy_data["deductible"],
                premium_amount=policy_data["premium_amount"],
                premium_frequency=PremiumFrequency.ANNUAL,
                start_date=start_date,
                end_date=end_date,
                type_specific_data=policy_data["type_specific_data"],
                is_active=True
            )
            
            db.add(policy)
            created_policies.append(policy)
    
    db.commit()
    print(f"✓ Created {len(created_policies)} policies")
    return created_policies


def create_sample_claims(db):
    """Create sample claims."""
    print("\nCreating sample claims...")
    
    policies = db.query(Policy).all()
    
    if not policies:
        print("  ! No policies found")
        return []
    
    claims_scenarios = [
        {
            "description": "Hospitalization for viral infection requiring 3 days of inpatient care at City Hospital.",
            "claimed_amount": 45000,
            "estimated_loss": 42000,
            "location": "City Hospital, Downtown",
            "specific_data": {
                "hospital_name": "City Hospital",
                "doctor": "Dr. Smith",
                "diagnosis": "Viral Infection",
                "treatment_days": 3
            }
        },
        {
            "description": "Vehicle accident on Highway 101, front bumper and headlight damage. Police report filed.",
            "claimed_amount": 85000,
            "estimated_loss": 80000,
            "location": "Highway 101, Mile Marker 45",
            "specific_data": {
                "damage_type": "collision",
                "police_report": "PR-2024-12345",
                "garage": "ABC Auto Repair"
            }
        },
        {
            "description": "Water damage to property due to burst pipe in the kitchen. Flooring and cabinets affected.",
            "claimed_amount": 120000,
            "estimated_loss": 115000,
            "location": "Residential Property",
            "specific_data": {
                "damage_cause": "burst_pipe",
                "affected_areas": ["kitchen", "dining_room"],
                "repair_estimate": 115000
            }
        }
    ]
    
    created_claims = []
    for policy in policies[:3]:  # Create claims for first 3 policies
        scenario = random.choice(claims_scenarios)
        
        incident_date = datetime.now() - timedelta(days=random.randint(5, 30))
        claim_number = f"CLM-{datetime.now().strftime('%Y%m%d')}-{random.randint(10000, 99999)}"
        
        claim = Claim(
            claim_number=claim_number,
            user_id=policy.user_id,
            policy_id=policy.id,
            incident_date=incident_date,
            incident_description=scenario["description"],
            claimed_amount=scenario["claimed_amount"],
            estimated_loss=scenario["estimated_loss"],
            incident_location=scenario["location"],
            claim_specific_data=scenario["specific_data"],
            status=ClaimStatus.SUBMITTED,
            submitted_at=incident_date + timedelta(days=1)
        )
        
        db.add(claim)
        created_claims.append(claim)
    
    db.commit()
    print(f"✓ Created {len(created_claims)} claims")
    return created_claims


def main():
    """Main initialization function."""
    print("=" * 60)
    print("Policy Secure - Database Initialization")
    print("=" * 60)
    
    try:
        # Create tables
        create_tables()
        
        # Create database session
        db = SessionLocal()
        
        try:
            # Create sample data
            create_sample_users(db)
            create_sample_policies(db)
            create_sample_claims(db)
            
            print("\n" + "=" * 60)
            print("✓ Database initialization completed successfully!")
            print("=" * 60)
            print("\nDefault Login Credentials:")
            print("  Admin:       admin@insurance.com / admin123")
            print("  Officer:     officer@insurance.com / officer123")
            print("  Investigator: fraud@insurance.com / fraud123")
            print("  Support:     support@insurance.com / support123")
            print("  Policyholder: user@example.com / user123")
            print("=" * 60)
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"\n✗ Error during initialization: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
