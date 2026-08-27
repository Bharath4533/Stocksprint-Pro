const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const marketDataProvider = require('../providers/marketDataProvider');
const db = require('../models/db');

// GET /api/alerts - List user's price alerts
router.get('/', requireAuth, (req, res) => {
  const alerts = db.find('alerts', a => a.userId === req.user.id);
  const populated = alerts.map(alt => {
    const sec = marketDataProvider.getQuote(alt.symbol);
    return {
      ...alt,
      currentPrice: sec ? sec.price : 0,
      companyName: sec ? sec.name : alt.symbol
    };
  });
  res.json(populated);
});

// POST /api/alerts - Create a new price alert
router.post('/', requireAuth, (req, res) => {
  const { symbol, condition, targetValue } = req.body;
  if (!symbol || !condition || !targetValue) {
    return res.status(400).json({ error: 'Symbol, condition (PRICE_ABOVE/PRICE_BELOW), and target value are required.' });
  }

  const sec = marketDataProvider.getQuote(symbol);
  if (!sec) {
    return res.status(404).json({ error: `Security '${symbol}' not found.` });
  }

  const newAlert = {
    id: `alt_${Date.now()}`,
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    condition: condition.toUpperCase(), // PRICE_ABOVE, PRICE_BELOW, PERCENT_MOVE
    targetValue: parseFloat(targetValue),
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  db.insert('alerts', newAlert);

  res.status(201).json({
    success: true,
    message: `Alert set for ${newAlert.symbol} when price is ${newAlert.condition.toLowerCase().replace('_', ' ')} ₹${newAlert.targetValue}.`,
    alert: newAlert
  });
});

// DELETE /api/alerts/:id - Delete an alert
router.delete('/:id', requireAuth, (req, res) => {
  const removed = db.remove('alerts', a => a.id === req.params.id && a.userId === req.user.id);
  if (!removed) {
    return res.status(404).json({ error: 'Alert not found.' });
  }
  res.json({ success: true, message: 'Alert removed.' });
});

module.exports = router;
