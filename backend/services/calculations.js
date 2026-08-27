const fs = require('fs');
const config = require('../config/config');

class FinancialCalculations {
  constructor() {
    this.chargesPath = config.CHARGES_PATH;
  }

  getChargesSchedule() {
    try {
      if (fs.existsSync(this.chargesPath)) {
        return JSON.parse(fs.readFileSync(this.chargesPath, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load charges schedule:', e);
    }
    return {
      equityDelivery: { brokerageRate: 0, sttRate: 0.001, exchangeTurnoverRate: 0.0000345, sebiChargesPerCrore: 10, stampDutyRate: 0.00015, gstRate: 0.18 },
      equityIntraday: { brokerageRate: 0.0003, brokerageMax: 20, sttRate: 0.00025, exchangeTurnoverRate: 0.0000345, sebiChargesPerCrore: 10, stampDutyRate: 0.00003, gstRate: 0.18 },
      dpChargesPerScrip: 15.93
    };
  }

  // Calculate comprehensive regulatory and broker charges
  calculateCharges(productType = 'CNC', side = 'BUY', price = 0, quantity = 0) {
    const turnover = Math.round(price * quantity * 100) / 100;
    const schedule = this.getChargesSchedule();
    const isDelivery = productType === 'CNC';
    const rates = isDelivery ? schedule.equityDelivery : schedule.equityIntraday;

    // 1. Brokerage
    let brokerage = 0;
    if (rates.brokerageRate > 0) {
      brokerage = turnover * rates.brokerageRate;
      if (rates.brokerageMax && brokerage > rates.brokerageMax) {
        brokerage = rates.brokerageMax;
      }
    }

    // 2. STT (Securities Transaction Tax)
    let stt = 0;
    if (isDelivery) {
      // Delivery STT is 0.1% on buy and sell
      stt = turnover * rates.sttRate;
    } else {
      // Intraday STT is 0.025% on sell only
      if (side === 'SELL') {
        stt = turnover * rates.sttRate;
      }
    }

    // 3. Exchange Turnover Charges (0.00345%)
    const exchangeTurnoverCharges = turnover * rates.exchangeTurnoverRate;

    // 4. SEBI Turnover Fees (₹10 per crore = 0.0001%)
    const sebiCharges = (turnover / 10000000) * (rates.sebiChargesPerCrore || 10);

    // 5. Stamp Duty (on BUY orders only)
    let stampDuty = 0;
    if (side === 'BUY') {
      stampDuty = turnover * rates.stampDutyRate;
    }

    // 6. GST (18% on Brokerage + Exchange Turnover + SEBI charges)
    const gstTaxableAmount = brokerage + exchangeTurnoverCharges + sebiCharges;
    const gst = gstTaxableAmount * rates.gstRate;

    // 7. DP Charges (₹15.93 on delivery SELL only)
    let dpCharges = 0;
    if (isDelivery && side === 'SELL') {
      dpCharges = schedule.dpChargesPerScrip || 15.93;
    }

    const totalCharges = Math.round((brokerage + stt + exchangeTurnoverCharges + sebiCharges + stampDuty + gst + dpCharges) * 100) / 100;

    return {
      turnover,
      brokerage: Math.round(brokerage * 100) / 100,
      stt: Math.round(stt * 100) / 100,
      exchangeTurnoverCharges: Math.round(exchangeTurnoverCharges * 100) / 100,
      sebiCharges: Math.round(sebiCharges * 100) / 100,
      stampDuty: Math.round(stampDuty * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      dpCharges: Math.round(dpCharges * 100) / 100,
      totalCharges
    };
  }

  // Margin requirement: CNC is 100% funds, MIS Intraday gives 5x leverage (20% margin required)
  calculateRequiredMargin(productType = 'CNC', price = 0, quantity = 0) {
    const totalValue = price * quantity;
    if (productType === 'MIS') {
      return Math.round((totalValue * 0.20) * 100) / 100; // 5x leverage for intraday
    }
    return Math.round(totalValue * 100) / 100; // 100% for delivery
  }

  // Weighted Average Buy Price Calculation
  calculateAveragePrice(existingQty = 0, existingAvg = 0, newQty = 0, newPrice = 0) {
    const totalQty = existingQty + newQty;
    if (totalQty <= 0) return 0;
    const totalCost = (existingQty * existingAvg) + (newQty * newPrice);
    return Math.round((totalCost / totalQty) * 100) / 100;
  }

  // P&L Calculations
  calculateUnrealizedPnL(qty = 0, avgPrice = 0, currentPrice = 0) {
    const invested = qty * avgPrice;
    const current = qty * currentPrice;
    const pnl = current - invested;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      investedValue: Math.round(invested * 100) / 100,
      currentValue: Math.round(current * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100
    };
  }

  // Realized P&L when selling shares
  calculateRealizedPnL(sellQty = 0, avgBuyPrice = 0, sellPrice = 0) {
    const buyCost = sellQty * avgBuyPrice;
    const sellProceeds = sellQty * sellPrice;
    const pnl = sellProceeds - buyCost;
    const pnlPercent = buyCost > 0 ? (pnl / buyCost) * 100 : 0;
    return {
      buyCost: Math.round(buyCost * 100) / 100,
      sellProceeds: Math.round(sellProceeds * 100) / 100,
      realizedPnL: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100
    };
  }

  // Systematic Investment Plan (SIP) Compound Returns Projection
  // Formula: M = P * ({[1 + i]^n - 1} / i) * (1 + i)
  calculateSIPProjection(monthlyAmount = 5000, expectedAnnualReturnPercent = 12, tenureYears = 10) {
    const P = monthlyAmount;
    const i = (expectedAnnualReturnPercent / 100) / 12; // Monthly rate
    const n = tenureYears * 12; // Number of months

    const totalInvested = P * n;
    let projectedFutureValue = 0;
    if (i > 0) {
      projectedFutureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    } else {
      projectedFutureValue = totalInvested;
    }

    const estimatedWealthGain = projectedFutureValue - totalInvested;

    return {
      monthlyAmount: P,
      tenureYears,
      expectedReturnRate: expectedAnnualReturnPercent,
      totalInvested: Math.round(totalInvested),
      projectedFutureValue: Math.round(projectedFutureValue),
      estimatedWealthGain: Math.round(estimatedWealthGain),
      disclaimer: "Projections are based on estimated historical returns and are not guaranteed."
    };
  }
}

module.exports = new FinancialCalculations();
