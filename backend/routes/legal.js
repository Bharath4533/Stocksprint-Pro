const express = require('express');
const router = express.Router();
const calculations = require('../services/calculations');

// GET /api/legal/disclosures - Statutory Risk Disclosures & Disclaimers
router.get('/disclosures', (req, res) => {
  res.json({
    sebiRiskDisclosure: {
      title: "Risk Disclosures on Derivatives & Equity Trading",
      points: [
        "9 out of 10 individual traders in equity Futures and Options Segment incurred net losses.",
        "On an average, loss makers registered net trading loss close to ₹50,000.",
        "Over and above the net trading losses, loss makers expended an additional 28% of net trading losses as transaction costs.",
        "Those making net trading profits incurred between 15% to 50% of such profits as transaction costs."
      ],
      source: "SEBI Study on Individual Traders in Equity Derivatives"
    },
    paperTradingDisclaimer: {
      title: "Simulated / Paper Trading Disclaimer",
      content: "NexTrade Pro provides virtual / simulated trading for educational and analytical purposes. No real money or actual exchange orders are routed to NSE, BSE, or MCX. Past simulated performance does not guarantee future financial returns."
    },
    chargesSchedule: calculations.getChargesSchedule()
  });
});

// GET /api/legal/terms
router.get('/terms', (req, res) => {
  res.json({
    title: "Terms and Conditions of Use",
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing and using NexTrade Pro, you agree to comply with all platform guidelines, security protocols, and paper-trading terms."
      },
      {
        heading: "2. Virtual Capital & No Real Investment Advice",
        body: "The virtual funds (₹5,00,000) allocated to your demo profile have no real cash value and cannot be withdrawn into physical currency."
      },
      {
        heading: "3. Account Security & Privacy",
        body: "Users are responsible for safeguarding their login credentials and session keys."
      }
    ]
  });
});

module.exports = router;
