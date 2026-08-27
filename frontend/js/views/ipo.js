// IPO Hub & Application View for NexTrade Pro

const IpoView = {
  activeStatus: 'ALL',
  ipos: [],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Initial Public Offerings (IPO)</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Apply for mainstream Indian primary market IPOs with simulated UPI ASBA mandates.</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="IpoView.loadIpos()">🔄 Refresh IPOs</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="chips-bar" id="ipo-tabs">
        <button class="chip active" onclick="IpoView.filterStatus('ALL')">All IPOs</button>
        <button class="chip" onclick="IpoView.filterStatus('OPEN')">🔥 Open for Bidding</button>
        <button class="chip" onclick="IpoView.filterStatus('UPCOMING')">📅 Upcoming</button>
        <button class="chip" onclick="IpoView.filterStatus('LISTED')">🏁 Recently Listed</button>
      </div>

      <!-- IPO Grid -->
      <div class="grid-2" id="ipos-grid">
        <!-- Injected dynamically -->
      </div>
    `;

    this.loadIpos();
  },

  async loadIpos() {
    try {
      const ipos = await api.get('/ipos');
      this.ipos = ipos;
      this.renderGrid();
    } catch (err) {
      Toast.error('Failed to load IPOs.');
    }
  },

  renderGrid() {
    const container = document.getElementById('ipos-grid');
    if (!container) return;

    let list = this.ipos || [];
    if (this.activeStatus !== 'ALL') {
      list = list.filter(i => i.status === this.activeStatus);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🏷️</div>
          <div class="empty-state-title">No IPOs in this category</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(ipo => {
      const isOpen = ipo.status === 'OPEN';
      const statusBadgeClass = isOpen ? 'badge-gain' : ipo.status === 'UPCOMING' ? 'badge-warning' : 'badge-neutral';

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0;">${ipo.company}</h3>
                <span style="font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono);">${ipo.symbol}</span>
              </div>
              <div style="display: flex; gap: 6px;">
                <span class="badge ${statusBadgeClass}">${ipo.status}</span>
                ${ipo.gmp ? `<span class="badge badge-gain">GMP: ${ipo.gmp}</span>` : ''}
              </div>
            </div>

            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
              ${ipo.description}
            </p>

            <div class="grid-3" style="background: var(--bg-surface-subtle); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 16px;">
              <div>
                <div style="font-size: 11px; color: var(--text-tertiary);">Price Band</div>
                <div style="font-weight: 800; font-family: var(--font-mono); font-size: 14px;">${ipo.priceBand}</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-tertiary);">Lot Size</div>
                <div style="font-weight: 800; font-family: var(--font-mono); font-size: 14px;">${ipo.lotSize} shares</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-tertiary);">Min. Investment</div>
                <div style="font-weight: 800; font-family: var(--font-mono); font-size: 14px;">₹${formatNumber(ipo.minInvestment)}</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
              <span>Bidding: <strong>${formatDate(ipo.openDate)} - ${formatDate(ipo.closeDate)}</strong></span>
              <span>Listing: <strong>${formatDate(ipo.listingDate)}</strong></span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
            <div style="font-size: 12px; color: var(--text-tertiary);">
              Issue Size: <strong>${ipo.issueSize}</strong>
            </div>
            ${isOpen ? `
              <button class="btn btn-primary btn-sm" onclick="IpoView.openApplyModal('${ipo.id}')">
                ⚡ Apply for IPO
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" disabled>
                ${ipo.status === 'UPCOMING' ? 'Opens Soon' : 'Closed'}
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  filterStatus(status) {
    this.activeStatus = status;
    document.querySelectorAll('#ipo-tabs .chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(status) || (status === 'ALL' && btn.textContent === 'All IPOs'));
    });
    this.renderGrid();
  },

  openApplyModal(ipoId) {
    const ipo = this.ipos.find(i => i.id === ipoId);
    if (!ipo) return;

    Modal.confirm({
      title: `Apply for ${ipo.company} IPO`,
      message: `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div class="form-group" style="margin: 0;">
            <label>Number of Lots (${ipo.lotSize} shares / lot)</label>
            <input type="number" id="ipo-apply-lots" class="input" value="1" min="1" max="13" oninput="IpoView.updateModalBlockAmt(${ipo.lotSize}, '${ipo.priceBand}')">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>UPI ID (Simulated Mandate)</label>
            <input type="text" id="ipo-apply-upi" class="input" value="bharath@okhdfcbank" placeholder="yourname@bank">
          </div>
          <div style="padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); font-size: 13px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Amount to Block:</span>
              <strong id="ipo-modal-block-amount" style="font-family: var(--font-mono); font-size: 15px;">₹${formatNumber(ipo.minInvestment)}</strong>
            </div>
            <div style="color: var(--text-tertiary); font-size: 11px; margin-top: 4px;">
              Simulated ASBA mandate will be authorized via virtual trading capital.
            </div>
          </div>
        </div>
      `,
      confirmText: 'Submit Application',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const lots = parseInt(document.getElementById('ipo-apply-lots').value, 10) || 1;
        const upiId = document.getElementById('ipo-apply-upi').value.trim();
        try {
          const res = await api.post(`/ipos/${ipo.id}/apply`, { lots, upiId });
          Toast.success(res.message);
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  },

  updateModalBlockAmt(lotSize, priceBand) {
    const lots = parseInt(document.getElementById('ipo-apply-lots')?.value, 10) || 1;
    const maxPrice = parseFloat(priceBand.split('-')[1]?.replace(/[^0-9.]/g, '')) || 100;
    const total = lots * lotSize * maxPrice;
    const el = document.getElementById('ipo-modal-block-amount');
    if (el) el.textContent = formatMoney(total);
  }
};
