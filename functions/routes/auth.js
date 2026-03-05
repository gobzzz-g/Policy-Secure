/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth');

const db = admin.firestore();
const auth = admin.auth();

/**
 * Register new user
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, role = 'policyholder' } = req.body;
    
    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: { message: 'Email, password, and full name are required', status: 400 }
      });
    }
    
    // Only allow policyholder registration via public endpoint
    const allowedRole = role === 'admin' || role === 'claims_officer' || role === 'fraud_investigator' 
      ? 'policyholder' 
      : role;
    
    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: full_name,
      disabled: false
    });
    
    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      full_name,
      phone: phone || '',
      role: allowedRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    });
    
    // Set custom claims for role-based access
    await auth.setCustomUserClaims(userRecord.uid, { role: allowedRole });
    
    // Generate custom token
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        full_name,
        role: allowedRole
      },
      token: customToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: { 
        message: error.message || 'Failed to register user', 
        status: 500 
      }
    });
  }
});

/**
 * Login user
 * POST /auth/login
 * Note: Client should use Firebase Auth signInWithEmailAndPassword
 * This endpoint is for getting user data after authentication
 */
router.post('/login', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 }
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      message: 'Login successful',
      user: {
        uid: req.userId,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role,
        active: userData.active
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Login failed', status: 500 }
    });
  }
});

/**
 * Get current user
 * GET /auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 }
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      uid: req.userId,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone,
      role: userData.role,
      active: userData.active,
      createdAt: userData.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: { message: 'Failed to get user data', status: 500 }
    });
  }
});

/**
 * Update user profile
 * PUT /auth/profile
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    
    await db.collection('users').doc(req.userId).update(updateData);
    
    // Update Firebase Auth display name
    if (full_name) {
      await auth.updateUser(req.userId, { displayName: full_name });
    }
    
    res.json({
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: { message: 'Failed to update profile', status: 500 }
    });
  }
});

/**
 * Logout (client-side only, this just validates token is still valid)
 * POST /auth/logout
 */
router.post('/logout', verifyToken, (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

module.exports = router;
