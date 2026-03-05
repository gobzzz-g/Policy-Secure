/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, requireOfficerOrAdmin } = require('../middleware/auth');

const db = admin.firestore();

/**
 * Get dashboard analytics
 * GET /analytics/dashboard
 */
router.get('/dashboard', verifyToken, requireOfficerOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get claims statistics
    const claimsSnapshot = await db.collection('claims').get();
    const claims = [];
    claimsSnapshot.forEach(doc => claims.push(doc.data()));
    
    // Calculate metrics
    const totalClaims = claims.length;
    const pendingClaims = claims.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
    const approvedClaims = claims.filter(c => c.status === 'approved').length;
    const rejectedClaims = claims.filter(c => c.status === 'rejected').length;
    
    // Fraud statistics
    const highRiskClaims = claims.filter(c => c.fraudRisk === 'high' || c.fraudRisk === 'critical').length;
    const avgFraudScore = claims.length > 0 
      ? claims.reduce((sum, c) => sum + (c.fraudScore || 0), 0) / claims.length 
      : 0;
    
    // Financial metrics
    const totalClaimAmount = claims.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
    const totalSettlementAmount = claims
      .filter(c => c.settlementAmount)
      .reduce((sum, c) => sum + c.settlementAmount, 0);
    
    // Claims by type
    const claimsByType = claims.reduce((acc, claim) => {
      acc[claim.claimType] = (acc[claim.claimType] || 0) + 1;
      return acc;
    }, {});
    
    // Claims by status
    const claimsByStatus = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      overview: {
        totalClaims,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalClaimAmount,
        totalSettlementAmount
      },
      fraud: {
        highRiskClaims,
        avgFraudScore: Math.round(avgFraudScore * 10) / 10,
        fraudPercentage: totalClaims > 0 ? Math.round((highRiskClaims / totalClaims) * 100) : 0
      },
      distribution: {
        byType: claimsByType,
        byStatus: claimsByStatus
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch analytics', status: 500 }
    });
  }
});

/**
 * Get claims trends
 * GET /analytics/trends
 */
router.get('/trends', verifyToken, requireOfficerOrAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    const snapshot = await db.collection('claims')
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt', 'asc')
      .get();
    
    const claims = [];
    snapshot.forEach(doc => {
      claims.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Group by day
    const trendData = claims.reduce((acc, claim) => {
      const date = claim.createdAt?.toDate?.()?.toISOString?.().split('T')[0] || 'unknown';
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          totalAmount: 0,
          highRisk: 0
        };
      }
      acc[date].count++;
      acc[date].totalAmount += claim.estimatedAmount || 0;
      if (claim.fraudRisk === 'high' || claim.fraudRisk === 'critical') {
        acc[date].highRisk++;
      }
      return acc;
    }, {});
    
    res.json({
      period,
      data: Object.values(trendData)
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch trends', status: 500 }
    });
  }
});

/**
 * Get user statistics
 * GET /analytics/users
 */
router.get('/users', verifyToken, requireOfficerOrAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.active).length,
      roleDistribution
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch user statistics', status: 500 }
    });
  }
});

module.exports = router;
