/**
 * Claims Routes
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, requireRole } = require('../middleware/auth');
const { analyzeClaim, detectFraud } = require('../services/gemini');

const db = admin.firestore();

/**
 * Get all claims (with filtering)
 * GET /claims
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, userId } = req.query;
    let query = db.collection('claims');
    
    // Apply role-based filtering
    if (req.userRole === 'policyholder') {
      // Policyholders can only see their own claims
      query = query.where('userId', '==', req.userId);
    } else if (userId && (req.userRole === 'admin' || req.userRole === 'claims_officer')) {
      // Officers and admins can filter by userId
      query = query.where('userId', '==', userId);
    }
    
    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Order by creation date
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    const claims = [];
    
    snapshot.forEach(doc => {
      claims.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ claims, count: claims.length });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch claims', status: 500 }
    });
  }
});

/**
 * Get single claim
 * GET /claims/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const claimDoc = await db.collection('claims').doc(req.params.id).get();
    
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: { message: 'Claim not found', status: 404 }
      });
    }
    
    const claim = claimDoc.data();
    
    // Check permissions
    if (req.userRole === 'policyholder' && claim.userId !== req.userId) {
      return res.status(403).json({
        error: { message: 'Forbidden', status: 403 }
      });
    }
    
    // Get timeline
    const timelineSnapshot = await claimDoc.ref.collection('timeline')
      .orderBy('timestamp', 'desc')
      .get();
    
    const timeline = [];
    timelineSnapshot.forEach(doc => {
      timeline.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      id: claimDoc.id,
      ...claim,
      timeline
    });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch claim', status: 500 }
    });
  }
});

/**
 * Create new claim
 * POST /claims
 */
router.post('/', verifyToken, requireRole('policyholder'), async (req, res) => {
  try {
    const {
      policyId,
      claimType,
      incidentDate,
      description,
      estimatedAmount,
      location,
      witnesses
    } = req.body;
    
    // Validate required fields
    if (!policyId || !claimType || !incidentDate || !description) {
      return res.status(400).json({
        error: { message: 'Missing required fields', status: 400 }
      });
    }
    
    // Verify policy exists and belongs to user
    const policyDoc = await db.collection('policies').doc(policyId).get();
    if (!policyDoc.exists) {
      return res.status(404).json({
        error: { message: 'Policy not found', status: 404 }
      });
    }
    
    const policy = policyDoc.data();
    if (policy.userId !== req.userId) {
      return res.status(403).json({
        error: { message: 'Policy does not belong to user', status: 403 }
      });
    }
    
    // Create claim
    const claimData = {
      userId: req.userId,
      policyId,
      claimType,
      incidentDate,
      description,
      estimatedAmount: estimatedAmount || 0,
      location: location || '',
      witnesses: witnesses || [],
      status: 'submitted',
      fraudRisk: 'pending',
      fraudScore: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const claimRef = await db.collection('claims').add(claimData);
    
    // Trigger AI analysis (async)
    analyzeClaim(claimRef.id, claimData).catch(err => {
      console.error('AI analysis failed:', err);
    });
    
    res.status(201).json({
      message: 'Claim created successfully',
      claimId: claimRef.id,
      claim: {
        id: claimRef.id,
        ...claimData
      }
    });
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({
      error: { message: 'Failed to create claim', status: 500 }
    });
  }
});

/**
 * Update claim
 * PUT /claims/:id
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const claimDoc = await db.collection('claims').doc(req.params.id).get();
    
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: { message: 'Claim not found', status: 404 }
      });
    }
    
    const claim = claimDoc.data();
    
    // Check permissions
    const canUpdate = 
      req.userRole === 'admin' ||
      req.userRole === 'claims_officer' ||
      (req.userRole === 'policyholder' && claim.userId === req.userId && claim.status === 'submitted');
    
    if (!canUpdate) {
      return res.status(403).json({
        error: { message: 'Forbidden', status: 403 }
      });
    }
    
    const { status, notes, settlementAmount, description, estimatedAmount } = req.body;
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Only officers/admins can update status and settlement
    if ((status || settlementAmount) && (req.userRole === 'admin' || req.userRole === 'claims_officer')) {
      if (status) updateData.status = status;
      if (settlementAmount !== undefined) updateData.settlementAmount = settlementAmount;
    }
    
    // Policyholders can update description in submitted status
    if (req.userRole === 'policyholder' && claim.status === 'submitted') {
      if (description) updateData.description = description;
      if (estimatedAmount !== undefined) updateData.estimatedAmount = estimatedAmount;
    }
    
    // Add notes if provided
    if (notes) {
      updateData.notes = admin.firestore.FieldValue.arrayUnion({
        text: notes,
        addedBy: req.userId,
        addedAt: new Date().toISOString()
      });
    }
    
    await claimDoc.ref.update(updateData);
    
    res.json({
      message: 'Claim updated successfully'
    });
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({
      error: { message: 'Failed to update claim', status: 500 }
    });
  }
});

/**
 * Delete claim
 * DELETE /claims/:id
 */
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const claimDoc = await db.collection('claims').doc(req.params.id).get();
    
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: { message: 'Claim not found', status: 404 }
      });
    }
    
    // Delete timeline subcollection
    const timelineSnapshot = await claimDoc.ref.collection('timeline').get();
    const batch = db.batch();
    timelineSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Delete claim
    await claimDoc.ref.delete();
    
    res.json({
      message: 'Claim deleted successfully'
    });
  } catch (error) {
    console.error('Delete claim error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete claim', status: 500 }
    });
  }
});

module.exports = router;
