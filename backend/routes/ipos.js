const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../models/db');
const logger = require('../services/logger');

// GET /api/ipos - List all IPOs with status filter (OPEN, UPCOMING, CLOSED, LISTED)
router.get('/', (req, res) => {
  const status = req.query.status;
  let ipos = db.getCollection('ipos');

  if (status && status !== 'ALL') {
    ipos = ipos.filter(i => i.status.toUpperCase() === status.toUpperCase());
  }

  res.json(ipos);
});

// GET /api/ipos/:id - IPO detail
router.get('/:id', (req, res) => {
  const ipo = db.findOne('ipos', i => i.id === req.params.id);
  if (!ipo) {
    return res.status(404).json({ error: 'IPO record not found.' });
  }
  res.json(ipo);
});

// GET /api/ipos/applications/me - Get user's submitted IPO applications
router.get('/applications/me', requireAuth, (req, res) => {
  const apps = db.find('ipoApplications', a => a.userId === req.user.id);
  res.json(apps);
});

// POST /api/ipos/:id/apply - Apply for IPO (Simulated ASBA / UPI mandate flow)
router.post('/:id/apply', requireAuth, (req, res) => {
  const { lots = 1, bidPrice, upiId } = req.body;
  const ipo = db.findOne('ipos', i => i.id === req.params.id || i.symbol === req.params.id || (i.symbol && req.params.id && i.symbol.toLowerCase() === req.params.id.toLowerCase()));

  if (!ipo) {
    return res.status(404).json({ error: 'IPO not found.' });
  }

  if (ipo.status !== 'OPEN') {
    return res.status(400).json({ error: `Cannot apply. IPO status is currently ${ipo.status}.` });
  }

  if (!upiId || !upiId.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid UPI ID for simulated mandate.' });
  }

  const numLots = parseInt(lots, 10) || 1;
  const totalShares = numLots * (ipo.lotSize || 10);
  const bandUpper = (ipo.priceBand || '₹100 - ₹500').split('-')[1] || '500';
  const price = parseFloat(bidPrice) || parseFloat(bandUpper.replace(/[^0-9.]/g, '')) || 100;
  const amountBlocked = Math.round(totalShares * price * 100) / 100;

  let userFunds = db.findOne('funds', f => f.userId === req.user.id);
  if (!userFunds) {
    userFunds = {
      userId: req.user.id,
      availableCash: 500000,
      usedMargin: 0,
      withdrawableAmount: 500000,
      totalDeposited: 500000,
      totalWithdrawn: 0
    };
    db.insert('funds', userFunds);
  }
  if (userFunds.availableCash < amountBlocked) {
    return res.status(400).json({
      error: `Insufficient simulated funds for IPO application. Required: ₹${amountBlocked.toLocaleString('en-IN')}`
    });
  }

  // Block funds for IPO application
  userFunds.availableCash = Math.round((userFunds.availableCash - amountBlocked) * 100) / 100;
  userFunds.usedMargin = Math.round((userFunds.usedMargin + amountBlocked) * 100) / 100;
  db.update('funds', f => f.userId === req.user.id, userFunds);

  const appId = `ipo_app_${Date.now()}`;
  const app = {
    id: appId,
    userId: req.user.id,
    ipoId: ipo.id,
    company: ipo.company,
    lots: numLots,
    shares: totalShares,
    bidPrice: price,
    amountBlocked,
    upiId,
    status: 'Submitted',
    appliedAt: new Date().toISOString()
  };

  db.insert('ipoApplications', app);

  db.insert('fundTransactions', {
    id: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: req.user.id,
    type: 'IPO_APPLICATION',
    amount: amountBlocked,
    status: 'SUCCESS',
    paymentMethod: `UPI Mandate (${upiId})`,
    referenceId: appId,
    description: `Applied for ${numLots} lot(s) (${totalShares} shares) in ${ipo.company} IPO`,
    createdAt: new Date().toISOString()
  });

  db.insert('notifications', {
    id: `notif_${Date.now()}`,
    userId: req.user.id,
    title: 'IPO Application Submitted',
    message: `Application for ${ipo.company} (${numLots} lot) has been placed. Amount blocked: ₹${amountBlocked.toLocaleString('en-IN')}.`,
    type: 'IPO',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  logger.logAudit({
    userId: req.user.id,
    action: 'IPO_APPLIED',
    details: { appId, ipo: ipo.company, lots: numLots, amountBlocked }
  });

  res.status(201).json({
    success: true,
    message: `Successfully applied for ${ipo.company} IPO!`,
    application: app
  });
});

module.exports = router;
