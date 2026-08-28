// User Profile, Bank, Security, and Preferences View for NexTrade Pro

const ProfileView = {
  async render(container) {
    container.innerHTML = `
      <div style="max-width: 840px; margin: 0 auto;">
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">Account & Security Profile</h1>
          <p style="font-size: 13.5px; color: var(--text-secondary);">Manage your personal information, linked bank accounts, and trading preferences.</p>
        </div>

        <!-- User Profile Card -->
        <div class="card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--brand-primary); color: #000; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900;" id="prof-avatar">
                BD
              </div>
              <div>
                <h2 style="font-size: 18px; font-weight: 800; margin: 0;" id="prof-name">Bharath Devan</h2>
                <div style="font-size: 13px; color: var(--text-secondary);" id="prof-email">demo@nextrade.in</div>
              </div>
            </div>
            <span class="badge badge-gain" id="prof-kyc-badge">KYC VERIFIED</span>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="prof-input-name" class="input" value="Bharath Devan">
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="text" id="prof-input-phone" class="input" value="+91 98765 43210">
            </div>
            <div class="form-group">
              <label>Permanent Account Number (PAN)</label>
              <input type="text" id="prof-input-pan" class="input" value="ABC****34F" disabled style="background: var(--bg-surface-subtle); font-family: var(--font-mono);">
            </div>
            <div class="form-group">
              <label>Date of Birth</label>
              <input type="text" id="prof-input-dob" class="input" value="14 May 1996" disabled style="background: var(--bg-surface-subtle);">
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
            <button class="btn btn-primary btn-sm" onclick="ProfileView.saveProfile()">Save Changes</button>
          </div>
        </div>

        <!-- Bank Account Card -->
        <div class="card" style="margin-bottom: 24px;">
          <h3 class="card-title" style="margin-bottom: 16px;">🏦 Verified Bank Account (Penny Drop Verified)</h3>
          <div style="padding: 16px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 15px;">HDFC Bank Limited</strong>
              <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">Account: <strong style="font-family: var(--font-mono);">XXXXXXXX7192</strong></div>
              <div style="font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono);">IFSC: HDFC0001234 • Savings Account</div>
            </div>
            <span class="badge badge-gain">✅ Penny Drop Verified</span>
          </div>
        </div>

        <!-- Nominee Details -->
        <div class="card" style="margin-bottom: 24px;">
          <h3 class="card-title" style="margin-bottom: 16px;">👥 Nominee Details</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm);">
            <div>
              <strong>Ananya Devan</strong>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Relationship: Spouse (100% Share)</div>
            </div>
            <span class="badge badge-neutral">SEBI Compliant</span>
          </div>
        </div>

        <!-- Security & Preferences Card -->
        <div class="card" style="margin-bottom: 24px;">
          <h3 class="card-title" style="margin-bottom: 16px;">⚙️ Preferences & Security Settings</h3>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <strong>Dark Mode Theme</strong>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Switch between sleek dark and clean light fintech modes.</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="ProfileView.toggleTheme()">🌓 Toggle Dark/Light</button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <strong>Account Security & Password</strong>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Direct password verification on all sign-ins.</div>
            </div>
            <span class="badge badge-gain">Active</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <strong>Reset Paper Trading Balance</strong>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Reset portfolio and replenish virtual capital to ₹5,00,000.</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="ProfileView.resetDemoBalance()">🔄 Reset Funds</button>
          </div>
        </div>
      </div>
    `;

    this.loadProfile();
  },

  async loadProfile() {
    try {
      const data = await api.get('/profile');
      if (document.getElementById('prof-name')) {
        document.getElementById('prof-name').textContent = data.name;
        document.getElementById('prof-email').textContent = data.email;
        document.getElementById('prof-input-name').value = data.name;
        document.getElementById('prof-input-phone').value = data.phone || '';
        document.getElementById('prof-input-pan').value = data.pan || 'ABC****34F';
        document.getElementById('prof-avatar').textContent = data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
    }
  },

  async saveProfile() {
    const name = document.getElementById('prof-input-name').value;
    const phone = document.getElementById('prof-input-phone').value;
    try {
      await api.patch('/profile', { name, phone });
      Toast.success('Profile updated successfully.');
      this.loadProfile();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  toggleTheme() {
    const current = Store.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    Store.setTheme(next);
    Toast.info(`Theme set to ${next} mode.`);
  },

  resetDemoBalance() {
    Modal.confirm({
      title: 'Reset Simulated Balance',
      message: 'Are you sure you want to reset your paper trading balance to ₹5,00,000.00?',
      confirmText: 'Reset Balance',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        try {
          await api.post('/funds/deposit', { amount: 500000 });
          Toast.success('Simulated balance reset to ₹5,00,000.');
          if (typeof appInit === 'function') appInit();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
};
