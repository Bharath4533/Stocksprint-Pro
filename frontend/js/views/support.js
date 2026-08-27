// Help Center, FAQs, and Customer Support View for NexTrade Pro

const SupportView = {
  tickets: [],
  faqs: [],

  async render(container) {
    container.innerHTML = `
      <div style="max-width: 880px; margin: 0 auto;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary);">Help & Support Center</h1>
          <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">Frequently asked questions, charges guide, and customer support ticket desk.</p>
          <button class="btn btn-primary" style="margin-top: 14px;" onclick="SupportView.openNewTicketModal()">✉️ Open Support Ticket</button>
        </div>

        <!-- FAQ Section -->
        <div class="card" style="margin-bottom: 28px; padding: 24px;">
          <h3 class="card-title" style="margin-bottom: 16px;">💡 Frequently Asked Questions</h3>
          <div id="support-faqs-list" style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Injected dynamically -->
          </div>
        </div>

        <!-- Support Tickets History -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface-subtle);">
            <h3 class="card-title">🎫 Your Support Tickets</h3>
          </div>
          <div class="data-table-wrapper" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="support-tickets-table-body">
                <!-- Injected dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.loadSupport();
  },

  async loadSupport() {
    try {
      const [faqs, tickets] = await Promise.all([
        api.get('/support/faqs'),
        api.get('/support/tickets')
      ]);

      this.faqs = faqs;
      this.tickets = tickets;

      // Render FAQs
      document.getElementById('support-faqs-list').innerHTML = faqs.map(faq => `
        <details style="padding: 14px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); cursor: pointer;">
          <summary style="font-weight: 700; color: var(--text-primary); font-size: 14.5px;">${faq.question}</summary>
          <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5; margin-top: 8px;">${faq.answer}</p>
        </details>
      `).join('');

      // Render Tickets
      const tbody = document.getElementById('support-tickets-table-body');
      if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-secondary);">No support tickets submitted.</td></tr>`;
      } else {
        tbody.innerHTML = tickets.map(t => `
          <tr>
            <td style="font-family: var(--font-mono); font-weight: 700;">${t.id}</td>
            <td style="font-size: 12.5px; color: var(--text-tertiary);">${formatDate(t.createdAt)}</td>
            <td><strong>${t.subject}</strong></td>
            <td><span class="badge badge-neutral">${t.category}</span></td>
            <td><span class="badge ${t.status === 'Resolved' ? 'badge-gain' : 'badge-warning'}">${t.status}</span></td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.warn('Failed to load support data:', e);
    }
  },

  openNewTicketModal() {
    Modal.confirm({
      title: 'Submit Support Ticket',
      message: `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div class="form-group" style="margin: 0;">
            <label>Subject</label>
            <input type="text" id="tck-modal-subj" class="input" placeholder="Brief summary of your query">
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Category</label>
            <select id="tck-modal-cat" class="select">
              <option>Trading & Orders</option>
              <option>Funds & Ledger</option>
              <option>KYC & Profile</option>
              <option>Mutual Funds & SIP</option>
              <option>General Support</option>
            </select>
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Description</label>
            <textarea id="tck-modal-desc" class="input" rows="3" placeholder="Provide details..."></textarea>
          </div>
        </div>
      `,
      confirmText: 'Submit Ticket',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const subject = document.getElementById('tck-modal-subj').value.trim();
        const category = document.getElementById('tck-modal-cat').value;
        const description = document.getElementById('tck-modal-desc').value.trim();

        if (!subject || !description) {
          Toast.error('Subject and description are required.');
          return;
        }

        try {
          const res = await api.post('/support/tickets', { subject, category, description });
          Toast.success(res.message);
          this.loadSupport();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
};
