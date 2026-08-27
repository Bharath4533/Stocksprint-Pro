// Comprehensive Portfolio & Holdings View for NexTrade Pro

const PortfolioView = {
  activeTab: 'holdings',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Portfolio & Holdings</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Real-time mark-to-market tracking across delivery holdings and intraday positions.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline btn-sm" onclick="PortfolioView.loadData()">🔄 Refresh Values</button>
          <button class="btn btn-primary btn-sm" onclick="SearchModal.open()">＋ Invest More</button>
        </div>
      </div>

      <!-- Portfolio Summary Cards -->
      <div class="grid-4" style="margin-bottom: 24px;">
        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Total Portfolio Value</div>
          <div id="port-total-val" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0;">₹0.00</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Invested: <strong id="port-invested-val">₹0.00</strong></div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Overall Profit & Loss</div>
          <div id="port-overall-pnl" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0;" class="gain">+₹0.00</div>
          <div id="port-overall-pct" style="font-size: 12px; font-weight: 700;" class="gain">+0.00%</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Today's P&L (1D Gain)</div>
          <div id="port-today-pnl" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0;" class="gain">+₹0.00</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Live Intraday Drift</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Available Simulated Cash</div>
          <div id="port-avail-cash" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: var(--brand-primary);">₹0.00</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Used Margin: <strong id="port-used-margin">₹0.00</strong></div>
        </div>
      </div>

      <!-- Navigation Tabs: Holdings vs Positions -->
      <div class="tabs-nav" id="portfolio-tabs">
        <button class="tab-btn active" onclick="PortfolioView.switchTab('holdings')">📦 Equity Holdings (<span id="port-holdings-count-badge">0</span>)</button>
        <button class="tab-btn" onclick="PortfolioView.switchTab('positions')">⚡ Intraday Positions (<span id="port-positions-count-badge">0</span>)</button>
        <button class="tab-btn" onclick="PortfolioView.switchTab('allocation')">📊 Asset Allocation</button>
      </div>

      <!-- Tab: Holdings -->
      <div id="port-tab-holdings" class="card" style="padding: 0; overflow: hidden;">
        <div class="data-table-wrapper" style="border: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Quantity</th>
                <th>Avg. Buy Price</th>
                <th>Current Price</th>
                <th>Invested Value</th>
                <th>Current Value</th>
                <th>Unrealized P&L</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="holdings-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Positions -->
      <div id="port-tab-positions" class="card" style="padding: 0; overflow: hidden; display: none;">
        <div class="data-table-wrapper" style="border: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Security</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Avg. Price</th>
                <th>Current Price</th>
                <th>Unrealized P&L</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="positions-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Asset Allocation -->
      <div id="port-tab-allocation" class="card" style="display: none; padding: 24px;">
        <h3 class="card-title" style="margin-bottom: 16px;">Simulated Capital Distribution</h3>
        <div id="allocation-bars" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Injected dynamically -->
        </div>
      </div>
    `;

    this.loadData();
  },

  async loadData() {
    try {
      const portfolio = await api.get('/portfolio');
      Store.portfolio = portfolio;

      const summary = portfolio.summary || {};
      document.getElementById('port-total-val').textContent = formatMoney(summary.totalPortfolioValue);
      document.getElementById('port-invested-val').textContent = formatMoney(summary.totalInvested);
      document.getElementById('port-avail-cash').textContent = formatMoney(summary.availableCash);
      document.getElementById('port-used-margin').textContent = formatMoney(summary.usedMargin);

      const overallPnL = document.getElementById('port-overall-pnl');
      overallPnL.textContent = (summary.overallPnL >= 0 ? '+' : '') + formatMoney(summary.overallPnL);
      overallPnL.className = summary.overallPnL >= 0 ? 'gain' : 'loss';

      const overallPct = document.getElementById('port-overall-pct');
      overallPct.textContent = (summary.overallPnLPercent >= 0 ? '+' : '') + formatPercent(summary.overallPnLPercent);
      overallPct.className = summary.overallPnLPercent >= 0 ? 'gain' : 'loss';

      const todayPnL = document.getElementById('port-today-pnl');
      todayPnL.textContent = (summary.todayPnL >= 0 ? '+' : '') + formatMoney(summary.todayPnL);
      todayPnL.className = summary.todayPnL >= 0 ? 'gain' : 'loss';

      document.getElementById('port-holdings-count-badge').textContent = portfolio.holdings ? portfolio.holdings.length : 0;
      document.getElementById('port-positions-count-badge').textContent = portfolio.positions ? portfolio.positions.length : 0;

      this.renderHoldings(portfolio.holdings || []);
      this.renderPositions(portfolio.positions || []);
      this.renderAllocation(portfolio.allocation || {}, summary.totalPortfolioValue || 1);
    } catch (err) {
      Toast.error('Failed to load portfolio.');
    }
  },

  renderHoldings(holdings) {
    const tbody = document.getElementById('holdings-table-body');
    if (!tbody) return;

    if (holdings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px;">
            <div class="empty-state">
              <div class="empty-state-icon">💼</div>
              <div class="empty-state-title">No holdings yet</div>
              <p class="empty-state-desc">Buy your first stock in Delivery mode to start building your simulated portfolio.</p>
              <button class="btn btn-primary btn-sm" onclick="SearchModal.open()">🔍 Discover Stocks</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = holdings.map(h => `
      <tr style="cursor: pointer;" onclick="window.location.hash='#/stock/${h.symbol}'">
        <td>
          <div style="font-weight: 700; font-size: 14.5px; color: var(--text-primary);">${h.symbol}</div>
          <div style="font-size: 12px; color: var(--text-tertiary);">${h.companyName || h.symbol}</div>
        </td>
        <td style="font-weight: 700; font-family: var(--font-mono);">${h.quantity} shares</td>
        <td style="font-family: var(--font-mono);">${formatMoney(h.averageBuyPrice)}</td>
        <td style="font-weight: 700; font-family: var(--font-mono);">${formatMoney(h.currentPrice)}</td>
        <td style="font-family: var(--font-mono);">${formatMoney(h.investedValue)}</td>
        <td style="font-weight: 800; font-family: var(--font-mono);">${formatMoney(h.currentValue)}</td>
        <td>
          <span class="badge ${h.unrealizedPnL >= 0 ? 'badge-gain' : 'badge-loss'}">
            ${h.unrealizedPnL >= 0 ? '+' : ''}${formatMoney(h.unrealizedPnL)} (${formatPercent(h.unrealizedPnLPercent)})
          </span>
        </td>
        <td style="text-align: right;" onclick="event.stopPropagation()">
          <div style="display: flex; justify-content: flex-end; gap: 6px;">
            <button class="btn btn-success btn-sm" onclick="OrderModal.open('${h.symbol}', 'BUY')">Buy More</button>
            <button class="btn btn-danger btn-sm" onclick="OrderModal.open('${h.symbol}', 'SELL')">Sell</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderPositions(positions) {
    const tbody = document.getElementById('positions-table-body');
    if (!tbody) return;

    if (positions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px;">
            <div class="empty-state">
              <div class="empty-state-icon">⚡</div>
              <div class="empty-state-title">No open intraday positions</div>
              <p class="empty-state-desc">Place an intraday MIS order to trade with 5x simulated leverage.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = positions.map(pos => `
      <tr>
        <td>
          <strong>${pos.symbol}</strong>
          <span class="badge badge-neutral" style="font-size: 10px; margin-left: 6px;">MIS</span>
        </td>
        <td><span class="badge ${pos.side === 'BUY' ? 'badge-gain' : 'badge-loss'}">${pos.side}</span></td>
        <td style="font-weight: 700; font-family: var(--font-mono);">${pos.quantity}</td>
        <td style="font-family: var(--font-mono);">${formatMoney(pos.averagePrice)}</td>
        <td style="font-weight: 700; font-family: var(--font-mono);">${formatMoney(pos.currentPrice)}</td>
        <td>
          <span class="badge ${(pos.unrealizedPnL || pos.realizedPnL) >= 0 ? 'badge-gain' : 'badge-loss'}">
            ${formatMoney(pos.status === 'OPEN' ? pos.unrealizedPnL : pos.realizedPnL)}
          </span>
        </td>
        <td>
          <span class="badge ${pos.status === 'OPEN' ? 'badge-gain' : 'badge-neutral'}">${pos.status}</span>
        </td>
        <td style="text-align: right;">
          ${pos.status === 'OPEN' ? `
            <button class="btn btn-danger btn-sm" onclick="PortfolioView.squareOff('${pos.id}', '${pos.symbol}')">Square Off</button>
          ` : `<span style="font-size: 12px; color: var(--text-tertiary);">Closed</span>`}
        </td>
      </tr>
    `).join('');
  },

  renderAllocation(allocation, total) {
    const container = document.getElementById('allocation-bars');
    if (!container) return;

    const equity = allocation.equity || 0;
    const mf = allocation.mutualFunds || 0;
    const cash = allocation.cash || 0;
    const grandTotal = equity + mf + cash || 1;

    const eqPct = ((equity / grandTotal) * 100).toFixed(1);
    const mfPct = ((mf / grandTotal) * 100).toFixed(1);
    const cashPct = ((cash / grandTotal) * 100).toFixed(1);

    container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 6px;">
          <span>📈 Equity Holdings</span>
          <span>${formatMoney(equity)} (${eqPct}%)</span>
        </div>
        <div style="height: 10px; background: var(--bg-surface-subtle); border-radius: 5px; overflow: hidden;">
          <div style="width: ${eqPct}%; height: 100%; background: #00d084; border-radius: 5px;"></div>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 6px;">
          <span>🌱 Mutual Funds & SIPs</span>
          <span>${formatMoney(mf)} (${mfPct}%)</span>
        </div>
        <div style="height: 10px; background: var(--bg-surface-subtle); border-radius: 5px; overflow: hidden;">
          <div style="width: ${mfPct}%; height: 100%; background: #3b82f6; border-radius: 5px;"></div>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 6px;">
          <span>💵 Available Trading Cash</span>
          <span>${formatMoney(cash)} (${cashPct}%)</span>
        </div>
        <div style="height: 10px; background: var(--bg-surface-subtle); border-radius: 5px; overflow: hidden;">
          <div style="width: ${cashPct}%; height: 100%; background: #f59e0b; border-radius: 5px;"></div>
        </div>
      </div>
    `;
  },

  squareOff(positionId, symbol) {
    Modal.confirm({
      title: `Square Off Position: ${symbol}`,
      message: `Are you sure you want to square off your open intraday position for <strong>${symbol}</strong> at the current market price?`,
      confirmText: 'Square Off Now',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await api.post(`/portfolio/positions/${positionId}/square-off`);
          Toast.success(res.message);
          this.loadData();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('#portfolio-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
    });
    ['holdings', 'positions', 'allocation'].forEach(t => {
      const el = document.getElementById(`port-tab-${t}`);
      if (el) el.style.display = t === tab ? 'block' : 'none';
    });
  }
};
