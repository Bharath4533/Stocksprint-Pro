// Interactive Benchmark Index Touch & 1-Month Chart Modal for StockSprint Pro

const IndexModal = {
  currentSymbol: 'NIFTY 50',
  currentRange: '1M', // Default to 1 Month as requested
  currentChartType: 'candlestick',
  chartInstance: null,
  indexData: null,

  async open(symbol = 'NIFTY 50') {
    this.currentSymbol = symbol;
    this.currentRange = '1M';

    let modalEl = document.getElementById('index-detail-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'index-detail-modal';
      modalEl.className = 'modal-backdrop';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 820px; max-height: 92vh; display: flex; flex-direction: column; overflow-y: auto;">
        <div class="modal-header" style="padding-bottom: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 id="idx-modal-title" style="font-size: 22px; font-weight: 800;">${symbol}</h2>
              <span class="badge badge-simulated" style="font-size: 11px;">BENCHMARK INDEX</span>
            </div>
            <div style="display: flex; align-items: baseline; gap: 10px; margin-top: 4px;">
              <span id="idx-modal-val" style="font-size: 26px; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary);">--</span>
              <span id="idx-modal-chg" style="font-size: 14px; font-weight: 700; font-family: var(--font-mono);">--</span>
              <span style="font-size: 12px; color: var(--text-secondary);">• 1-Month Stock Value Rate</span>
            </div>
          </div>
          <button class="modal-close" onclick="IndexModal.close()">&times;</button>
        </div>

        <div class="modal-body" style="padding: 16px 0;">
          <!-- 1-Month Key Statistics Strip -->
          <div class="grid-4" style="gap: 10px; margin-bottom: 16px;">
            <div style="background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">1-Month High</div>
              <div id="idx-1m-high" style="font-size: 16px; font-weight: 800; font-family: var(--font-mono); color: var(--gain-green); margin-top: 4px;">--</div>
            </div>
            <div style="background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">1-Month Low</div>
              <div id="idx-1m-low" style="font-size: 16px; font-weight: 800; font-family: var(--font-mono); color: var(--loss-red); margin-top: 4px;">--</div>
            </div>
            <div style="background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">1-Month Net Return</div>
              <div id="idx-1m-return" style="font-size: 16px; font-weight: 800; font-family: var(--font-mono); color: var(--gain-green); margin-top: 4px;">--</div>
            </div>
            <div style="background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">52-Week Range</div>
              <div id="idx-52w-range" style="font-size: 12px; font-weight: 700; font-family: var(--font-mono); color: var(--text-secondary); margin-top: 6px;">--</div>
            </div>
          </div>

          <!-- Chart Controls Strip -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; gap: 6px;" id="idx-timeframe-btns">
              <button class="btn btn-ghost btn-sm" onclick="IndexModal.setRange('1D')">1D</button>
              <button class="btn btn-ghost btn-sm" onclick="IndexModal.setRange('1W')">1W</button>
              <button class="btn btn-primary btn-sm" id="btn-range-1m" onclick="IndexModal.setRange('1M')">1M</button>
              <button class="btn btn-ghost btn-sm" onclick="IndexModal.setRange('3M')">3M</button>
              <button class="btn btn-ghost btn-sm" onclick="IndexModal.setRange('1Y')">1Y</button>
              <button class="btn btn-ghost btn-sm" onclick="IndexModal.setRange('5Y')">5Y</button>
            </div>

            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-sm" id="btn-chart-type" onclick="IndexModal.toggleChartType()">🕯️ Candlesticks</button>
            </div>
          </div>

          <!-- Canvas Interactive Chart Container -->
          <div style="position: relative; height: 320px; background: var(--bg-base); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 20px; overflow: hidden;">
            <canvas id="idx-canvas-chart" style="width: 100%; height: 100%; display: block;"></canvas>
          </div>

          <!-- Top Index Constituents & Sector Weight -->
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px;">Top Heavyweight Constituents</h4>
            <div id="idx-constituents-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
              <!-- Injected dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    modalEl.classList.add('active');
    await this.loadData();
  },

  async loadData() {
    try {
      const [details, chartRes] = await Promise.all([
        api.get(`/markets/indices/${encodeURIComponent(this.currentSymbol)}`),
        api.get(`/markets/indices/${encodeURIComponent(this.currentSymbol)}/chart?range=${this.currentRange}`)
      ]);

      this.indexData = details;
      this.updateStatsUI(details);

      // Render chart
      const canvas = document.getElementById('idx-canvas-chart');
      if (canvas) {
        if (!this.chartInstance) {
          this.chartInstance = new StockCanvasChart(canvas, {
            chartType: this.currentChartType,
            showVolume: true,
            showSMA: true
          });
        } else {
          this.chartInstance.canvas = canvas;
          this.chartInstance.ctx = canvas.getContext('2d');
          this.chartInstance.resize();
        }
        this.chartInstance.setData(chartRes.candles || []);
      }
    } catch (err) {
      console.error('Index load error:', err);
    }
  },

  updateStatsUI(details) {
    if (!details) return;

    const valEl = document.getElementById('idx-modal-val');
    const chgEl = document.getElementById('idx-modal-chg');
    const highEl = document.getElementById('idx-1m-high');
    const lowEl = document.getElementById('idx-1m-low');
    const returnEl = document.getElementById('idx-1m-return');
    const range52w = document.getElementById('idx-52w-range');
    const constList = document.getElementById('idx-constituents-list');

    const isGain = details.percentChange >= 0;

    if (valEl) valEl.textContent = Number(details.value).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (chgEl) {
      chgEl.className = isGain ? 'gain' : 'loss';
      chgEl.textContent = `${isGain ? '+' : ''}${details.change} (${isGain ? '+' : ''}${details.percentChange}%)`;
    }

    if (highEl) highEl.textContent = `₹${Number(details.monthHigh).toLocaleString('en-IN')}`;
    if (lowEl) lowEl.textContent = `₹${Number(details.monthLow).toLocaleString('en-IN')}`;
    if (returnEl) returnEl.textContent = `+${details.monthReturnPct}% (+₹${Number(details.monthGainPts).toLocaleString('en-IN')})`;
    if (range52w) range52w.textContent = `₹${Number(details.yearLow).toLocaleString('en-IN')} - ₹${Number(details.yearHigh).toLocaleString('en-IN')}`;

    if (constList && details.constituents) {
      constList.innerHTML = details.constituents.map(c => `
        <div style="background: var(--bg-surface-subtle); padding: 10px 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; cursor: pointer; border: 1px solid var(--border-subtle);" onclick="IndexModal.close(); window.location.hash='#/stock?symbol=${c.symbol}'">
          <div>
            <div style="font-weight: 700; font-size: 13px;">${c.symbol}</div>
            <div style="font-size: 11px; color: var(--text-tertiary);">${c.weight} Weight</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 13px; font-family: var(--font-mono);">₹${c.price}</div>
            <div style="font-size: 11px; font-weight: 700;" class="${c.change.startsWith('+') ? 'gain' : 'loss'}">${c.change}</div>
          </div>
        </div>
      `).join('');
    }
  },

  async setRange(range) {
    this.currentRange = range;
    const btns = document.querySelectorAll('#idx-timeframe-btns button');
    btns.forEach(b => {
      if (b.textContent === range) {
        b.className = 'btn btn-primary btn-sm';
      } else {
        b.className = 'btn btn-ghost btn-sm';
      }
    });

    try {
      const chartRes = await api.get(`/markets/indices/${encodeURIComponent(this.currentSymbol)}/chart?range=${range}`);
      if (this.chartInstance) {
        this.chartInstance.setData(chartRes.candles || []);
      }
    } catch (e) {}
  },

  toggleChartType() {
    this.currentChartType = this.currentChartType === 'candlestick' ? 'line' : 'candlestick';
    const btn = document.getElementById('btn-chart-type');
    if (btn) {
      btn.textContent = this.currentChartType === 'candlestick' ? '🕯️ Candlesticks' : '📈 Line Chart';
    }
    if (this.chartInstance) {
      this.chartInstance.setChartType(this.currentChartType);
    }
  },

  close() {
    const modalEl = document.getElementById('index-detail-modal');
    if (modalEl) modalEl.classList.remove('active');
  }
};
