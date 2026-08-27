const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');
const marketDataProvider = require('../providers/marketDataProvider');

// GET /api/watchlists - Get all watchlists for current user
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  let userWatchlists = db.find('watchlists', w => w.userId === userId);

  if (!userWatchlists || userWatchlists.length === 0) {
    // Seed default watchlist for user
    const defaultWl = {
      id: `wl_${Date.now()}`,
      userId,
      name: 'My Watchlist',
      symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'SUZLON'],
      createdAt: new Date().toISOString()
    };
    db.insert('watchlists', defaultWl);
    userWatchlists = [defaultWl];
  }

  // Populate stock details for each symbol in watchlists
  const populated = userWatchlists.map(wl => {
    const stocks = wl.symbols.map(s => marketDataProvider.getQuote(s)).filter(Boolean);
    return {
      ...wl,
      stocks
    };
  });

  res.json(populated);
});

// POST /api/watchlists - Create new watchlist folder
router.post('/', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Watchlist name is required.' });
  }

  const newWl = {
    id: `wl_${Date.now()}`,
    userId: req.user.id,
    name: name.trim(),
    symbols: [],
    createdAt: new Date().toISOString()
  };

  db.insert('watchlists', newWl);
  res.status(201).json({ ...newWl, stocks: [] });
});

// POST /api/watchlists/:id/symbols - Add symbol to watchlist
router.post('/:id/symbols', requireAuth, (req, res) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Stock symbol is required.' });
  }

  const wl = db.findOne('watchlists', w => w.id === req.params.id && w.userId === req.user.id);
  if (!wl) {
    return res.status(404).json({ error: 'Watchlist not found.' });
  }

  const cleanSym = symbol.toUpperCase();
  if (!wl.symbols.includes(cleanSym)) {
    wl.symbols.push(cleanSym);
    db.save();
  }

  const stocks = wl.symbols.map(s => marketDataProvider.getQuote(s)).filter(Boolean);
  res.json({ ...wl, stocks });
});

// DELETE /api/watchlists/:id/symbols/:symbol - Remove symbol from watchlist
router.delete('/:id/symbols/:symbol', requireAuth, (req, res) => {
  const cleanSym = req.params.symbol.toUpperCase();
  const wl = db.findOne('watchlists', w => w.id === req.params.id && w.userId === req.user.id);
  if (!wl) {
    return res.status(404).json({ error: 'Watchlist not found.' });
  }

  wl.symbols = wl.symbols.filter(s => s !== cleanSym);
  db.save();

  const stocks = wl.symbols.map(s => marketDataProvider.getQuote(s)).filter(Boolean);
  res.json({ ...wl, stocks });
});

// DELETE /api/watchlists/:id - Delete watchlist folder
router.delete('/:id', requireAuth, (req, res) => {
  const removed = db.remove('watchlists', w => w.id === req.params.id && w.userId === req.user.id);
  if (!removed) {
    return res.status(404).json({ error: 'Watchlist not found.' });
  }
  res.json({ success: true, message: 'Watchlist deleted.' });
});

module.exports = router;
