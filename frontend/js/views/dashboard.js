// Dashboard View for NexTrade Pro

const DashboardView = {
  async render(container) {
    container.innerHTML = `
      <!-- Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <span class="badge badge-simulated" style="margin-bottom: 8px;">PAPER TRADING MODE • ₹5,00,000 SIMULATED CAPITAL</span>
          <h1>Trade Indian Markets with Zero Financial Risk</h1>
          <p>Practice real-time execution across NSE/BSE equities, track multi-asset portfolios, analyze candlestick charts, and build your investment strategy.</p>
          <div style="display: flex; gap: 10px; margin-top: 18px;">
            <button class="btn btn-primary" onclick="SearchModal.open()">🔍 Search Securities (Cmd+K)</button>
            <button class="btn btn-outline" style="border-color: rgba(255,255,255,0.3); color: #fff;" onclick="window.location.hash='#/onboarding'">📋 Complete KYC</button>
          </div>
        </div>
        <div class="hero-balance-box">
          <div class="hero-balance-label">Available Simulated Cash</div>
          <div class="hero-balance-val" id="dash-avail-cash">₹5,00,000.00</div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 13px; color: #94a3b8;">
            <span>Used Margin: <strong id="dash-used-margin" style="color: #fff;">₹0.00</strong></span>
            <span>Total: <strong id="dash-total-cap" style="color: #fff;">₹5,00,000.00</strong></span>
          </div>
        </div>
      </div>

      <!-- Quick Portfolio & Indices Grid -->
      <div class="grid-4" style="margin-bottom: 28px;" id="dash-metrics-grid">
        <div class="card" style="padding: 16px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Total Portfolio Value</div>
          <div id="dash-port-val" style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0;">₹5,00,000.00</div>
          <div style="font-size: 12px;" class="badge badge-gain">Simulated Wealth</div>
        </div>
        <div class="card" style="padding: 16px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Today's P&L</div>
          <div id="dash-today-pnl" style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0;" class="gain">+₹0.00</div>
          <div id="dash-today-pct" style="font-size: 12px; font-weight: 600;" class="gain">+0.00%</div>
        </div>
        <div class="card" style="padding: 16px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Overall Return</div>
          <div id="dash-overall-pnl" style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0;" class="gain">+₹0.00</div>
          <div id="dash-overall-pct" style="font-size: 12px; font-weight: 600;" class="gain">+0.00%</div>
        </div>
        <div class="card" style="padding: 16px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Active Holdings</div>
          <div id="dash-holdings-count" style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0;">3 Scrips</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Delivery Equities</div>
        </div>
      </div>

      <!-- Top Movers & Discover Columns -->
      <div class="grid-2" style="margin-bottom: 28px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🚀 Top Market Gainers</h3>
            <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#/markets'">View All →</button>
          </div>
          <div id="dash-gainers-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Injected dynamically -->
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🔻 Top Market Losers</h3>
            <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#/markets'">View All →</button>
          </div>
          <div id="dash-losers-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Injected dynamically -->
          </div>
        </div>
      </div>

      <!-- Most Active Securities & Market News -->
      <div class="grid-2" style="margin-bottom: 28px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">⚡ Most Active by Volume</h3>
            <span class="badge badge-neutral">NSE Live</span>
          </div>
          <div id="dash-active-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Injected dynamically -->
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📰 Financial Wire & News</h3>
            <span class="badge badge-simulated">Sample Wire</span>
          </div>
          <div id="dash-news-list" style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Injected dynamically -->
          </div>
        </div>
      </div>
    `;

    this.loadData();
  },

  async loadData() {
    try {
      const [funds, portfolio, gainers, losers, active, news] = await Promise.all([
        api.get('/funds').catch(() => ({ availableCash: 500000, usedMargin: 0, totalSimulatedCapital: 500000 })),
        api.get('/portfolio').catch(() => null),
        api.get('/markets/gainers?limit=4'),
        api.get('/markets/losers?limit=4'),
        api.get('/markets/most-active?limit=4'),
        api.get('/markets/news')
      ]);

      // Update Funds
      if (document.getElementById('dash-avail-cash')) {
        document.getElementById('dash-avail-cash').textContent = formatMoney(funds.availableCash);
        document.getElementById('dash-used-margin').textContent = formatMoney(funds.usedMargin);
        document.getElementById('dash-total-cap').textContent = formatMoney(funds.totalSimulatedCapital);
      }

      // Update Portfolio Metrics
      if (portfolio && portfolio.summary) {
        document.getElementById('dash-port-val').textContent = formatMoney(portfolio.summary.totalPortfolioValue);
        const todayPnL = document.getElementById('dash-today-pnl');
        todayPnL.textContent = (portfolio.summary.todayPnL >= 0 ? '+' : '') + formatMoney(portfolio.summary.todayPnL);
        todayPnL.className = portfolio.summary.todayPnL >= 0 ? 'gain' : 'loss';

        const overallPnL = document.getElementById('dash-overall-pnl');
        overallPnL.textContent = (portfolio.summary.overallPnL >= 0 ? '+' : '') + formatMoney(portfolio.summary.overallPnL);
        overallPnL.className = portfolio.summary.overallPnL >= 0 ? 'gain' : 'loss';

        document.getElementById('dash-holdings-count').textContent = `${portfolio.summary.holdingsCount} Scrips`;
      }

      // Render Gainers & Losers
      const renderStockRow = (s) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--bg-surface-subtle); cursor: pointer; transition: background 0.15s ease;"
             onclick="window.location.hash='#/stock/${s.symbol}'"
             onmouseover="this.style.background='var(--border-subtle)'"
             onmouseout="this.style.background='var(--bg-surface-subtle)'">
          <div>
            <strong style="font-size: 14.5px; color: var(--text-primary);">${s.symbol}</strong>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.sector}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-family: var(--font-mono); font-size: 14.5px;">${formatMoney(s.price)}</div>
            <span class="badge ${s.percentChange >= 0 ? 'badge-gain' : 'badge-loss'}">${formatPercent(s.percentChange)}</span>
          </div>
        </div>
      `;

      document.getElementById('dash-gainers-list').innerHTML = gainers.map(renderStockRow).join('');
      document.getElementById('dash-losers-list').innerHTML = losers.map(renderStockRow).join('');
      document.getElementById('dash-active-list').innerHTML = active.map(s => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--bg-surface-subtle); cursor: pointer;"
             onclick="window.location.hash='#/stock/${s.symbol}'">
          <div>
            <strong style="font-size: 14.5px;">${s.symbol}</strong>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.name}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-family: var(--font-mono);">${formatMoney(s.price)}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Vol: ${(s.volume / 100000).toFixed(1)}L</div>
          </div>
        </div>
      `).join('');

      // Render News
      document.getElementById('dash-news-list').innerHTML = news.slice(0, 3).map(n => `
        <div style="padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface-subtle);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span class="badge badge-neutral" style="font-size: 10px;">${n.category}</span>
            <span style="font-size: 11px; color: var(--text-tertiary);">${formatTime(n.timestamp)}</span>
          </div>
          <div style="font-weight: 700; font-size: 13.5px; margin-bottom: 4px; color: var(--text-primary);">${n.title}</div>
          <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">${n.summary}</p>
        </div>
      `).join('');

    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    }
  }
};
