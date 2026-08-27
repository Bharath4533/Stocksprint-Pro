// 12-Step Indian KYC & User Onboarding Wizard for NexTrade Pro

const OnboardingView = {
  currentStep: 1,
  totalSteps: 12,
  formData: {
    phone: '+91 98765 43210',
    email: 'user@nextrade.in',
    pan: 'ABCDE1234F',
    dob: '1996-05-14',
    accountNumber: '50100492837192',
    ifsc: 'HDFC0001234',
    nomineeName: 'Ananya Devan',
    nomineeRelation: 'Spouse',
    address: '42 Financial District, Hyderabad, 500081',
    riskProfile: 'GROWTH'
  },

  render(container) {
    this.currentStep = 1;
    container.innerHTML = `
      <div style="max-width: 680px; margin: 0 auto;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary);">NexTrade Onboarding & KYC</h1>
          <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">Complete your simulated Indian regulatory KYC onboarding in simple steps.</p>
        </div>

        <!-- Progress Bar -->
        <div class="card" style="margin-bottom: 24px; padding: 18px 24px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
            <span>Step <span id="kyc-step-num">1</span> of 12</span>
            <span id="kyc-step-title">Mobile Verification</span>
          </div>
          <div style="height: 8px; background: var(--bg-surface-subtle); border-radius: 4px; overflow: hidden;">
            <div id="kyc-progress-fill" style="width: 8.33%; height: 100%; background: var(--brand-primary); border-radius: 4px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Wizard Step Container -->
        <div class="card" id="kyc-step-body" style="padding: 28px;">
          <!-- Injected dynamically by step -->
        </div>
      </div>
    `;

    this.renderCurrentStep();
  },

  renderCurrentStep() {
    const body = document.getElementById('kyc-step-body');
    const stepNum = document.getElementById('kyc-step-num');
    const stepTitle = document.getElementById('kyc-step-title');
    const progressFill = document.getElementById('kyc-progress-fill');

    if (!body) return;

    if (stepNum) stepNum.textContent = this.currentStep;
    if (progressFill) progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;

    let title = '';
    let content = '';

    switch (this.currentStep) {
      case 1:
        title = 'Step 1: Mobile Verification';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Enter your Mobile Number</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">We will send a 6-digit OTP for identity verification.</p>
          <div class="form-group">
            <label>Mobile Number</label>
            <input type="text" id="ob-phone" class="input" value="${this.formData.phone}">
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Send OTP</button>
        `;
        break;
      case 2:
        title = 'Step 2: OTP Verification';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Verify Mobile OTP</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">Enter the 6-digit code (Use demo code: <strong>123456</strong>)</p>
          <div class="form-group">
            <label>6-Digit OTP</label>
            <input type="text" id="ob-otp" class="input" value="123456" maxlength="6" style="letter-spacing: 4px; font-size: 18px; text-align: center;">
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Verify OTP</button>
        `;
        break;
      case 3:
        title = 'Step 3: Email Address';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Verify Email Address</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">For contract notes and account statements.</p>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="ob-email" class="input" value="${this.formData.email}">
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Continue</button>
        `;
        break;
      case 4:
        title = 'Step 4: PAN Card Verification';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Permanent Account Number (PAN)</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">Mandatory for Indian financial market trading.</p>
          <div class="form-group">
            <label>PAN Number (10 Alphanumeric)</label>
            <input type="text" id="ob-pan" class="input" value="${this.formData.pan}" maxlength="10" style="text-transform: uppercase;">
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Verify with NSDL</button>
        `;
        break;
      case 5:
        title = 'Step 5: Date of Birth';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Date of Birth</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">Must match official PAN records.</p>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="ob-dob" class="input" value="${this.formData.dob}">
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Continue</button>
        `;
        break;
      case 6:
        title = 'Step 6: Personal Information';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Personal Details</h3>
          <div class="form-group">
            <label>Marital Status</label>
            <select class="select"><option>Single</option><option selected>Married</option></select>
          </div>
          <div class="form-group">
            <label>Occupation</label>
            <select class="select"><option selected>Professional / IT</option><option>Business</option><option>Student</option></select>
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Continue</button>
        `;
        break;
      case 7:
        title = 'Step 7: Bank Account Details';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Link Bank Account</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">We will verify account ownership via instant Penny Drop.</p>
          <div class="form-group">
            <label>Bank Account Number</label>
            <input type="text" id="ob-bank-acc" class="input" value="${this.formData.accountNumber}">
          </div>
          <div class="form-group">
            <label>IFSC Code</label>
            <input type="text" id="ob-ifsc" class="input" value="${this.formData.ifsc}" style="text-transform: uppercase;">
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Verify Bank</button>
        `;
        break;
      case 8:
        title = 'Step 8: Nominee Details';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Nominee Declaration</h3>
          <div class="form-group">
            <label>Nominee Name</label>
            <input type="text" class="input" value="${this.formData.nomineeName}">
          </div>
          <div class="form-group">
            <label>Relationship</label>
            <input type="text" class="input" value="${this.formData.nomineeRelation}">
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Continue</button>
        `;
        break;
      case 9:
        title = 'Step 9: Residential Address';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Communication Address</h3>
          <div class="form-group">
            <label>Complete Address</label>
            <textarea class="input" rows="3">${this.formData.address}</textarea>
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Continue</button>
        `;
        break;
      case 10:
        title = 'Step 10: Digital KYC / Digilocker';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Aadhaar Digilocker Verification</h3>
          <div style="padding: 16px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 16px;">
            <div style="font-weight: 700; color: var(--gain-green);">✅ DigiLocker Instant Verification Active</div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">Aadhaar documents retrieved securely via government DigiLocker gateway.</div>
          </div>
          <button class="btn btn-primary" style="width: 100%;" onclick="OnboardingView.nextStep()">Proceed</button>
        `;
        break;
      case 11:
        title = 'Step 11: Risk Profile Assessment';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 12px;">Investor Risk Profile</h3>
          <div class="form-group">
            <label>Investment Objective</label>
            <select class="select">
              <option>Conservative (Capital Preservation)</option>
              <option selected>Growth & Moderate Capital Appreciation</option>
              <option>Aggressive Trading (High Volatility)</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="OnboardingView.nextStep()">Final Review</button>
        `;
        break;
      case 12:
        title = 'Step 12: Account Confirmation';
        content = `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">KYC Verification Complete!</h2>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px;">Your Indian paper trading account is fully activated with ₹5,00,000 in simulated trading capital.</p>
            <button class="btn btn-primary btn-lg" style="width: 100%;" onclick="OnboardingView.finishKYC()">🚀 Go to Dashboard & Trade</button>
          </div>
        `;
        break;
    }

    if (stepTitle) stepTitle.textContent = title;
    body.innerHTML = content;
  },

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderCurrentStep();
    }
  },

  async finishKYC() {
    try {
      await api.post('/profile/kyc/complete', {
        nominee: { name: this.formData.nomineeName, relation: this.formData.nomineeRelation },
        address: this.formData.address,
        riskProfile: 'GROWTH'
      });
      Toast.success('KYC Completed successfully!');
      window.location.hash = '#/dashboard';
    } catch (e) {
      window.location.hash = '#/dashboard';
    }
  }
};
