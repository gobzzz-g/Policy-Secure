"""
Settlement Calculator Service
Calculates recommended settlement amounts based on policy rules.
"""

from typing import Dict, Any, Tuple
import logging

from app.models.claim import Claim
from app.models.policy import Policy

logger = logging.getLogger(__name__)


class SettlementCalculator:
    """
    Service for calculating claim settlement amounts.
    Uses the formula: min(Estimated Loss, Per-Claim Limit, Sum Insured) - Deductible
    """
    
    @staticmethod
    def calculate_settlement(
        claim: Claim,
        policy: Policy,
        fraud_risk_score: float = 0
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate recommended settlement amount for a claim.
        
        Args:
            claim: The insurance claim
            policy: Related policy
            fraud_risk_score: Fraud risk score (0-100)
            
        Returns:
            Tuple of (settlement_amount, breakdown_dict)
        """
        
        # Start with estimated loss
        eligible_amount = claim.estimated_loss
        
        # Apply per-claim limit
        eligible_amount = min(eligible_amount, policy.per_claim_limit)
        
        # Apply sum insured (total policy limit)
        eligible_amount = min(eligible_amount, policy.sum_insured)
        
        # Apply deductible
        settlement_amount = max(0, eligible_amount - policy.deductible)
        
        # Apply fraud risk adjustment (optional - reduce if high risk)
        fraud_adjustment = 0
        if fraud_risk_score >= 70:
            # High risk: suggest 20% reduction for officer review
            fraud_adjustment = settlement_amount * 0.20
            settlement_amount = settlement_amount * 0.80
        elif fraud_risk_score >= 50:
            # Medium-high risk: suggest 10% reduction
            fraud_adjustment = settlement_amount * 0.10
            settlement_amount = settlement_amount * 0.90
        
        # Round to 2 decimal places
        settlement_amount = round(settlement_amount, 2)
        
        # Create breakdown for transparency
        breakdown = {
            "claimed_amount": round(claim.claimed_amount, 2),
            "estimated_loss": round(claim.estimated_loss, 2),
            "per_claim_limit": round(policy.per_claim_limit, 2),
            "sum_insured": round(policy.sum_insured, 2),
            "deductible": round(policy.deductible, 2),
            "fraud_adjustment": round(fraud_adjustment, 2),
            "eligible_amount": round(eligible_amount + fraud_adjustment, 2),
            "recommended_settlement": round(settlement_amount, 2)
        }
        
        logger.info(
            f"Settlement calculated for claim {claim.claim_number}: "
            f"${settlement_amount:,.2f}"
        )
        
        return settlement_amount, breakdown
    
    @staticmethod
    def validate_claim_amount(claim: Claim, policy: Policy) -> Tuple[bool, str]:
        """
        Validate if claimed amount is within policy limits.
        
        Args:
            claim: The claim to validate
            policy: Related policy
            
        Returns:
            Tuple of (is_valid, message)
        """
        
        # Check if claimed amount exceeds per-claim limit
        if claim.claimed_amount > policy.per_claim_limit:
            return False, (
                f"Claimed amount (${claim.claimed_amount:,.2f}) exceeds "
                f"per-claim limit (${policy.per_claim_limit:,.2f})"
            )
        
        # Check if claimed amount exceeds sum insured
        if claim.claimed_amount > policy.sum_insured:
            return False, (
                f"Claimed amount (${claim.claimed_amount:,.2f}) exceeds "
                f"sum insured (${policy.sum_insured:,.2f})"
            )
        
        # Check if estimated loss is reasonable compared to claimed amount
        if claim.estimated_loss < claim.claimed_amount * 0.5:
            return False, (
                f"Estimated loss (${claim.estimated_loss:,.2f}) is significantly "
                f"lower than claimed amount (${claim.claimed_amount:,.2f})"
            )
        
        return True, "Claim amount is valid"
    
    @staticmethod
    def calculate_insurance_type_specific_adjustments(
        claim: Claim,
        policy: Policy
    ) -> Dict[str, Any]:
        """
        Calculate insurance-type-specific adjustments.
        Different insurance types may have different calculation rules.
        
        Args:
            claim: The claim
            policy: The policy
            
        Returns:
            Dict with type-specific adjustments and notes
        """
        
        adjustments = {
            "applies": False,
            "adjustment_amount": 0,
            "adjustment_reason": "",
            "notes": []
        }
        
        insurance_type = policy.insurance_type.value
        
        if insurance_type == "health":
            # Health insurance specific rules
            hospital_network = claim.claim_specific_data.get("hospital_network")
            if hospital_network == "non_network":
                # Non-network hospitals may have reduced coverage
                adjustments["applies"] = True
                adjustments["adjustment_reason"] = "Non-network hospital: 80% coverage"
                adjustments["notes"].append("Network hospitals provide 100% coverage")
        
        elif insurance_type == "motor":
            # Motor insurance specific rules
            vehicle_age = claim.claim_specific_data.get("vehicle_age_years", 0)
            if vehicle_age > 10:
                # Depreciation for older vehicles
                depreciation = min(30, vehicle_age * 2)
                adjustments["applies"] = True
                adjustments["adjustment_reason"] = f"Vehicle depreciation: {depreciation}%"
                adjustments["notes"].append(f"Vehicle is {vehicle_age} years old")
        
        elif insurance_type == "property":
            # Property insurance specific rules
            security_measures = claim.claim_specific_data.get("security_measures", [])
            if not security_measures or len(security_measures) == 0:
                adjustments["notes"].append(
                    "No security measures reported. May affect future premiums."
                )
        
        elif insurance_type == "travel":
            # Travel insurance specific rules
            trip_cancellation_reason = claim.claim_specific_data.get("cancellation_reason")
            if trip_cancellation_reason == "change_of_mind":
                adjustments["applies"] = True
                adjustments["adjustment_reason"] = "Change of mind not covered"
                adjustments["adjustment_amount"] = -100  # Full reduction
        
        elif insurance_type == "crop":
            # Crop insurance specific rules
            crop_type = claim.claim_specific_data.get("crop_type")
            weather_verified = claim.claim_specific_data.get("weather_verified", False)
            if not weather_verified:
                adjustments["notes"].append(
                    "Weather data verification recommended"
                )
        
        return adjustments
    
    @staticmethod
    def get_settlement_timeline_estimate(claim: Claim, fraud_risk_score: float) -> str:
        """
        Estimate settlement processing timeline.
        
        Args:
            claim: The claim
            fraud_risk_score: Fraud risk score
            
        Returns:
            Estimated timeline string
        """
        
        base_days = 7
        
        # Add time for document verification
        if len(claim.document_ids) < 2:
            base_days += 3
        
        # Add time for fraud investigation
        if fraud_risk_score >= 70:
            base_days += 10
        elif fraud_risk_score >= 50:
            base_days += 5
        
        # Add time for high-value claims
        if claim.claimed_amount > 100000:
            base_days += 7
        
        return f"{base_days}-{base_days + 5} business days"
