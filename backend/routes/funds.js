const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../models/db');
const logger = require('../services/logger');

// GET /api/funds - User funds & margin overview
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  let funds = db.findOne('funds', f => f.userId === userId);
  if (!funds) {
    funds = {
      userId,
      availableCash: 500000.00,
      usedMargin: 0,
      totalSimulatedCapital: 500000.00,
      withdrawableAmount: 500000.00,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      updatedAt: new Date().toISOString()
    };
    db.insert('funds', funds);
  }

  res.json(funds);
});

// POST /api/funds/deposit - Add simulated funds (UPI, Netbanking, Cards)
router.post('/deposit', requireAuth, (req, res) => {
  const userId = req.user.id;
  const amount = parseFloat(req.body.amount);
  const paymentMethod = req.body.paymentMethod || 'UPI (Simulated)';

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid deposit amount greater than ₹0.' });
  }

  if (amount > 10000000) {
    return res.status(400).json({ error: 'Single simulated deposit limit is ₹1,00,00,000.' });
  }

  let funds = db.findOne('funds', f => f.userId === userId);
  if (!funds) {
    funds = {
      userId,
      availableCash: 0,
      usedMargin: 0,
      totalSimulatedCapital: 0,
      withdrawableAmount: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0
    };
    db.insert('funds', funds);
  }

  funds.availableCash = Math.round((funds.availableCash + amount) * 100) / 100;
  funds.totalSimulatedCapital = Math.round((funds.totalSimulatedCapital + amount) * 100) / 100;
  funds.withdrawableAmount = funds.availableCash;
  funds.updatedAt = new Date().toISOString();
  db.update('funds', f => f.userId === userId, funds);

  const txnId = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const txn = {
    id: txnId,
    userId,
    type: 'DEPOSIT',
    amount,
    status: 'SUCCESS',
    paymentMethod,
    referenceId: `SIM/DEP/${Date.now().toString().slice(-8)}`,
    description: `Added ₹${amount.toLocaleString('en-IN')} via ${paymentMethod}`,
    createdAt: new Date().toISOString()
  };
  db.insert('fundTransactions', txn);

  db.insert('notifications', {
    id: `notif_${Date.now()}`,
    userId,
    title: 'Funds Added Successfully',
    message: `₹${amount.toLocaleString('en-IN')} has been added to your simulated trading balance via ${paymentMethod}.`,
    type: 'FUNDS',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  logger.logAudit({
    userId,
    action: 'FUNDS_DEPOSITED',
    details: { amount, paymentMethod, txnId }
  });

  res.status(201).json({
    success: true,
    message: `₹${amount.toLocaleString('en-IN')} added to simulated funds.`,
    funds,
    transaction: txn
  });
});

// POST /api/funds/withdraw - Withdraw simulated funds
router.post('/withdraw', requireAuth, (req, res) => {
  const userId = req.user.id;
  const amount = parseFloat(req.body.amount);
  const bankDetails = req.body.bankDetails || 'Linked Bank Account';

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
  }

  const funds = db.findOne('funds', f => f.userId === userId);
  if (!funds || funds.availableCash < amount) {
    const avail = funds ? funds.availableCash : 0;
    return res.status(400).json({
      error: `Insufficient withdrawable funds. Available: ₹${avail.toLocaleString('en-IN')}, Requested: ₹${amount.toLocaleString('en-IN')}`
    });
  }

  funds.availableCash = Math.round((funds.availableCash - amount) * 100) / 100;
  funds.totalSimulatedCapital = Math.round((funds.totalSimulatedCapital - amount) * 100) / 100;
  funds.withdrawableAmount = funds.availableCash;
  funds.updatedAt = new Date().toISOString();
  db.update('funds', f => f.userId === userId, funds);

  const txnId = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const txn = {
    id: txnId,
    userId,
    type: 'WITHDRAWAL',
    amount,
    status: 'SUCCESS',
    paymentMethod: 'Bank Transfer (NEFT/IMPS)',
    referenceId: `SIM/WTH/${Date.now().toString().slice(-8)}`,
    description: `Withdrew ₹${amount.toLocaleString('en-IN')} to ${bankDetails}`,
    createdAt: new Date().toISOString()
  };
  db.insert('fundTransactions', txn);

  db.insert('notifications', {
    id: `notif_${Date.now()}`,
    userId,
    title: 'Withdrawal Processed',
    message: `₹${amount.toLocaleString('en-IN')} has been withdrawn to your verified bank account.`,
    type: 'FUNDS',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  logger.logAudit({
    userId,
    action: 'FUNDS_WITHDRAWN',
    details: { amount, txnId }
  });

  res.json({
    success: true,
    message: `₹${amount.toLocaleString('en-IN')} withdrawal processed successfully.`,
    funds,
    transaction: txn
  });
});

// GET /api/funds/transactions - Transaction ledger
router.get('/transactions', requireAuth, (req, res) => {
  const userId = req.user.id;
  const typeFilter = req.query.type; // DEPOSIT, WITHDRAWAL, BUY_TRADE, SELL_TRADE
  let txns = db.find('fundTransactions', t => t.userId === userId);

  if (typeFilter && typeFilter !== 'ALL') {
    txns = txns.filter(t => t.type === typeFilter);
  }

  txns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(txns);
});

module.exports = router;
