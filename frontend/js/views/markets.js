// Markets & Discover View for NexTrade Pro

const MarketsView = {
  activeSector: 'All',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Market Discovery & Indices</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Real-time quotes across NSE/BSE benchmark indices, sectors, and top equities.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm" onclick="MarketsView.loadData()">🔄 Refresh Quotes</button>
          <button class="btn btn-primary btn-sm" onclick="SearchModal.open()">🔍 Search (Cmd+K)</button>
        </div>
      </div>

      <!-- Major Indices Grid -->
      <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">📊 Benchmark Indices</h2>
      <div class="grid-4" id="markets-indices-grid" style="margin-bottom: 28px;">
        <!-- Indices cards injected dynamically -->
      </div>

      <!-- Sector Filter Chips -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">🏭 Sector Heatmap & Filters</h2>
        <div class="chips-bar" id="markets-sector-chips">
          <button class="chip active" onclick="MarketsView.filterSector('All')">All Sectors</button>
          <button class="chip" onclick="MarketsView.filterSector('IT')">IT Services</button>
          <button class="chip" onclick="MarketsView.filterSector('Banking')">Banking & Financials</button>
          <button class="chip" onclick="MarketsView.filterSector('Auto')">Automobile</button>
          <button class="chip" onclick="MarketsView.filterSector('Energy')">Energy & Power</button>
          <button class="chip" onclick="MarketsView.filterSector('FMCG')">FMCG</button>
          <button class="chip" onclick="MarketsView.filterSector('Renewable')">Renewables</button>
          <button class="chip" onclick="MarketsView.filterSector('Retail')">Retail & Tech</button>
        </div>
      </div>

      <!-- Securities Grid -->
      <div class="grid-auto" id="markets-stocks-grid">
        <!-- Securities injected dynamically -->
      </div>
    `;

    this.loadData();
  },

  async loadData() {
    try {
      const [indices, stocks] = await Promise.all([
        api.get('/markets/indices'),
        api.get('/stocks')
      ]);

      Store.indices = indices;
      Store.stocks = stocks;

      // Render Indices
      const indicesContainer = document.getElementById('markets-indices-grid');
      if (indicesContainer) {
        indicesContainer.innerHTML = indices.map(idx => `
          <div class="card" style="padding: 16px; transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <strong style="font-size: 15px; color: var(--text-primary);">${idx.symbol}</strong>
              <span class="badge ${idx.percentChange >= 0 ? 'badge-gain' : 'badge-loss'}">${formatPercent(idx.percentChange)}</span>
            </div>
            <div style="font-size: 22px; font-weight: 800; font-family: var(--font-mono);">${formatNumber(idx.value)}</div>
            <div style="font-size: 12px; color: ${idx.change >= 0 ? 'var(--gain-green)' : 'var(--loss-red)'}; font-weight: 600; margin-top: 4px;">
              ${idx.change >= 0 ? '+' : ''}${formatNumber(idx.change)} pts
            </div>
          </div>
        `).join('');
      }

      this.renderStocks();
    } catch (err) {
      console.warn('Failed to load market discovery data:', err);
    }
  },

  filterSector(sector) {
    this.activeSector = sector;
    document.querySelectorAll('#markets-sector-chips .chip').forEach(btn => {
      if (btn.textContent.includes(sector) || (sector === 'All' && btn.textContent === 'All Sectors')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    this.renderStocks();
  },

  renderStocks() {
    const container = document.getElementById('markets-stocks-grid');
    if (!container) return;

    let filtered = Store.stocks || [];
    if (this.activeSector !== 'All') {
      filtered = filtered.filter(s => s.sector.toLowerCase().includes(this.activeSector.toLowerCase()));
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>No stocks found in ${this.activeSector} sector.</p></div>`;
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="stock-card" onclick="window.location.hash='#/stock/${s.symbol}'">
        <div class="stock-card-top">
          <div>
            <div class="stock-symbol">${s.symbol}</div>
            <div class="stock-name">${s.name}</div>
          </div>
          <span class="badge ${s.percentChange >= 0 ? 'badge-gain' : 'badge-loss'}">${formatPercent(s.percentChange)}</span>
        </div>

        <div style="margin: 10px 0;">
          <div class="stock-price">${formatMoney(s.price)}</div>
          <div style="font-size: 12px; color: ${s.change >= 0 ? 'var(--gain-green)' : 'var(--loss-red)'}; font-weight: 600;">
            ${s.change >= 0 ? '+' : ''}${formatMoney(s.change)} today
          </div>
        </div>

        <div style="font-size: 11.5px; color: var(--text-tertiary); margin-bottom: 12px;">
          ${s.cap} • ${s.sector}
        </div>

        <div class="stock-card-bottom" onclick="event.stopPropagation()">
          <button class="btn btn-outline btn-sm" onclick="WatchlistView.addPrompt('${s.symbol}')">♡ Watchlist</button>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-success btn-sm" onclick="OrderModal.open('${s.symbol}', 'BUY')">BUY</button>
            <button class="btn btn-danger btn-sm" onclick="OrderModal.open('${s.symbol}', 'SELL')">SELL</button>
          </div>
        </div>
      </div>
    `).join('');
  }
};
