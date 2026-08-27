// Supabase Database Service & Synchronization Layer for StockSprint Pro

const { supabase, isConfigured } = require('../config/supabase');
const logger = require('./logger');

class SupabaseService {
  // Sync a single record to a Supabase table
  async upsert(table, data) {
    if (!isConfigured()) return null;
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data)
        .select();

      if (error) {
        console.warn(`[SUPABASE] Error upserting into ${table}:`, error.message);
        return null;
      }
      return result;
    } catch (err) {
      console.warn(`[SUPABASE] Connection error for ${table}:`, err.message);
      return null;
    }
  }

  // Insert an order record to Supabase
  async syncOrder(order) {
    if (!isConfigured()) return;
    await this.upsert('orders', {
      id: order.id,
      user_id: order.userId,
      symbol: order.symbol,
      exchange: order.exchange || 'NSE',
      side: order.side,
      order_type: order.orderType,
      product_type: order.productType,
      quantity: order.quantity,
      price: order.price,
      trigger_price: order.triggerPrice || 0,
      charges: order.charges || 0,
      status: order.status,
      charges_breakdown: order.chargesBreakdown || {},
      created_at: order.createdAt || new Date().toISOString(),
    });
  }

  // Insert a transaction record to Supabase
  async syncTransaction(txn) {
    if (!isConfigured()) return;
    await this.upsert('transactions', {
      id: txn.id,
      user_id: txn.userId,
      type: txn.type,
      amount: txn.amount,
      payment_method: txn.paymentMethod,
      reference_id: txn.referenceId,
      description: txn.description,
      created_at: txn.createdAt || new Date().toISOString(),
    });
  }

  // Sync user funds to Supabase
  async syncFunds(funds) {
    if (!isConfigured()) return;
    await this.upsert('funds', {
      user_id: funds.userId,
      available_cash: funds.availableCash,
      used_margin: funds.usedMargin,
      total_simulated_capital: funds.totalSimulatedCapital,
      withdrawable_amount: funds.withdrawableAmount,
      updated_at: new Date().toISOString(),
    });
  }

  // Check health and return Supabase connection status
  async getStatus() {
    if (!isConfigured()) {
      return { connected: false, mode: 'LOCAL_JSON', message: 'Set SUPABASE_URL and SUPABASE_ANON_KEY to enable cloud persistence.' };
    }
    try {
      const { data, error } = await supabase.from('securities').select('count').limit(1);
      if (error) {
        return { connected: false, mode: 'LOCAL_FALLBACK', error: error.message };
      }
      return { connected: true, mode: 'SUPABASE_CLOUD', message: 'Connected to Supabase PostgreSQL' };
    } catch (e) {
      return { connected: false, mode: 'LOCAL_FALLBACK', error: e.message };
    }
  }
}

module.exports = new SupabaseService();
