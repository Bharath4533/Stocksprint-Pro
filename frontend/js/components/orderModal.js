// Order Ticket Modal & Bottom Sheet for NexTrade Pro

class OrderTicketModal {
  constructor() {
    this.currentStock = null;
    this.side = 'BUY';
    this.productType = 'CNC'; // CNC (Delivery) or MIS (Intraday)
    this.orderType = 'MARKET'; // MARKET, LIMIT, SL, SL_M
    this.quantity = 1;
    this.price = 0;
    this.triggerPrice = 0;
    this.init();
  }

  init() {
    if (document.getElementById('order-ticket-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'order-ticket-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header" id="order-header" style="background: var(--bg-surface-subtle);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="order-side-badge" class="badge badge-gain">BUY</span>
              <strong id="order-stock-symbol" style="font-size: 17px;">RELIANCE</strong>
              <span id="order-exchange-badge" class="badge badge-neutral">NSE</span>
            </div>
            <div style="font-size: 12px; color: var(--text-tertiary);" id="order-stock-name">Reliance Industries Ltd</div>
          </div>
          <div style="text-align: right;">
            <div id="order-stock-price" style="font-size: 19px; font-weight: 800; font-family: var(--font-mono);">₹0.00</div>
            <div id="order-stock-change" style="font-size: 12px; font-weight: 600;" class="gain">+0.00%</div>
          </div>
        </div>

        <div class="modal-body" style="padding: 20px 24px;">
          <!-- Product Selector: Delivery (CNC) vs Intraday (MIS) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
            <button id="btn-prod-cnc" class="btn btn-outline" style="border-width: 2px;" onclick="OrderModal.setProduct('CNC')">
              📦 Delivery (CNC)
            </button>
            <button id="btn-prod-mis" class="btn btn-outline" style="border-width: 2px;" onclick="OrderModal.setProduct('MIS')">
              ⚡ Intraday (MIS 5x)
            </button>
          </div>

          <!-- Order Type: Market vs Limit vs SL -->
          <div class="form-group">
            <label>Order Type</label>
            <div style="display: flex; gap: 8px;">
              <button id="btn-ord-market" class="chip active" onclick="OrderModal.setOrderType('MARKET')">Market</button>
              <button id="btn-ord-limit" class="chip" onclick="OrderModal.setOrderType('LIMIT')">Limit</button>
              <button id="btn-ord-sl" class="chip" onclick="OrderModal.setOrderType('SL')">SL</button>
            </div>
          </div>

          <!-- Quantity & Price Inputs -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
            <div class="form-group" style="margin: 0;">
              <label>Quantity (Shares)</label>
              <input type="number" id="order-qty-input" class="input" min="1" value="1" oninput="OrderModal.updateCalculations()">
            </div>
            <div class="form-group" style="margin: 0;">
              <label>Price (₹)</label>
              <input type="number" id="order-price-input" class="input" step="0.05" oninput="OrderModal.updateCalculations()">
            </div>
          </div>

          <div id="order-trigger-group" class="form-group" style="display: none; margin-bottom: 16px;">
            <label>Trigger Price (₹)</label>
            <input type="number" id="order-trigger-input" class="input" step="0.05" placeholder="Trigger price">
          </div>

          <!-- Live Financial Charges & Margin Breakdown Box -->
          <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 18px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-secondary);">Approx. Margin Required:</span>
              <strong id="calc-margin-val" style="font-family: var(--font-mono); font-size: 14px;">₹0.00</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--text-secondary);">Est. Charges (STT/GST/SEBI):</span>
              <span id="calc-charges-val" style="font-family: var(--font-mono); color: var(--text-secondary);">₹0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed var(--border-subtle);">
              <span style="color: var(--text-secondary);">Available Simulated Funds:</span>
              <span id="calc-avail-funds" style="font-family: var(--font-mono); font-weight: 600;">₹0.00</span>
            </div>
          </div>

          <!-- Simulated Paper Trading Notice -->
          <div style="font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center; gap: 6px;">
            <span>ℹ️</span>
            <span>Simulated Paper Trading Mode. No real financial capital at risk.</span>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-ghost" onclick="Modal.close('order-ticket-modal')">Cancel</button>
          <button id="btn-submit-order" class="btn btn-success" style="min-width: 140px;" onclick="OrderModal.submitOrder()">
            BUY RELIANCE
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async open(symbol, side = 'BUY') {
    this.init();
    let sec = (Store.stocks || []).find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!sec) {
      try {
        sec = await api.get(`/stocks/${symbol}`);
      } catch (e) {}
    }
    if (!sec) {
      Toast.error(`Could not load quote for ${symbol}`);
      return;
    }

    this.currentStock = sec;
    this.side = side.toUpperCase();
    this.productType = 'CNC';
    this.orderType = 'MARKET';
    this.quantity = 1;
    this.price = sec.price;

    document.getElementById('order-stock-symbol').textContent = sec.symbol;
    document.getElementById('order-stock-name').textContent = sec.name;
    document.getElementById('order-stock-price').textContent = formatMoney(sec.price);
    const chgEl = document.getElementById('order-stock-change');
    chgEl.textContent = formatPercent(sec.percentChange);
    chgEl.className = sec.percentChange >= 0 ? 'gain' : 'loss';

    const sideBadge = document.getElementById('order-side-badge');
    sideBadge.textContent = this.side;
    sideBadge.className = this.side === 'BUY' ? 'badge badge-gain' : 'badge badge-loss';

    document.getElementById('order-qty-input').value = 1;
    document.getElementById('order-price-input').value = sec.price;
    document.getElementById('order-price-input').disabled = true;

    this.setProduct('CNC');
    this.setOrderType('MARKET');
    this.updateCalculations();

    Modal.open('order-ticket-modal');
  }

  setProduct(prod) {
    this.productType = prod;
    const btnCnc = document.getElementById('btn-prod-cnc');
    const btnMis = document.getElementById('btn-prod-mis');
    if (prod === 'CNC') {
      btnCnc.className = 'btn btn-primary';
      btnMis.className = 'btn btn-outline';
    } else {
      btnCnc.className = 'btn btn-outline';
      btnMis.className = 'btn btn-primary';
    }
    this.updateCalculations();
  }

  setOrderType(type) {
    this.orderType = type;
    ['market', 'limit', 'sl'].forEach(t => {
      const btn = document.getElementById(`btn-ord-${t}`);
      if (btn) btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`btn-ord-${type.toLowerCase()}`);
    if (activeBtn) activeBtn.classList.add('active');

    const priceInput = document.getElementById('order-price-input');
    const triggerGroup = document.getElementById('order-trigger-group');

    if (type === 'MARKET') {
      priceInput.disabled = true;
      priceInput.value = this.currentStock ? this.currentStock.price : 0;
      triggerGroup.style.display = 'none';
    } else if (type === 'LIMIT') {
      priceInput.disabled = false;
      triggerGroup.style.display = 'none';
    } else if (type === 'SL') {
      priceInput.disabled = false;
      triggerGroup.style.display = 'block';
    }
    this.updateCalculations();
  }

  async updateCalculations() {
    if (!this.currentStock) return;
    const qty = parseInt(document.getElementById('order-qty-input').value, 10) || 1;
    const prc = this.orderType === 'MARKET' ? this.currentStock.price : (parseFloat(document.getElementById('order-price-input').value) || this.currentStock.price);

    const submitBtn = document.getElementById('btn-submit-order');
    submitBtn.textContent = `${this.side} ${this.currentStock.symbol}`;
    submitBtn.className = this.side === 'BUY' ? 'btn btn-success' : 'btn btn-danger';

    try {
      const estimate = await api.post('/orders/estimate', {
        symbol: this.currentStock.symbol,
        side: this.side,
        orderType: this.orderType,
        productType: this.productType,
        quantity: qty,
        price: prc
      });

      document.getElementById('calc-margin-val').textContent = formatMoney(estimate.requiredMargin);
      document.getElementById('calc-charges-val').textContent = formatMoney(estimate.charges.totalCharges);
      document.getElementById('calc-avail-funds').textContent = formatMoney(estimate.availableFunds);

      if (this.side === 'BUY' && !estimate.hasSufficientFunds) {
        document.getElementById('calc-margin-val').style.color = 'var(--loss-red)';
      } else {
        document.getElementById('calc-margin-val').style.color = 'var(--text-primary)';
      }
    } catch (e) {
      // Fallback local estimation
      const turnover = qty * prc;
      const margin = this.productType === 'MIS' ? turnover * 0.20 : turnover;
      document.getElementById('calc-margin-val').textContent = formatMoney(margin);
      document.getElementById('calc-charges-val').textContent = formatMoney(turnover * 0.001);
      document.getElementById('calc-avail-funds').textContent = formatMoney(Store.funds.availableCash || 500000);
    }
  }

  async submitOrder() {
    if (!this.currentStock) return;
    const qty = parseInt(document.getElementById('order-qty-input').value, 10);
    const prc = this.orderType === 'MARKET' ? this.currentStock.price : parseFloat(document.getElementById('order-price-input').value);
    const trgPrc = parseFloat(document.getElementById('order-trigger-input')?.value) || 0;

    if (!qty || qty < 1) {
      Toast.error('Please enter a valid quantity of at least 1 share.');
      return;
    }

    const estValue = formatMoney(qty * prc);

    // Show Confirmation Dialog
    Modal.confirm({
      title: `Confirm Simulated ${this.side} Order`,
      message: `
        <div style="font-size: 14px; line-height: 1.6;">
          <p>Are you sure you want to place this <strong>${this.productType}</strong> order?</p>
          <div style="margin-top: 10px; padding: 10px; background: var(--bg-surface-subtle); border-radius: 6px;">
            <strong>${this.side} ${qty} × ${this.currentStock.symbol}</strong><br>
            <span>Order Type: <strong>${this.orderType}</strong></span><br>
            <span>Estimated Value: <strong>${estValue}</strong></span>
          </div>
        </div>
      `,
      confirmText: `Confirm ${this.side}`,
      confirmClass: this.side === 'BUY' ? 'btn-success' : 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await api.post('/orders', {
            symbol: this.currentStock.symbol,
            side: this.side,
            orderType: this.orderType,
            productType: this.productType,
            quantity: qty,
            price: prc,
            triggerPrice: trgPrc
          });

          Toast.success(`Simulated order executed! ${this.side} ${qty} ${this.currentStock.symbol}`);
          Modal.close('order-ticket-modal');

          // Refresh state
          if (typeof appInit === 'function') appInit();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
}

const OrderModal = new OrderTicketModal();
