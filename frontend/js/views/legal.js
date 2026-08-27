// Regulatory Disclosures, SEBI Compliance, and Tariff Sheet View for NexTrade Pro

const LegalView = {
  async render(container) {
    container.innerHTML = `
      <div style="max-width: 880px; margin: 0 auto;">
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Regulatory Disclosures & Legal Compliance</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Statutory disclosures, SEBI risk warnings, and transparent brokerage charge schedules.</p>
        </div>

        <!-- SEBI Mandatory Risk Disclosure Card -->
        <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--warning-amber);">
          <h3 class="card-title" style="color: var(--warning-amber); margin-bottom: 12px;">⚠️ SEBI Risk Disclosures on Derivatives & Equity Trading</h3>
          <ul style="padding-left: 20px; font-size: 13.5px; color: var(--text-secondary); line-height: 1.6;">
            <li>9 out of 10 individual traders in equity Futures and Options Segment incurred net losses.</li>
            <li>On an average, loss makers registered net trading loss close to ₹50,000.</li>
            <li>Over and above the net trading losses, loss makers expended an additional 28% of net trading losses as transaction costs.</li>
            <li>Those making net trading profits incurred between 15% to 50% of such profits as transaction costs.</li>
          </ul>
          <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 12px;">Source: SEBI Study on Individual Traders in Equity Derivatives</div>
        </div>

        <!-- Paper Trading Notice -->
        <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--brand-accent);">
          <h3 class="card-title" style="color: var(--brand-accent); margin-bottom: 10px;">ℹ️ Live Feed & Paper Trading Platform Notice</h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5;">
            StockSprint Pro provides live exchange market data feeds with simulated execution for educational and analytical purposes. 
            Virtual orders are simulated with accurate Indian brokerage and statutory fees.
          </p>
        </div>

        <!-- Transparent Brokerage & Charges Schedule Table -->
        <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 24px;">
          <div style="padding: 16px 20px; background: var(--bg-surface-subtle); border-bottom: 1px solid var(--border-subtle);">
            <h3 class="card-title">💰 Brokerage & Statutory Charges Schedule</h3>
          </div>
          <div class="data-table-wrapper" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Charge Head</th>
                  <th>Equity Delivery (CNC)</th>
                  <th>Equity Intraday (MIS)</th>
                  <th>Direct Mutual Funds</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Brokerage</strong></td>
                  <td class="gain"><strong>₹0 (Zero Brokerage)</strong></td>
                  <td>₹20 or 0.03% (whichever lower)</td>
                  <td class="gain"><strong>₹0 (Direct Plan)</strong></td>
                </tr>
                <tr>
                  <td><strong>STT / CTT</strong></td>
                  <td>0.1% on Buy & Sell</td>
                  <td>0.025% on Sell only</td>
                  <td>Nil</td>
                </tr>
                <tr>
                  <td><strong>Exchange Turnover Fee</strong></td>
                  <td>0.00345% of Turnover</td>
                  <td>0.00345% of Turnover</td>
                  <td>Nil</td>
                </tr>
                <tr>
                  <td><strong>GST</strong></td>
                  <td>18% on (Brokerage + Exchange)</td>
                  <td>18% on (Brokerage + Exchange)</td>
                  <td>Nil</td>
                </tr>
                <tr>
                  <td><strong>SEBI Charges</strong></td>
                  <td>₹10 per Crore</td>
                  <td>₹10 per Crore</td>
                  <td>Nil</td>
                </tr>
                <tr>
                  <td><strong>Stamp Duty</strong></td>
                  <td>0.015% (₹1500 / Crore on Buy)</td>
                  <td>0.003% (₹300 / Crore on Buy)</td>
                  <td>0.005% on Purchase</td>
                </tr>
                <tr>
                  <td><strong>DP Charges</strong></td>
                  <td>₹15.93 per scrip (Sell side only)</td>
                  <td>Nil</td>
                  <td>Nil</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};
