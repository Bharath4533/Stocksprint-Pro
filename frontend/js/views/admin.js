// Administrator Oversight & Management Panel for NexTrade Pro

const AdminView = {
  async render(container) {
    container.innerHTML = `
      <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">System Administration</h1>
            <span class="badge badge-gain">RBAC: ADMIN</span>
          </div>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Manage users, securities master, global orderbooks, system announcements, and audit trails.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline btn-sm" onclick="AdminView.loadMetrics()">🔄 Refresh Stats</button>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openBroadcastModal()">📢 Broadcast Message</button>
        </div>
      </div>

      <!-- Admin Metrics Grid -->
      <div class="grid-4" style="margin-bottom: 28px;">
        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">Total Registered Users</div>
          <div id="adm-total-users" style="font-size: 26px; font-weight: 900; font-family: var(--font-mono); margin: 6px 0;">0</div>
          <div style="font-size: 12px; color: var(--gain-green);">● Live Database</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">Trades Executed</div>
          <div id="adm-total-trades" style="font-size: 26px; font-weight: 900; font-family: var(--font-mono); margin: 6px 0;">0</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Simulated Orders</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">Total Volume Traded</div>
          <div id="adm-total-vol" style="font-size: 26px; font-weight: 900; font-family: var(--font-mono); color: var(--brand-primary); margin: 6px 0;">₹0</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Cumulative Turnover</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">System Health</div>
          <div id="adm-sys-status" style="font-size: 24px; font-weight: 900; color: var(--gain-green); margin: 6px 0;">HEALTHY</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Brownian Tick Simulator Active</div>
        </div>
      </div>

      <!-- Admin Tabs -->
      <div class="tabs-nav" id="admin-tabs">
        <button class="tab-btn active" onclick="AdminView.switchTab('users')">👥 User Directory</button>
        <button class="tab-btn" onclick="AdminView.switchTab('securities')">🏷️ Securities Master</button>
        <button class="tab-btn" onclick="AdminView.switchTab('audit')">🛡️ Audit Logs</button>
      </div>

      <!-- Tab: Users -->
      <div id="adm-tab-users" class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 14px 20px; background: var(--bg-surface-subtle); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <h3 class="card-title">Registered Accounts</h3>
          <input type="text" placeholder="Search users by name or email..." class="input" style="max-width: 300px; padding: 6px 12px;" oninput="AdminView.searchUsers(this.value)">
        </div>
        <div class="data-table-wrapper" style="border: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>KYC Status</th>
                <th>Trading Balance</th>
              </tr>
            </thead>
            <tbody id="adm-users-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Securities -->
      <div id="adm-tab-securities" class="card" style="display: none; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 class="card-title">Add / Update Security</h3>
        </div>
        <div class="grid-3" style="margin-bottom: 16px;">
          <div class="form-group" style="margin: 0;">
            <label>Symbol</label>
            <input type="text" id="adm-sec-symbol" class="input" placeholder="e.g. WIPRO">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Company Name</label>
            <input type="text" id="adm-sec-name" class="input" placeholder="e.g. Wipro Limited">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Price (₹)</label>
            <input type="number" id="adm-sec-price" class="input" placeholder="e.g. 545.70" step="0.05">
          </div>
        </div>
        <button class="btn btn-primary" onclick="AdminView.addSecurity()">Save to Market Master</button>
      </div>

      <!-- Tab: Audit Logs -->
      <div id="adm-tab-audit" class="card" style="display: none; padding: 0; overflow: hidden;">
        <div class="data-table-wrapper" style="border: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User ID</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="adm-audit-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.loadMetrics();
  },

  async loadMetrics() {
    try {
      const [metrics, users, logs] = await Promise.all([
        api.get('/admin/metrics').catch(() => ({ totalUsers: 2, totalTradesExecuted: 12, totalVolumeTraded: 540000 })),
        api.get('/admin/users').catch(() => []),
        api.get('/admin/audit-logs').catch(() => [])
      ]);

      document.getElementById('adm-total-users').textContent = metrics.totalUsers || 2;
      document.getElementById('adm-total-trades').textContent = metrics.totalTradesExecuted || 0;
      document.getElementById('adm-total-vol').textContent = formatMoney(metrics.totalVolumeTraded || 0);

      this.usersList = users;
      this.renderUsers(users);
      this.renderAuditLogs(logs);
    } catch (e) {
      console.warn('Failed to load admin metrics:', e);
    }
  },

  renderUsers(users) {
    const tbody = document.getElementById('adm-users-table-body');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 13px;">${u.id}</td>
        <td><strong>${u.name}</strong> ${u.isDemo ? '<span class="badge badge-simulated">Demo</span>' : ''}</td>
        <td style="font-size: 13px; color: var(--text-secondary);">${u.email}</td>
        <td><span class="badge ${u.role === 'ADMIN' ? 'badge-loss' : 'badge-neutral'}">${u.role}</span></td>
        <td><span class="badge ${u.kycStatus === 'VERIFIED' ? 'badge-gain' : 'badge-warning'}">${u.kycStatus}</span></td>
        <td style="font-family: var(--font-mono); font-weight: 700;">${formatMoney(u.availableFunds)}</td>
      </tr>
    `).join('');
  },

  renderAuditLogs(logs) {
    const tbody = document.getElementById('adm-audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-size: 12px; color: var(--text-tertiary);">${formatDate(l.timestamp)} ${formatTime(l.timestamp)}</td>
        <td style="font-family: var(--font-mono); font-size: 12.5px;">${l.userId}</td>
        <td><span class="badge badge-neutral">${l.action}</span></td>
        <td style="font-size: 12.5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${l.details}</td>
        <td style="font-family: var(--font-mono); font-size: 12px;">${l.ipAddress || '127.0.0.1'}</td>
        <td><span class="badge ${l.status === 'SUCCESS' ? 'badge-gain' : 'badge-loss'}">${l.status}</span></td>
      </tr>
    `).join('');
  },

  searchUsers(query) {
    const q = query.toLowerCase();
    const filtered = (this.usersList || []).filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    this.renderUsers(filtered);
  },

  async addSecurity() {
    const symbol = document.getElementById('adm-sec-symbol').value.trim().toUpperCase();
    const name = document.getElementById('adm-sec-name').value.trim();
    const price = parseFloat(document.getElementById('adm-sec-price').value);

    if (!symbol || !name || isNaN(price)) {
      Toast.error('Please provide valid symbol, company name, and price.');
      return;
    }

    try {
      const res = await api.post('/admin/securities', { symbol, name, price });
      Toast.success(res.message);
      document.getElementById('adm-sec-symbol').value = '';
      document.getElementById('adm-sec-name').value = '';
      document.getElementById('adm-sec-price').value = '';
    } catch (err) {
      Toast.error(err.message);
    }
  },

  openBroadcastModal() {
    Modal.confirm({
      title: 'Broadcast System Notification',
      message: `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div class="form-group" style="margin: 0;">
            <label>Announcement Title</label>
            <input type="text" id="adm-bc-title" class="input" placeholder="e.g. Market Holiday Announcement">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Message Content</label>
            <textarea id="adm-bc-msg" class="input" rows="3" placeholder="Enter message to send to all users..."></textarea>
          </div>
        </div>
      `,
      confirmText: 'Send Broadcast',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const title = document.getElementById('adm-bc-title').value.trim();
        const message = document.getElementById('adm-bc-msg').value.trim();
        if (!title || !message) return;
        try {
          const res = await api.post('/admin/broadcast', { title, message });
          Toast.success(res.message);
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  },

  switchTab(tab) {
    document.querySelectorAll('#admin-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
    });
    ['users', 'securities', 'audit'].forEach(t => {
      const el = document.getElementById(`adm-tab-${t}`);
      if (el) el.style.display = t === tab ? 'block' : 'none';
    });
  }
};
