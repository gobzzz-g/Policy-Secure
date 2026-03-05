/**
 * Settlement Routes
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, requireOfficerOrAdmin } = require('../middleware/auth');
const { calculateSettlement } = require('../services/gemini');

const db = admin.firestore();

/**
 * Calculate settlement for a claim
 * POST /settlement/calculate/:claimId
 */
router.post('/calculate/:claimId', verifyToken, requireOfficerOrAdmin, async (req, res) => {
  try {
    const claimDoc = await db.collection('claims').doc(req.params.claimId).get();
    
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: { message: 'Claim not found', status: 404 }
      });
    }
    
    const claim = claimDoc.data();
    
    // Get policy details
    const policyDoc = await db.collection('policies').doc(claim.policyId).get();
    if (!policyDoc.exists) {
      return res.status(404).json({
        error: { message: 'Policy not found', status: 404 }
      });
    }
    
    const policy = policyDoc.data();
    
    // Calculate settlement using AI
    const settlement = await calculateSettlement(claim, policy);
    
    // Save settlement result
    const settlementRef = await db.collection('settlement_results').add({
      claimId: req.params.claimId,
      userId: claim.userId,
      policyId: claim.policyId,
      recommendedAmount: settlement.amount,
      breakdown: settlement.breakdown,
      factors: settlement.factors,
      aiConfidence: settlement.confidence,
      calculatedBy: req.userId,
      status: 'pending_approval',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update claim with settlement recommendation
    await claimDoc.ref.update({
      settlementAmount: settlement.amount,
      settlementCalculatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      message: 'Settlement calculated successfully',
      settlementId: settlementRef.id,
      settlement
    });
  } catch (error) {
    console.error('Settlement calculation error:', error);
    res.status(500).json({
      error: { message: 'Failed to calculate settlement', status: 500 }
    });
  }
});

/**
 * Get settlement results
 * GET /settlement/results
 */
router.get('/results', verifyToken, async (req, res) => {
  try {
    let query = db.collection('settlement_results');
    
    if (req.userRole === 'policyholder') {
      query = query.where('userId', '==', req.userId);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const results = [];
    
    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Get settlement results error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch settlement results', status: 500 }
    });
  }
});

/**
 * Approve/reject settlement
 * PUT /settlement/:id/approve
 */
router.put('/:id/approve', verifyToken, requireOfficerOrAdmin, async (req, res) => {
  try {
    const settlementDoc = await db.collection('settlement_results').doc(req.params.id).get();
    
    if (!settlementDoc.exists) {
      return res.status(404).json({
        error: { message: 'Settlement not found', status: 404 }
      });
    }
    
    const { approved, finalAmount, notes } = req.body;
    
    const updateData = {
      status: approved ? 'approved' : 'rejected',
      approvedBy: req.userId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (finalAmount !== undefined) {
      updateData.finalAmount = finalAmount;
    }
    
    if (notes) {
      updateData.approvalNotes = notes;
    }
    
    await settlementDoc.ref.update(updateData);
    
    // Update claim status
    const settlement = settlementDoc.data();
    if (approved) {
      await db.collection('claims').doc(settlement.claimId).update({
        status: 'approved',
        settlementAmount: finalAmount || settlement.recommendedAmount,
        approvedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      message: `Settlement ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Approve settlement error:', error);
    res.status(500).json({
      error: { message: 'Failed to process settlement approval', status: 500 }
    });
  }
});

module.exports = router;
