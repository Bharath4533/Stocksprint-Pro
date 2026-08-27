const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const marketDataProvider = require('../providers/marketDataProvider');
const tradingEngine = require('../services/tradingEngine');
const calculations = require('../services/calculations');
const db = require('../models/db');

// GET /api/portfolio - Overall portfolio summary and metrics
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  const holdings = db.find('holdings', h => h.userId === userId);
  const positions = db.find('positions', p => p.userId === userId && p.status === 'OPEN');
  const userFunds = db.findOne('funds', f => f.userId === userId) || { availableCash: 0, usedMargin: 0 };
  const sips = db.find('sips', s => s.userId === userId);

  let totalInvested = 0;
  let currentStockValue = 0;
  let todayPnL = 0;

  // Calculate live mark-to-market for holdings
  const updatedHoldings = holdings.map(h => {
    const sec = marketDataProvider.getQuote(h.symbol);
    const livePrice = sec ? sec.price : h.currentPrice;
    const prevClose = sec ? sec.prevClose : livePrice;
    const invested = Math.round(h.quantity * h.averageBuyPrice * 100) / 100;
    const currentVal = Math.round(h.quantity * livePrice * 100) / 100;
    const pnl = Math.round((currentVal - invested) * 100) / 100;
    const pnlPercent = invested > 0 ? Math.round(((pnl / invested) * 100) * 100) / 100 : 0;
    const dayGain = Math.round(h.quantity * (livePrice - prevClose) * 100) / 100;

    totalInvested += invested;
    currentStockValue += currentVal;
    todayPnL += dayGain;

    return {
      ...h,
      currentPrice: livePrice,
      investedValue: invested,
      currentValue: currentVal,
      unrealizedPnL: pnl,
      unrealizedPnLPercent: pnlPercent,
      dayGain
    };
  });

  // Calculate positions P&L
  let positionsUnrealizedPnL = 0;
  const updatedPositions = positions.map(pos => {
    const sec = marketDataProvider.getQuote(pos.symbol);
    const livePrice = sec ? sec.price : pos.averagePrice;
    const pnl = pos.side === 'BUY'
      ? Math.round((livePrice - pos.averagePrice) * pos.quantity * 100) / 100
      : Math.round((pos.averagePrice - livePrice) * pos.quantity * 100) / 100;

    positionsUnrealizedPnL += pnl;
    todayPnL += pnl;

    return {
      ...pos,
      currentPrice: livePrice,
      unrealizedPnL: pnl
    };
  });

  // Mutual Fund values
  let mutualFundInvested = 0;
  let mutualFundCurrent = 0;
  for (const sip of sips) {
    mutualFundInvested += sip.totalInvested || 0;
    mutualFundCurrent += sip.currentValue || sip.totalInvested || 0;
  }

  const overallStockPnL = Math.round((currentStockValue - totalInvested) * 100) / 100;
  const overallPnLPercent = totalInvested > 0 ? Math.round(((overallStockPnL / totalInvested) * 100) * 100) / 100 : 0;
  const totalPortfolioValue = Math.round((currentStockValue + mutualFundCurrent + userFunds.availableCash) * 100) / 100;

  res.json({
    summary: {
      totalPortfolioValue,
      totalInvested: Math.round((totalInvested + mutualFundInvested) * 100) / 100,
      currentHoldingValue: currentStockValue,
      mutualFundValue: mutualFundCurrent,
      availableCash: userFunds.availableCash,
      usedMargin: userFunds.usedMargin,
      overallPnL: overallStockPnL,
      overallPnLPercent,
      todayPnL: Math.round(todayPnL * 100) / 100,
      holdingsCount: updatedHoldings.length,
      positionsCount: updatedPositions.length
    },
    holdings: updatedHoldings,
    positions: updatedPositions,
    allocation: {
      equity: currentStockValue,
      mutualFunds: mutualFundCurrent,
      cash: userFunds.availableCash
    }
  });
});

// GET /api/portfolio/holdings - Detailed holdings
router.get('/holdings', requireAuth, (req, res) => {
  const userId = req.user.id;
  const holdings = db.find('holdings', h => h.userId === userId);

  const updatedHoldings = holdings.map(h => {
    const sec = marketDataProvider.getQuote(h.symbol);
    const livePrice = sec ? sec.price : h.currentPrice;
    const invested = Math.round(h.quantity * h.averageBuyPrice * 100) / 100;
    const currentVal = Math.round(h.quantity * livePrice * 100) / 100;
    const pnl = Math.round((currentVal - invested) * 100) / 100;
    const pnlPercent = invested > 0 ? Math.round(((pnl / invested) * 100) * 100) / 100 : 0;

    return {
      ...h,
      companyName: sec ? sec.name : h.symbol,
      sector: sec ? sec.sector : 'General',
      currentPrice: livePrice,
      investedValue: invested,
      currentValue: currentVal,
      unrealizedPnL: pnl,
      unrealizedPnLPercent: pnlPercent
    };
  });

  res.json(updatedHoldings);
});

// GET /api/portfolio/positions - Detailed intraday positions
router.get('/positions', requireAuth, (req, res) => {
  const userId = req.user.id;
  const positions = db.find('positions', p => p.userId === userId);

  const updatedPositions = positions.map(pos => {
    const sec = marketDataProvider.getQuote(pos.symbol);
    const livePrice = sec ? sec.price : pos.averagePrice;
    let unPnL = 0;
    if (pos.status === 'OPEN') {
      unPnL = pos.side === 'BUY'
        ? Math.round((livePrice - pos.averagePrice) * pos.quantity * 100) / 100
        : Math.round((pos.averagePrice - livePrice) * pos.quantity * 100) / 100;
    }

    return {
      ...pos,
      companyName: sec ? sec.name : pos.symbol,
      currentPrice: livePrice,
      unrealizedPnL: unPnL
    };
  });

  res.json(updatedPositions);
});

// POST /api/portfolio/positions/:id/square-off - Square off an open intraday position
router.post('/positions/:id/square-off', requireAuth, (req, res) => {
  try {
    const squared = tradingEngine.squareOffPosition(req.user.id, req.params.id);
    res.json({
      success: true,
      message: `Position for ${squared.symbol} squared off successfully. Realized P&L: ₹${squared.realizedPnL}`,
      position: squared
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
