const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../models/db');
const logger = require('../services/logger');

// GET /api/support/faqs - Frequently Asked Questions
router.get('/faqs', (req, res) => {
  const faqs = [
    {
      category: 'Paper Trading',
      question: 'What is simulated paper trading in NexTrade Pro?',
      answer: 'Paper trading allows you to practice investing and intraday trading in real-time Indian stock market scenarios using ₹5,00,000 in virtual funds without risking real capital.'
    },
    {
      category: 'Charges & STT',
      question: 'How are brokerage and regulatory charges calculated?',
      answer: 'Delivery orders have 0% brokerage with 0.1% STT on both buy and sell. Intraday orders incur 0.03% (capped at ₹20 per trade) brokerage and 0.025% STT on sell side only, plus exchange turnover, SEBI fees, and GST.'
    },
    {
      category: 'Order Types',
      question: 'What is the difference between CNC and MIS?',
      answer: 'CNC (Cash and Carry) is for Delivery trades held across multiple days (100% funds required). MIS (Margin Intraday Square-off) is for Intraday positions with 5x leverage that must be squared off before market close.'
    },
    {
      category: 'Mutual Funds & SIP',
      question: 'When do SIP installments get processed?',
      answer: 'SIP installments are automatically simulated and deducted from your trading cash balance on the specified monthly date.'
    }
  ];
  res.json(faqs);
});

// GET /api/support/tickets - User's support tickets
router.get('/tickets', requireAuth, (req, res) => {
  const tickets = db.find('supportTickets', t => t.userId === req.user.id);
  tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(tickets);
});

// POST /api/support/tickets - Submit new support ticket
router.post('/tickets', requireAuth, (req, res) => {
  const { subject, category, description } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required.' });
  }

  const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
  const newTicket = {
    id: ticketId,
    userId: req.user.id,
    subject: subject.trim(),
    category: category || 'General Inquiry',
    description: description.trim(),
    status: 'Open',
    createdAt: new Date().toISOString()
  };

  db.insert('supportTickets', newTicket);

  logger.logAudit({
    userId: req.user.id,
    action: 'SUPPORT_TICKET_CREATED',
    details: { ticketId, subject }
  });

  res.status(201).json({
    success: true,
    message: `Support ticket ${ticketId} created successfully. Our team will respond shortly.`,
    ticket: newTicket
  });
});

module.exports = router;
