const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const tradingEngine = require('../services/tradingEngine');
const calculations = require('../services/calculations');
const db = require('../models/db');

// GET /api/orders - Get user orders / orderbook
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  const statusFilter = req.query.status; // OPEN, FILLED, CANCELLED, REJECTED
  let orders = db.find('orders', o => o.userId === userId);

  if (statusFilter) {
    orders = orders.filter(o => o.status === statusFilter.toUpperCase());
  }

  // Sort by createdAt descending
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const openOrders = orders.filter(o => o.status === 'OPEN');
  const executedOrders = orders.filter(o => o.status === 'FILLED');
  const otherOrders = orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED');

  res.json({
    all: orders,
    open: openOrders,
    executed: executedOrders,
    cancelled: otherOrders
  });
});

// POST /api/orders - Place simulated trading order
router.post('/', requireAuth, (req, res) => {
  try {
    const { symbol, exchange, side, orderType, productType, quantity, price, triggerPrice } = req.body;
    const order = tradingEngine.placeOrder({
      userId: req.user.id,
      symbol,
      exchange: exchange || 'NSE',
      side: side || 'BUY',
      orderType: orderType || 'MARKET',
      productType: productType || 'CNC',
      quantity: parseInt(quantity, 10),
      price: parseFloat(price) || 0,
      triggerPrice: parseFloat(triggerPrice) || 0
    });

    res.status(201).json({
      success: true,
      message: `Simulated order ${order.id} placed successfully.`,
      order
    });
  } catch (err) {
    res.status(400).json({
      error: err.message || 'Failed to place order.'
    });
  }
});

// POST /api/orders/estimate - Pre-trade charges and margin estimator
router.post('/estimate', requireAuth, (req, res) => {
  try {
    const { symbol, side, orderType, productType, quantity, price } = req.body;
    const qty = parseInt(quantity, 10) || 1;
    const prc = parseFloat(price) || 0;
    const prodType = (productType || 'CNC').toUpperCase();
    const ordSide = (side || 'BUY').toUpperCase();

    const charges = calculations.calculateCharges(prodType, ordSide, prc, qty);
    const requiredMargin = calculations.calculateRequiredMargin(prodType, prc, qty);
    const userFunds = db.findOne('funds', f => f.userId === req.user.id);

    res.json({
      symbol,
      side: ordSide,
      productType: prodType,
      quantity: qty,
      price: prc,
      turnover: charges.turnover,
      requiredMargin,
      charges,
      availableFunds: userFunds ? userFunds.availableCash : 0,
      hasSufficientFunds: userFunds ? userFunds.availableCash >= (requiredMargin + charges.totalCharges) : false
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/orders/:id - Cancel open order
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const cancelled = tradingEngine.cancelOrder(req.user.id, req.params.id);
    res.json({
      success: true,
      message: `Order ${cancelled.id} cancelled successfully.`,
      order: cancelled
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
