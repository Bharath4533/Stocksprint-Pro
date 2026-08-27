// Detailed Stock Page View for NexTrade Pro

const StockDetailView = {
  currentSymbol: null,
  currentStock: null,
  activeRange: '1D',
  chartInstance: null,

  async render(container, symbol = 'RELIANCE') {
    this.currentSymbol = symbol.toUpperCase();

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <button class="btn btn-ghost btn-sm" onclick="window.history.back()">← Back to Markets</button>
      </div>

      <!-- Stock Header Card -->
      <div class="card" style="margin-bottom: 24px; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h1 id="stock-det-symbol" style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0;">${this.currentSymbol}</h1>
              <span id="stock-det-exchange" class="badge badge-neutral">NSE</span>
              <span id="stock-det-cap" class="badge badge-neutral">Large Cap</span>
            </div>
            <div id="stock-det-name" style="font-size: 15px; color: var(--text-secondary); margin-top: 4px;">Loading...</div>
            <div id="stock-det-isin" style="font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono); margin-top: 2px;">ISIN: -</div>
          </div>

          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="text-align: right;">
              <div id="stock-det-price" style="font-size: 32px; font-weight: 900; font-family: var(--font-mono); color: var(--text-primary);">₹0.00</div>
              <div id="stock-det-change" style="font-size: 14px; font-weight: 700;" class="gain">+0.00 (+0.00%)</div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-success btn-lg" onclick="OrderModal.open('${this.currentSymbol}', 'BUY')">BUY</button>
              <button class="btn btn-danger btn-lg" onclick="OrderModal.open('${this.currentSymbol}', 'SELL')">SELL</button>
              <button class="icon-btn" style="height: 48px; width: 48px;" title="Add to Watchlist" onclick="WatchlistView.addPrompt('${this.currentSymbol}')">♡</button>
              <button class="icon-btn" style="height: 48px; width: 48px;" title="Set Price Alert" onclick="AlertsView.openModal('${this.currentSymbol}')">🔔</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Chart Section -->
      <div class="card" style="margin-bottom: 24px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <!-- Timeframe Selector -->
          <div class="chips-bar" style="margin: 0;" id="chart-range-chips">
            <button class="chip active" onclick="StockDetailView.setRange('1D')">1D</button>
            <button class="chip" onclick="StockDetailView.setRange('1W')">1W</button>
            <button class="chip" onclick="StockDetailView.setRange('1M')">1M</button>
            <button class="chip" onclick="StockDetailView.setRange('3M')">3M</button>
            <button class="chip" onclick="StockDetailView.setRange('6M')">6M</button>
            <button class="chip" onclick="StockDetailView.setRange('1Y')">1Y</button>
            <button class="chip" onclick="StockDetailView.setRange('5Y')">5Y</button>
          </div>

          <!-- Chart Controls -->
          <div style="display: flex; gap: 8px;">
            <button id="btn-chart-candle" class="chip active" onclick="StockDetailView.setChartType('candlestick')">🕯️ Candlestick</button>
            <button id="btn-chart-line" class="chip" onclick="StockDetailView.setChartType('line')">📈 Line</button>
          </div>
        </div>

        <!-- Canvas Chart Container -->
        <div style="position: relative; width: 100%; height: 380px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); overflow: hidden;">
          <canvas id="stock-canvas-chart" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>
      </div>

      <!-- Tabs for Fundamentals, Financials, and News -->
      <div class="tabs-nav" id="stock-detail-tabs">
        <button class="tab-btn active" onclick="StockDetailView.switchTab('fundamentals')">Fundamentals</button>
        <button class="tab-btn" onclick="StockDetailView.switchTab('financials')">Financials</button>
        <button class="tab-btn" onclick="StockDetailView.switchTab('news')">Company News</button>
      </div>

      <!-- Tab: Fundamentals -->
      <div id="tab-fundamentals" class="stock-tab-content card">
        <h3 class="card-title" style="margin-bottom: 16px;">Key Financial Metrics</h3>
        <div class="grid-4" id="fundamentals-grid">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Tab: Financials -->
      <div id="tab-financials" class="stock-tab-content card" style="display: none;">
        <h3 class="card-title" style="margin-bottom: 16px;">Income & Profit Statement (in ₹ Crores)</h3>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>FY 2023</th>
                <th>FY 2024</th>
                <th>FY 2025 (E)</th>
                <th>FY 2026 (E)</th>
              </tr>
            </thead>
            <tbody id="financials-table-body">
              <!-- Populated dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: News -->
      <div id="tab-news" class="stock-tab-content card" style="display: none;">
        <h3 class="card-title" style="margin-bottom: 16px;">Recent Company Announcements & Wire</h3>
        <div id="stock-news-list" style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;

    this.initChart();
    this.loadStock();
  },

  initChart() {
    const canvas = document.getElementById('stock-canvas-chart');
    if (canvas) {
      this.chartInstance = new StockCanvasChart(canvas, { chartType: 'candlestick' });
    }
  },

  async loadStock() {
    try {
      const stock = await api.get(`/stocks/${this.currentSymbol}`);
      this.currentStock = stock;

      document.getElementById('stock-det-symbol').textContent = stock.symbol;
      document.getElementById('stock-det-name').textContent = stock.name;
      document.getElementById('stock-det-isin').textContent = `ISIN: ${stock.isin || 'N/A'}`;
      document.getElementById('stock-det-exchange').textContent = stock.exchange || 'NSE';
      document.getElementById('stock-det-cap').textContent = stock.cap || 'Large Cap';
      document.getElementById('stock-det-price').textContent = formatMoney(stock.price);

      const chgEl = document.getElementById('stock-det-change');
      chgEl.textContent = `${stock.change >= 0 ? '+' : ''}${formatMoney(stock.change)} (${formatPercent(stock.percentChange)})`;
      chgEl.className = stock.percentChange >= 0 ? 'gain' : 'loss';

      // Render Fundamentals
      const f = stock.fundamentals || {};
      document.getElementById('fundamentals-grid').innerHTML = `
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">Market Capitalization</div>
          <div style="font-weight: 800; font-size: 16px;">${f.marketCap || 'N/A'}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">P/E Ratio</div>
          <div style="font-weight: 800; font-size: 16px;">${f.pe || 'N/A'}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">P/B Ratio</div>
          <div style="font-weight: 800; font-size: 16px;">${f.pb || 'N/A'}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">EPS (TTM)</div>
          <div style="font-weight: 800; font-size: 16px;">₹${f.eps || 'N/A'}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">ROE</div>
          <div style="font-weight: 800; font-size: 16px;">${f.roe || 'N/A'}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">ROCE</div>
          <div style="font-weight: 800; font-size: 16px;">${f.roce || 'N/A'}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">Dividend Yield</div>
          <div style="font-weight: 800; font-size: 16px;">${f.divYield || 'N/A'}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
          <div style="font-size: 12px; color: var(--text-tertiary);">52W High / Low</div>
          <div style="font-weight: 800; font-size: 15px;">₹${f.high52 || 0} / ₹${f.low52 || 0}</div>
        </div>
      `;

      // Render Financials Table
      const fin = stock.financials || {};
      const rev = fin.revenue || { '2023': 0, '2024': 0, '2025': 0, '2026': 0 };
      const prf = fin.profit || { '2023': 0, '2024': 0, '2025': 0, '2026': 0 };
      const eps = fin.eps || { '2023': 0, '2024': 0, '2025': 0, '2026': 0 };

      document.getElementById('financials-table-body').innerHTML = `
        <tr>
          <td><strong>Total Revenue</strong></td>
          <td>₹${formatNumber(rev['2023'])} Cr</td>
          <td>₹${formatNumber(rev['2024'])} Cr</td>
          <td>₹${formatNumber(rev['2025'])} Cr</td>
          <td>₹${formatNumber(rev['2026'])} Cr</td>
        </tr>
        <tr>
          <td><strong>Net Profit (PAT)</strong></td>
          <td class="gain">₹${formatNumber(prf['2023'])} Cr</td>
          <td class="gain">₹${formatNumber(prf['2024'])} Cr</td>
          <td class="gain">₹${formatNumber(prf['2025'])} Cr</td>
          <td class="gain">₹${formatNumber(prf['2026'])} Cr</td>
        </tr>
        <tr>
          <td><strong>Earnings Per Share (EPS)</strong></td>
          <td>₹${eps['2023']}</td>
          <td>₹${eps['2024']}</td>
          <td>₹${eps['2025']}</td>
          <td>₹${eps['2026']}</td>
        </tr>
      `;

      // Render News
      const newsList = document.getElementById('stock-news-list');
      if (stock.news && stock.news.length > 0) {
        newsList.innerHTML = stock.news.map(n => `
          <div style="padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface-subtle);">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${n.title}</div>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">${n.summary}</p>
            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 6px;">${n.source} • ${formatDate(n.timestamp)}</div>
          </div>
        `).join('');
      } else {
        newsList.innerHTML = `<div class="empty-state"><p>No recent news articles tagged for ${stock.symbol}.</p></div>`;
      }

      this.loadChartData();
    } catch (err) {
      Toast.error('Could not load stock details.');
    }
  },

  async loadChartData() {
    try {
      const data = await api.get(`/stocks/${this.currentSymbol}/chart?range=${this.activeRange}`);
      if (this.chartInstance && data.candles) {
        this.chartInstance.setData(data.candles);
      }
    } catch (e) {
      console.warn('Failed to load chart data:', e);
    }
  },

  setRange(range) {
    this.activeRange = range;
    document.querySelectorAll('#chart-range-chips .chip').forEach(btn => {
      if (btn.textContent === range) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    this.loadChartData();
  },

  setChartType(type) {
    document.getElementById('btn-chart-candle').classList.toggle('active', type === 'candlestick');
    document.getElementById('btn-chart-line').classList.toggle('active', type === 'line');
    if (this.chartInstance) {
      this.chartInstance.setChartType(type);
    }
  },

  switchTab(tabId) {
    document.querySelectorAll('#stock-detail-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tabId));
    });
    ['fundamentals', 'financials', 'news'].forEach(t => {
      const el = document.getElementById(`tab-${t}`);
      if (el) el.style.display = t === tabId ? 'block' : 'none';
    });
  }
};
