// Funds Management & Ledger View for NexTrade Pro

const FundsView = {
  activeLedgerFilter: 'ALL',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Funds & Margin</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Manage simulated capital, deposit virtual funds, and inspect transaction ledgers.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="FundsView.openAddFundsModal()">＋ Add Funds (Simulated)</button>
          <button class="btn btn-outline" onclick="FundsView.openWithdrawModal()">Withdraw Funds</button>
        </div>
      </div>

      <!-- Funds Balance Metrics -->
      <div class="grid-4" style="margin-bottom: 28px;">
        <div class="card" style="padding: 20px; background: linear-gradient(135deg, rgba(0, 208, 132, 0.12) 0%, var(--bg-surface) 100%);">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">Available Trading Balance</div>
          <div id="funds-avail-cash" style="font-size: 28px; font-weight: 900; font-family: var(--font-mono); color: var(--brand-primary); margin: 6px 0;">₹0.00</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Available for immediate orders</div>
        </div>

        <div class="card" style="padding: 20px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">Used Margin (Collateral)</div>
          <div id="funds-used-margin" style="font-size: 28px; font-weight: 900; font-family: var(--font-mono); margin: 6px 0;">₹0.00</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Blocked in delivery & positions</div>
        </div>

        <div class="card" style="padding: 20px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">Total Capital</div>
          <div id="funds-total-cap" style="font-size: 28px; font-weight: 900; font-family: var(--font-mono); margin: 6px 0;">₹0.00</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Cash + Margin utilized</div>
        </div>

        <div class="card" style="padding: 20px;">
          <div style="font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase;">Withdrawable Amount</div>
          <div id="funds-withdrawable" style="font-size: 28px; font-weight: 900; font-family: var(--font-mono); margin: 6px 0;">₹0.00</div>
          <div style="font-size: 12px; color: var(--text-secondary);">T+1 settled clear balance</div>
        </div>
      </div>

      <!-- Transaction History / Ledger Section -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-subtle); flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 class="card-title">📜 Transaction Ledger & Account Statements</h3>
            <div style="font-size: 12px; color: var(--text-tertiary);">All debit and credit records with timestamps and references.</div>
          </div>
          <div class="chips-bar" style="margin: 0;" id="ledger-filter-chips">
            <button class="chip active" onclick="FundsView.filterLedger('ALL')">All</button>
            <button class="chip" onclick="FundsView.filterLedger('DEPOSIT')">Deposits</button>
            <button class="chip" onclick="FundsView.filterLedger('WITHDRAWAL')">Withdrawals</button>
            <button class="chip" onclick="FundsView.filterLedger('BUY_TRADE')">Buy Trades</button>
            <button class="chip" onclick="FundsView.filterLedger('SELL_TRADE')">Sell Trades</button>
          </div>
        </div>

        <div class="data-table-wrapper" style="border: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Description</th>
                <th>Payment Mode / Ref</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody id="ledger-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.loadFunds();
  },

  async loadFunds() {
    try {
      const [funds, txns] = await Promise.all([
        api.get('/funds'),
        api.get('/funds/transactions')
      ]);

      Store.funds = funds;

      document.getElementById('funds-avail-cash').textContent = formatMoney(funds.availableCash);
      document.getElementById('funds-used-margin').textContent = formatMoney(funds.usedMargin);
      document.getElementById('funds-total-cap').textContent = formatMoney(funds.totalSimulatedCapital);
      document.getElementById('funds-withdrawable').textContent = formatMoney(funds.withdrawableAmount);

      this.txns = txns;
      this.renderLedger();
    } catch (err) {
      Toast.error('Failed to load funds.');
    }
  },

  renderLedger() {
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;

    let list = this.txns || [];
    if (this.activeLedgerFilter !== 'ALL') {
      list = list.filter(t => t.type === this.activeLedgerFilter);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <div class="empty-state">
              <div class="empty-state-title">No transactions found</div>
              <p class="empty-state-desc">Transactions such as deposits, withdrawals, and trade debits/credits appear here.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(t => {
      const isCredit = t.type === 'DEPOSIT' || t.type === 'SELL_TRADE';
      const amountClass = isCredit ? 'gain' : 'loss';
      const sign = isCredit ? '+' : '-';

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700; font-size: 13px;">${t.id}</td>
          <td style="font-size: 12.5px; color: var(--text-tertiary);">${formatDate(t.createdAt)} ${formatTime(t.createdAt)}</td>
          <td>
            <span class="badge ${isCredit ? 'badge-gain' : 'badge-neutral'}">${t.type.replace('_', ' ')}</span>
          </td>
          <td style="font-size: 13.5px;">${t.description}</td>
          <td style="font-size: 12px; color: var(--text-secondary); font-family: var(--font-mono);">${t.paymentMethod}</td>
          <td style="text-align: right; font-weight: 800; font-family: var(--font-mono); font-size: 15px;" class="${amountClass}">
            ${sign}${formatMoney(t.amount)}
          </td>
        </tr>
      `;
    }).join('');
  },

  filterLedger(filter) {
    this.activeLedgerFilter = filter;
    document.querySelectorAll('#ledger-filter-chips .chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toUpperCase().includes(filter) || (filter === 'ALL' && btn.textContent === 'All'));
    });
    this.renderLedger();
  },

  openAddFundsModal() {
    Modal.confirm({
      title: 'Add Simulated Funds',
      message: `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div class="form-group" style="margin: 0;">
            <label>Amount to Add (₹)</label>
            <input type="number" id="add-funds-amount-input" class="input" value="100000" min="1000" step="5000">
          </div>
          <div class="chips-bar" style="margin: 0;">
            <button type="button" class="chip" onclick="document.getElementById('add-funds-amount-input').value=50000">+₹50,000</button>
            <button type="button" class="chip" onclick="document.getElementById('add-funds-amount-input').value=100000">+₹1,00,000</button>
            <button type="button" class="chip" onclick="document.getElementById('add-funds-amount-input').value=500000">+₹5,00,000</button>
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Payment Method</label>
            <select id="add-funds-method-select" class="select">
              <option value="UPI (Simulated GPay)">⚡ UPI (GPay / PhonePe - Simulated)</option>
              <option value="Netbanking (HDFC Bank)">🏦 Netbanking (HDFC / SBI / ICICI - Simulated)</option>
              <option value="Debit Card">💳 Instant Debit Card (Simulated)</option>
            </select>
          </div>
        </div>
      `,
      confirmText: 'Add Funds Now',
      confirmClass: 'btn-success',
      onConfirm: async () => {
        const amt = parseFloat(document.getElementById('add-funds-amount-input').value);
        const method = document.getElementById('add-funds-method-select').value;
        try {
          const res = await api.post('/funds/deposit', { amount: amt, paymentMethod: method });
          Toast.success(res.message);
          this.loadFunds();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  },

  openWithdrawModal() {
    Modal.confirm({
      title: 'Withdraw Funds',
      message: `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div class="form-group" style="margin: 0;">
            <label>Withdrawal Amount (₹)</label>
            <input type="number" id="withdraw-funds-input" class="input" placeholder="Enter amount" min="500">
          </div>
          <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); font-size: 13px;">
            <div>Bank: <strong>HDFC Bank (A/C: *******7192)</strong></div>
            <div style="color: var(--text-tertiary); font-size: 12px; margin-top: 4px;">Simulated NEFT/IMPS transfer. Settled within 24 hours.</div>
          </div>
        </div>
      `,
      confirmText: 'Confirm Withdrawal',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const amt = parseFloat(document.getElementById('withdraw-funds-input').value);
        try {
          const res = await api.post('/funds/withdraw', { amount: amt });
          Toast.success(res.message);
          this.loadFunds();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
};
