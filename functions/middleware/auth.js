/**
 * Authentication Middleware
 */

const admin = require('firebase-admin');

/**
 * Verify Firebase ID token
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: 'Unauthorized - No token provided', status: 401 }
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      req.userId = decodedToken.uid;
      
      // Fetch user role from Firestore
      const userDoc = await admin.firestore().collection('users').doc(req.userId).get();
      if (userDoc.exists) {
        req.userRole = userDoc.data().role;
      }
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({
        error: { message: 'Invalid token', status: 401 }
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: { message: 'Authentication error', status: 500 }
    });
  }
}

/**
 * Check if user has required role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        error: { message: 'Forbidden - Role not found', status: 403 }
      });
    }
    
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: { 
          message: `Forbidden - Requires one of: ${roles.join(', ')}`, 
          status: 403 
        }
      });
    }
    
    next();
  };
}

/**
 * Check if user is admin
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Check if user is officer or admin
 */
function requireOfficerOrAdmin(req, res, next) {
  return requireRole('admin', 'claims_officer')(req, res, next);
}

/**
 * Check if user is investigator, officer, or admin
 */
function requireInvestigatorAccess(req, res, next) {
  return requireRole('admin', 'claims_officer', 'fraud_investigator')(req, res, next);
}

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireOfficerOrAdmin,
  requireInvestigatorAccess
};
