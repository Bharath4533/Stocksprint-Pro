// Mobile Phone OTP Login & Registration Modal for StockSprint Pro

const AuthModal = {
  currentPhone: '',
  activeOtpCode: '',
  isSending: false,

  open() {
    let modalEl = document.getElementById('phone-auth-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'phone-auth-modal';
      modalEl.className = 'modal-backdrop';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 440px; text-align: center; padding: 32px 28px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 36px; height: 36px; line-height: 36px; background: var(--brand-primary); color: #000; font-size: 18px; font-weight: 900; border-radius: 8px;">S</div>
            <span style="font-size: 18px; font-weight: 900; letter-spacing: -0.5px;">Stock<span>Sprint</span> <small style="font-size: 10px; background: var(--bg-surface-subtle); padding: 1px 4px; border-radius: 3px; color: var(--brand-primary);">PRO</small></span>
          </div>
          <button class="modal-close" onclick="AuthModal.close()">&times;</button>
        </div>

        <div id="auth-modal-step-container">
          <!-- Step 1: Enter Phone Number -->
          <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 6px;">Login with Mobile OTP</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 22px;">Enter your 10-digit Indian mobile number to access your ₹5,00,000 trading account.</p>

          <div class="form-group" style="text-align: left;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Mobile Number</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="padding: 10px 12px; background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-weight: 700; font-size: 14px;">🇮🇳 +91</span>
              <input type="tel" id="auth-phone-input" class="input" placeholder="e.g. 9876543210" maxlength="10" style="font-size: 16px; font-family: var(--font-mono); font-weight: 700;" autofocus>
            </div>
          </div>

          <div id="auth-phone-status" style="margin: 10px 0; font-size: 12.5px;"></div>

          <button id="btn-auth-send" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;" onclick="AuthModal.handleSendOtp()">
            📲 Send Verification OTP
          </button>

          <div style="margin-top: 20px; font-size: 12px; color: var(--text-tertiary);">
            By continuing, you agree to StockSprint Pro's Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    `;

    modalEl.classList.add('active');
    FirebaseAuthService.init();
  },

  async handleSendOtp() {
    const input = document.getElementById('auth-phone-input');
    const statusDiv = document.getElementById('auth-phone-status');
    const btn = document.getElementById('btn-auth-send');
    const phone = input ? input.value.trim() : '';

    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
      Toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    this.currentPhone = phone;
    if (btn) btn.disabled = true;
    if (statusDiv) statusDiv.innerHTML = '<span style="color:var(--brand-primary);">Sending OTP to mobile...</span>';

    try {
      const res = await FirebaseAuthService.sendRealSMS(phone);
      this.activeOtpCode = res.devOtp || '123456';
      Toast.success(res.message);
      this.renderOtpStep();
    } catch (err) {
      if (btn) btn.disabled = false;
      if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--loss-red);">${err.message}</span>`;
      Toast.error(err.message);
    }
  },

  renderOtpStep() {
    const container = document.getElementById('auth-modal-step-container');
    if (!container) return;

    container.innerHTML = `
      <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 6px;">Enter 6-Digit Code</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">We dispatched a verification code to <strong>+91 ${this.currentPhone}</strong>.</p>

      <div style="padding: 12px 14px; background: rgba(0, 208, 132, 0.08); border: 1px dashed var(--brand-primary); border-radius: var(--radius-sm); margin-bottom: 18px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><strong>OTP Code:</strong></span>
          <span style="font-family: var(--font-mono); font-size: 18px; font-weight: 800; color: var(--brand-primary); letter-spacing: 3px;">${this.activeOtpCode}</span>
        </div>
      </div>

      <div class="form-group" style="text-align: left;">
        <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">6-Digit OTP</label>
        <input type="text" id="auth-otp-input" class="input" placeholder="••••••" maxlength="6" style="letter-spacing: 8px; font-size: 22px; font-family: var(--font-mono); text-align: center;" value="${this.activeOtpCode}" autofocus>
      </div>

      <div id="auth-verify-status" style="margin: 10px 0; font-size: 12.5px;"></div>

      <button id="btn-auth-verify" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;" onclick="AuthModal.handleVerifyOtp()">
        🚀 Verify & Login
      </button>

      <div style="margin-top: 14px; text-align: center;">
        <button class="btn btn-ghost btn-sm" onclick="AuthModal.handleSendOtp()">Resend OTP</button>
        <span style="color: var(--text-tertiary); margin: 0 6px;">•</span>
        <button class="btn btn-ghost btn-sm" onclick="AuthModal.open()">Change Number</button>
      </div>
    `;
  },

  async handleVerifyOtp() {
    const input = document.getElementById('auth-otp-input');
    const statusDiv = document.getElementById('auth-verify-status');
    const btn = document.getElementById('btn-auth-verify');
    const otp = input ? input.value.trim() : '';

    if (!otp || otp.length < 4) {
      Toast.error('Please enter the 6-digit OTP code.');
      return;
    }

    if (btn) btn.disabled = true;
    if (statusDiv) statusDiv.innerHTML = '<span style="color:var(--brand-primary);">Verifying and logging in...</span>';

    try {
      const loginRes = await FirebaseAuthService.verifyRealSMS(this.currentPhone, otp);
      Toast.success(`Welcome ${loginRes.user.name}!`);
      this.close();
      window.location.hash = '#/dashboard';
      if (typeof App !== 'undefined' && App.renderCurrentRoute) {
        App.renderCurrentRoute();
      }
    } catch (err) {
      if (btn) btn.disabled = false;
      if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--loss-red);">${err.message}</span>`;
      Toast.error(err.message);
    }
  },

  close() {
    const modalEl = document.getElementById('phone-auth-modal');
    if (modalEl) modalEl.classList.remove('active');
  }
};

window.AuthModal = AuthModal;
