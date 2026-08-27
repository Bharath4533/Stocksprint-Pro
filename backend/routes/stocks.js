const express = require('express');
const router = express.Router();
const marketDataProvider = require('../providers/marketDataProvider');
const calculations = require('../services/calculations');
const db = require('../models/db');

// GET /api/stocks - List all stock securities
router.get('/', (req, res) => {
  const symbols = req.query.symbols ? req.query.symbols.split(',') : null;
  res.json(marketDataProvider.getQuotes(symbols));
});

// GET /api/stocks/:symbol - Detailed stock quote & fundamentals
router.get('/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const quote = marketDataProvider.getQuote(symbol);
  if (!quote) {
    return res.status(404).json({ error: `Stock security '${symbol}' not found.` });
  }

  // Related news
  const news = db.find('news', n => n.relatedSymbols && n.relatedSymbols.includes(symbol));

  res.json({
    ...quote,
    news: news || []
  });
});

// GET /api/stocks/:symbol/chart - Candlestick OHLCV data
router.get('/:symbol/chart', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const range = req.query.range || '1D'; // 1D, 1W, 1M, 3M, 6M, 1Y, 5Y
  const candles = marketDataProvider.getHistoricalCandles(symbol, range);
  res.json({
    symbol,
    range,
    candles
  });
});

// GET /api/stocks/:symbol/charges - Real-time charges estimator for order form
router.get('/:symbol/charges', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const quote = marketDataProvider.getQuote(symbol);
  const price = parseFloat(req.query.price) || (quote ? quote.price : 0);
  const quantity = parseInt(req.query.quantity, 10) || 1;
  const productType = (req.query.productType || 'CNC').toUpperCase();
  const side = (req.query.side || 'BUY').toUpperCase();

  const charges = calculations.calculateCharges(productType, side, price, quantity);
  const marginRequired = calculations.calculateRequiredMargin(productType, price, quantity);

  res.json({
    symbol,
    price,
    quantity,
    productType,
    side,
    marginRequired,
    ...charges
  });
});

module.exports = router;
