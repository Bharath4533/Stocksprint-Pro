// Mutual Funds & Systematic Investment Plan (SIP) View for NexTrade Pro

const MutualFundsView = {
  activeCategory: 'ALL',
  funds: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Direct Mutual Funds & SIPs</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Discover top-performing Indian mutual funds with zero commission and automated SIPs.</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="MutualFundsView.openSipCalculatorModal()">🧮 SIP Compound Calculator</button>
      </div>

      <!-- Interactive SIP Calculator Banner Card -->
      <div class="card" style="margin-bottom: 28px; padding: 24px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, var(--bg-surface) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
          <div>
            <h3 class="card-title">🌱 SIP Wealth Growth Simulator</h3>
            <div style="font-size: 13px; color: var(--text-secondary);">See how regular monthly investments compound over time.</div>
          </div>
          <span class="badge badge-simulated">12% CAGR Baseline</span>
        </div>

        <div class="grid-3" style="margin-bottom: 18px;">
          <div class="form-group" style="margin: 0;">
            <label>Monthly Investment (₹)</label>
            <input type="number" id="sip-quick-amount" class="input" value="10000" step="1000" oninput="MutualFundsView.calcQuickSip()">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Expected Return Rate (% p.a.)</label>
            <input type="number" id="sip-quick-rate" class="input" value="14" step="0.5" oninput="MutualFundsView.calcQuickSip()">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Time Period (Years)</label>
            <input type="number" id="sip-quick-years" class="input" value="10" min="1" max="30" oninput="MutualFundsView.calcQuickSip()">
          </div>
        </div>

        <div style="display: flex; justify-content: space-around; background: var(--bg-surface-subtle); border-radius: var(--radius-md); padding: 16px; text-align: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 12px; color: var(--text-tertiary);">Total Amount Invested</div>
            <div id="sip-res-invested" style="font-size: 20px; font-weight: 800; font-family: var(--font-mono); margin-top: 4px;">₹12,00,000</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--text-tertiary);">Estimated Wealth Gain</div>
            <div id="sip-res-gain" style="font-size: 20px; font-weight: 800; font-family: var(--font-mono); color: var(--gain-green); margin-top: 4px;">+₹14,20,500</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--text-tertiary);">Expected Future Value</div>
            <div id="sip-res-total" style="font-size: 22px; font-weight: 900; font-family: var(--font-mono); color: var(--brand-accent); margin-top: 4px;">₹26,20,500</div>
          </div>
        </div>
      </div>

      <!-- Category Filter Chips -->
      <div class="chips-bar" id="mf-category-chips">
        <button class="chip active" onclick="MutualFundsView.filterCategory('ALL')">All Funds</button>
        <button class="chip" onclick="MutualFundsView.filterCategory('Flexi Cap')">Flexi Cap</button>
        <button class="chip" onclick="MutualFundsView.filterCategory('Small Cap')">Small Cap</button>
        <button class="chip" onclick="MutualFundsView.filterCategory('Large Cap')">Large Cap</button>
        <button class="chip" onclick="MutualFundsView.filterCategory('Hybrid')">Hybrid & Balanced</button>
      </div>

      <!-- Mutual Funds Grid -->
      <div class="grid-2" id="mutual-funds-grid">
        <!-- Injected dynamically -->
      </div>
    `;

    this.loadFunds();
    this.calcQuickSip();
  },

  async loadFunds() {
    try {
      const funds = await api.get('/mutual-funds');
      this.funds = funds;
      this.renderFunds();
    } catch (err) {
      Toast.error('Failed to load mutual funds.');
    }
  },

  renderFunds() {
    const container = document.getElementById('mutual-funds-grid');
    if (!container) return;

    let filtered = this.funds || [];
    if (this.activeCategory !== 'ALL') {
      filtered = filtered.filter(f => f.category.toLowerCase().includes(this.activeCategory.toLowerCase()));
    }

    container.innerHTML = filtered.map(f => `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0;">${f.name}</h3>
              <span class="badge badge-neutral" style="margin-top: 4px;">${f.category}</span>
            </div>
            <span class="badge badge-gain" style="font-size: 13px;">${f.returns3Y} (3Y CAGR)</span>
          </div>

          <div class="grid-3" style="margin: 16px 0; background: var(--bg-surface-subtle); padding: 12px; border-radius: var(--radius-sm);">
            <div>
              <div style="font-size: 11px; color: var(--text-tertiary);">NAV</div>
              <div style="font-weight: 800; font-family: var(--font-mono);">₹${f.nav}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-tertiary);">Fund Size (AUM)</div>
              <div style="font-weight: 700;">${f.aum}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-tertiary);">Expense Ratio</div>
              <div style="font-weight: 700;">${f.expenseRatio}</div>
            </div>
          </div>

          <div style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 16px;">
            <strong>Top Holdings:</strong> ${f.topHoldings ? f.topHoldings.join(', ') : 'Bluechip Equities'}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; color: var(--text-tertiary);">
            Min. SIP: <strong>₹${f.minSipAmount}</strong>
          </div>
          <button class="btn btn-primary btn-sm" onclick="MutualFundsView.openStartSipModal('${f.id}')">
            🌱 Start SIP
          </button>
        </div>
      </div>
    `).join('');
  },

  filterCategory(cat) {
    this.activeCategory = cat;
    document.querySelectorAll('#mf-category-chips .chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(cat) || (cat === 'ALL' && btn.textContent === 'All Funds'));
    });
    this.renderFunds();
  },

  async calcQuickSip() {
    const amount = parseFloat(document.getElementById('sip-quick-amount')?.value) || 10000;
    const rate = parseFloat(document.getElementById('sip-quick-rate')?.value) || 14;
    const years = parseInt(document.getElementById('sip-quick-years')?.value, 10) || 10;

    try {
      const res = await api.post('/mutual-funds/calculator', { amount, returnRate: rate, years });
      document.getElementById('sip-res-invested').textContent = formatMoney(res.totalInvested);
      document.getElementById('sip-res-gain').textContent = `+${formatMoney(res.estimatedWealthGain)}`;
      document.getElementById('sip-res-total').textContent = formatMoney(res.projectedFutureValue);
    } catch (e) {
      console.warn('SIP calc error:', e);
    }
  },

  openStartSipModal(fundId) {
    const fund = this.funds.find(f => f.id === fundId);
    if (!fund) return;

    Modal.confirm({
      title: `Start Monthly SIP in ${fund.name}`,
      message: `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div class="form-group" style="margin: 0;">
            <label>Monthly SIP Amount (₹)</label>
            <input type="number" id="sip-modal-amount" class="input" value="${fund.minSipAmount || 1000}" min="${fund.minSipAmount || 500}" step="500">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Monthly SIP Deduction Date</label>
            <select id="sip-modal-date" class="select">
              <option value="5">5th of every month</option>
              <option value="10" selected>10th of every month</option>
              <option value="15">15th of every month</option>
              <option value="25">25th of every month</option>
            </select>
          </div>
          <div style="font-size: 12px; color: var(--text-tertiary); background: var(--bg-surface-subtle); padding: 10px; border-radius: 6px;">
            Simulated SIP installment will be debited monthly from your trading balance.
          </div>
        </div>
      `,
      confirmText: 'Start SIP Now',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const amt = parseFloat(document.getElementById('sip-modal-amount').value);
        const date = parseInt(document.getElementById('sip-modal-date').value, 10);
        try {
          const res = await api.post('/mutual-funds/sips', { fundId, amount: amt, sipDate: date });
          Toast.success(res.message);
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
};
