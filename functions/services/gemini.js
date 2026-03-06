/**
 * Google Gemini AI Service
 * Provides AI-powered claim analysis, fraud detection, and settlement calculation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Analyze claim using Gemini AI
 */
async function analyzeClaim(claimId, claim) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
Analyze this insurance claim and provide insights:

Claim Type: ${claim.claimType}
Incident Date: ${claim.incidentDate}
Description: ${claim.description}
Estimated Amount: $${claim.estimatedAmount}
Location: ${claim.location || 'Not provided'}

Provide:
1. Summary of the claim
2. Key factors to consider
3. Potential concerns or red flags
4. Recommended next steps

Format as JSON with keys: summary, factors, concerns, nextSteps
`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse as JSON, fallback to plain text
    try {
      return JSON.parse(text);
    } catch {
      return {
        summary: text,
        factors: [],
        concerns: [],
        nextSteps: []
      };
    }
  } catch (error) {
    console.error('AI claim analysis error:', error);
    return {
      summary: 'AI analysis unavailable',
      factors: [],
      concerns: [],
      nextSteps: ['Manual review required']
    };
  }
}

/**
 * Detect fraud using Gemini AI
 */
async function detectFraud(claimId, claim) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
Analyze this insurance claim for potential fraud indicators:

Claim Type: ${claim.claimType}
Incident Date: ${claim.incidentDate}
Description: ${claim.description}
Estimated Amount: $${claim.estimatedAmount}
Location: ${claim.location || 'Not provided'}
Witnesses: ${claim.witnesses?.length || 0}

Analyze for:
1. Inconsistencies in the description
2. Unusually high claim amount
3. Timing concerns
4. Missing information
5. Common fraud patterns

Provide a fraud risk assessment as JSON:
{
  "risk": "low|medium|high|critical",
  "score": 0-100,
  "indicators": ["list of fraud indicators found"],
  "recommendations": ["list of recommended actions"]
}
`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse as JSON
    try {
      const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
      return {
        risk: analysis.risk || 'low',
        score: analysis.score || 0,
        indicators: analysis.indicators || [],
        recommendations: analysis.recommendations || []
      };
    } catch {
      // Fallback fraud detection based on simple rules
      const indicators = [];
      let score = 0;
      
      if (claim.estimatedAmount > 50000) {
        indicators.push('High claim amount');
        score += 30;
      }
      
      if (!claim.witnesses || claim.witnesses.length === 0) {
        indicators.push('No witnesses');
        score += 20;
      }
      
      if (!claim.location) {
        indicators.push('Missing location');
        score += 15;
      }
      
      const risk = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
      
      return {
        risk,
        score,
        indicators,
        recommendations: ['Manual review recommended']
      };
    }
  } catch (error) {
    console.error('Fraud detection error:', error);
    return {
      risk: 'pending',
      score: 0,
      indicators: ['AI analysis failed'],
      recommendations: ['Manual fraud review required']
    };
  }
}

/**
 * Calculate settlement using Gemini AI
 */
async function calculateSettlement(claim, policy) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
Calculate a fair settlement amount for this insurance claim:

Policy Information:
- Type: ${policy.policyType}
- Coverage Amount: $${policy.coverageAmount}
- Premium: $${policy.premium}

Claim Information:
- Type: ${claim.claimType}
- Estimated Amount: $${claim.estimatedAmount}
- Description: ${claim.description}
- Fraud Risk: ${claim.fraudRisk || 'pending'}
- Fraud Score: ${claim.fraudScore || 0}

Calculate settlement considering:
1. Policy coverage limits
2. Claim validity
3. Estimated damages
4. Fraud risk assessment
5. Industry standards

Provide settlement calculation as JSON:
{
  "amount": number,
  "breakdown": {
    "baseClaim": number,
    "deductible": number,
    "adjustments": number
  },
  "factors": ["list of factors considered"],
  "confidence": "low|medium|high"
}
`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const settlement = JSON.parse(text.replace(/```json|```/g, '').trim());
      return {
        amount: Math.min(settlement.amount || claim.estimatedAmount, policy.coverageAmount),
        breakdown: settlement.breakdown || {
          baseClaim: claim.estimatedAmount,
          deductible: 0,
          adjustments: 0
        },
        factors: settlement.factors || [],
        confidence: settlement.confidence || 'medium'
      };
    } catch {
      // Fallback calculation
      const maxCoverage = policy.coverageAmount;
      const claimAmount = claim.estimatedAmount;
      const fraudAdjustment = claim.fraudScore > 50 ? 0.7 : 1.0;
      
      const calculatedAmount = Math.min(claimAmount * fraudAdjustment, maxCoverage);
      
      return {
        amount: Math.round(calculatedAmount),
        breakdown: {
          baseClaim: claimAmount,
          deductible: 0,
          adjustments: claimAmount - calculatedAmount
        },
        factors: [
          'Policy coverage limit',
          'Fraud risk adjustment',
          'Standard calculation'
        ],
        confidence: 'medium'
      };
    }
  } catch (error) {
    console.error('Settlement calculation error:', error);
    
    // Safe fallback
    return {
      amount: Math.min(claim.estimatedAmount, policy.coverageAmount),
      breakdown: {
        baseClaim: claim.estimatedAmount,
        deductible: 0,
        adjustments: 0
      },
      factors: ['Automatic calculation'],
      confidence: 'low'
    };
  }
}

module.exports = {
  analyzeClaim,
  detectFraud,
  calculateSettlement
};
