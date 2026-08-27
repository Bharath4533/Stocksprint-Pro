// NSE Stock Market Sector Heatmap Matrix for StockSprint Pro

const HeatmapView = {
  async render(container) {
    container.innerHTML = `
      <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">🗺️ NSE Market Sector Heatmap</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 4px;">Visual representation of market cap weight and daily performance across Indian industries.</p>
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary btn-sm" onclick="HeatmapView.filterSector('ALL')">All Sectors</button>
          <button class="btn btn-outline btn-sm" onclick="HeatmapView.filterSector('Banking')">Banking</button>
          <button class="btn btn-outline btn-sm" onclick="HeatmapView.filterSector('IT')">IT</button>
          <button class="btn btn-outline btn-sm" onclick="HeatmapView.filterSector('Energy')">Energy</button>
          <button class="btn btn-outline btn-sm" onclick="HeatmapView.filterSector('Auto')">Auto</button>
        </div>
      </div>

      <!-- Heatmap Legend -->
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px; font-size: 12px; color: var(--text-secondary); background: var(--bg-surface); padding: 10px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-weight: 700;">Performance Scale:</span>
        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #00875a; border-radius: 2px;"></span> &gt; +2%</span>
        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #00D084; border-radius: 2px;"></span> +0.5% to +2%</span>
        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #334155; border-radius: 2px;"></span> Neutral</span>
        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #ff4d4d; border-radius: 2px;"></span> -0.5% to -2%</span>
        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #b91c1c; border-radius: 2px;"></span> &lt; -2%</span>
      </div>

      <!-- Heatmap Grid -->
      <div id="heatmap-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
        <!-- Injected dynamically -->
      </div>
    `;

    this.loadHeatmap();
  },

  async loadHeatmap(sectorFilter = 'ALL') {
    try {
      const stocks = await api.get('/stocks');
      const container = document.getElementById('heatmap-container');
      if (!container) return;

      const filtered = sectorFilter === 'ALL' ? stocks : stocks.filter(s => s.sector && s.sector.toLowerCase().includes(sectorFilter.toLowerCase()));

      container.innerHTML = filtered.map(s => {
        const pct = s.percentChange;
        let bgColor = '#334155';
        let textColor = '#ffffff';

        if (pct >= 2.0) bgColor = '#00875a';
        else if (pct > 0.3) bgColor = '#00B070';
        else if (pct >= -0.3 && pct <= 0.3) bgColor = '#1E293B';
        else if (pct < -0.3 && pct >= -2.0) bgColor = '#DC2626';
        else if (pct < -2.0) bgColor = '#991B1B';

        return `
          <div style="background: ${bgColor}; color: ${textColor}; padding: 18px 16px; border-radius: var(--radius-md); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; justify-content: space-between; min-height: 120px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
               onmouseover="this.style.transform='scale(1.02)'"
               onmouseout="this.style.transform='scale(1)'"
               onclick="window.location.hash='#/stock?symbol=${s.symbol}'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 17px; font-weight: 900; letter-spacing: 0.5px;">${s.symbol}</div>
                <div style="font-size: 11px; opacity: 0.85; margin-top: 2px;">${s.name}</div>
              </div>
              <span style="font-size: 10px; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-weight: 700;">${s.sector || 'EQUITY'}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px;">
              <div style="font-size: 18px; font-weight: 800; font-family: var(--font-mono);">₹${Number(s.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div style="font-size: 14px; font-weight: 800; font-family: var(--font-mono); background: rgba(0,0,0,0.25); padding: 3px 8px; border-radius: 4px;">
                ${pct >= 0 ? '+' : ''}${pct}%
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error('Heatmap error:', e);
    }
  },

  filterSector(sector) {
    this.loadHeatmap(sector);
  }
};
