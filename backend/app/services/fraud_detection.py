"""
Fraud Detection Service
Hybrid rule-based + AI-powered fraud detection system.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from app.models.claim import Claim, FraudRiskLevel
from app.models.policy import Policy
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """
    Service for detecting fraudulent insurance claims.
    Uses rule-based signals + pattern analysis.
    """
    
    def __init__(self, db: Session):
        """Initialize fraud detection service."""
        self.db = db
    
    def analyze_claim(
        self,
        claim: Claim,
        policy: Policy,
        user: User
    ) -> Tuple[List[str], Dict[str, Any]]:
        """
        Analyze claim for fraud signals.
        
        Args:
            claim: The claim to analyze
            policy: Related policy
            user: Claim submitter
            
        Returns:
            Tuple of (fraud_signals, user_history)
        """
        signals = []
        
        # Rule-based checks
        signals.extend(self._check_early_claim(claim, policy))
        signals.extend(self._check_amount_patterns(claim, policy))
        signals.extend(self._check_frequency(claim, user))
        signals.extend(self._check_description_quality(claim))
        signals.extend(self._check_claim_history(user))
        signals.extend(self._check_suspicious_patterns(claim, user))
        
        # Get user history for AI analysis
        user_history = self._get_user_history(user)
        
        logger.info(f"Detected {len(signals)} fraud signals for claim {claim.claim_number}")
        
        return signals, user_history
    
    def _check_early_claim(self, claim: Claim, policy: Policy) -> List[str]:
        """Check if claim submitted too early after policy start."""
        signals = []
        
        days_since_start = policy.days_since_start
        
        if days_since_start < settings.EARLY_CLAIM_DAYS_THRESHOLD:
            signals.append(
                f"Early claim: Filed {days_since_start} days after policy start "
                f"(threshold: {settings.EARLY_CLAIM_DAYS_THRESHOLD} days)"
            )
            logger.warning(f"Early claim detected for {claim.claim_number}")
        
        return signals
    
    def _check_amount_patterns(self, claim: Claim, policy: Policy) -> List[str]:
        """Check for suspicious amount patterns."""
        signals = []
        
        # Check if claimed amount is very close to per-claim limit
        if claim.claimed_amount >= policy.per_claim_limit * 0.95:
            signals.append(
                f"Claimed amount (${claim.claimed_amount:,.2f}) is {claim.claimed_amount/policy.per_claim_limit*100:.1f}% "
                f"of per-claim limit (${policy.per_claim_limit:,.2f})"
            )
        
        # Check if claimed amount exceeds estimated loss significantly
        if claim.claimed_amount > claim.estimated_loss * 1.2:
            signals.append(
                f"Claimed amount exceeds estimated loss by "
                f"{(claim.claimed_amount/claim.estimated_loss - 1)*100:.1f}%"
            )
        
        # Check if amount is round number (potential estimation rather than actual)
        if claim.claimed_amount % 1000 == 0 and claim.claimed_amount >= 10000:
            signals.append(
                f"Claimed amount is a round number (${claim.claimed_amount:,.0f}), "
                "which may indicate estimation rather than actual documentation"
            )
        
        return signals
    
    def _check_frequency(self, claim: Claim, user: User) -> List[str]:
        """Check claim submission frequency."""
        signals = []
        
        # Count recent claims
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_claims = self.db.query(Claim).filter(
            Claim.user_id == user.id,
            Claim.created_at >= thirty_days_ago,
            Claim.id != claim.id
        ).count()
        
        if recent_claims >= 3:
            signals.append(
                f"High frequency: {recent_claims} claims submitted in last 30 days"
            )
        
        # Count claims today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        claims_today = self.db.query(Claim).filter(
            Claim.user_id == user.id,
            Claim.created_at >= today_start,
            Claim.id != claim.id
        ).count()
        
        if claims_today >= settings.MAX_CLAIMS_PER_DAY:
            signals.append(
                f"Multiple claims today: {claims_today + 1} claims filed on same day"
            )
        
        return signals
    
    def _check_description_quality(self, claim: Claim) -> List[str]:
        """Check quality and detail of incident description."""
        signals = []
        
        description = claim.incident_description.strip()
        
        # Check length
        if len(description) < 50:
            signals.append(
                f"Insufficient description: Only {len(description)} characters provided"
            )
        
        # Check for vague descriptions
        vague_keywords = ['something', 'somehow', 'maybe', 'approximately', 'not sure', 'dont know']
        vague_count = sum(1 for keyword in vague_keywords if keyword in description.lower())
        
        if vague_count >= 2:
            signals.append(
                f"Vague description: Contains {vague_count} uncertain terms"
            )
        
        # Check if location is missing for certain claim types
        if not claim.incident_location or len(claim.incident_location.strip()) < 5:
            signals.append("Missing or incomplete incident location")
        
        return signals
    
    def _check_claim_history(self, user: User) -> List[str]:
        """Check user's historical claim patterns."""
        signals = []
        
        # Get all user claims
        all_claims = self.db.query(Claim).filter(Claim.user_id == user.id).all()
        
        if len(all_claims) >= 10:
            # Check rejection rate
            rejected_claims = [c for c in all_claims if c.status.value == 'rejected']
            rejection_rate = len(rejected_claims) / len(all_claims)
            
            if rejection_rate > 0.3:
                signals.append(
                    f"High rejection history: {rejection_rate*100:.0f}% of previous claims rejected"
                )
            
            # Check for previous fraud flags
            flagged_claims = [c for c in all_claims if c.is_flagged_for_investigation]
            
            if len(flagged_claims) >= 2:
                signals.append(
                    f"Previous fraud flags: {len(flagged_claims)} claims previously flagged"
                )
        
        return signals
    
    def _check_suspicious_patterns(self, claim: Claim, user: User) -> List[str]:
        """Check for suspicious patterns in claim data."""
        signals = []
        
        # Check for duplicate or very similar descriptions
        similar_claims = self.db.query(Claim).filter(
            Claim.user_id == user.id,
            Claim.incident_description == claim.incident_description,
            Claim.id != claim.id
        ).count()
        
        if similar_claims > 0:
            signals.append(
                f"Duplicate description: {similar_claims} previous claim(s) with identical description"
            )
        
        # Check if claim-specific data looks complete
        if not claim.claim_specific_data or len(claim.claim_specific_data) < 2:
            signals.append(
                "Incomplete claim details: Missing insurance-type-specific information"
            )
        
        # Check if witnesses provided but no details
        if claim.witnesses and len(claim.witnesses) > 0:
            incomplete_witnesses = sum(
                1 for w in claim.witnesses 
                if not w.get('name') or not w.get('contact')
            )
            if incomplete_witnesses > 0:
                signals.append(
                    f"Incomplete witness information: {incomplete_witnesses} witness(es) missing details"
                )
        
        return signals
    
    def _get_user_history(self, user: User) -> Dict[str, Any]:
        """Get user's claim history summary."""
        
        all_claims = self.db.query(Claim).filter(Claim.user_id == user.id).all()
        
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_claims = [c for c in all_claims if c.created_at >= thirty_days_ago]
        
        approved_claims = [c for c in all_claims if c.status.value == 'approved']
        avg_amount = (
            sum(c.claimed_amount for c in approved_claims) / len(approved_claims)
            if approved_claims else 0
        )
        
        fraud_flags = sum(1 for c in all_claims if c.is_flagged_for_investigation)
        
        return {
            'total_claims': len(all_claims),
            'recent_claims': len(recent_claims),
            'avg_claim_amount': avg_amount,
            'fraud_flags': fraud_flags,
            'rejection_count': sum(1 for c in all_claims if c.status.value == 'rejected'),
            'approval_count': len(approved_claims)
        }
    
    def calculate_risk_level(self, fraud_score: float) -> FraudRiskLevel:
        """
        Convert fraud score to risk level.
        
        Args:
            fraud_score: Fraud risk score (0-100)
            
        Returns:
            FraudRiskLevel enum value
        """
        if fraud_score >= settings.FRAUD_RISK_HIGH_THRESHOLD:
            return FraudRiskLevel.CRITICAL if fraud_score >= 85 else FraudRiskLevel.HIGH
        elif fraud_score >= settings.FRAUD_RISK_MEDIUM_THRESHOLD:
            return FraudRiskLevel.MEDIUM
        else:
            return FraudRiskLevel.LOW
    
    def should_flag_for_investigation(self, fraud_score: float, signals: List[str]) -> bool:
        """
        Determine if claim should be flagged for fraud investigation.
        
        Args:
            fraud_score: Calculated fraud risk score
            signals: List of detected fraud signals
            
        Returns:
            True if claim should be flagged
        """
        # Flag if high risk
        if fraud_score >= settings.FRAUD_RISK_HIGH_THRESHOLD:
            return True
        
        # Flag if multiple critical signals
        critical_keywords = ['early claim', 'high frequency', 'duplicate', 'previous fraud']
        critical_signals = sum(
            1 for signal in signals 
            if any(keyword in signal.lower() for keyword in critical_keywords)
        )
        
        if critical_signals >= 2:
            return True
        
        return False
