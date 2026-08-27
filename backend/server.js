const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const marketDataProvider = require('./providers/marketDataProvider');
const db = require('./models/db');

// Import Route Handlers
const authRoutes = require('./routes/auth');
const marketsRoutes = require('./routes/markets');
const stocksRoutes = require('./routes/stocks');
const watchlistsRoutes = require('./routes/watchlists');
const ordersRoutes = require('./routes/orders');
const portfolioRoutes = require('./routes/portfolio');
const fundsRoutes = require('./routes/funds');
const mutualFundsRoutes = require('./routes/mutualFunds');
const iposRoutes = require('./routes/ipos');
const alertsRoutes = require('./routes/alerts');
const notificationsRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');
const supportRoutes = require('./routes/support');
const adminRoutes = require('./routes/admin');
const legalRoutes = require('./routes/legal');

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter(200, 60000)); // 200 requests per minute

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: config.APP_NAME,
    version: config.APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Backward-compatible endpoints for old test suite
app.get('/api/state', (req, res) => {
  const user = db.findOne('users', u => u.isDemo === true) || db.getCollection('users')[0];
  const funds = db.findOne('funds', f => f.userId === user.id);
  const stocks = db.getCollection('securities');
  const wishlist = {};
  const userWls = db.find('watchlists', w => w.userId === user.id);
  for (const w of userWls) {
    wishlist[w.name] = w.symbols;
  }
  const holdings = db.find('holdings', h => h.userId === user.id);
  const orders = db.find('orders', o => o.userId === user.id);
  const notifications = db.find('notifications', n => n.userId === user.id);

  res.json({
    user: {
      name: user.name,
      email: user.email,
      tradingBalance: funds ? funds.availableCash : 500000,
      cash: funds ? funds.availableCash : 500000
    },
    stocks,
    wishlist,
    portfolio: {
      equity: holdings.reduce((acc, h) => acc + h.currentValue, 0),
      mutualFunds: 22000,
      mtfBorrowing: 0,
      investmentPicks: ['TCS', 'INFY', 'RELIANCE']
    },
    orders,
    notifications: notifications.map(n => ({ id: n.id, text: n.message, read: n.isRead }))
  });
});

app.get('/api/account', (req, res) => {
  const user = db.findOne('users', u => u.isDemo === true) || db.getCollection('users')[0];
  const funds = db.findOne('funds', f => f.userId === user.id);
  res.json({
    name: user.name,
    email: user.email,
    tradingBalance: funds ? funds.availableCash : 500000,
    cash: funds ? funds.availableCash : 500000
  });
});

app.get('/api/wishlist', (req, res) => {
  const user = db.findOne('users', u => u.isDemo === true) || db.getCollection('users')[0];
  const wishlist = {};
  const userWls = db.find('watchlists', w => w.userId === user.id);
  for (const w of userWls) {
    wishlist[w.name] = w.symbols;
  }
  res.json(wishlist);
});

app.post('/api/wishlist/folder', (req, res) => {
  const user = db.findOne('users', u => u.isDemo === true) || db.getCollection('users')[0];
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  db.insert('watchlists', {
    id: `wl_${Date.now()}`,
    userId: user.id,
    name,
    symbols: [],
    createdAt: new Date().toISOString()
  });
  const wishlist = {};
  const userWls = db.find('watchlists', w => w.userId === user.id);
  for (const w of userWls) wishlist[w.name] = w.symbols;
  res.json(wishlist);
});

app.post('/api/wishlist', (req, res) => {
  const user = db.findOne('users', u => u.isDemo === true) || db.getCollection('users')[0];
  const folder = req.body.folder || 'My Wishlist';
  const symbol = (req.body.symbol || '').toUpperCase();
  let wl = db.findOne('watchlists', w => w.userId === user.id && w.name === folder);
  if (!wl) {
    wl = { id: `wl_${Date.now()}`, userId: user.id, name: folder, symbols: [], createdAt: new Date().toISOString() };
    db.insert('watchlists', wl);
  }
  if (symbol && !wl.symbols.includes(symbol)) {
    wl.symbols.push(symbol);
    db.save();
  }
  const wishlist = {};
  const userWls = db.find('watchlists', w => w.userId === user.id);
  for (const w of userWls) wishlist[w.name] = w.symbols;
  res.json(wishlist);
});

// Mount Modern REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/watchlists', watchlistsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/mutual-funds', mutualFundsRoutes);
app.use('/api/ipos', iposRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/legal', legalRoutes);

const supabaseService = require('./services/supabaseService');

app.get('/api/supabase/status', async (req, res) => {
  const status = await supabaseService.getStatus();
  res.json(status);
});

// Server-Sent Events (SSE) for simulated real-time market stream
app.get('/api/stream/ticks', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const intervalId = setInterval(() => {
    marketDataProvider.simulatePriceTick();
    const indices = marketDataProvider.getBenchmarkIndices();
    const movers = marketDataProvider.getTopMovers();
    const data = JSON.stringify({
      timestamp: Date.now(),
      indices,
      topGainers: movers.gainers
    });
    res.write(`data: ${data}\n\n`);
  }, 3000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized error handler
app.use(errorHandler);

// Background Live Price Drift & Live Market Feed Sync
setInterval(() => {
  marketDataProvider.simulatePriceTick();
}, 4000);

// Live real-time market data sync from public exchange API every 60s
setInterval(() => {
  marketDataProvider.syncLiveMarketData().catch(() => {});
}, 60000);

const PORT = config.PORT;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 ${config.APP_NAME} running at http://localhost:${PORT}`);
    marketDataProvider.syncLiveMarketData().catch(() => {});
  });
}

module.exports = app;