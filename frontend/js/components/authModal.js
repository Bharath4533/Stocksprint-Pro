// Password-Based Authentication Modal for StockSprint Pro
// Features: Email/Mobile + Password Login, New User Registration, and 1-Click Demo Login

const AuthModal = {
  currentTab: 'login', // 'login' | 'register'

  open(tab = 'login') {
    this.currentTab = tab;
    let modalEl = document.getElementById('password-auth-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'password-auth-modal';
      modalEl.className = 'modal-backdrop';
      document.body.appendChild(modalEl);
    }

    this.render();
    modalEl.classList.add('active');
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  render() {
    const modalEl = document.getElementById('password-auth-modal');
    if (!modalEl) return;

    const isLogin = this.currentTab === 'login';

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 440px; padding: 28px 24px; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 34px; height: 34px; line-height: 34px; text-align: center; background: var(--brand-primary); color: #000; font-size: 18px; font-weight: 900; border-radius: 8px;">S</div>
            <span style="font-size: 18px; font-weight: 900; letter-spacing: -0.5px;">Stock<span>Sprint</span> <small style="font-size: 10px; background: var(--bg-surface-subtle); padding: 2px 6px; border-radius: 4px; color: var(--brand-primary);">PRO</small></span>
          </div>
          <button class="modal-close" onclick="AuthModal.close()">&times;</button>
        </div>

        <!-- Auth Tabs -->
        <div style="display: flex; background: var(--bg-surface-subtle); padding: 4px; border-radius: var(--radius-sm); margin-bottom: 22px;">
          <button class="btn ${isLogin ? 'btn-primary' : 'btn-ghost'}" style="flex: 1; padding: 8px; font-weight: 700; font-size: 13.5px;" onclick="AuthModal.switchTab('login')">
            Sign In
          </button>
          <button class="btn ${!isLogin ? 'btn-primary' : 'btn-ghost'}" style="flex: 1; padding: 8px; font-weight: 700; font-size: 13.5px;" onclick="AuthModal.switchTab('register')">
            Create Account
          </button>
        </div>

        ${isLogin ? this.renderLoginForm() : this.renderRegisterForm()}

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-subtle); text-align: center;">
          <button class="btn btn-outline" style="width: 100%; font-size: 13px;" onclick="AuthModal.handleDemoLogin()">
            ⚡ Instant 1-Click Demo Login (₹5,00,000 Balance)
          </button>
        </div>
      </div>
    `;
  },

  renderLoginForm() {
    return `
      <form onsubmit="event.preventDefault(); AuthModal.handleLogin();">
        <div class="form-group" style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Email Address or Mobile Number</label>
          <input type="text" id="auth-login-identifier" class="input" placeholder="e.g. name@domain.com or 9876543210" required autofocus>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 0;">Password</label>
          </div>
          <input type="password" id="auth-login-password" class="input" placeholder="Enter your account password" required>
        </div>

        <div id="auth-login-error" style="color: var(--loss-red); font-size: 12.5px; margin-bottom: 12px; display: none;"></div>

        <button type="submit" id="btn-login-submit" class="btn btn-primary btn-lg" style="width: 100%;">
          🔐 Sign In
        </button>

        <div style="margin-top: 14px; text-align: center; font-size: 12.5px; color: var(--text-secondary);">
          Don't have an account? <a href="javascript:void(0)" onclick="AuthModal.switchTab('register')" style="color: var(--brand-primary); font-weight: 700;">Create one now</a>
        </div>
      </form>
    `;
  },

  renderRegisterForm() {
    return `
      <form onsubmit="event.preventDefault(); AuthModal.handleRegister();">
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Full Legal Name</label>
          <input type="text" id="auth-reg-name" class="input" placeholder="e.g. Rahul Sharma" required autofocus>
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Mobile Number</label>
          <input type="tel" id="auth-reg-phone" class="input" placeholder="10-digit mobile number" maxlength="10" required>
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Email Address</label>
          <input type="email" id="auth-reg-email" class="input" placeholder="name@domain.com" required>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Create Password</label>
          <input type="password" id="auth-reg-password" class="input" placeholder="Minimum 6 characters" minlength="6" required>
        </div>

        <div id="auth-reg-error" style="color: var(--loss-red); font-size: 12.5px; margin-bottom: 12px; display: none;"></div>

        <button type="submit" id="btn-reg-submit" class="btn btn-primary btn-lg" style="width: 100%;">
          🚀 Create Account & Start Trading
        </button>

        <div style="margin-top: 14px; text-align: center; font-size: 12.5px; color: var(--text-secondary);">
          Already have an account? <a href="javascript:void(0)" onclick="AuthModal.switchTab('login')" style="color: var(--brand-primary); font-weight: 700;">Sign In</a>
        </div>
      </form>
    `;
  },

  async handleLogin() {
    const identInput = document.getElementById('auth-login-identifier');
    const passInput = document.getElementById('auth-login-password');
    const errDiv = document.getElementById('auth-login-error');
    const btn = document.getElementById('btn-login-submit');

    const identifier = identInput ? identInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!identifier || !password) {
      if (errDiv) { errDiv.textContent = 'Please enter both identifier and password.'; errDiv.style.display = 'block'; }
      return;
    }

    if (btn) btn.disabled = true;
    if (errDiv) errDiv.style.display = 'none';

    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.token) {
        Store.setToken(res.token);
        Store.user = res.user;
        Toast.success(`Welcome back, ${res.user.name}!`);
        this.close();
        window.location.hash = '#/dashboard';
        if (typeof App !== 'undefined' && App.renderCurrentRoute) {
          App.renderCurrentRoute();
        }
      }
    } catch (err) {
      if (btn) btn.disabled = false;
      if (errDiv) {
        errDiv.textContent = err.message || 'Login failed. Please check your credentials.';
        errDiv.style.display = 'block';
      }
      Toast.error(err.message);
    }
  },

  async handleRegister() {
    const name = document.getElementById('auth-reg-name')?.value.trim();
    const phone = document.getElementById('auth-reg-phone')?.value.trim();
    const email = document.getElementById('auth-reg-email')?.value.trim();
    const password = document.getElementById('auth-reg-password')?.value.trim();
    const errDiv = document.getElementById('auth-reg-error');
    const btn = document.getElementById('btn-reg-submit');

    if (!name || !phone || !email || !password) {
      if (errDiv) { errDiv.textContent = 'Please fill out all fields.'; errDiv.style.display = 'block'; }
      return;
    }

    if (password.length < 6) {
      if (errDiv) { errDiv.textContent = 'Password must be at least 6 characters.'; errDiv.style.display = 'block'; }
      return;
    }

    if (btn) btn.disabled = true;
    if (errDiv) errDiv.style.display = 'none';

    try {
      const res = await api.post('/auth/register', { name, phone, email, password });
      if (res.token) {
        Store.setToken(res.token);
        Store.user = res.user;
        Toast.success(`Account created! Welcome to StockSprint Pro, ${res.user.name}!`);
        this.close();
        window.location.hash = '#/dashboard';
        if (typeof App !== 'undefined' && App.renderCurrentRoute) {
          App.renderCurrentRoute();
        }
      }
    } catch (err) {
      if (btn) btn.disabled = false;
      if (errDiv) {
        errDiv.textContent = err.message || 'Registration failed.';
        errDiv.style.display = 'block';
      }
      Toast.error(err.message);
    }
  },

  async handleDemoLogin() {
    try {
      const res = await api.post('/auth/demo');
      if (res.token) {
        Store.setToken(res.token);
        Store.user = res.user;
        Toast.success('Logged in with Demo Account (₹5,00,000 Balance)!');
        this.close();
        window.location.hash = '#/dashboard';
        if (typeof App !== 'undefined' && App.renderCurrentRoute) {
          App.renderCurrentRoute();
        }
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  close() {
    const modalEl = document.getElementById('password-auth-modal');
    if (modalEl) modalEl.classList.remove('active');
  }
};

window.AuthModal = AuthModal;
