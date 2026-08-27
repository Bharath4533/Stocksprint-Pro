// Unit Tests for Financial Calculation Engine

const assert = require('assert');
const calculations = require('../backend/services/calculations');

console.log('--- RUNNING FINANCIAL ENGINE UNIT TESTS ---');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`, err.message);
  }
}

// 1. Average Price Tests
test('Calculate Weighted Average Buy Price', () => {
  // Bought 10 @ 100, then bought 10 @ 200 -> Avg should be 150
  const avg = calculations.calculateAveragePrice(10, 100, 10, 200);
  assert.strictEqual(avg, 150);

  // Bought 5 @ 1000, then bought 15 @ 1200 -> (5000 + 18000) / 20 = 23000 / 20 = 1150
  const avg2 = calculations.calculateAveragePrice(5, 1000, 15, 1200);
  assert.strictEqual(avg2, 1150);
});

// 2. Unrealized P&L Tests
test('Calculate Unrealized P&L & Return %', () => {
  const pnl = calculations.calculateUnrealizedPnL(10, 100, 120);
  assert.strictEqual(pnl.investedValue, 1000);
  assert.strictEqual(pnl.currentValue, 1200);
  assert.strictEqual(pnl.pnl, 200);
  assert.strictEqual(pnl.pnlPercent, 20);
});

// 3. Realized P&L Tests
test('Calculate Realized P&L on Share Sale', () => {
  const pnl = calculations.calculateRealizedPnL(5, 100, 150);
  assert.strictEqual(pnl.buyCost, 500);
  assert.strictEqual(pnl.sellProceeds, 750);
  assert.strictEqual(pnl.realizedPnL, 250);
  assert.strictEqual(pnl.pnlPercent, 50);
});

// 4. Regulatory & Brokerage Charges Tests
test('Calculate Equity Delivery Charges (0% Brokerage, STT, Exchange, Stamp Duty, GST)', () => {
  // Buy 10 shares of RELIANCE @ ₹3000 = Turnover ₹30,000
  const charges = calculations.calculateCharges('CNC', 'BUY', 3000, 10);
  assert.strictEqual(charges.turnover, 30000);
  assert.strictEqual(charges.brokerage, 0); // 0% brokerage on Delivery
  assert.strictEqual(charges.stt, 30); // 0.1% STT on Delivery = ₹30
  assert.strictEqual(charges.stampDuty, 4.5); // 0.015% on BUY = ₹4.50
  assert(charges.totalCharges > 34);
});

test('Calculate Equity Intraday Charges (0.03% max ₹20 Brokerage, Sell STT, 5x Leverage)', () => {
  // Buy 100 shares of INFY @ ₹1800 = Turnover ₹1,80,000
  const charges = calculations.calculateCharges('MIS', 'BUY', 1800, 100);
  assert.strictEqual(charges.turnover, 180000);
  assert.strictEqual(charges.brokerage, 20); // Capped at ₹20
  assert.strictEqual(charges.stt, 0); // Intraday STT is 0 on BUY side

  const margin = calculations.calculateRequiredMargin('MIS', 1800, 100);
  assert.strictEqual(margin, 36000); // 20% margin (5x leverage)
});

// 5. SIP Compound Calculator Tests
test('Calculate SIP Compound Returns Projection', () => {
  // ₹10,000/mo at 12% for 10 years (120 months)
  const sip = calculations.calculateSIPProjection(10000, 12, 10);
  assert.strictEqual(sip.totalInvested, 1200000);
  assert(sip.projectedFutureValue > 2200000); // Should compound to ~₹23.2 Lakhs
  assert(sip.estimatedWealthGain > 1000000);
});

console.log(`\nUnit Tests Result: ${passed}/${total} passed.\n`);
if (passed !== total) process.exit(1);
