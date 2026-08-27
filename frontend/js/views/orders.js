// Order Book & History View for NexTrade Pro

const OrdersView = {
  activeTab: 'executed',
  ordersData: { all: [], open: [], executed: [], cancelled: [] },

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Order Book</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Track real-time order states, executions, and simulated trade logs.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline btn-sm" onclick="OrdersView.loadOrders()">🔄 Refresh Orders</button>
          <button class="btn btn-primary btn-sm" onclick="SearchModal.open()">＋ Place New Order</button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" id="orders-tabs">
        <button class="tab-btn active" onclick="OrdersView.switchTab('executed')">
          ✅ Executed Trades (<span id="count-executed-orders">0</span>)
        </button>
        <button class="tab-btn" onclick="OrdersView.switchTab('open')">
          ⏳ Open Orders (<span id="count-open-orders">0</span>)
        </button>
        <button class="tab-btn" onclick="OrdersView.switchTab('cancelled')">
          🚫 Cancelled / Rejected (<span id="count-cancelled-orders">0</span>)
        </button>
      </div>

      <!-- Orders Data Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="data-table-wrapper" style="border: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Time</th>
                <th>Security</th>
                <th>Type</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Price (₹)</th>
                <th>Charges</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="orders-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.loadOrders();
  },

  async loadOrders() {
    try {
      const data = await api.get('/orders');
      this.ordersData = data;
      Store.orders = data;

      document.getElementById('count-executed-orders').textContent = data.executed ? data.executed.length : 0;
      document.getElementById('count-open-orders').textContent = data.open ? data.open.length : 0;
      document.getElementById('count-cancelled-orders').textContent = data.cancelled ? data.cancelled.length : 0;

      this.renderTable();
    } catch (err) {
      Toast.error('Failed to load orders.');
    }
  },

  renderTable() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    const list = this.ordersData[this.activeTab] || [];

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 48px;">
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <div class="empty-state-title">No ${this.activeTab} orders</div>
              <p class="empty-state-desc">Your order book reflects all simulated market and limit order activities.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(o => {
      const sideClass = o.side === 'BUY' ? 'badge-gain' : 'badge-loss';
      const statusClass = o.status === 'FILLED' ? 'badge-gain' : o.status === 'OPEN' ? 'badge-warning' : 'badge-neutral';

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-size: 13px; font-weight: 700;">${o.id}</td>
          <td style="font-size: 12.5px; color: var(--text-tertiary);">${formatTime(o.createdAt)}</td>
          <td>
            <strong>${o.symbol}</strong>
            <span class="badge badge-neutral" style="font-size: 10px; margin-left: 4px;">${o.exchange || 'NSE'}</span>
          </td>
          <td>
            <span style="font-size: 12px; font-weight: 600;">${o.productType} • ${o.orderType}</span>
          </td>
          <td><span class="badge ${sideClass}">${o.side}</span></td>
          <td style="font-weight: 700; font-family: var(--font-mono);">${o.quantity}</td>
          <td style="font-weight: 800; font-family: var(--font-mono);">${formatMoney(o.price)}</td>
          <td style="font-size: 12.5px; color: var(--text-secondary); font-family: var(--font-mono);">₹${o.charges || 0}</td>
          <td><span class="badge ${statusClass}">${o.status}</span></td>
          <td style="text-align: right;">
            ${o.status === 'OPEN' ? `
              <button class="btn btn-danger btn-sm" onclick="OrdersView.cancelOrder('${o.id}')">Cancel</button>
            ` : `<span style="font-size: 12px; color: var(--text-tertiary);">-</span>`}
          </td>
        </tr>
      `;
    }).join('');
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('#orders-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
    });
    this.renderTable();
  },

  cancelOrder(orderId) {
    Modal.confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel open order <strong>${orderId}</strong>?`,
      confirmText: 'Cancel Order',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/orders/${orderId}`);
          Toast.info(res.message);
          this.loadOrders();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
};
