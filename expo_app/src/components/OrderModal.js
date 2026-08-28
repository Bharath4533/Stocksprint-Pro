import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

export const OrderModal = ({ visible, stock, defaultSide = 'BUY', onClose, onOrderPlaced }) => {
  const [side, setSide] = useState(defaultSide); // 'BUY' | 'SELL'
  const [productType, setProductType] = useState('CNC'); // 'CNC' (Delivery) | 'MIS' (Intraday)
  const [orderType, setOrderType] = useState('MARKET'); // 'MARKET' | 'LIMIT'
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState(stock ? stock.currentPrice?.toString() : '0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible || !stock) return null;

  const currentPrice = stock.currentPrice || stock.lastPrice || 100;
  const executionPrice = orderType === 'MARKET' ? currentPrice : (parseFloat(price) || currentPrice);
  const qty = parseInt(quantity, 10) || 1;
  const orderValue = executionPrice * qty;
  const marginRequired = productType === 'MIS' ? orderValue * 0.2 : orderValue; // 5x leverage on MIS
  const brokerage = productType === 'CNC' ? 0 : Math.min(20, orderValue * 0.0003);
  const totalEst = marginRequired + brokerage;

  const handlePlaceOrder = async () => {
    if (qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity of at least 1 share.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/orders', {
        symbol: stock.symbol,
        side,
        type: orderType,
        productType,
        quantity: qty,
        price: executionPrice,
      });
      Alert.alert('Order Executed! 🚀', `Successfully placed ${side} order for ${qty} shares of ${stock.symbol}!`);
      if (onOrderPlaced) onOrderPlaced(res);
      onClose();
    } catch (err) {
      Alert.alert('Order Error', err.message || 'Failed to place simulated order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{stock.symbol}</Text>
              <Text style={styles.price}>₹{currentPrice.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Buy / Sell Tabs */}
          <View style={styles.sideTabs}>
            <TouchableOpacity
              style={[styles.sideTab, side === 'BUY' && { backgroundColor: Colors.gainGreen }]}
              onPress={() => setSide('BUY')}
            >
              <Text style={[styles.sideText, side === 'BUY' && { color: '#000' }]}>BUY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideTab, side === 'SELL' && { backgroundColor: Colors.lossRed }]}
              onPress={() => setSide('SELL')}
            >
              <Text style={[styles.sideText, side === 'SELL' && { color: '#fff' }]}>SELL</Text>
            </TouchableOpacity>
          </View>

          {/* Product Type (Delivery / Intraday MIS) */}
          <View style={styles.productRow}>
            <TouchableOpacity
              style={[styles.productBtn, productType === 'CNC' && styles.productBtnActive]}
              onPress={() => setProductType('CNC')}
            >
              <Text style={[styles.productText, productType === 'CNC' && styles.productTextActive]}>
                Delivery (CNC 1x)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.productBtn, productType === 'MIS' && styles.productBtnActive]}
              onPress={() => setProductType('MIS')}
            >
              <Text style={[styles.productText, productType === 'MIS' && styles.productTextActive]}>
                Intraday (MIS 5x)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quantity & Order Type */}
          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Qty"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Order Type</Text>
              <View style={styles.orderTypeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, orderType === 'MARKET' && styles.typeBtnActive]}
                  onPress={() => setOrderType('MARKET')}
                >
                  <Text style={[styles.typeText, orderType === 'MARKET' && styles.typeTextActive]}>MKT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, orderType === 'LIMIT' && styles.typeBtnActive]}
                  onPress={() => setOrderType('LIMIT')}
                >
                  <Text style={[styles.typeText, orderType === 'LIMIT' && styles.typeTextActive]}>LMT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {orderType === 'LIMIT' && (
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.label}>Limit Price</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="Enter limit price"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          )}

          {/* Cost & Margin Breakdown */}
          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Required Margin:</Text>
              <Text style={styles.costVal}>₹{marginRequired.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Brokerage & Charges:</Text>
              <Text style={styles.costVal}>₹{brokerage.toFixed(2)}</Text>
            </View>
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: side === 'BUY' ? Colors.gainGreen : Colors.lossRed }]}
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={side === 'BUY' ? '#000' : '#fff'} />
            ) : (
              <Text style={[styles.submitText, { color: side === 'BUY' ? '#000' : '#fff' }]}>
                {side} {qty} {stock.symbol} (₹{totalEst.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brandPrimary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  sideTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  sideTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  sideText: {
    fontWeight: '800',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  productRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  productBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    alignItems: 'center',
  },
  productBtnActive: {
    borderWidth: 1.5,
    borderColor: Colors.brandPrimary,
  },
  productText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  productTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  orderTypeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 2,
    height: 48,
    alignItems: 'center',
  },
  typeBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: Colors.bgElevated,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.textPrimary,
  },
  costBreakdown: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  costVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default OrderModal;
