// Main Application Controller & Router for StockSprint Pro

const App = {
  routes: {
    dashboard: DashboardView,
    markets: MarketsView,
    stock: StockDetailView,
    watchlist: WatchlistView,
    portfolio: PortfolioView,
    orders: OrdersView,
    funds: FundsView,
    'mutual-funds': MutualFundsView,
    ipos: IpoView,
    alerts: AlertsView,
    onboarding: OnboardingView,
    profile: ProfileView,
    support: SupportView,
    legal: LegalView,
    admin: AdminView
  },

  async init() {
    // 1. Initialize Theme
    Store.setTheme(Store.theme);

    // 2. Authenticate Demo Session if no token
    if (!Store.token) {
      try {
        const res = await api.post('/auth/demo');
        Store.setToken(res.token);
        Store.user = res.user;
      } catch (e) {
        console.warn('Demo login initialization error:', e);
      }
    } else {
      try {
        const me = await api.get('/auth/me');
        Store.user = me.user;
        Store.funds = me.funds;
      } catch (e) {
        // Fallback to demo
        const res = await api.post('/auth/demo').catch(() => ({}));
        if (res.token) {
          Store.setToken(res.token);
          Store.user = res.user;
        }
      }
    }

    // 3. Setup Hash Router
    window.addEventListener('hashchange', () => this.handleRoute());

    // 4. Initial Route
    this.handleRoute();

    // 5. Load Real-time Indices and Start SSE Stream
    this.initLiveTickStream();
  },

  handleRoute() {
    const hash = window.location.hash.slice(2) || 'dashboard';
    const parts = hash.split('/');
    const routeKey = parts[0];
    const param = parts[1];

    // Update active nav items
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
      const href = item.getAttribute('href') || '';
      if (href.includes(routeKey) || (routeKey === 'dashboard' && href.includes('dashboard'))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const container = document.getElementById('app-view-container');
    if (!container) return;

    // Route Handler
    const view = this.routes[routeKey] || DashboardView;
    if (routeKey === 'stock' && param) {
      StockDetailView.render(container, param);
    } else {
      view.render(container);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async initLiveTickStream() {
    // Load initial indices
    try {
      const indices = await api.get('/markets/indices');
      this.updateIndicesTicker(indices);
    } catch (e) {}

    // Connect to Server-Sent Events (SSE) stream for live Brownian ticks
    try {
      const evtSource = new EventSource('/api/stream/ticks');
      evtSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.indices) {
            this.updateIndicesTicker(data.indices);
          }
        } catch (err) {}
      };
    } catch (e) {
      console.warn('SSE not supported or disabled, using background polling.');
    }
  },

  updateIndicesTicker(indices = []) {
    const tickerContainer = document.getElementById('header-ticker-bar');
    if (!tickerContainer) return;

    tickerContainer.innerHTML = indices.map(idx => `
      <div class="ticker-item" onclick="window.location.hash='#/markets'">
        <span class="ticker-symbol">${idx.symbol}:</span>
        <span class="ticker-val">${formatNumber(idx.value)}</span>
        <span style="font-size: 11.5px; font-weight: 700;" class="${idx.percentChange >= 0 ? 'gain' : 'loss'}">
          ${formatPercent(idx.percentChange)}
        </span>
      </div>
    `).join('');
  }
};

// Global initializer
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

function appInit() {
  App.init();
}
