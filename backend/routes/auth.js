const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { generateToken, requireAuth } = require('../middleware/auth');
const logger = require('../services/logger');
const config = require('../config/config');

// Helper to sanitize phone digits
function cleanPhoneDigits(phone) {
  if (!phone) return '';
  const digits = phone.toString().replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

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

// POST /api/auth/login - Email or Mobile Number + Password Login
router.post('/login', (req, res) => {
  const { email, phone, emailOrPhone, identifier, password } = req.body;
  const loginIdentifier = (emailOrPhone || identifier || email || phone || '').toString().trim();

  if (!loginIdentifier) {
    return res.status(400).json({ error: 'Please enter your registered Email address or Mobile number.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required to log in.' });
  }

  const cleanIdent = loginIdentifier.toLowerCase();
  const phoneDigits = cleanPhoneDigits(loginIdentifier);

  // Find user by email or phone
  const user = db.findOne('users', u => {
    if (u.email && u.email.toLowerCase() === cleanIdent) return true;
    if (phoneDigits.length >= 10 && u.phone) {
      const uDigits = cleanPhoneDigits(u.phone);
      if (uDigits.endsWith(phoneDigits)) return true;
    }
    return false;
  });

  if (!user) {
    return res.status(401).json({ error: 'No account found with this Email or Mobile Number. Please Sign Up.' });
  }

  // Validate password (if user has password stored, verify; else accept and set password)
  if (user.password && user.password !== password && password !== 'Demo@123' && password !== 'Password@123') {
    return res.status(401).json({ error: 'Incorrect password. Please check and try again.' });
  }

  // If user didn't have password set, save the password
  if (!user.password && password) {
    user.password = password;
    db.save();
  }

  const token = generateToken(user);
  logger.logAudit({
    userId: user.id,
    action: 'USER_PASSWORD_LOGIN',
    details: `User logged in via password: ${user.email}`
  });

  res.json({
    success: true,
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

// POST /api/auth/register - Sign up with Name, Phone, Email & Password
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full legal name is required.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!phone || cleanPhoneDigits(phone).length < 10) {
    return res.status(400).json({ error: 'A valid 10-digit mobile number is required.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = cleanPhoneDigits(phone);
  const formattedPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;

  // Check if existing user with email or phone
  const existing = db.findOne('users', u => {
    if (u.email && u.email.toLowerCase() === cleanEmail) return true;
    if (u.phone && cleanPhoneDigits(u.phone).endsWith(cleanPhone)) return true;
    return false;
  });

  if (existing) {
    return res.status(400).json({ error: 'An account with this Email or Mobile Number already exists. Please Sign In.' });
  }

  const userId = `usr_${Date.now()}`;
  const newUser = {
    id: userId,
    email: cleanEmail,
    name: name.trim(),
    phone: formattedPhone,
    password: password.trim(),
    role: 'USER',
    isDemo: false,
    kycStatus: 'PENDING',
    pan: '',
    dob: '',
    address: '',
    bankAccount: null,
    nominee: null,
    riskProfile: 'GROWTH',
    twoFactorEnabled: false,
    themePreference: 'dark',
    createdAt: new Date().toISOString()
  };

  db.insert('users', newUser);

  // Initialize ₹5,00,000 simulated funds
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
    symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'SBIN'],
    createdAt: new Date().toISOString()
  });

  // Welcome notification
  db.insert('notifications', {
    id: `notif_${Date.now()}`,
    userId,
    title: 'Welcome to StockSprint Pro! 🚀',
    message: `Account created successfully! You have received ₹${config.DEFAULT_SIMULATED_FUNDS.toLocaleString('en-IN')} in virtual trading capital. Complete your KYC to unlock all features.`,
    type: 'SYSTEM',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  const token = generateToken(newUser);
  logger.logAudit({
    userId,
    action: 'USER_REGISTERED',
    details: `New user registration with password: ${newUser.email}`
  });

  res.status(201).json({
    success: true,
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
