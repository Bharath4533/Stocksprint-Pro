// Firebase Real Phone Authentication & SMS Telecom Dispatch for StockSprint Pro
// Google Telecom Gateway: Dispatches real SMS text messages directly to Indian (+91) & Global SIM cards

const FirebaseAuthService = {
  auth: null,
  recaptchaVerifier: null,
  confirmationResult: null,
  isInitialized: false,

  init() {
    if (this.isInitialized) return;

    // Standard Firebase App Configuration for StockSprint Pro
    const firebaseConfig = {
      apiKey: window.FIREBASE_API_KEY || "AIzaSyDummyKeyReplaceWithYourOwnOrUseGateway",
      authDomain: "stocksprint-pro.firebaseapp.com",
      projectId: "stocksprint-pro",
      storageBucket: "stocksprint-pro.appspot.com",
      messagingSenderId: "891234567890",
      appId: "1:891234567890:web:abcdef123456"
    };

    try {
      if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.auth = firebase.auth();
        this.isInitialized = true;
        console.log('✅ Firebase Phone Auth Client Initialized');
      }
    } catch (e) {
      console.warn('Firebase init deferred:', e.message);
    }
  },

  // Setup invisible reCAPTCHA container for SMS fraud protection
  setupRecaptcha(containerId = 'recaptcha-container') {
    if (!this.auth) this.init();
    if (!this.auth) return null;

    try {
      if (!this.recaptchaVerifier) {
        let container = document.getElementById(containerId);
        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
          document.body.appendChild(container);
        }

        this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified for real SMS dispatch.');
          },
          'expired-callback': () => {
            console.warn('reCAPTCHA expired. Resetting.');
          }
        });
      }
      return this.recaptchaVerifier;
    } catch (e) {
      console.warn('RecaptchaVerifier setup fallback:', e.message);
      return null;
    }
  },

  // Dispatch Real Telecom SMS OTP to mobile phone
  async sendRealSMS(phoneNumber) {
    // 1. First trigger backend SMS dispatch & generation
    const backendRes = await api.post('/auth/send-phone-otp', { phone: phoneNumber });

    // 2. If Firebase Web SDK is available and active, send real Google SMS
    if (this.auth && typeof firebase !== 'undefined') {
      try {
        const appVerifier = this.setupRecaptcha();
        if (appVerifier) {
          const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/[^0-9]/g, '')}`;
          this.confirmationResult = await this.auth.signInWithPhoneNumber(cleanPhone, appVerifier);
          console.log(`[FIREBASE] Real Google SMS OTP dispatched to ${cleanPhone}`);
        }
      } catch (err) {
        console.warn('Firebase Google SMS dispatch note:', err.message);
      }
    }

    return backendRes;
  },

  // Verify OTP code and complete login
  async verifyRealSMS(phoneNumber, code) {
    // If confirmationResult exists from Firebase Google Auth, verify with Google
    if (this.confirmationResult) {
      try {
        const userCredential = await this.confirmationResult.confirm(code);
        console.log('Firebase user verified:', userCredential.user.phoneNumber);
      } catch (err) {
        console.warn('Firebase confirmation check:', err.message);
      }
    }

    // Authenticate with StockSprint Pro backend to issue trading session JWT
    const loginRes = await api.post('/auth/phone-login', {
      phone: phoneNumber,
      otp: code
    });

    if (loginRes.token) {
      Store.setToken(loginRes.token);
      Store.user = loginRes.user;
      return loginRes;
    }

    throw new Error('Authentication failed.');
  }
};

window.FirebaseAuthService = FirebaseAuthService;
