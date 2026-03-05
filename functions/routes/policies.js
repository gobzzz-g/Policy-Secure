/**
 * Policies Routes
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, requireRole, requireOfficerOrAdmin } = require('../middleware/auth');

const db = admin.firestore();

/**
 * Get all policies
 * GET /policies
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = db.collection('policies');
    
    // Role-based filtering
    if (req.userRole === 'policyholder') {
      query = query.where('userId', '==', req.userId);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const policies = [];
    
    snapshot.forEach(doc => {
      policies.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ policies, count: policies.length });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch policies', status: 500 }
    });
  }
});

/**
 * Get single policy
 * GET /policies/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const policyDoc = await db.collection('policies').doc(req.params.id).get();
    
    if (!policyDoc.exists) {
      return res.status(404).json({
        error: { message: 'Policy not found', status: 404 }
      });
    }
    
    const policy = policyDoc.data();
    
    // Check permissions
    if (req.userRole === 'policyholder' && policy.userId !== req.userId) {
      return res.status(403).json({
        error: { message: 'Forbidden', status: 403 }
      });
    }
    
    res.json({
      id: policyDoc.id,
      ...policy
    });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch policy', status: 500 }
    });
  }
});

/**
 * Create new policy
 * POST /policies
 */
router.post('/', verifyToken, requireOfficerOrAdmin, async (req, res) => {
  try {
    const {
      userId,
      policyNumber,
      policyType,
      coverageAmount,
      premium,
      startDate,
      endDate,
      status = 'active'
    } = req.body;
    
    if (!userId || !policyNumber || !policyType || !coverageAmount || !premium) {
      return res.status(400).json({
        error: { message: 'Missing required fields', status: 400 }
      });
    }
    
    // Check if policy number already exists
    const existingPolicy = await db.collection('policies')
      .where('policyNumber', '==', policyNumber)
      .limit(1)
      .get();
    
    if (!existingPolicy.empty) {
      return res.status(409).json({
        error: { message: 'Policy number already exists', status: 409 }
      });
    }
    
    const policyData = {
      userId,
      policyNumber,
      policyType,
      coverageAmount,
      premium,
      startDate,
      endDate,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const policyRef = await db.collection('policies').add(policyData);
    
    res.status(201).json({
      message: 'Policy created successfully',
      policyId: policyRef.id,
      policy: {
        id: policyRef.id,
        ...policyData
      }
    });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({
      error: { message: 'Failed to create policy', status: 500 }
    });
  }
});

/**
 * Update policy
 * PUT /policies/:id
 */
router.put('/:id', verifyToken, requireOfficerOrAdmin, async (req, res) => {
  try {
    const policyDoc = await db.collection('policies').doc(req.params.id).get();
    
    if (!policyDoc.exists) {
      return res.status(404).json({
        error: { message: 'Policy not found', status: 404 }
      });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Remove fields that shouldn't be updated
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.policyNumber;
    
    await policyDoc.ref.update(updateData);
    
    res.json({
      message: 'Policy updated successfully'
    });
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({
      error: { message: 'Failed to update policy', status: 500 }
    });
  }
});

/**
 * Delete policy
 * DELETE /policies/:id
 */
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const policyDoc = await db.collection('policies').doc(req.params.id).get();
    
    if (!policyDoc.exists) {
      return res.status(404).json({
        error: { message: 'Policy not found', status: 404 }
      });
    }
    
    await policyDoc.ref.delete();
    
    res.json({
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete policy', status: 500 }
    });
  }
});

module.exports = router;
