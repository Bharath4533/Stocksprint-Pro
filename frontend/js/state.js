// Global State Management & Utilities for NexTrade Pro

class StateStore {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('nextrade_token') || null;
    this.theme = localStorage.getItem('nextrade_theme') || 'dark';
    this.funds = { availableCash: 500000, usedMargin: 0 };
    this.indices = [];
    this.stocks = [];
    this.watchlists = [];
    this.activeWatchlistId = null;
    this.portfolio = null;
    this.orders = { all: [], open: [], executed: [], cancelled: [] };
    this.unreadNotifs = 0;
    this.listeners = new Set();
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('nextrade_token', token);
    } else {
      localStorage.removeItem('nextrade_token');
    }
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('nextrade_theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    this.notify();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (e) {
        console.error('State listener error:', e);
      }
    }
  }
}

const Store = new StateStore();

// Formatting Helpers
const formatMoney = (amount) => {
  const n = Number(amount) || 0;
  return '₹' + n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatNumber = (num) => {
  const n = Number(num) || 0;
  return n.toLocaleString('en-IN');
};

const formatPercent = (pct) => {
  const n = Number(pct) || 0;
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
