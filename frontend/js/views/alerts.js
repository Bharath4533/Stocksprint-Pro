// Price Alerts Manager View for NexTrade Pro

const AlertsView = {
  alerts: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Price Alerts</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Set automated price triggers and receive instant alerts when market targets are hit.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="AlertsView.openModal()">＋ Set New Alert</button>
      </div>

      <!-- Alerts List Container -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="data-table-wrapper" style="border: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Security</th>
                <th>Condition</th>
                <th>Target Price / Value</th>
                <th>Current Price</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="alerts-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.loadAlerts();
  },

  async loadAlerts() {
    try {
      const data = await api.get('/alerts');
      this.alerts = data;
      this.renderTable();
    } catch (err) {
      Toast.error('Failed to load alerts.');
    }
  },

  renderTable() {
    const tbody = document.getElementById('alerts-table-body');
    if (!tbody) return;

    if (this.alerts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 48px;">
            <div class="empty-state">
              <div class="empty-state-icon">🔔</div>
              <div class="empty-state-title">No price alerts set</div>
              <p class="empty-state-desc">Never miss market movements. Create an alert for stocks you are watching.</p>
              <button class="btn btn-primary btn-sm" onclick="AlertsView.openModal()">＋ Set Alert</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.alerts.map(a => `
      <tr>
        <td>
          <strong>${a.symbol}</strong>
          <div style="font-size: 12px; color: var(--text-tertiary);">${a.companyName || a.symbol}</div>
        </td>
        <td>
          <span class="badge badge-neutral">
            ${a.condition === 'PRICE_ABOVE' ? '📈 Price Above' : a.condition === 'PRICE_BELOW' ? '📉 Price Below' : '⚡ % Move'}
          </span>
        </td>
        <td style="font-weight: 800; font-family: var(--font-mono); font-size: 15px;">₹${formatNumber(a.targetValue)}</td>
        <td style="font-weight: 700; font-family: var(--font-mono); font-size: 14.5px;">₹${formatNumber(a.currentPrice)}</td>
        <td><span class="badge badge-gain">${a.status}</span></td>
        <td style="text-align: right;">
          <button class="icon-btn" title="Delete Alert" style="height: 30px; width: 30px;" onclick="AlertsView.deleteAlert('${a.id}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  },

  openModal(prefillSymbol = '') {
    Modal.confirm({
      title: 'Set New Price Alert',
      message: `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div class="form-group" style="margin: 0;">
            <label>Stock Symbol</label>
            <input type="text" id="alert-symbol-input" class="input" value="${prefillSymbol || 'RELIANCE'}" placeholder="e.g. TCS, INFY">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Condition</label>
            <select id="alert-condition-select" class="select">
              <option value="PRICE_ABOVE">📈 When Price Rises Above</option>
              <option value="PRICE_BELOW">📉 When Price Drops Below</option>
              <option value="PERCENT_MOVE">⚡ When Price Moves By (+/- %)</option>
            </select>
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Target Value (₹ or %)</label>
            <input type="number" id="alert-target-input" class="input" placeholder="e.g. 3050.00" step="0.5">
          </div>
        </div>
      `,
      confirmText: 'Create Alert',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const symbol = document.getElementById('alert-symbol-input').value.trim().toUpperCase();
        const condition = document.getElementById('alert-condition-select').value;
        const targetValue = parseFloat(document.getElementById('alert-target-input').value);

        if (!symbol || isNaN(targetValue)) {
          Toast.error('Please fill in valid symbol and target value.');
          return;
        }

        try {
          const res = await api.post('/alerts', { symbol, condition, targetValue });
          Toast.success(res.message);
          this.loadAlerts();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  },

  async deleteAlert(id) {
    try {
      await api.delete(`/alerts/${id}`);
      Toast.info('Alert deleted.');
      this.loadAlerts();
    } catch (err) {
      Toast.error(err.message);
    }
  }
};
