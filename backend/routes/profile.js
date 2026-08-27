const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const kycProvider = require('../providers/kycProvider');
const logger = require('../services/logger');
const db = require('../models/db');

// GET /api/profile - Complete user profile with masked sensitive data
router.get('/', requireAuth, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Mask sensitive values for response
  const maskedPan = logger.maskSensitive(user.pan);
  const maskedBank = user.bankAccount ? {
    ...user.bankAccount,
    accountNumber: logger.maskSensitive(user.bankAccount.accountNumber)
  } : null;

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isDemo: user.isDemo || false,
    kycStatus: user.kycStatus || 'PENDING',
    pan: maskedPan,
    dob: user.dob,
    address: user.address,
    bankAccount: maskedBank,
    nominee: user.nominee,
    riskProfile: user.riskProfile || 'MODERATE',
    twoFactorEnabled: user.twoFactorEnabled || false,
    themePreference: user.themePreference || 'dark',
    createdAt: user.createdAt
  });
});

// PATCH /api/profile - Update personal preferences and settings
router.patch('/', requireAuth, (req, res) => {
  const { name, phone, address, riskProfile, themePreference, twoFactorEnabled } = req.body;
  const user = db.findOne('users', u => u.id === req.user.id);

  if (name) user.name = name.trim();
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (riskProfile) user.riskProfile = riskProfile;
  if (themePreference) user.themePreference = themePreference;
  if (typeof twoFactorEnabled === 'boolean') user.twoFactorEnabled = twoFactorEnabled;

  db.update('users', u => u.id === req.user.id, user);

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      riskProfile: user.riskProfile,
      themePreference: user.themePreference,
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
});

// POST /api/profile/kyc/verify-pan - Instant PAN verification
router.post('/kyc/verify-pan', requireAuth, (req, res) => {
  const { pan, fullName, dob } = req.body;
  const user = db.findOne('users', u => u.id === req.user.id);

  const verification = kycProvider.verifyPAN(pan, fullName || user.name, dob);
  if (!verification.success) {
    return res.status(400).json({ error: verification.message });
  }

  user.pan = verification.pan;
  if (dob) user.dob = dob;
  db.update('users', u => u.id === user.id, user);

  res.json({
    success: true,
    message: 'PAN verified successfully.',
    details: verification
  });
});

// POST /api/profile/kyc/verify-bank - Penny Drop Bank Account Verification
router.post('/kyc/verify-bank', requireAuth, (req, res) => {
  const { accountNumber, ifsc, bankName } = req.body;
  const user = db.findOne('users', u => u.id === req.user.id);

  const verification = kycProvider.verifyBankAccount(accountNumber, ifsc);
  if (!verification.success) {
    return res.status(400).json({ error: verification.message });
  }

  user.bankAccount = {
    bankName: bankName || verification.bankName,
    accountNumber: accountNumber,
    ifsc: ifsc.toUpperCase(),
    accountType: 'Savings',
    isVerified: true
  };
  db.update('users', u => u.id === user.id, user);

  res.json({
    success: true,
    message: 'Bank account verified via penny drop.',
    bankAccount: {
      ...user.bankAccount,
      accountNumber: logger.maskSensitive(accountNumber)
    }
  });
});

// POST /api/profile/kyc/complete - Finalize KYC Onboarding
router.post('/kyc/complete', requireAuth, (req, res) => {
  const { nominee, address, riskProfile } = req.body;
  const user = db.findOne('users', u => u.id === req.user.id);

  if (nominee) user.nominee = nominee;
  if (address) user.address = address;
  if (riskProfile) user.riskProfile = riskProfile;
  user.kycStatus = 'VERIFIED';

  db.update('users', u => u.id === user.id, user);

  db.insert('notifications', {
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'KYC Verification Completed',
    message: 'Congratulations! Your KYC documents and bank details have been verified. You can now trade without restrictions.',
    type: 'SYSTEM',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  logger.logAudit({
    userId: user.id,
    action: 'KYC_COMPLETED',
    details: 'User completed 12-step KYC onboarding'
  });

  res.json({
    success: true,
    message: 'KYC verification complete! Your account is active.',
    kycStatus: 'VERIFIED'
  });
});

module.exports = router;
