// Multi-Watchlist View for NexTrade Pro

const WatchlistView = {
  watchlists: [],
  activeWlId: null,

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Watchlists</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Organize securities into custom folders and monitor live ticks.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary btn-sm" onclick="WatchlistView.openNewFolderModal()">＋ New Watchlist Folder</button>
          <button class="btn btn-outline btn-sm" onclick="SearchModal.open()">🔍 Add Stocks</button>
        </div>
      </div>

      <!-- Watchlist Folder Tabs -->
      <div class="tabs-nav" id="watchlist-folder-tabs">
        <!-- Injected dynamically -->
      </div>

      <!-- Active Watchlist Container -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 14px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-subtle);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <strong id="active-wl-title" style="font-size: 16px;">My Watchlist</strong>
            <span id="active-wl-count" class="badge badge-neutral">0 scrips</span>
          </div>
          <button id="btn-delete-wl" class="btn btn-ghost btn-sm" style="color: var(--loss-red);" onclick="WatchlistView.deleteActiveFolder()">🗑️ Delete Folder</button>
        </div>

        <div class="data-table-wrapper" style="border: none; border-radius: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Security</th>
                <th>Price (₹)</th>
                <th>24h Change</th>
                <th>Day High / Low</th>
                <th>Volume</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="watchlist-table-body">
              <!-- Rows injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.loadWatchlists();
  },

  async loadWatchlists() {
    try {
      const data = await api.get('/watchlists');
      this.watchlists = data;
      Store.watchlists = data;

      if (!this.activeWlId && data.length > 0) {
        this.activeWlId = data[0].id;
      }

      this.renderTabs();
      this.renderActiveWatchlist();
    } catch (err) {
      Toast.error('Failed to load watchlists.');
    }
  },

  renderTabs() {
    const tabsContainer = document.getElementById('watchlist-folder-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = this.watchlists.map(wl => `
      <button class="tab-btn ${wl.id === this.activeWlId ? 'active' : ''}" onclick="WatchlistView.selectFolder('${wl.id}')">
        📁 ${wl.name} (${wl.symbols ? wl.symbols.length : 0})
      </button>
    `).join('');
  },

  selectFolder(id) {
    this.activeWlId = id;
    this.renderTabs();
    this.renderActiveWatchlist();
  },

  renderActiveWatchlist() {
    const activeWl = this.watchlists.find(w => w.id === this.activeWlId) || this.watchlists[0];
    if (!activeWl) return;

    const titleEl = document.getElementById('active-wl-title');
    const countEl = document.getElementById('active-wl-count');
    const tbody = document.getElementById('watchlist-table-body');
    const deleteBtn = document.getElementById('btn-delete-wl');

    if (titleEl) titleEl.textContent = activeWl.name;
    if (countEl) countEl.textContent = `${activeWl.stocks ? activeWl.stocks.length : 0} scrips`;
    if (deleteBtn) deleteBtn.style.display = this.watchlists.length > 1 ? 'block' : 'none';

    if (!activeWl.stocks || activeWl.stocks.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 48px;">
              <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">This watchlist is empty</div>
                <p class="empty-state-desc">Add stocks to track their real-time movements and place paper trades.</p>
                <button class="btn btn-primary btn-sm" onclick="SearchModal.open()">🔍 Search & Add Stocks</button>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    if (tbody) {
      tbody.innerHTML = activeWl.stocks.map(s => `
        <tr style="cursor: pointer;" onclick="window.location.hash='#/stock/${s.symbol}'">
          <td>
            <div style="font-weight: 700; font-size: 14.5px; color: var(--text-primary);">${s.symbol}</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.name}</div>
          </td>
          <td style="font-weight: 800; font-family: var(--font-mono); font-size: 15px;">${formatMoney(s.price)}</td>
          <td>
            <span class="badge ${s.percentChange >= 0 ? 'badge-gain' : 'badge-loss'}">
              ${formatPercent(s.percentChange)} (${formatMoney(s.change)})
            </span>
          </td>
          <td style="font-size: 12.5px; color: var(--text-secondary);">
            H: ₹${s.high || s.price} | L: ₹${s.low || s.price}
          </td>
          <td style="font-size: 12.5px; color: var(--text-secondary);">
            ${formatNumber(s.volume)}
          </td>
          <td style="text-align: right;" onclick="event.stopPropagation()">
            <div style="display: flex; justify-content: flex-end; gap: 6px;">
              <button class="btn btn-success btn-sm" onclick="OrderModal.open('${s.symbol}', 'BUY')">BUY</button>
              <button class="btn btn-danger btn-sm" onclick="OrderModal.open('${s.symbol}', 'SELL')">SELL</button>
              <button class="icon-btn" title="Remove from Watchlist" style="height: 30px; width: 30px;" onclick="WatchlistView.removeStock('${activeWl.id}', '${s.symbol}')">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  },

  openNewFolderModal() {
    Modal.confirm({
      title: 'Create New Watchlist Folder',
      message: `
        <div class="form-group" style="margin-top: 10px;">
          <label>Folder Name</label>
          <input type="text" id="new-folder-name-input" class="input" placeholder="e.g. Dividend Picks, High Growth, Momentum" autofocus>
        </div>
      `,
      confirmText: 'Create Folder',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const input = document.getElementById('new-folder-name-input');
        const name = input ? input.value.trim() : '';
        if (!name) return;
        try {
          const newWl = await api.post('/watchlists', { name });
          Toast.success(`Created watchlist "${name}"`);
          this.activeWlId = newWl.id;
          this.loadWatchlists();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  },

  async addPrompt(symbol) {
    if (!this.watchlists || this.watchlists.length === 0) {
      await this.loadWatchlists();
    }

    const options = this.watchlists.map(w => `<option value="${w.id}">${w.name}</option>`).join('');

    Modal.confirm({
      title: `Add ${symbol} to Watchlist`,
      message: `
        <div class="form-group" style="margin-top: 10px;">
          <label>Select Watchlist Folder</label>
          <select id="select-add-wl-folder" class="select">
            ${options}
          </select>
        </div>
      `,
      confirmText: 'Add to Watchlist',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const select = document.getElementById('select-add-wl-folder');
        const wlId = select ? select.value : this.activeWlId;
        try {
          await api.post(`/watchlists/${wlId}/symbols`, { symbol });
          Toast.success(`Added ${symbol} to watchlist`);
          this.loadWatchlists();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  },

  async removeStock(wlId, symbol) {
    try {
      await api.delete(`/watchlists/${wlId}/symbols/${symbol}`);
      Toast.info(`Removed ${symbol} from watchlist`);
      this.loadWatchlists();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  deleteActiveFolder() {
    const activeWl = this.watchlists.find(w => w.id === this.activeWlId);
    if (!activeWl) return;

    Modal.confirm({
      title: `Delete Watchlist "${activeWl.name}"`,
      message: `Are you sure you want to delete this watchlist folder? All tracking symbols inside will be removed.`,
      confirmText: 'Delete Folder',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await api.delete(`/watchlists/${activeWl.id}`);
          Toast.info(`Watchlist "${activeWl.name}" deleted.`);
          this.activeWlId = null;
          this.loadWatchlists();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
};
