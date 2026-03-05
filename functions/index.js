/**
 * PolicySecure Firebase Cloud Functions
 * Main entry point for all API endpoints
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Import route modules
const authRoutes = require('./routes/auth');
const claimRoutes = require('./routes/claims');
const policyRoutes = require('./routes/policies');
const fraudRoutes = require('./routes/fraud');
const settlementRoutes = require('./routes/settlement');
const analyticsRoutes = require('./routes/analytics');

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'PolicySecure API',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/claims', claimRoutes);
app.use('/policies', policyRoutes);
app.use('/fraud', fraudRoutes);
app.use('/settlement', settlementRoutes);
app.use('/analytics', analyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404
    }
  });
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// Export Firebase Admin instances for use in other modules
exports.db = db;
exports.auth = auth;
exports.storage = storage;

// Firestore triggers
exports.onClaimCreated = functions.firestore
  .document('claims/{claimId}')
  .onCreate(async (snap, context) => {
    const claim = snap.data();
    const claimId = context.params.claimId;
    
    console.log(`New claim created: ${claimId}`);
    
    // Add initial timeline entry
    await snap.ref.collection('timeline').add({
      action: 'created',
      description: 'Claim submitted',
      status: claim.status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      user: claim.userId
    });
    
    // Trigger fraud detection (you can implement this as a separate function)
    // await triggerFraudDetection(claimId, claim);
    
    return null;
  });

exports.onClaimStatusChanged = functions.firestore
  .document('claims/{claimId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const claimId = context.params.claimId;
    
    if (before.status !== after.status) {
      console.log(`Claim ${claimId} status changed: ${before.status} -> ${after.status}`);
      
      // Add timeline entry
      await change.after.ref.collection('timeline').add({
        action: 'status_changed',
        description: `Status changed from ${before.status} to ${after.status}`,
        status: after.status,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        previousStatus: before.status
      });
      
      // Send notification (implement as needed)
      // await sendStatusChangeNotification(claimId, after.userId, after.status);
    }
    
    return null;
  });
