# 🤖 Gemini AI Integration Guide

## Overview

This platform uses **Google's Gemini API** to provide intelligent, explainable AI-powered analysis for insurance claims processing. The integration is production-ready with proper error handling, fallback mechanisms, and security.

## 🎯 Use Cases

### 1. Fraud Detection & Risk Scoring
Gemini analyzes claim patterns, policy history, and rule-based signals to generate:
- **Fraud Risk Score** (0-100)
- **Risk Level** (LOW, MEDIUM, HIGH, CRITICAL)
- **Natural Language Explanation**
- **Specific Fraud Indicators**
- **Confidence Score**

### 2. Settlement Justification
Gemini provides human-readable explanations for settlement amounts:
- **Why** a particular amount is recommended
- **How** policy terms were applied
- **What** deductions or adjustments were made
- **Breakdown** of calculation steps

### 3. Claim Validation
Gemini validates claim logic and identifies:
- Logical inconsistencies
- Missing information
- Concerns requiring clarification
- Recommendations for review

## 🔧 Implementation Details

### Service Location
**File:** `backend/app/services/gemini_service.py`

### Key Methods

```python
class GeminiService:
    async def analyze_fraud_risk(
        claim_data, policy_data, user_history, rule_based_signals
    ) -> FraudAnalysisResult
    
    async def generate_settlement_justification(
        claim_data, policy_data, calculated_settlement
    ) -> SettlementRecommendation
    
    async def validate_claim_reasoning(
        claim_data, policy_data
    ) -> Dict[str, Any]
```

## 📊 How It Works

### Fraud Analysis Flow

```
1. Rule-Based System detects signals
   ↓
2. System prepares structured data
   ↓
3. Gemini receives detailed prompt with:
   - Claim details
   - Policy information
   - User history
   - Pre-detected signals
   ↓
4. Gemini analyzes patterns
   ↓
5. Returns structured JSON response
   ↓
6. System parses and stores results
   ↓
7. Human reviewer sees explanation
```

### Example Prompt Structure

```
You are an expert insurance fraud analyst. Analyze the following claim:

CLAIM DETAILS:
- Claim Number: CLM-20241215-A1B2C3D4
- Insurance Type: health
- Claimed Amount: $45,000
- Estimated Loss: $42,000
- Incident Date: 2024-12-10
- Description: Hospitalization for viral infection...

POLICY INFORMATION:
- Sum Insured: $500,000
- Per Claim Limit: $100,000
- Days Since Policy Start: 25

USER CLAIM HISTORY:
- Total Claims Filed: 3
- Claims in Last 30 Days: 2
- Average Claim Amount: $38,000

RULE-BASED SIGNALS DETECTED:
- Early claim: Filed 25 days after policy start (threshold: 30 days)
- High frequency: 2 claims in last 30 days

Provide fraud risk assessment in JSON format...
```

### Example Gemini Response

```json
{
  "fraud_risk_score": 65,
  "risk_level": "HIGH",
  "explanation": "This claim shows multiple concerning patterns. The claim was filed shortly after policy inception (25 days), which is a common indicator of potential fraud. The policyholder has submitted 2 claims within 30 days, suggesting a possible pattern of frequent claims. However, the claimed amount is reasonable relative to the policy limit, and the incident description appears detailed. Recommend manual review by fraud investigator.",
  "fraud_indicators": [
    "Early claim submission after policy start",
    "Multiple claims in short timeframe",
    "Pattern of above-average claim amounts"
  ],
  "confidence_score": 75
}
```

## 🔐 Security & Configuration

### API Key Management

**Environment Variable:**
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

**Never:**
- ❌ Commit API keys to version control
- ❌ Expose keys in frontend code
- ❌ Log API keys
- ❌ Share keys publicly

**Always:**
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod
- ✅ Monitor API usage

### Configuration

**File:** `backend/app/core/config.py`

```python
class Settings(BaseSettings):
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-pro"
```

## 🛡️ Error Handling

### Graceful Fallbacks

The system includes comprehensive fallback logic:

```python
def _fallback_fraud_analysis(rule_signals: List[str]):
    """Fallback when Gemini API is unavailable"""
    
    num_signals = len(rule_signals)
    
    if num_signals >= 4:
        risk_score = 85
        risk_level = FraudRiskLevel.CRITICAL
    elif num_signals >= 3:
        risk_score = 65
        risk_level = FraudRiskLevel.HIGH
    # ... etc
```

### Error Scenarios Handled

1. **API Key Invalid**
   - Logs error
   - Uses fallback scoring
   - Notifies admin (in logs)

2. **Rate Limit Exceeded**
   - Catches exception
   - Returns rule-based score
   - Continues processing

3. **Network Timeout**
   - Implements timeout
   - Falls back gracefully
   - User sees results immediately

4. **Malformed Response**
   - JSON parsing with try/catch
   - Extracts what's available
   - Uses defaults for missing fields

## 📈 Response Parsing

### Structured Extraction

```python
def _parse_fraud_response(response_text: str):
    """Extract JSON from Gemini response"""
    
    # Find JSON boundaries
    start = response_text.find('{')
    end = response_text.rfind('}') + 1
    
    if start != -1 and end > start:
        json_text = response_text[start:end]
        data = json.loads(json_text)
        
        # Map to internal types
        risk_score = float(data.get('fraud_risk_score', 0))
        risk_level = map_risk_level(data.get('risk_level'))
        
        return FraudAnalysisResult(...)
```

## 🎨 Prompt Engineering Best Practices

### Key Principles

1. **Be Specific**: Clear instructions yield better results
2. **Provide Context**: Include all relevant information
3. **Request Structure**: Ask for JSON output
4. **Set Guardrails**: Define acceptable ranges
5. **Examples**: Show desired format

### Prompt Template Pattern

```
[Role Definition]
You are an expert insurance fraud analyst.

[Context]
Analyze the following claim for fraud risk.

[Data Section]
**CLAIM DETAILS:**
- Field: Value
...

[Instructions]
**YOUR TASK:**
1. Analyze this claim
2. Provide specific outputs
3. Follow guidelines

**GUIDELINES:**
- Do NOT auto-reject
- Consider patterns
- Be thorough but fair

[Output Format]
Provide response in JSON:
{
  "field": "format"
}
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **API Call Volume**
   - Calls per day
   - Success rate
   - Average latency

2. **Cost Management**
   - Tokens consumed
   - Cost per claim
   - Budget tracking

3. **Quality Metrics**
   - Agreement with human reviewers
   - False positive rate
   - False negative rate

### Logging

```python
logger.info(f"Fraud analysis completed for claim {claim_number}")
logger.error(f"Gemini API failed: {str(e)}")
logger.warning(f"Fallback analysis used for claim {claim_id}")
```

## 🔄 Integration Points

### 1. Claim Submission
**Endpoint:** `POST /api/claims/{id}/submit`

When a claim is submitted:
1. Rule-based signals detected
2. Gemini analyzes fraud risk
3. Results stored in database
4. Settlement calculated with AI justification

### 2. Claim Review
**Endpoint:** `GET /api/claims/{id}`

Officers see:
- Gemini's fraud explanation
- Risk score visualization
- Detected signals list
- Settlement justification

### 3. Analytics
**Endpoint:** `GET /api/admin/analytics/fraud-trends`

Aggregate Gemini insights:
- Average fraud scores
- Common fraud indicators
- Detection accuracy
- Trend analysis

## 🚀 Optimization Tips

### 1. Caching
```python
# Cache Gemini responses for identical claims
@lru_cache(maxsize=100)
def get_cached_analysis(claim_signature):
    ...
```

### 2. Batch Processing
```python
# Process multiple claims in one API call
async def batch_analyze_claims(claims: List[Claim]):
    ...
```

### 3. Rate Limiting
```python
# Respect API rate limits
from ratelimit import limits, sleep_and_retry

@sleep_and_retry
@limits(calls=60, period=60)
def call_gemini_api():
    ...
```

## 🧪 Testing

### Unit Tests
```python
def test_fraud_analysis_with_high_risk():
    # Mock Gemini response
    # Verify parsing
    # Check risk level mapping
```

### Integration Tests
```python
async def test_end_to_end_claim_submission():
    # Submit claim
    # Verify Gemini called
    # Check database updated
    # Validate response structure
```

## 📝 Best Practices Summary

✅ **DO:**
- Use environment variables for API keys
- Implement fallback logic
- Log API interactions
- Parse responses defensively
- Validate output structure
- Monitor API usage
- Handle rate limits gracefully

❌ **DON'T:**
- Auto-reject claims based solely on AI
- Skip human review for high-risk
- Expose API keys
- Trust responses blindly
- Ignore error handling
- Exceed rate limits
- Store API keys in code

## 🎓 Learning Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)
- [API Key Management](https://ai.google.dev/tutorials/setup)

## 📞 Support

For Gemini API issues:
- Check API status: https://status.cloud.google.com/
- Review error logs in backend terminal
- Verify API key validity
- Check rate limits

---

**Remember:** Gemini AI is a powerful tool that **assists** human decision-making. It should never replace human judgment in critical decisions like claim approval/rejection.
