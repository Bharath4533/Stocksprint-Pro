const express = require('express');
const router = express.Router();
const marketDataProvider = require('../providers/marketDataProvider');
const db = require('../models/db');

// GET /api/markets/status
router.get('/status', (req, res) => {
  res.json(marketDataProvider.getMarketStatus());
});

// GET /api/markets/indices
router.get('/indices', (req, res) => {
  res.json(marketDataProvider.getIndices());
});

// GET /api/markets/gainers
router.get('/gainers', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 6;
  res.json(marketDataProvider.getTopGainers(limit));
});

// GET /api/markets/losers
router.get('/losers', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 6;
  res.json(marketDataProvider.getTopLosers(limit));
});

// GET /api/markets/most-active
router.get('/most-active', (req, res) => {
  const by = req.query.by || 'volume'; // volume or value
  const limit = parseInt(req.query.limit, 10) || 6;
  if (by === 'value') {
    return res.json(marketDataProvider.getMostActiveByValue(limit));
  }
  res.json(marketDataProvider.getMostActiveByVolume(limit));
});

// GET /api/markets/sectors
router.get('/sectors', (req, res) => {
  const sector = req.query.sector;
  res.json(marketDataProvider.getBySector(sector));
});

// GET /api/markets/search
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  res.json(marketDataProvider.globalSearch(query));
});

// GET /api/markets/news
router.get('/news', (req, res) => {
  const news = db.getCollection('news');
  res.json(news);
});

module.exports = router;
