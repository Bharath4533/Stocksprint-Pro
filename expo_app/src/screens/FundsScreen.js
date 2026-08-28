import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

export const FundsScreen = () => {
  const [funds, setFunds] = useState(null);
  const [amount, setAmount] = useState('50000');

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    try {
      const res = await api.get('/funds');
      setFunds(res);
    } catch (e) {
      console.warn('Funds load error:', e.message);
    }
  };

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    try {
      await api.post('/funds/deposit', { amount: val, method: 'UPI' });
      Alert.alert('Funds Added! 💵', `Added ₹${val.toLocaleString('en-IN')} simulated trading balance.`);
      loadFunds();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    try {
      await api.post('/funds/withdraw', { amount: val });
      Alert.alert('Withdrawal Processed', `Withdrew ₹${val.toLocaleString('en-IN')}.`);
      loadFunds();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Balance Overview */}
        <View style={styles.card}>
          <Text style={styles.label}>AVAILABLE CASH BALANCE</Text>
          <Text style={styles.val}>₹{(funds?.availableCash || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
          
          <View style={styles.row}>
            <View>
              <Text style={styles.subLabel}>Used Margin</Text>
              <Text style={styles.subVal}>₹{(funds?.usedMargin || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.subLabel}>Withdrawable</Text>
              <Text style={styles.subVal}>₹{(funds?.withdrawableAmount || funds?.availableCash || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Deposit / Withdraw Action */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Add or Withdraw Simulated Capital</Text>
          
          <Text style={styles.inputLabel}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="50000"
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.gainGreen }]} onPress={handleDeposit}>
              <Text style={styles.btnText}>+ Add Funds (UPI)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.bgElevated }]} onPress={handleWithdraw}>
              <Text style={[styles.btnText, { color: Colors.textPrimary }]}>- Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  val: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 14,
    marginTop: 8,
  },
  subLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  subVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
});

export default FundsScreen;
