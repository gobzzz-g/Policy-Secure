/**
 * Fraud Detection Routes
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, requireInvestigatorAccess } = require('../middleware/auth');
const { detectFraud } = require('../services/gemini');

const db = admin.firestore();

/**
 * Get fraud reports
 * GET /fraud/reports
 */
router.get('/reports', verifyToken, requireInvestigatorAccess, async (req, res) => {
  try {
    const snapshot = await db.collection('fraud_reports')
      .orderBy('createdAt', 'desc')
      .get();
    
    const reports = [];
    snapshot.forEach(doc => {
      reports.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ reports, count: reports.length });
  } catch (error) {
    console.error('Get fraud reports error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch fraud reports', status: 500 }
    });
  }
});

/**
 * Analyze claim for fraud
 * POST /fraud/analyze/:claimId
 */
router.post('/analyze/:claimId', verifyToken, requireInvestigatorAccess, async (req, res) => {
  try {
    const claimDoc = await db.collection('claims').doc(req.params.claimId).get();
    
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: { message: 'Claim not found', status: 404 }
      });
    }
    
    const claim = claimDoc.data();
    
    // Run fraud detection
    const fraudAnalysis = await detectFraud(req.params.claimId, claim);
    
    // Update claim with fraud analysis
    await claimDoc.ref.update({
      fraudRisk: fraudAnalysis.risk,
      fraudScore: fraudAnalysis.score,
      fraudIndicators: fraudAnalysis.indicators,
      fraudAnalyzedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create fraud report if high risk
    if (fraudAnalysis.risk === 'high' || fraudAnalysis.risk === 'critical') {
      await db.collection('fraud_reports').add({
        claimId: req.params.claimId,
        userId: claim.userId,
        riskLevel: fraudAnalysis.risk,
        fraudScore: fraudAnalysis.score,
        indicators: fraudAnalysis.indicators,
        recommendations: fraudAnalysis.recommendations,
        analyzedBy: req.userId,
        status: 'pending_review',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      message: 'Fraud analysis completed',
      analysis: fraudAnalysis
    });
  } catch (error) {
    console.error('Fraud analysis error:', error);
    res.status(500).json({
      error: { message: 'Failed to analyze claim for fraud', status: 500 }
    });
  }
});

/**
 * Update fraud report status
 * PUT /fraud/reports/:id
 */
router.put('/reports/:id', verifyToken, requireInvestigatorAccess, async (req, res) => {
  try {
    const reportDoc = await db.collection('fraud_reports').doc(req.params.id).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({
        error: { message: 'Fraud report not found', status: 404 }
      });
    }
    
    const { status, notes, action } = req.body;
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.userId
    };
    
    if (status) updateData.status = status;
    if (action) updateData.action = action;
    if (notes) {
      updateData.notes = admin.firestore.FieldValue.arrayUnion({
        text: notes,
        addedBy: req.userId,
        addedAt: new Date().toISOString()
      });
    }
    
    await reportDoc.ref.update(updateData);
    
    res.json({
      message: 'Fraud report updated successfully'
    });
  } catch (error) {
    console.error('Update fraud report error:', error);
    res.status(500).json({
      error: { message: 'Failed to update fraud report', status: 500 }
    });
  }
});

module.exports = router;
