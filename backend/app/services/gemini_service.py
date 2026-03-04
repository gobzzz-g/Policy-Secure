"""
Gemini API Integration Service
Handles all AI-powered analysis using Google's Gemini API.
"""

from typing import Dict, Any, List, Optional
import json
import logging
from datetime import datetime

from app.core.config import settings
from app.schemas.claim_schema import FraudAnalysisResult, SettlementRecommendation
from app.models.claim import FraudRiskLevel

# Configure logging
logger = logging.getLogger(__name__)

# Try to import and configure Gemini API (may fail on Python 3.14)
try:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    GEMINI_AVAILABLE = True
    logger.info("Gemini API initialized successfully")
except Exception as e:
    genai = None
    GEMINI_AVAILABLE = False
    logger.warning(f"Gemini API not available: {str(e)}. Using fallback mode.")


class GeminiService:
    """
    Service class for Gemini API interactions.
    Provides fraud detection, claim reasoning, and settlement justification.
    """
    
    def __init__(self):
        """Initialize Gemini service with model configuration."""
        if GEMINI_AVAILABLE:
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            self.generation_config = {
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
        else:
            self.model = None
            self.generation_config = None
    
    async def analyze_fraud_risk(
        self,
        claim_data: Dict[str, Any],
        policy_data: Dict[str, Any],
        user_history: Dict[str, Any],
        rule_based_signals: List[str]
    ) -> FraudAnalysisResult:
        """
        Analyze fraud risk for a claim using Gemini AI.
        
        Args:
            claim_data: Claim information
            policy_data: Related policy information
            user_history: User's claim history
            rule_based_signals: Pre-detected fraud signals from rules
            
        Returns:
            FraudAnalysisResult with score, level, explanation, and signals
        """
        # Use fallback if Gemini is not available
        if not GEMINI_AVAILABLE or self.model is None:
            logger.info(f"Using fallback fraud analysis for claim {claim_data.get('claim_number')}")
            return self._fallback_fraud_analysis(rule_based_signals)
        
        try:
            # Construct detailed prompt for Gemini
            prompt = self._build_fraud_analysis_prompt(
                claim_data, policy_data, user_history, rule_based_signals
            )
            
            # Generate analysis
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            # Parse response
            result = self._parse_fraud_response(response.text, rule_based_signals)
            
            logger.info(f"Fraud analysis completed for claim {claim_data.get('claim_number')}")
            return result
            
        except Exception as e:
            logger.error(f"Gemini fraud analysis failed: {str(e)}")
            # Fallback to rule-based scoring
            return self._fallback_fraud_analysis(rule_based_signals)
    
    async def generate_settlement_justification(
        self,
        claim_data: Dict[str, Any],
        policy_data: Dict[str, Any],
        calculated_settlement: float
    ) -> SettlementRecommendation:
        """
        Generate natural language justification for settlement amount.
        
        Args:
            claim_data: Claim information
            policy_data: Policy information
            calculated_settlement: Calculated settlement amount
            
        Returns:
            SettlementRecommendation with justification and breakdown
        """
        # Use fallback if Gemini is not available
        if not GEMINI_AVAILABLE or self.model is None:
            return self._fallback_settlement_justification(calculated_settlement, policy_data)
        
        try:
            prompt = self._build_settlement_prompt(claim_data, policy_data, calculated_settlement)
            
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            result = self._parse_settlement_response(response.text, calculated_settlement)
            
            logger.info(f"Settlement justification generated for claim {claim_data.get('claim_number')}")
            return result
            
        except Exception as e:
            logger.error(f"Gemini settlement justification failed: {str(e)}")
            return self._fallback_settlement_justification(calculated_settlement, policy_data)
    
    async def validate_claim_reasoning(
        self,
        claim_data: Dict[str, Any],
        policy_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate claim logic and identify inconsistencies.
        
        Args:
            claim_data: Claim information
            policy_data: Policy information
            
        Returns:
            Dict with validation results and recommendations
        """
        try:
            prompt = self._build_validation_prompt(claim_data, policy_data)
            
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            return self._parse_validation_response(response.text)
            
        except Exception as e:
            logger.error(f"Gemini claim validation failed: {str(e)}")
            return {"is_valid": True, "concerns": [], "recommendations": []}
    
    def _build_fraud_analysis_prompt(
        self,
        claim_data: Dict[str, Any],
        policy_data: Dict[str, Any],
        user_history: Dict[str, Any],
        rule_based_signals: List[str]
    ) -> str:
        """Build comprehensive prompt for fraud analysis."""
        
        return f"""You are an expert insurance fraud analyst. Analyze the following claim for fraud risk.

**CLAIM DETAILS:**
- Claim Number: {claim_data.get('claim_number')}
- Insurance Type: {policy_data.get('insurance_type')}
- Claimed Amount: ${claim_data.get('claimed_amount'):,.2f}
- Estimated Loss: ${claim_data.get('estimated_loss'):,.2f}
- Incident Date: {claim_data.get('incident_date')}
- Description: {claim_data.get('incident_description')}
- Location: {claim_data.get('incident_location', 'Not specified')}

**POLICY INFORMATION:**
- Sum Insured: ${policy_data.get('sum_insured'):,.2f}
- Per Claim Limit: ${policy_data.get('per_claim_limit'):,.2f}
- Days Since Policy Start: {policy_data.get('days_since_start', 0)}
- Policy Active: {policy_data.get('is_active', True)}

**USER CLAIM HISTORY:**
- Total Claims Filed: {user_history.get('total_claims', 0)}
- Claims in Last 30 Days: {user_history.get('recent_claims', 0)}
- Average Claim Amount: ${user_history.get('avg_claim_amount', 0):,.2f}
- Previous Fraud Flags: {user_history.get('fraud_flags', 0)}

**RULE-BASED SIGNALS DETECTED:**
{chr(10).join(f'- {signal}' for signal in rule_based_signals) if rule_based_signals else '- No automatic signals detected'}

**YOUR TASK:**
Analyze this claim and provide:
1. A fraud risk score (0-100, where 0 is no risk and 100 is certain fraud)
2. A clear explanation of your reasoning
3. Specific fraud indicators you identified
4. Your confidence level (0-100)

**IMPORTANT GUIDELINES:**
- Do NOT auto-reject claims. Your role is to assess risk, not make final decisions.
- Consider both the rule-based signals and your own analysis.
- Look for patterns like:
  * Claims submitted shortly after policy start
  * Claimed amount very close to limits
  * Vague or inconsistent descriptions
  * Unusual patterns compared to claim type norms
- Be thorough but fair in your assessment.

Provide your response in the following JSON format:
{{
    "fraud_risk_score": <number 0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "explanation": "<detailed natural language explanation>",
    "fraud_indicators": ["<indicator 1>", "<indicator 2>", ...],
    "confidence_score": <number 0-100>
}}
"""
    
    def _build_settlement_prompt(
        self,
        claim_data: Dict[str, Any],
        policy_data: Dict[str, Any],
        calculated_settlement: float
    ) -> str:
        """Build prompt for settlement justification."""
        
        return f"""You are an insurance claims settlement expert. Explain the recommended settlement amount.

**CLAIM INFORMATION:**
- Claimed Amount: ${claim_data.get('claimed_amount'):,.2f}
- Estimated Loss: ${claim_data.get('estimated_loss'):,.2f}
- Incident: {claim_data.get('incident_description')}

**POLICY TERMS:**
- Sum Insured: ${policy_data.get('sum_insured'):,.2f}
- Per Claim Limit: ${policy_data.get('per_claim_limit'):,.2f}
- Deductible: ${policy_data.get('deductible', 0):,.2f}

**CALCULATED SETTLEMENT:**
${calculated_settlement:,.2f}

**YOUR TASK:**
Provide a clear, natural language justification explaining:
1. Why this settlement amount is recommended
2. How policy terms were applied
3. Any reductions or adjustments made
4. A breakdown of the calculation

Be professional, empathetic, and transparent. The explanation will be shown to the policyholder.

Provide your response in JSON format:
{{
    "justification": "<detailed explanation>",
    "calculation_steps": ["<step 1>", "<step 2>", ...],
    "breakdown": {{
        "claimed": <amount>,
        "eligible": <amount>,
        "deductible": <amount>,
        "recommended": <amount>
    }}
}}
"""
    
    def _build_validation_prompt(
        self,
        claim_data: Dict[str, Any],
        policy_data: Dict[str, Any]
    ) -> str:
        """Build prompt for claim validation."""
        
        return f"""Validate the following insurance claim for logical consistency and completeness.

**CLAIM DETAILS:**
{json.dumps(claim_data, indent=2, default=str)}

**POLICY DETAILS:**
{json.dumps(policy_data, indent=2, default=str)}

**YOUR TASK:**
Review the claim and identify:
1. Any logical inconsistencies
2. Missing or incomplete information
3. Concerns that need clarification
4. Recommendations for review

Provide response in JSON:
{{
    "is_valid": <true|false>,
    "concerns": ["<concern 1>", ...],
    "missing_info": ["<info 1>", ...],
    "recommendations": ["<recommendation 1>", ...]
}}
"""
    
    def _parse_fraud_response(self, response_text: str, rule_signals: List[str]) -> FraudAnalysisResult:
        """Parse Gemini response for fraud analysis."""
        try:
            # Try to extract JSON from response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            
            if start != -1 and end > start:
                json_text = response_text[start:end]
                data = json.loads(json_text)
                
                risk_score = float(data.get('fraud_risk_score', 0))
                risk_level_str = data.get('risk_level', 'LOW').upper()
                
                # Map to enum
                risk_level_map = {
                    'LOW': FraudRiskLevel.LOW,
                    'MEDIUM': FraudRiskLevel.MEDIUM,
                    'HIGH': FraudRiskLevel.HIGH,
                    'CRITICAL': FraudRiskLevel.CRITICAL
                }
                risk_level = risk_level_map.get(risk_level_str, FraudRiskLevel.LOW)
                
                # Combine rule-based and AI-detected indicators
                all_signals = list(set(rule_signals + data.get('fraud_indicators', [])))
                
                return FraudAnalysisResult(
                    fraud_risk_score=risk_score,
                    fraud_risk_level=risk_level,
                    fraud_explanation=data.get('explanation', 'AI analysis completed'),
                    fraud_signals=all_signals,
                    confidence_score=float(data.get('confidence_score', 70))
                )
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            logger.warning(f"Failed to parse Gemini fraud response: {str(e)}")
            return self._fallback_fraud_analysis(rule_signals)
    
    def _parse_settlement_response(
        self, response_text: str, calculated_amount: float
    ) -> SettlementRecommendation:
        """Parse Gemini response for settlement justification."""
        try:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            
            if start != -1 and end > start:
                json_text = response_text[start:end]
                data = json.loads(json_text)
                
                return SettlementRecommendation(
                    recommended_amount=calculated_amount,
                    justification=data.get('justification', 'Settlement calculated per policy terms'),
                    breakdown=data.get('breakdown', {})
                )
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            logger.warning(f"Failed to parse settlement response: {str(e)}")
            return SettlementRecommendation(
                recommended_amount=calculated_amount,
                justification="Settlement calculated based on policy terms and estimated loss.",
                breakdown={"recommended": calculated_amount}
            )
    
    def _parse_validation_response(self, response_text: str) -> Dict[str, Any]:
        """Parse validation response."""
        try:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            
            if start != -1 and end > start:
                json_text = response_text[start:end]
                return json.loads(json_text)
            else:
                raise ValueError("No JSON found")
                
        except Exception as e:
            logger.warning(f"Failed to parse validation response: {str(e)}")
            return {"is_valid": True, "concerns": [], "recommendations": []}
    
    def _fallback_fraud_analysis(self, rule_signals: List[str]) -> FraudAnalysisResult:
        """Fallback fraud analysis when Gemini is unavailable."""
        
        # Simple scoring based on number of signals
        num_signals = len(rule_signals)
        
        if num_signals >= 4:
            risk_score = 85
            risk_level = FraudRiskLevel.CRITICAL
        elif num_signals >= 3:
            risk_score = 65
            risk_level = FraudRiskLevel.HIGH
        elif num_signals >= 2:
            risk_score = 45
            risk_level = FraudRiskLevel.MEDIUM
        else:
            risk_score = 20
            risk_level = FraudRiskLevel.LOW
        
        explanation = f"Automated analysis detected {num_signals} potential fraud signals. "
        explanation += "Manual review recommended. AI analysis temporarily unavailable."
        
        return FraudAnalysisResult(
            fraud_risk_score=float(risk_score),
            fraud_risk_level=risk_level,
            fraud_explanation=explanation,
            fraud_signals=rule_signals,
            confidence_score=60.0
        )
    
    def _fallback_settlement_justification(
        self, amount: float, policy_data: Dict[str, Any]
    ) -> SettlementRecommendation:
        """Fallback settlement justification."""
        
        justification = (
            f"Settlement of ${amount:,.2f} recommended based on policy terms. "
            f"This amount considers the per-claim limit of ${policy_data.get('per_claim_limit', 0):,.2f}, "
            f"estimated loss, and applicable deductible."
        )
        
        return SettlementRecommendation(
            recommended_amount=amount,
            justification=justification,
            breakdown={
                "recommended": amount,
                "per_claim_limit": policy_data.get('per_claim_limit', 0)
            }
        )


# Global instance
gemini_service = GeminiService()
