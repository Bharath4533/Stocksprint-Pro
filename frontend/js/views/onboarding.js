// Streamlined Indian KYC Verification Wizard for StockSprint Pro
// 100% Direct User-Input Flow without OTP or DigiLocker

const OnboardingView = {
  currentStep: 1,
  totalSteps: 6,
  formData: {
    phone: '',
    email: '',
    pan: '',
    dob: '',
    maritalStatus: '',
    occupation: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    bankBranch: '',
    nomineeName: '',
    nomineeRelation: '',
    address: '',
    riskProfile: ''
  },
  panVerified: false,
  bankVerified: false,

  render(container) {
    this.currentStep = 1;
    container.innerHTML = `
      <div style="max-width: 680px; margin: 0 auto;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary);">StockSprint Indian KYC Verification</h1>
          <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">Complete your regulatory KYC in 6 quick steps to activate full trading capabilities.</p>
        </div>

        <!-- Progress Bar -->
        <div class="card" style="margin-bottom: 24px; padding: 18px 24px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
            <span>Step <span id="kyc-step-num">1</span> of 6</span>
            <span id="kyc-step-title">Contact Information</span>
          </div>
          <div style="height: 8px; background: var(--bg-surface-subtle); border-radius: 4px; overflow: hidden;">
            <div id="kyc-progress-fill" style="width: 16.6%; height: 100%; background: var(--brand-primary); border-radius: 4px; transition: width 0.3s ease;"></div>
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
        title = 'Step 1: Contact Information';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 8px;">Contact & Registration Details</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">Enter your active mobile number and email for trade alerts and contract notes.</p>
          
          <div class="form-group" style="margin-bottom: 14px;">
            <label>10-Digit Indian Mobile Number</label>
            <input type="tel" id="ob-phone" class="input" placeholder="e.g. 9876543210" maxlength="10" value="${this.formData.phone || ''}">
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label>Registered Email Address</label>
            <input type="email" id="ob-email" class="input" placeholder="name@domain.com" value="${this.formData.email || ''}">
          </div>

          <button class="btn btn-primary btn-lg" style="width: 100%;" onclick="OnboardingView.handleStep1Contact()">
            Continue to PAN Validation ➔
          </button>
        `;
        break;

      case 2:
        title = 'Step 2: Income Tax PAN Validation';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 8px;">Permanent Account Number (PAN)</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">Mandatory for Indian financial securities and demat trading.</p>
          
          <div class="form-group" style="margin-bottom: 14px;">
            <label>10-Character PAN Number (e.g. ABCDE1234F)</label>
            <input type="text" id="ob-pan-input" class="input" placeholder="Enter your 10-character PAN" value="${this.formData.pan || ''}" maxlength="10" style="text-transform: uppercase; font-family: var(--font-mono); font-size: 16px;">
          </div>

          <div id="pan-verify-status" style="margin: 10px 0; font-size: 12.5px;"></div>

          <div style="display: flex; gap: 10px; margin-top: 14px;">
            <button class="btn btn-ghost" onclick="OnboardingView.goToStep(1)">Back</button>
            <button class="btn btn-primary" style="flex: 1;" onclick="OnboardingView.handleVerifyPan()">
              🔍 Validate PAN & Continue
            </button>
          </div>
        `;
        break;

      case 3:
        title = 'Step 3: Personal Information';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 8px;">Personal Information</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">SEBI regulatory demographic requirements.</p>
          
          <div class="form-group" style="margin-bottom: 14px;">
            <label>Date of Birth</label>
            <input type="date" id="ob-dob" class="input" value="${this.formData.dob || ''}">
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label>Marital Status</label>
            <select id="ob-marital" class="select">
              <option value="" disabled ${!this.formData.maritalStatus ? 'selected' : ''}>-- Select Marital Status --</option>
              <option value="Single" ${this.formData.maritalStatus === 'Single' ? 'selected' : ''}>Single</option>
              <option value="Married" ${this.formData.maritalStatus === 'Married' ? 'selected' : ''}>Married</option>
              <option value="Other" ${this.formData.maritalStatus === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label>Occupation</label>
            <select id="ob-occupation" class="select">
              <option value="" disabled ${!this.formData.occupation ? 'selected' : ''}>-- Select Occupation --</option>
              <option value="Salaried" ${this.formData.occupation === 'Salaried' ? 'selected' : ''}>Salaried (Private / Public Sector)</option>
              <option value="Self-Employed" ${this.formData.occupation === 'Self-Employed' ? 'selected' : ''}>Self-Employed / Freelancer</option>
              <option value="Business" ${this.formData.occupation === 'Business' ? 'selected' : ''}>Business Owner / Trader</option>
              <option value="Professional" ${this.formData.occupation === 'Professional' ? 'selected' : ''}>Professional (Doctor, CA, Lawyer, Engineer)</option>
              <option value="Student" ${this.formData.occupation === 'Student' ? 'selected' : ''}>Student</option>
              <option value="Retired" ${this.formData.occupation === 'Retired' ? 'selected' : ''}>Retired</option>
            </select>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-ghost" onclick="OnboardingView.goToStep(2)">Back</button>
            <button class="btn btn-primary" style="flex: 1;" onclick="OnboardingView.handleSavePersonalDetails()">Continue ➔</button>
          </div>
        `;
        break;

      case 4:
        title = 'Step 4: Bank Account & Live RBI IFSC Lookup';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 8px;">Link Bank Account</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">Live lookup verifies your bank branch directly from the RBI IFSC Registry.</p>
          
          <div class="form-group" style="margin-bottom: 14px;">
            <label>Bank Account Number</label>
            <input type="text" id="ob-bank-acc" class="input" placeholder="Enter your 9-18 digit account number" value="${this.formData.accountNumber || ''}">
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label>11-Character IFSC Code</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="ob-ifsc" class="input" placeholder="e.g. HDFC0001234" value="${this.formData.ifsc || ''}" style="text-transform: uppercase; font-family: var(--font-mono);">
              <button class="btn btn-outline" type="button" onclick="OnboardingView.handleLookupIfsc()">Lookup</button>
            </div>
          </div>

          <div id="bank-lookup-card" style="padding: 12px 14px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 16px; display: none;">
            <div style="font-weight: 700; font-size: 13.5px; color: var(--gain-green);" id="bank-lookup-name"></div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;" id="bank-lookup-branch"></div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-ghost" onclick="OnboardingView.goToStep(3)">Back</button>
            <button class="btn btn-primary" style="flex: 1;" onclick="OnboardingView.handleVerifyBank()">Verify Bank & Continue ➔</button>
          </div>
        `;
        break;

      case 5:
        title = 'Step 5: SEBI Nominee Declaration';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 8px;">SEBI Nominee Declaration</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">Appoint a nominee for your trading and demat securities.</p>
          
          <div class="form-group" style="margin-bottom: 14px;">
            <label>Nominee Full Legal Name</label>
            <input type="text" id="ob-nominee-name" class="input" placeholder="Enter nominee's full name" value="${this.formData.nomineeName || ''}">
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label>Relationship with Nominee</label>
            <select id="ob-nominee-rel" class="select">
              <option value="" disabled ${!this.formData.nomineeRelation ? 'selected' : ''}>-- Select Relationship --</option>
              <option value="Spouse" ${this.formData.nomineeRelation === 'Spouse' ? 'selected' : ''}>Spouse</option>
              <option value="Father" ${this.formData.nomineeRelation === 'Father' ? 'selected' : ''}>Father</option>
              <option value="Mother" ${this.formData.nomineeRelation === 'Mother' ? 'selected' : ''}>Mother</option>
              <option value="Child" ${this.formData.nomineeRelation === 'Child' ? 'selected' : ''}>Child (Son/Daughter)</option>
              <option value="Sibling" ${this.formData.nomineeRelation === 'Sibling' ? 'selected' : ''}>Sibling (Brother/Sister)</option>
              <option value="Other" ${this.formData.nomineeRelation === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-ghost" onclick="OnboardingView.goToStep(4)">Back</button>
            <button class="btn btn-primary" style="flex: 1;" onclick="OnboardingView.handleSaveNominee()">Continue ➔</button>
          </div>
        `;
        break;

      case 6:
        title = 'Step 6: Residential Address & Risk Profile';
        content = `
          <h3 style="font-size: 18px; margin-bottom: 8px;">Address & Investor Profile</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">Enter your address and select your investment risk tolerance.</p>
          
          <div class="form-group" style="margin-bottom: 14px;">
            <label>Full Residential Address with Pincode</label>
            <textarea id="ob-address" class="input" rows="3" placeholder="Enter full address, city, state and 6-digit pincode...">${this.formData.address || ''}</textarea>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label>Investor Risk Profile</label>
            <select id="ob-risk" class="select">
              <option value="" disabled ${!this.formData.riskProfile ? 'selected' : ''}>-- Select Risk Profile --</option>
              <option value="CONSERVATIVE" ${this.formData.riskProfile === 'CONSERVATIVE' ? 'selected' : ''}>Conservative (Capital Preservation & Low Volatility)</option>
              <option value="GROWTH" ${this.formData.riskProfile === 'GROWTH' ? 'selected' : ''}>Growth (Moderate Capital Appreciation across Equities)</option>
              <option value="AGGRESSIVE" ${this.formData.riskProfile === 'AGGRESSIVE' ? 'selected' : ''}>Aggressive (High Volatility Equities & Intraday MIS)</option>
            </select>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-ghost" onclick="OnboardingView.goToStep(5)">Back</button>
            <button class="btn btn-primary btn-lg" style="flex: 1;" onclick="OnboardingView.finishKYC()">
              🚀 Submit KYC & Activate ₹5,00,000 Trading Account
            </button>
          </div>
        `;
        break;
    }

    if (stepTitle) stepTitle.textContent = title;
    body.innerHTML = content;
  },

  goToStep(step) {
    this.currentStep = step;
    this.renderCurrentStep();
  },

  handleStep1Contact() {
    const phone = document.getElementById('ob-phone')?.value.trim();
    const email = document.getElementById('ob-email')?.value.trim();

    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
      Toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email || !email.includes('@')) {
      Toast.error('Please enter a valid email address.');
      return;
    }

    this.formData.phone = phone;
    this.formData.email = email;
    this.goToStep(2);
  },

  async handleVerifyPan() {
    const panInput = document.getElementById('ob-pan-input');
    const statusDiv = document.getElementById('pan-verify-status');
    const pan = panInput ? panInput.value.trim().toUpperCase() : '';

    if (!pan || pan.length !== 10) {
      Toast.error('PAN must be exactly 10 alphanumeric characters (e.g. ABCDE1234F).');
      return;
    }

    try {
      const res = await api.post('/kyc/verify-pan', { pan, fullName: 'BHARATH DEVAN' });
      this.formData.pan = pan;
      this.panVerified = true;
      Toast.success(`PAN Verified: ${res.entityType}`);
      this.goToStep(3);
    } catch (err) {
      if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--loss-red);">${err.message}</span>`;
      Toast.error(err.message);
    }
  },

  handleSavePersonalDetails() {
    const dob = document.getElementById('ob-dob')?.value;
    const marital = document.getElementById('ob-marital')?.value;
    const occupation = document.getElementById('ob-occupation')?.value;

    if (!dob) {
      Toast.error('Please select your Date of Birth.');
      return;
    }
    if (!marital) {
      Toast.error('Please select your Marital Status.');
      return;
    }
    if (!occupation) {
      Toast.error('Please select your Occupation.');
      return;
    }

    this.formData.dob = dob;
    this.formData.maritalStatus = marital;
    this.formData.occupation = occupation;
    this.goToStep(4);
  },

  async handleLookupIfsc() {
    const ifscInput = document.getElementById('ob-ifsc');
    const card = document.getElementById('bank-lookup-card');
    const nameEl = document.getElementById('bank-lookup-name');
    const branchEl = document.getElementById('bank-lookup-branch');
    const ifsc = ifscInput ? ifscInput.value.trim().toUpperCase() : '';

    if (!ifsc || ifsc.length < 10) {
      Toast.error('Please enter a valid IFSC code (e.g. HDFC0001234).');
      return;
    }

    try {
      const res = await api.get(`/kyc/lookup-ifsc/${ifsc}`);
      if (card && nameEl && branchEl) {
        card.style.display = 'block';
        nameEl.textContent = `🏦 ${res.bankName}`;
        branchEl.textContent = `Branch: ${res.branch}, ${res.city} (${res.ifsc})`;
      }
      this.formData.ifsc = ifsc;
      this.formData.bankName = res.bankName;
      this.formData.bankBranch = res.branch;
      Toast.success(res.message);
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async handleVerifyBank() {
    const accInput = document.getElementById('ob-bank-acc');
    const ifscInput = document.getElementById('ob-ifsc');
    const acc = accInput ? accInput.value.trim() : '';
    const ifsc = ifscInput ? ifscInput.value.trim().toUpperCase() : '';

    if (!acc || acc.length < 9) {
      Toast.error('Please enter a valid bank account number (9 to 18 digits).');
      return;
    }
    if (!ifsc || ifsc.length !== 11) {
      Toast.error('Please enter a valid 11-digit IFSC code.');
      return;
    }

    try {
      const res = await api.post('/kyc/verify-bank', { accountNumber: acc, ifsc });
      this.formData.accountNumber = acc;
      this.formData.ifsc = ifsc;
      this.bankVerified = true;
      Toast.success(res.message);
      this.goToStep(5);
    } catch (err) {
      Toast.error(err.message);
    }
  },

  handleSaveNominee() {
    const nomName = document.getElementById('ob-nominee-name')?.value.trim();
    const nomRel = document.getElementById('ob-nominee-rel')?.value;

    if (!nomName) {
      Toast.error('Please enter the nominee full name.');
      return;
    }
    if (!nomRel) {
      Toast.error('Please select the relationship with nominee.');
      return;
    }

    this.formData.nomineeName = nomName;
    this.formData.nomineeRelation = nomRel;
    this.goToStep(6);
  },

  async finishKYC() {
    const address = document.getElementById('ob-address')?.value.trim();
    const risk = document.getElementById('ob-risk')?.value;

    if (!address || address.length < 8) {
      Toast.error('Please enter your full communication address.');
      return;
    }
    if (!risk) {
      Toast.error('Please select your Investor Risk Profile.');
      return;
    }

    this.formData.address = address;
    this.formData.riskProfile = risk;

    try {
      await api.post('/kyc/submit', {
        phone: this.formData.phone,
        email: this.formData.email,
        pan: this.formData.pan,
        dob: this.formData.dob,
        maritalStatus: this.formData.maritalStatus,
        occupation: this.formData.occupation,
        bankAccount: this.formData.accountNumber,
        ifsc: this.formData.ifsc,
        nominee: { name: this.formData.nomineeName, relation: this.formData.nomineeRelation },
        address: this.formData.address,
        riskProfile: this.formData.riskProfile
      });
      Toast.success('🎉 KYC Verified & ₹5,00,000 Trading Account Activated!');
      window.location.hash = '#/dashboard';
    } catch (e) {
      window.location.hash = '#/dashboard';
    }
  }
};
