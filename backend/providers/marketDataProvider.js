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

  // Generate historical OHLCV candles (works for both Stocks and Benchmark Indices)
  getHistoricalCandles(symbol, range = '1D') {
    let basePrice = 1000.0;
    const sec = this.getQuote(symbol);
    if (sec) {
      basePrice = sec.price;
    } else {
      const idx = this.getIndex(symbol);
      if (idx) basePrice = idx.value;
    }

    const candles = [];
    const now = new Date();

    let count = 60;
    let intervalMinutes = 5;

    switch (range.toUpperCase()) {
      case '1D': count = 75; intervalMinutes = 5; break;
      case '1W': count = 35; intervalMinutes = 60; break;
      case '1M': count = 30; intervalMinutes = 1440; break; // 30 daily candles for 1 Month
      case '3M': count = 60; intervalMinutes = 1440; break;
      case '1Y': count = 52; intervalMinutes = 10080; break;
      case '5Y': count = 60; intervalMinutes = 43200; break;
      default: count = 75; intervalMinutes = 5;
    }

    let runningPrice = basePrice * (1 - (count * 0.0012));

    for (let i = count; i >= 0; i--) {
      const candleTime = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
      const drift = (Math.random() - 0.485) * (range === '1M' ? 0.015 : 0.008);
      const open = Math.round(runningPrice * 100) / 100;
      const close = Math.round((open * (1 + drift)) * 100) / 100;
      const high = Math.round((Math.max(open, close) * (1 + Math.random() * 0.005)) * 100) / 100;
      const low = Math.round((Math.min(open, close) * (1 - Math.random() * 0.005)) * 100) / 100;
      const volume = Math.floor(Math.random() * 450000) + 50000;

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

  getIndex(symbol) {
    if (!symbol) return null;
    const s = symbol.toLowerCase().trim();
    return db.findOne('indices', i => i.symbol.toLowerCase() === s || i.name.toLowerCase() === s || i.symbol.toLowerCase().replace(/\s+/g, '') === s.replace(/\s+/g, ''));
  }

  getIndexDetails(symbol) {
    const idx = this.getIndex(symbol) || db.getCollection('indices')[0];
    const val = idx ? idx.value : 24825.40;
    const monthGainPts = Math.round(val * 0.034 * 100) / 100;
    const monthReturnPct = 3.42;

    const constituentsMap = {
      'NIFTY 50': [
        { name: 'HDFC Bank', symbol: 'HDFCBANK', weight: '11.4%', price: 1680.50, change: '+0.85%' },
        { name: 'Reliance Industries', symbol: 'RELIANCE', weight: '9.8%', price: 3012.40, change: '+1.15%' },
        { name: 'ICICI Bank', symbol: 'ICICIBANK', weight: '7.6%', price: 1220.10, change: '+0.42%' },
        { name: 'Infosys', symbol: 'INFY', weight: '6.1%', price: 1845.60, change: '+1.65%' },
        { name: 'Tata Consultancy Services', symbol: 'TCS', weight: '4.8%', price: 4230.15, change: '+1.22%' },
        { name: 'ITC Ltd', symbol: 'ITC', weight: '4.1%', price: 488.30, change: '-0.15%' },
        { name: 'Larsen & Toubro', symbol: 'LT', weight: '3.9%', price: 3620.00, change: '+0.78%' },
      ],
      'SENSEX': [
        { name: 'Reliance Industries', symbol: 'RELIANCE', weight: '11.8%', price: 3012.40, change: '+1.15%' },
        { name: 'HDFC Bank', symbol: 'HDFCBANK', weight: '10.9%', price: 1680.50, change: '+0.85%' },
        { name: 'ICICI Bank', symbol: 'ICICIBANK', weight: '8.4%', price: 1220.10, change: '+0.42%' },
        { name: 'Infosys', symbol: 'INFY', weight: '7.2%', price: 1845.60, change: '+1.65%' },
        { name: 'TCS', symbol: 'TCS', weight: '5.6%', price: 4230.15, change: '+1.22%' },
      ],
      'BANK NIFTY': [
        { name: 'HDFC Bank', symbol: 'HDFCBANK', weight: '28.2%', price: 1680.50, change: '+0.85%' },
        { name: 'ICICI Bank', symbol: 'ICICIBANK', weight: '23.4%', price: 1220.10, change: '+0.42%' },
        { name: 'State Bank of India', symbol: 'SBIN', weight: '11.5%', price: 825.60, change: '+0.95%' },
        { name: 'Axis Bank', symbol: 'AXISBANK', weight: '9.8%', price: 1190.20, change: '+0.30%' },
        { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK', weight: '8.7%', price: 1740.00, change: '-0.20%' },
      ],
      'NIFTY IT': [
        { name: 'Tata Consultancy Services', symbol: 'TCS', weight: '27.4%', price: 4230.15, change: '+1.22%' },
        { name: 'Infosys', symbol: 'INFY', weight: '25.8%', price: 1845.60, change: '+1.65%' },
        { name: 'HCL Technologies', symbol: 'HCLTECH', weight: '12.1%', price: 1710.40, change: '+1.80%' },
        { name: 'Wipro', symbol: 'WIPRO', weight: '9.2%', price: 540.20, change: '+0.65%' },
        { name: 'Tech Mahindra', symbol: 'TECHM', weight: '8.5%', price: 1530.00, change: '+1.10%' },
      ]
    };

    const key = idx ? idx.symbol : 'NIFTY 50';
    const constituents = constituentsMap[key] || constituentsMap['NIFTY 50'];

    return {
      ...idx,
      monthHigh: Math.round(val * 1.042 * 100) / 100,
      monthLow: Math.round(val * 0.965 * 100) / 100,
      monthGainPts,
      monthReturnPct,
      yearHigh: Math.round(val * 1.12 * 100) / 100,
      yearLow: Math.round(val * 0.82 * 100) / 100,
      peRatio: 22.8,
      pbRatio: 3.9,
      dividendYield: '1.24%',
      constituents
    };
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
