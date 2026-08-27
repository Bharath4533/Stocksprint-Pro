const db = require('../models/db');
const calculations = require('./calculations');
const marketDataProvider = require('../providers/marketDataProvider');
const logger = require('./logger');

class PaperTradingEngine {
  // Place and simulate a trading order
  placeOrder({ userId, symbol, exchange = 'NSE', side = 'BUY', orderType = 'MARKET', productType = 'CNC', quantity = 1, price = 0, triggerPrice = 0 }) {
    const qty = parseInt(quantity, 10);
    if (!symbol || isNaN(qty) || qty <= 0) {
      throw new Error('Invalid order parameters. Symbol and positive quantity are required.');
    }

    const sec = marketDataProvider.getQuote(symbol);
    if (!sec) {
      throw new Error(`Security ${symbol} not found in exchange master.`);
    }

    const execPrice = (orderType === 'MARKET') ? sec.price : (parseFloat(price) || sec.price);
    const orderSide = side.toUpperCase();
    const prodType = productType.toUpperCase(); // CNC or MIS
    const ordType = orderType.toUpperCase(); // MARKET, LIMIT, SL, SL_M

    // Calculate required funds/margin
    const requiredMargin = calculations.calculateRequiredMargin(prodType, execPrice, qty);
    const charges = calculations.calculateCharges(prodType, orderSide, execPrice, qty);
    const totalDeduction = requiredMargin + charges.totalCharges;

    // Get user funds
    const userFunds = db.findOne('funds', f => f.userId === userId);
    if (!userFunds) {
      throw new Error('User funds record not found.');
    }

    // Validate available funds for BUY
    if (orderSide === 'BUY') {
      if (userFunds.availableCash < totalDeduction) {
        const diff = Math.round((totalDeduction - userFunds.availableCash) * 100) / 100;
        throw new Error(`Insufficient funds. Required: ₹${totalDeduction.toLocaleString('en-IN')}, Available: ₹${userFunds.availableCash.toLocaleString('en-IN')}. Shortage: ₹${diff.toLocaleString('en-IN')}`);
      }
    } else if (orderSide === 'SELL') {
      // For Delivery SELL, verify holding quantity
      if (prodType === 'CNC') {
        const holding = db.findOne('holdings', h => h.userId === userId && h.symbol.toUpperCase() === symbol.toUpperCase() && h.productType === 'CNC');
        if (!holding || holding.quantity < qty) {
          const avail = holding ? holding.quantity : 0;
          throw new Error(`Insufficient holdings to sell. Available: ${avail} shares, Requested: ${qty} shares.`);
        }
      }
    }

    // Generate Order ID
    const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isMarket = ordType === 'MARKET';
    const status = isMarket ? 'FILLED' : 'OPEN';
    const statusMessage = isMarket ? 'Order executed successfully at market price' : 'Order placed in orderbook';

    const newOrder = {
      id: orderId,
      userId,
      symbol: symbol.toUpperCase(),
      exchange,
      side: orderSide,
      orderType: ordType,
      productType: prodType,
      quantity: qty,
      price: execPrice,
      triggerPrice: parseFloat(triggerPrice) || 0,
      status,
      statusMessage,
      charges: charges.totalCharges,
      chargesBreakdown: charges,
      isSimulated: true,
      createdAt: new Date().toISOString(),
      executedAt: isMarket ? new Date().toISOString() : null
    };

    db.insert('orders', newOrder);

    // If filled immediately (MARKET order), update ledger and portfolios
    if (status === 'FILLED') {
      this._processFilledOrder(newOrder, userFunds, sec, charges, totalDeduction);
    }

    return newOrder;
  }

  _processFilledOrder(order, userFunds, sec, charges, totalDeduction) {
    const { userId, symbol, side, productType, quantity, price } = order;

    if (side === 'BUY') {
      if (productType === 'CNC') {
        // Debit funds
        userFunds.availableCash = Math.round((userFunds.availableCash - (price * quantity + charges.totalCharges)) * 100) / 100;
        userFunds.usedMargin = Math.round((userFunds.usedMargin + (price * quantity)) * 100) / 100;

        // Update or Insert Holding
        const existing = db.findOne('holdings', h => h.userId === userId && h.symbol === symbol && h.productType === 'CNC');
        if (existing) {
          const newAvg = calculations.calculateAveragePrice(existing.quantity, existing.averageBuyPrice, quantity, price);
          const newQty = existing.quantity + quantity;
          existing.quantity = newQty;
          existing.averageBuyPrice = newAvg;
          existing.investedValue = Math.round(newQty * newAvg * 100) / 100;
          existing.currentPrice = sec.price;
          existing.currentValue = Math.round(newQty * sec.price * 100) / 100;
          const pnl = calculations.calculateUnrealizedPnL(newQty, newAvg, sec.price);
          existing.unrealizedPnL = pnl.pnl;
          existing.unrealizedPnLPercent = pnl.pnlPercent;
        } else {
          const invested = Math.round(quantity * price * 100) / 100;
          const curVal = Math.round(quantity * sec.price * 100) / 100;
          const pnl = calculations.calculateUnrealizedPnL(quantity, price, sec.price);
          db.insert('holdings', {
            id: `hld_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            userId,
            symbol,
            quantity,
            averageBuyPrice: price,
            investedValue: invested,
            currentPrice: sec.price,
            currentValue: curVal,
            unrealizedPnL: pnl.pnl,
            unrealizedPnLPercent: pnl.pnlPercent,
            productType: 'CNC'
          });
        }
      } else {
        // Intraday MIS BUY -> Position
        const marginReq = calculations.calculateRequiredMargin('MIS', price, quantity);
        userFunds.availableCash = Math.round((userFunds.availableCash - (marginReq + charges.totalCharges)) * 100) / 100;
        userFunds.usedMargin = Math.round((userFunds.usedMargin + marginReq) * 100) / 100;

        db.insert('positions', {
          id: `pos_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId,
          symbol,
          quantity,
          averagePrice: price,
          currentPrice: sec.price,
          side: 'BUY',
          productType: 'MIS',
          unrealizedPnL: 0,
          realizedPnL: 0,
          status: 'OPEN',
          openedAt: new Date().toISOString()
        });
      }

      // Ledger entry
      db.insert('fundTransactions', {
        id: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        userId,
        type: 'BUY_TRADE',
        amount: Math.round((price * quantity + charges.totalCharges) * 100) / 100,
        status: 'SUCCESS',
        paymentMethod: 'Simulated Trading Balance',
        referenceId: order.id,
        description: `Bought ${quantity} ${symbol} @ ₹${price.toLocaleString('en-IN')} (${productType}) + Charges ₹${charges.totalCharges}`,
        createdAt: new Date().toISOString()
      });
    } else if (side === 'SELL') {
      if (productType === 'CNC') {
        const holding = db.findOne('holdings', h => h.userId === userId && h.symbol === symbol && h.productType === 'CNC');
        if (holding) {
          const pnl = calculations.calculateRealizedPnL(quantity, holding.averageBuyPrice, price);
          const netCredit = Math.round((price * quantity - charges.totalCharges) * 100) / 100;

          userFunds.availableCash = Math.round((userFunds.availableCash + netCredit) * 100) / 100;
          userFunds.usedMargin = Math.max(0, Math.round((userFunds.usedMargin - (holding.averageBuyPrice * quantity)) * 100) / 100);

          if (holding.quantity === quantity) {
            db.remove('holdings', h => h.id === holding.id);
          } else {
            holding.quantity -= quantity;
            holding.investedValue = Math.round(holding.quantity * holding.averageBuyPrice * 100) / 100;
            holding.currentValue = Math.round(holding.quantity * sec.price * 100) / 100;
            const updatedPnl = calculations.calculateUnrealizedPnL(holding.quantity, holding.averageBuyPrice, sec.price);
            holding.unrealizedPnL = updatedPnl.pnl;
            holding.unrealizedPnLPercent = updatedPnl.pnlPercent;
          }

          // Ledger entry
          db.insert('fundTransactions', {
            id: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
            userId,
            type: 'SELL_TRADE',
            amount: netCredit,
            status: 'SUCCESS',
            paymentMethod: 'Simulated Trading Balance',
            referenceId: order.id,
            description: `Sold ${quantity} ${symbol} @ ₹${price.toLocaleString('en-IN')} (CNC) | Realized P&L: ₹${pnl.realizedPnL} (after ₹${charges.totalCharges} charges)`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    db.update('funds', f => f.userId === userId, userFunds);

    // Notification
    db.insert('notifications', {
      id: `notif_${Date.now()}`,
      userId,
      title: `Order Executed: ${side} ${symbol}`,
      message: `Executed ${quantity} ${symbol} @ ₹${price.toLocaleString('en-IN')} (${productType}). Total value: ₹${(price * quantity).toLocaleString('en-IN')}.`,
      type: 'ORDER',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    logger.logAudit({
      userId,
      action: 'ORDER_EXECUTED',
      details: { orderId: order.id, symbol, side, qty: quantity, price, productType }
    });
  }

  // Square off an open intraday position
  squareOffPosition(userId, positionId) {
    const pos = db.findOne('positions', p => p.id === positionId && p.userId === userId && p.status === 'OPEN');
    if (!pos) {
      throw new Error('Active position not found.');
    }

    const sec = marketDataProvider.getQuote(pos.symbol);
    const curPrice = sec ? sec.price : pos.averagePrice;
    const realized = calculations.calculateRealizedPnL(pos.quantity, pos.averagePrice, curPrice);
    const charges = calculations.calculateCharges('MIS', pos.side === 'BUY' ? 'SELL' : 'BUY', curPrice, pos.quantity);

    pos.status = 'CLOSED';
    pos.currentPrice = curPrice;
    pos.realizedPnL = Math.round((realized.realizedPnL - charges.totalCharges) * 100) / 100;
    pos.closedAt = new Date().toISOString();

    const userFunds = db.findOne('funds', f => f.userId === userId);
    if (userFunds) {
      const marginReleased = calculations.calculateRequiredMargin('MIS', pos.averagePrice, pos.quantity);
      userFunds.usedMargin = Math.max(0, Math.round((userFunds.usedMargin - marginReleased) * 100) / 100);
      userFunds.availableCash = Math.round((userFunds.availableCash + marginReleased + pos.realizedPnL) * 100) / 100;
      db.update('funds', f => f.userId === userId, userFunds);
    }

    db.save();

    db.insert('notifications', {
      id: `notif_${Date.now()}`,
      userId,
      title: `Position Squared Off: ${pos.symbol}`,
      message: `Squared off ${pos.quantity} ${pos.symbol} @ ₹${curPrice}. Realized P&L: ₹${pos.realizedPnL}.`,
      type: 'ORDER',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return pos;
  }

  // Cancel an open order
  cancelOrder(userId, orderId) {
    const order = db.findOne('orders', o => o.id === orderId && o.userId === userId && o.status === 'OPEN');
    if (!order) {
      throw new Error('Open order not found or already executed/cancelled.');
    }
    order.status = 'CANCELLED';
    order.statusMessage = 'Cancelled by user';
    order.cancelledAt = new Date().toISOString();
    db.save();
    return order;
  }
}

module.exports = new PaperTradingEngine();
