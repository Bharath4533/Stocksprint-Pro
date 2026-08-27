const db = require('../models/db');
const config = require('../config/config');

class MarketDataProvider {
  getMarketStatus() {
    const now = new Date();
    // Use IST timezone conversion
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    const day = ist.getDay(); // 0 = Sunday, 6 = Saturday

    if (day === 0 || day === 6) {
      return { status: 'CLOSED', message: 'Market Closed (Weekend)', nextOpen: 'Monday 09:15 AM IST' };
    }

    const hours = ist.getHours();
    const minutes = ist.getMinutes();
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (currentTime >= '09:00' && currentTime < '09:15') {
      return { status: 'PRE_OPEN', message: 'Pre-Open Session', nextOpen: '09:15 AM IST' };
    } else if (currentTime >= '09:15' && currentTime <= '15:30') {
      return { status: 'OPEN', message: 'Market Open', closeTime: '03:30 PM IST' };
    } else if (currentTime > '15:30' && currentTime <= '16:00') {
      return { status: 'POST_CLOSE', message: 'Post-Closing Session', nextOpen: 'Tomorrow 09:15 AM IST' };
    } else {
      return { status: 'CLOSED', message: 'Market Closed', nextOpen: 'Tomorrow 09:15 AM IST' };
    }
  }

  // Simulate realistic Brownian motion price drift
  simulatePriceTick() {
    const securities = db.getCollection('securities');
    for (const sec of securities) {
      // Small random drift between -0.3% and +0.3%
      const volatility = (sec.cap === 'Small Cap' ? 0.008 : sec.cap === 'Mid Cap' ? 0.005 : 0.003);
      const deltaPercent = (Math.random() - 0.495) * volatility;
      const rawPrice = sec.price * (1 + deltaPercent);
      sec.price = Math.round(rawPrice * 100) / 100;
      sec.change = Math.round((sec.price - sec.prevClose) * 100) / 100;
      sec.percentChange = Math.round(((sec.change / sec.prevClose) * 100) * 100) / 100;
      if (sec.price > sec.high) sec.high = sec.price;
      if (sec.price < sec.low) sec.low = sec.price;
      sec.volume += Math.floor(Math.random() * 200) + 10;
      sec.value = Math.round(sec.price * sec.volume);
    }

    const indices = db.getCollection('indices');
    for (const idx of indices) {
      const deltaPercent = (Math.random() - 0.495) * 0.0015;
      const rawVal = idx.value * (1 + deltaPercent);
      idx.value = Math.round(rawVal * 100) / 100;
      idx.change = Math.round((idx.value - idx.prevClose) * 100) / 100;
      idx.percentChange = Math.round(((idx.change / idx.prevClose) * 100) * 100) / 100;
      if (idx.value > idx.high) idx.high = idx.value;
      if (idx.value < idx.low) idx.low = idx.value;
    }

    db.save();
  }

  getIndices() {
    return db.getCollection('indices');
  }

  getQuotes(symbols) {
    const securities = db.getCollection('securities');
    if (!symbols || !symbols.length) return securities;
    const lookup = new Set(symbols.map(s => s.toUpperCase()));
    return securities.filter(s => lookup.has(s.symbol.toUpperCase()));
  }

  getQuote(symbol) {
    return db.findOne('securities', s => s.symbol.toUpperCase() === symbol.toUpperCase());
  }

  getTopGainers(limit = 6) {
    const securities = db.getCollection('securities');
    return [...securities]
      .filter(s => s.percentChange > 0)
      .sort((a, b) => b.percentChange - a.percentChange)
      .slice(0, limit);
  }

  getTopLosers(limit = 6) {
    const securities = db.getCollection('securities');
    return [...securities]
      .filter(s => s.percentChange < 0)
      .sort((a, b) => a.percentChange - b.percentChange)
      .slice(0, limit);
  }

  getMostActiveByVolume(limit = 6) {
    const securities = db.getCollection('securities');
    return [...securities]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  getMostActiveByValue(limit = 6) {
    const securities = db.getCollection('securities');
    return [...securities]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  getBySector(sector) {
    const securities = db.getCollection('securities');
    if (!sector || sector === 'All') return securities;
    return securities.filter(s => s.sector.toLowerCase().includes(sector.toLowerCase()));
  }

  // Generate realistic OHLCV Candlestick data for time ranges: 1D, 1W, 1M, 3M, 6M, 1Y, 5Y
  getHistoricalCandles(symbol, range = '1D') {
    const quote = this.getQuote(symbol);
    if (!quote) return [];

    const basePrice = quote.prevClose || quote.price;
    const candles = [];
    let numCandles = 75;
    let intervalMinutes = 5;
    let volatility = 0.003;

    switch (range.toUpperCase()) {
      case '1D':
        numCandles = 75; // 75 5-minute candles (09:15 to 15:30)
        intervalMinutes = 5;
        volatility = 0.0025;
        break;
      case '1W':
        numCandles = 50;
        intervalMinutes = 60;
        volatility = 0.006;
        break;
      case '1M':
        numCandles = 22; // 22 trading days
        intervalMinutes = 1440;
        volatility = 0.012;
        break;
      case '3M':
        numCandles = 65;
        intervalMinutes = 1440;
        volatility = 0.015;
        break;
      case '6M':
        numCandles = 130;
        intervalMinutes = 1440;
        volatility = 0.018;
        break;
      case '1Y':
        numCandles = 250;
        intervalMinutes = 1440;
        volatility = 0.022;
        break;
      case '5Y':
        numCandles = 260; // 260 weekly candles
        intervalMinutes = 10080;
        volatility = 0.035;
        break;
      default:
        numCandles = 75;
    }

    const now = Date.now();
    let current = basePrice * (1 - (numCandles * 0.001 * (quote.change >= 0 ? 1 : -1)));

    // Deterministic pseudo-random seed based on symbol characters for stable past candles
    let seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 42);
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < numCandles; i++) {
      const timestamp = now - ((numCandles - i) * intervalMinutes * 60 * 1000);
      const move = (pseudoRandom() - 0.48) * volatility * current;
      const open = Math.round(current * 100) / 100;
      const close = Math.round((current + move) * 100) / 100;
      const high = Math.round((Math.max(open, close) + Math.abs(pseudoRandom() * volatility * current)) * 100) / 100;
      const low = Math.round((Math.min(open, close) - Math.abs(pseudoRandom() * volatility * current)) * 100) / 100;
      const volume = Math.floor(pseudoRandom() * 50000) + 5000;

      candles.push({
        time: timestamp,
        open,
        high,
        low,
        close,
        volume
      });

      current = close;
    }

    // Force the last candle's close to match live quote price
    if (candles.length > 0) {
      candles[candles.length - 1].close = quote.price;
      if (candles[candles.length - 1].high < quote.price) candles[candles.length - 1].high = quote.price;
      if (candles[candles.length - 1].low > quote.price) candles[candles.length - 1].low = quote.price;
    }

    return candles;
  }

  // Unified global search across Stocks, Mutual Funds, IPOs, Indices
  globalSearch(query = '') {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        popular: this.getQuotes(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS']),
        recent: []
      };
    }

    const securities = db.getCollection('securities');
    const mutualFunds = db.getCollection('mutualFunds');
    const ipos = db.getCollection('ipos');
    const indices = db.getCollection('indices');

    const matchedStocks = securities.filter(s =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.isin && s.isin.toLowerCase().includes(q)) ||
      s.sector.toLowerCase().includes(q)
    ).map(s => ({ ...s, type: 'STOCK' }));

    const matchedMFs = mutualFunds.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    ).map(m => ({ ...m, type: 'MUTUAL_FUND', symbol: m.id }));

    const matchedIPOs = ipos.filter(i =>
      i.company.toLowerCase().includes(q) ||
      i.symbol.toLowerCase().includes(q)
    ).map(i => ({ ...i, type: 'IPO' }));

    const matchedIndices = indices.filter(i =>
      i.symbol.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q)
    ).map(i => ({ ...i, type: 'INDEX' }));

    return {
      stocks: matchedStocks,
      mutualFunds: matchedMFs,
      ipos: matchedIPOs,
      indices: matchedIndices,
      totalCount: matchedStocks.length + matchedMFs.length + matchedIPOs.length + matchedIndices.length
    };
  }
}

module.exports = new MarketDataProvider();
