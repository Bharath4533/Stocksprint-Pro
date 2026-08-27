const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'nextrade_pro_secure_jwt_secret_key_2026',
  JWT_EXPIRY: '7d',
  DB_PATH: path.join(__dirname, '../data/db.json'),
  SEED_PATH: path.join(__dirname, '../data/seed.json'),
  CHARGES_PATH: path.join(__dirname, './charges.json'),
  MARKET: {
    TIMEZONE: 'Asia/Kolkata',
    OPEN_TIME: '09:15',
    CLOSE_TIME: '15:30',
    PRE_OPEN_START: '09:00',
    POST_CLOSE_END: '16:00',
    CURRENCY_SYMBOL: '₹',
    DEFAULT_CURRENCY: 'INR'
  },
  DEFAULT_SIMULATED_FUNDS: 500000,
  APP_NAME: 'StockSprint Pro',
  APP_VERSION: '2.0.0'
};
