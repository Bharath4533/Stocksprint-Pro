const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const calculations = require('../services/calculations');
const db = require('../models/db');
const logger = require('../services/logger');

// GET /api/mutual-funds - List all mutual funds with category filter
router.get('/', (req, res) => {
  const category = req.query.category;
  let funds = db.getCollection('mutualFunds');

  if (category && category !== 'ALL') {
    funds = funds.filter(f => f.category.toLowerCase().includes(category.toLowerCase()));
  }

  res.json(funds);
});

// GET /api/mutual-funds/:id - Fund detail
router.get('/:id', (req, res) => {
  const fund = db.findOne('mutualFunds', f => f.id === req.params.id);
  if (!fund) {
    return res.status(404).json({ error: 'Mutual fund not found.' });
  }
  res.json(fund);
});

// POST /api/mutual-funds/calculator - Calculate SIP projections
router.post('/calculator', (req, res) => {
  const amount = parseFloat(req.body.amount) || 5000;
  const returnRate = parseFloat(req.body.returnRate) || 12;
  const years = parseInt(req.body.years, 10) || 10;

  const result = calculations.calculateSIPProjection(amount, returnRate, years);
  res.json(result);
});

// GET /api/mutual-funds/sips/me - Get user's active SIPs
router.get('/sips/me', requireAuth, (req, res) => {
  const sips = db.find('sips', s => s.userId === req.user.id);
  res.json(sips);
});

// POST /api/mutual-funds/sips - Start a new simulated SIP
router.post('/sips', requireAuth, (req, res) => {
  const { fundId, amount, frequency = 'Monthly', sipDate = 10 } = req.body;
  const amt = parseFloat(amount);

  if (!fundId || isNaN(amt) || amt < 500) {
    return res.status(400).json({ error: 'Valid mutual fund and minimum SIP amount of ₹500 required.' });
  }

  const fund = db.findOne('mutualFunds', f => f.id === fundId);
  if (!fund) {
    return res.status(404).json({ error: 'Mutual fund not found.' });
  }

  const userFunds = db.findOne('funds', f => f.userId === req.user.id);
  if (!userFunds || userFunds.availableCash < amt) {
    return res.status(400).json({ error: 'Insufficient simulated funds for first SIP installment.' });
  }

  // Deduct first installment
  userFunds.availableCash = Math.round((userFunds.availableCash - amt) * 100) / 100;
  db.update('funds', f => f.userId === req.user.id, userFunds);

  const sipId = `sip_${Date.now()}`;
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  nextDate.setDate(parseInt(sipDate, 10) || 10);

  const newSip = {
    id: sipId,
    userId: req.user.id,
    fundId: fund.id,
    fundName: fund.name,
    amount: amt,
    frequency,
    sipDate: parseInt(sipDate, 10) || 10,
    status: 'Active',
    installmentsPaid: 1,
    totalInvested: amt,
    currentValue: amt,
    nextDueDate: nextDate.toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  };

  db.insert('sips', newSip);

  db.insert('fundTransactions', {
    id: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: req.user.id,
    type: 'MUTUAL_FUND_SIP',
    amount: amt,
    status: 'SUCCESS',
    paymentMethod: 'Simulated Trading Balance',
    referenceId: sipId,
    description: `SIP Installment #1 for ${fund.name}`,
    createdAt: new Date().toISOString()
  });

  db.insert('notifications', {
    id: `notif_${Date.now()}`,
    userId: req.user.id,
    title: 'SIP Started Successfully',
    message: `Your monthly SIP of ₹${amt.toLocaleString('en-IN')} in ${fund.name} is now active.`,
    type: 'SIP',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  logger.logAudit({
    userId: req.user.id,
    action: 'SIP_CREATED',
    details: { sipId, fundName: fund.name, amount: amt }
  });

  res.status(201).json({
    success: true,
    message: `SIP for ${fund.name} started successfully.`,
    sip: newSip
  });
});

module.exports = router;
