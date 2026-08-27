const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const db = require('../models/db');
const logger = require('../services/logger');

// Enforce ADMIN / SUPER_ADMIN role for all admin routes
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

// GET /api/admin/metrics - High level platform statistics
router.get('/metrics', (req, res) => {
  const users = db.getCollection('users');
  const orders = db.getCollection('orders');
  const securities = db.getCollection('securities');
  const ipos = db.getCollection('ipos');
  const fundTxns = db.getCollection('fundTransactions');

  let totalSimulatedVolume = 0;
  for (const o of orders) {
    if (o.status === 'FILLED') {
      totalSimulatedVolume += (o.price * o.quantity);
    }
  }

  res.json({
    totalUsers: users.length,
    activeOrders: orders.filter(o => o.status === 'OPEN').length,
    totalTradesExecuted: orders.filter(o => o.status === 'FILLED').length,
    totalVolumeTraded: Math.round(totalSimulatedVolume),
    totalSecurities: securities.length,
    activeIpos: ipos.filter(i => i.status === 'OPEN').length,
    systemStatus: 'HEALTHY',
    mockEngineStatus: 'ACTIVE',
    uptimeSeconds: process.uptime()
  });
});

// GET /api/admin/users - User management directory
router.get('/users', (req, res) => {
  const users = db.getCollection('users');
  const search = (req.query.q || '').toLowerCase();
  let filtered = users;

  if (search) {
    filtered = users.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.phone && u.phone.includes(search))
    );
  }

  const sanitized = filtered.map(u => {
    const funds = db.findOne('funds', f => f.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isDemo: u.isDemo || false,
      kycStatus: u.kycStatus,
      riskProfile: u.riskProfile,
      availableFunds: funds ? funds.availableCash : 0,
      createdAt: u.createdAt
    };
  });

  res.json(sanitized);
});

// GET /api/admin/orders - Global order oversight
router.get('/orders', (req, res) => {
  const orders = db.getCollection('orders');
  res.json(orders);
});

// POST /api/admin/securities - Add or update a security
router.post('/securities', (req, res) => {
  const { symbol, name, price, cap, sector, exchange = 'NSE' } = req.body;
  if (!symbol || !name || !price) {
    return res.status(400).json({ error: 'Symbol, name, and current price are required.' });
  }

  const existing = db.findOne('securities', s => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (existing) {
    existing.name = name;
    existing.price = parseFloat(price);
    if (cap) existing.cap = cap;
    if (sector) existing.sector = sector;
    db.save();
    return res.json({ success: true, message: `Security ${symbol} updated.`, security: existing });
  }

  const newSec = {
    symbol: symbol.toUpperCase(),
    name,
    isin: `INE${Math.random().toString(36).substr(2, 6).toUpperCase()}01`,
    exchange,
    price: parseFloat(price),
    change: 0,
    percentChange: 0,
    open: parseFloat(price),
    high: parseFloat(price),
    low: parseFloat(price),
    prevClose: parseFloat(price),
    volume: 100000,
    value: parseFloat(price) * 100000,
    cap: cap || 'Mid Cap',
    sector: sector || 'General',
    lotSize: 1,
    fundamentals: {
      marketCap: '₹10,000 Cr',
      pe: 25.0,
      pb: 3.5,
      eps: 15.0,
      roe: '15%',
      roce: '18%',
      divYield: '1.0%',
      debtToEquity: 0.1,
      high52: parseFloat(price) * 1.2,
      low52: parseFloat(price) * 0.8,
      faceValue: 10,
      bookValue: parseFloat(price) * 0.3
    }
  };

  db.insert('securities', newSec);

  logger.logAudit({
    userId: req.user.id,
    action: 'SECURITY_ADDED',
    details: { symbol: newSec.symbol, name: newSec.name }
  });

  res.status(201).json({ success: true, message: `Security ${newSec.symbol} added to market master.`, security: newSec });
});

// POST /api/admin/broadcast - Send broadcast notification to all users
router.post('/broadcast', (req, res) => {
  const { title, message, type = 'SYSTEM' } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const users = db.getCollection('users');
  let count = 0;
  for (const user of users) {
    db.insert('notifications', {
      id: `notif_${Date.now()}_${count}`,
      userId: user.id,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    count++;
  }

  logger.logAudit({
    userId: req.user.id,
    action: 'BROADCAST_SENT',
    details: { title, recipientCount: count }
  });

  res.json({ success: true, message: `Broadcast sent to ${count} users.` });
});

// GET /api/admin/audit-logs - System audit trail
router.get('/audit-logs', (req, res) => {
  const logs = db.getCollection('auditLogs');
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(logs.slice(0, 100));
});

module.exports = router;
