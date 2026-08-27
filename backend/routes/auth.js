const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { generateToken, requireAuth } = require('../middleware/auth');
const logger = require('../services/logger');
const config = require('../config/config');

// POST /api/auth/demo - 1-Click Instant Demo Login (₹5,00,000 balance)
router.post('/demo', (req, res) => {
  let demoUser = db.findOne('users', u => u.isDemo === true);
  if (!demoUser) {
    db.resetToSeed();
    demoUser = db.findOne('users', u => u.isDemo === true);
  }

  const token = generateToken(demoUser);
  logger.logAudit({
    userId: demoUser.id,
    action: 'DEMO_LOGIN',
    details: 'User logged in via 1-click Demo Account'
  });

  res.json({
    token,
    user: {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      phone: demoUser.phone,
      role: demoUser.role,
      isDemo: true,
      kycStatus: demoUser.kycStatus
    }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please register or use Demo Login.' });
  }

  const token = generateToken(user);
  logger.logAudit({
    userId: user.id,
    action: 'USER_LOGIN',
    details: `User logged in: ${user.email}`
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isDemo: user.isDemo || false,
      kycStatus: user.kycStatus
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userId = `usr_${Date.now()}`;
  const newUser = {
    id: userId,
    email: email.toLowerCase(),
    name: name.trim(),
    phone: phone || '+91 98000 00000',
    role: 'USER',
    isDemo: false,
    kycStatus: 'PENDING',
    pan: '',
    dob: '',
    address: '',
    bankAccount: null,
    nominee: null,
    riskProfile: 'MODERATE',
    twoFactorEnabled: false,
    themePreference: 'dark',
    createdAt: new Date().toISOString()
  };

  db.insert('users', newUser);

  // Initialize funds for user (₹5,00,000 simulated funds)
  db.insert('funds', {
    userId,
    availableCash: config.DEFAULT_SIMULATED_FUNDS,
    usedMargin: 0,
    totalSimulatedCapital: config.DEFAULT_SIMULATED_FUNDS,
    withdrawableAmount: config.DEFAULT_SIMULATED_FUNDS,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    updatedAt: new Date().toISOString()
  });

  // Default watchlist
  db.insert('watchlists', {
    id: `wl_${Date.now()}`,
    userId,
    name: 'My Watchlist',
    symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'],
    createdAt: new Date().toISOString()
  });

  // Welcome notification
  db.insert('notifications', {
    id: `notif_${Date.now()}`,
    userId,
    title: 'Welcome to NexTrade Pro',
    message: `Account created successfully! You have received ₹${config.DEFAULT_SIMULATED_FUNDS.toLocaleString('en-IN')} in simulated trading capital. Complete your KYC to unlock all features.`,
    type: 'SYSTEM',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  const token = generateToken(newUser);
  logger.logAudit({
    userId,
    action: 'USER_REGISTERED',
    details: `New user registration: ${newUser.email}`
  });

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      isDemo: false,
      kycStatus: newUser.kycStatus
    }
  });
});

// POST /api/auth/otp/send & POST /api/auth/otp/verify (Mock Indian Phone OTP)
router.post('/otp/send', (req, res) => {
  const { phone } = req.body;
  res.json({
    success: true,
    message: `OTP sent to ${phone || 'mobile number'}. (Use demo code: 123456 in development).`,
    otpDemoHint: '123456'
  });
});

router.post('/otp/verify', (req, res) => {
  const { otp } = req.body;
  if (otp === '123456' || otp === '999999' || (otp && otp.length === 6)) {
    return res.json({ success: true, message: 'OTP verified successfully.' });
  }
  return res.status(400).json({ error: 'Invalid OTP code. Please enter 123456.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = req.user;
  const funds = db.findOne('funds', f => f.userId === user.id);
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isDemo: user.isDemo || false,
      kycStatus: user.kycStatus,
      themePreference: user.themePreference || 'dark',
      twoFactorEnabled: user.twoFactorEnabled || false
    },
    funds: funds || { availableCash: 0, usedMargin: 0 }
  });
});

module.exports = router;
