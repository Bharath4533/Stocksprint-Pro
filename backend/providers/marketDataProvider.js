// Live Market Data Provider & Indian Securities Engine for StockSprint Pro

const http = require('http');
const https = require('https');
const db = require('../models/db');
const config = require('../config/config');

class MarketDataProvider {
  constructor() {
    this.tickerMap = {
      'RELIANCE': 'RELIANCE.NS',
      'TCS': 'TCS.NS',
      'INFY': 'INFY.NS',
      'HDFCBANK': 'HDFCBANK.NS',
      'ICICIBANK': 'ICICIBANK.NS',
      'SBIN': 'SBIN.NS',
      'ITC': 'ITC.NS',
      'LT': 'LT.NS',
      'BHARTIARTL': 'BHARTIARTL.NS',
      'MARUTI': 'MARUTI.NS',
      'TATAMOTORS': 'TATAMOTORS.NS',
      'ZOMATO': 'ZOMATO.NS',
      'SUZLON': 'SUZLON.NS',
      'TRENT': 'TRENT.NS',
      'NIFTY 50': '^NSEI',
      'SENSEX': '^BSESN',
      'BANK NIFTY': '^NSEBANK',
      'NIFTY IT': '^CNXIT',
    };

    this.lastLiveFetch = 0;
  }

  getMarketStatus() {
    const now = new Date();
    // Convert to IST
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    const day = ist.getDay(); // 0 = Sun, 6 = Sat

    if (day === 0 || day === 6) {
      return { status: 'CLOSED', message: 'Market Closed (Weekend)', nextOpen: 'Monday 09:15 AM IST' };
    }

    const hours = ist.getHours();
    const minutes = ist.getMinutes();
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (currentTime >= '09:00' && currentTime < '09:15') {
      return { status: 'PRE_OPEN', message: 'Pre-Open Session', nextOpen: '09:15 AM IST' };
    } else if (currentTime >= '09:15' && currentTime <= '15:30') {
      return { status: 'OPEN', message: 'Live Trading Session Active', closeTime: '03:30 PM IST' };
    } else if (currentTime > '15:30' && currentTime <= '16:00') {
      return { status: 'POST_CLOSE', message: 'Post-Closing Session', nextOpen: 'Tomorrow 09:15 AM IST' };
    } else {
      return { status: 'CLOSED', message: 'Market Closed', nextOpen: 'Tomorrow 09:15 AM IST' };
    }
  }

  // Fetch Live Real Market Data from Public Market Data API
  async fetchLiveQuote(symbol) {
    const ticker = this.tickerMap[symbol] || `${symbol}.NS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;

    return new Promise((resolve) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        timeout: 4000,
      }, (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            const result = parsed.chart?.result?.[0];
            if (result && result.meta) {
              const meta = result.meta;
              const price = meta.regularMarketPrice || meta.chartPreviousClose;
              const prevClose = meta.chartPreviousClose || meta.previousClose || price;
              const change = Math.round((price - prevClose) * 100) / 100;
              const percentChange = Math.round(((change / prevClose) * 100) * 100) / 100;

              resolve({
                price: Math.round(price * 100) / 100,
                prevClose: Math.round(prevClose * 100) / 100,
                high: Math.round((meta.regularMarketDayHigh || price) * 100) / 100,
                low: Math.round((meta.regularMarketDayLow || price) * 100) / 100,
                volume: meta.regularMarketVolume || 0,
                change,
                percentChange,
                isLive: true,
              });
              return;
            }
          } catch (e) {}
          resolve(null);
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  // Refresh all live market quotes periodically
  async syncLiveMarketData() {
    const securities = db.getCollection('securities');
    for (const sec of securities.slice(0, 8)) {
      try {
        const live = await this.fetchLiveQuote(sec.symbol);
        if (live && live.price > 0) {
          sec.price = live.price;
          sec.prevClose = live.prevClose;
          sec.change = live.change;
          sec.percentChange = live.percentChange;
          if (live.high > sec.high) sec.high = live.high;
          if (live.low < sec.low) sec.low = live.low;
          if (live.volume > 0) sec.volume = live.volume;
        }
      } catch (e) {}
    }

    const indices = db.getCollection('indices');
    for (const idx of indices.slice(0, 3)) {
      try {
        const live = await this.fetchLiveQuote(idx.symbol);
        if (live && live.price > 0) {
          idx.value = live.price;
          idx.prevClose = live.prevClose;
          idx.change = live.change;
          idx.percentChange = live.percentChange;
        }
      } catch (e) {}
    }

    db.save();
  }

  // Continuous realistic price tick simulation with Brownian motion
  simulatePriceTick() {
    const securities = db.getCollection('securities');
    for (const sec of securities) {
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

  getQuote(symbol) {
    if (!symbol) return null;
    const cleanSym = symbol.toUpperCase().trim();
    return db.findOne('securities', s => s.symbol === cleanSym);
  }

  getAllSecurities() {
    return db.getCollection('securities');
  }

  getIndices() {
    return db.getCollection('indices');
  }

  getBenchmarkIndices() {
    return this.getIndices();
  }

  getQuotes(symbols = null) {
    if (!symbols) return db.getCollection('securities');
    const set = new Set(symbols.map(s => s.toUpperCase()));
    return db.getCollection('securities').filter(s => set.has(s.symbol));
  }

  getTopMovers() {
    const securities = [...db.getCollection('securities')];
    const sorted = securities.sort((a, b) => b.percentChange - a.percentChange);
    return {
      gainers: sorted.slice(0, 6),
      losers: sorted.slice(-6).reverse(),
    };
  }

  getTopGainers(limit = 6) {
    return this.getTopMovers().gainers.slice(0, limit);
  }

  getTopLosers(limit = 6) {
    return this.getTopMovers().losers.slice(0, limit);
  }

  getMostActiveByVolume(limit = 6) {
    const securities = [...db.getCollection('securities')];
    return securities.sort((a, b) => b.volume - a.volume).slice(0, limit);
  }

  getMostActiveByValue(limit = 6) {
    const securities = [...db.getCollection('securities')];
    return securities.sort((a, b) => b.value - a.value).slice(0, limit);
  }

  getBySector(sector) {
    if (!sector) return db.getCollection('securities');
    return db.find('securities', s => s.sector && s.sector.toLowerCase() === sector.toLowerCase());
  }

  // Generate historical OHLCV candles
  getHistoricalCandles(symbol, range = '1D') {
    const sec = this.getQuote(symbol);
    const basePrice = sec ? sec.price : 1000.0;
    const candles = [];
    const now = new Date();

    let count = 60;
    let intervalMinutes = 5;

    switch (range.toUpperCase()) {
      case '1D': count = 75; intervalMinutes = 5; break;
      case '1W': count = 35; intervalMinutes = 60; break;
      case '1M': count = 30; intervalMinutes = 1440; break;
      case '3M': count = 60; intervalMinutes = 1440; break;
      case '1Y': count = 52; intervalMinutes = 10080; break;
      case '5Y': count = 60; intervalMinutes = 43200; break;
      default: count = 75; intervalMinutes = 5;
    }

    let runningPrice = basePrice * (1 - (count * 0.0015));

    for (let i = count; i >= 0; i--) {
      const candleTime = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
      const drift = (Math.random() - 0.49) * 0.012;
      const open = Math.round(runningPrice * 100) / 100;
      const close = Math.round((open * (1 + drift)) * 100) / 100;
      const high = Math.round((Math.max(open, close) * (1 + Math.random() * 0.006)) * 100) / 100;
      const low = Math.round((Math.min(open, close) * (1 - Math.random() * 0.006)) * 100) / 100;
      const volume = Math.floor(Math.random() * 15000) + 1200;

      candles.push({
        time: candleTime.toISOString(),
        open,
        high,
        low,
        close,
        volume,
      });

      runningPrice = close;
    }

    return candles;
  }

  // Global search across Stocks, Mutual Funds, IPOs, and Indices
  search(query) {
    if (!query || query.trim() === '') return { results: [], totalCount: 0 };
    const q = query.toLowerCase().trim();

    const securities = db.getCollection('securities')
      .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.sector && s.sector.toLowerCase().includes(q)))
      .map(s => ({ type: 'STOCK', symbol: s.symbol, name: s.name, price: s.price, percentChange: s.percentChange, exchange: s.exchange }));

    const indices = db.getCollection('indices')
      .filter(i => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      .map(i => ({ type: 'INDEX', symbol: i.symbol, name: i.name, price: i.value, percentChange: i.percentChange }));

    const mutualFunds = db.getCollection('mutualFunds')
      .filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
      .map(m => ({ type: 'MUTUAL_FUND', id: m.id, name: m.name, category: m.category, nav: m.nav, returns3Y: m.returns3Y }));

    const ipos = db.getCollection('ipos')
      .filter(p => p.company.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q))
      .map(p => ({ type: 'IPO', id: p.id, company: p.company, symbol: p.symbol, status: p.status, priceBand: p.priceBand }));

    const results = [...indices, ...securities, ...mutualFunds, ...ipos];
    return { results, totalCount: results.length };
  }

  globalSearch(query) {
    return this.search(query);
  }
}

module.exports = new MarketDataProvider();
