// Integration Tests for NexTrade Pro API Endpoints

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-allow-demo': 'true',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runIntegrationTests() {
  console.log('--- RUNNING API INTEGRATION TESTS ---');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`, err.message);
    }
  }

  let authToken = '';

  // 1. Health & Backward-Compatible State API
  await test('GET /api/health returns 200 OK', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'OK');
    assert.strictEqual(res.data.app, 'StockSprint Pro');
  });

  await test('GET /api/supabase/status returns database connection status', async () => {
    const res = await request('/api/supabase/status');
    assert.strictEqual(res.status, 200);
    assert(res.data.mode);
  });

  await test('GET /api/state returns valid portfolio & stocks for backward compatibility', async () => {
    const res = await request('/api/state');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.stocks));
    assert(res.data.stocks.length > 0);
  });

  // 2. Authentication Flow
  await test('POST /api/auth/demo returns token and demo user', async () => {
    const res = await request('/api/auth/demo', { method: 'POST' });
    assert.strictEqual(res.status, 200);
    assert(res.data.token);
    assert.strictEqual(res.data.user.isDemo, true);
    authToken = res.data.token;
  });

  // 3. Markets & Stock Master
  await test('GET /api/markets/indices returns benchmark indices', async () => {
    const res = await request('/api/markets/indices');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
    const nifty = res.data.find(i => i.symbol === 'NIFTY 50');
    assert(nifty);
    assert(nifty.value > 20000);
  });

  await test('GET /api/markets/indices/NIFTY%2050 returns 1-Month performance stats & constituents', async () => {
    const res = await request('/api/markets/indices/NIFTY%2050');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.symbol, 'NIFTY 50');
    assert(res.data.monthHigh > 0);
    assert(res.data.monthLow > 0);
    assert(Array.isArray(res.data.constituents));
    assert(res.data.constituents.length > 0);
  });

  await test('GET /api/markets/indices/NIFTY%2050/chart?range=1M returns 1-Month historical candles', async () => {
    const res = await request('/api/markets/indices/NIFTY%2050/chart?range=1M');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.range, '1M');
    assert(Array.isArray(res.data.candles));
    assert(res.data.candles.length > 0);
  });

  await test('GET /api/stocks/RELIANCE returns quote, fundamentals, and financials', async () => {
    const res = await request('/api/stocks/RELIANCE');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.symbol, 'RELIANCE');
    assert(res.data.fundamentals);
    assert(res.data.financials);
  });

  await test('GET /api/stocks/TCS/chart returns OHLCV candlestick data', async () => {
    const res = await request('/api/stocks/TCS/chart?range=1D');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.candles));
    assert(res.data.candles.length > 0);
  });

  // 4. Global Search
  await test('GET /api/markets/search finds stocks and mutual funds', async () => {
    const res = await request('/api/markets/search?q=Tata');
    assert.strictEqual(res.status, 200);
    assert(res.data.totalCount > 0);
  });

  // 5. Watchlist Management
  await test('Watchlist CRUD: Create folder, add symbol, remove symbol', async () => {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    // Create folder
    const createRes = await request('/api/watchlists', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'Automated Test List' }
    });
    assert.strictEqual(createRes.status, 201);
    const wlId = createRes.data.id;

    // Add Symbol
    const addRes = await request(`/api/watchlists/${wlId}/symbols`, {
      method: 'POST',
      headers: authHeaders,
      body: { symbol: 'TRENT' }
    });
    assert.strictEqual(addRes.status, 200);
    assert(addRes.data.symbols.includes('TRENT'));

    // Delete folder
    const delRes = await request(`/api/watchlists/${wlId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.strictEqual(delRes.status, 200);
  });

  // 6. Paper Trading Order Execution & Portfolio Update
  await test('Place Simulated Buy Order & Verify Holdings & Funds Deduction', async () => {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    // Initial funds check
    const initialFunds = await request('/api/funds', { headers: authHeaders });
    const cashBefore = initialFunds.data.availableCash;

    // Place Buy Order for 2 shares of INFY (CNC Delivery)
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: authHeaders,
      body: {
        symbol: 'INFY',
        side: 'BUY',
        orderType: 'MARKET',
        productType: 'CNC',
        quantity: 2
      }
    });

    assert.strictEqual(orderRes.status, 201);
    assert.strictEqual(orderRes.data.order.status, 'FILLED');

    // Verify Funds Debited
    const afterFunds = await request('/api/funds', { headers: authHeaders });
    assert(afterFunds.data.availableCash < cashBefore);

    // Verify Holdings Updated
    const portRes = await request('/api/portfolio', { headers: authHeaders });
    const holding = portRes.data.holdings.find(h => h.symbol === 'INFY');
    assert(holding);
    assert(holding.quantity >= 2);
  });

  // 7. Intraday Position & Square-off
  await test('Place Intraday MIS Order and Square-off', async () => {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    // Place Intraday Order
    const orderRes = await request('/api/orders', {
      method: 'POST',
      headers: authHeaders,
      body: {
        symbol: 'SUZLON',
        side: 'BUY',
        orderType: 'MARKET',
        productType: 'MIS',
        quantity: 50
      }
    });
    assert.strictEqual(orderRes.status, 201);

    // Find Open Position
    const portRes = await request('/api/portfolio', { headers: authHeaders });
    const pos = portRes.data.positions.find(p => p.symbol === 'SUZLON' && p.status === 'OPEN');
    assert(pos);

    // Square Off Position
    const sqRes = await request(`/api/portfolio/positions/${pos.id}/square-off`, {
      method: 'POST',
      headers: authHeaders
    });
    assert.strictEqual(sqRes.status, 200);
    assert.strictEqual(sqRes.data.position.status, 'CLOSED');
  });

  // 8. Mutual Funds & SIP
  await test('Calculate SIP & Start Simulated SIP', async () => {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    const sipRes = await request('/api/mutual-funds/sips', {
      method: 'POST',
      headers: authHeaders,
      body: {
        fundId: 'mf_parag_parikh_flexi',
        amount: 2000,
        sipDate: 10
      }
    });

    assert.strictEqual(sipRes.status, 201);
    assert.strictEqual(sipRes.data.sip.amount, 2000);
  });

  // 9. IPO Application
  await test('Apply for Simulated IPO with UPI Mandate', async () => {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    const ipoRes = await request('/api/ipos/ipo_swiggy_101/apply', {
      method: 'POST',
      headers: authHeaders,
      body: {
        lots: 1,
        upiId: 'test@okaxis'
      }
    });

    assert.strictEqual(ipoRes.status, 201);
    assert.strictEqual(ipoRes.data.application.status, 'Submitted');
  });

  // 10. Real Indian KYC & OTP Verification Flow
  await test('Real KYC: Send & Verify Mobile Phone SMS OTP', async () => {
    const sendRes = await request('/api/kyc/send-phone-otp', {
      method: 'POST',
      body: { phone: '+919876543210' }
    });
    assert.strictEqual(sendRes.status, 200);
    assert.strictEqual(sendRes.data.success, true);
    const otp = sendRes.data.devOtp || '123456';

    const verifyRes = await request('/api/kyc/verify-phone-otp', {
      method: 'POST',
      body: { phone: '+919876543210', otp }
    });
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.success, true);
  });

  await test('Real KYC: Send & Verify Email OTP', async () => {
    const sendRes = await request('/api/kyc/send-email-otp', {
      method: 'POST',
      body: { email: 'bharath@nextrade.in' }
    });
    assert.strictEqual(sendRes.status, 200);
    assert.strictEqual(sendRes.data.success, true);
    const otp = sendRes.data.devOtp || '123456';

    const verifyRes = await request('/api/kyc/verify-email-otp', {
      method: 'POST',
      body: { email: 'bharath@nextrade.in', otp }
    });
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.success, true);
  });

  await test('Real KYC: Rejection of Invalid / Dummy Mobile Number', async () => {
    const invalidPhoneRes = await request('/api/kyc/send-phone-otp', {
      method: 'POST',
      body: { phone: '0000000000' }
    });
    assert.strictEqual(invalidPhoneRes.status, 400);
  });

  await test('Real KYC: Rejection of Fake Email Domain (No MX Records)', async () => {
    const fakeEmailRes = await request('/api/kyc/send-email-otp', {
      method: 'POST',
      body: { email: 'user@nonexistentfakedomain123456789.xyz' }
    });
    assert.strictEqual(fakeEmailRes.status, 400);
  });

  await test('Real KYC: UIDAI Verhoeff Aadhaar Validation', async () => {
    // Test invalid Aadhaar
    const invalidAadhaar = await request('/api/kyc/verify-aadhaar', {
      method: 'POST',
      body: { aadhaar: '012345678901' }
    });
    assert.strictEqual(invalidAadhaar.status, 400);
  });

  await test('Real KYC: Strict PAN Format & Entity Validation', async () => {
    const panRes = await request('/api/kyc/verify-pan', {
      method: 'POST',
      body: { pan: 'ABCPE1234F', fullName: 'Bharath Devan' }
    });
    assert.strictEqual(panRes.status, 200);
    assert.strictEqual(panRes.data.success, true);
    assert.strictEqual(panRes.data.entityType, 'Individual (Person)');
    assert.strictEqual(panRes.data.isIndividual, true);
  });

  await test('Real KYC: Live RBI IFSC Directory Lookup & Bank Verification', async () => {
    const ifscRes = await request('/api/kyc/lookup-ifsc/HDFC0001234');
    assert.strictEqual(ifscRes.status, 200);
    assert.strictEqual(ifscRes.data.success, true);
    assert(ifscRes.data.bankName);

    const bankRes = await request('/api/kyc/verify-bank', {
      method: 'POST',
      body: {
        accountNumber: '50100492837192',
        ifsc: 'HDFC0001234',
        accountHolderName: 'Bharath Devan'
      }
    });
    assert.strictEqual(bankRes.status, 200);
    assert.strictEqual(bankRes.data.success, true);
    assert.strictEqual(bankRes.data.status, 'VERIFIED');
  });

  await test('Real KYC: Final Profile Submission', async () => {
    const subRes = await request('/api/kyc/submit', {
      method: 'POST',
      body: {
        phone: '+919876543210',
        email: 'bharath@gmail.com',
        pan: 'ABCPE1234F',
        bankAccount: '50100492837192',
        ifsc: 'HDFC0001234'
      }
    });
    assert.strictEqual(subRes.status, 200);
    assert.strictEqual(subRes.data.kycStatus, 'VERIFIED');
  });

  console.log(`\nIntegration Tests Result: ${passed}/${total} passed.\n`);
  if (passed !== total) process.exit(1);
}

runIntegrationTests().catch(err => {
  console.error('Integration test runner error:', err);
  process.exit(1);
});
