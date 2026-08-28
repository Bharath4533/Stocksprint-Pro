import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

export const MutualFundsScreen = () => {
  const [funds, setFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [sipAmount, setSipAmount] = useState('5000');
  const [sipDuration, setSipDuration] = useState('5'); // years

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    try {
      const res = await api.get('/mutual-funds');
      setFunds(res || []);
    } catch (e) {
      console.warn('MF load error:', e.message);
    }
  };

  const calculateSipProjection = () => {
    const p = parseFloat(sipAmount) || 5000;
    const r = (selectedFund?.cagr3y || 15) / 100 / 12;
    const n = (parseInt(sipDuration, 10) || 5) * 12;
    const invested = p * n;
    const maturity = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    return { invested, maturity, gains: maturity - invested };
  };

  const handleStartSip = async () => {
    try {
      await api.post('/mutual-funds/sip', {
        schemeCode: selectedFund.schemeCode,
        amount: parseFloat(sipAmount),
        frequency: 'MONTHLY'
      });
      Alert.alert('SIP Activated! 🌱', `Monthly SIP of ₹${sipAmount} started in ${selectedFund.schemeName}!`);
      setSelectedFund(null);
    } catch (err) {
      Alert.alert('SIP Error', err.message);
    }
  };

  const projection = selectedFund ? calculateSipProjection() : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={funds}
        keyExtractor={item => item.schemeCode || item.schemeName}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedFund(item)} activeOpacity={0.7}>
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <Text style={styles.category}>{item.category || 'Equity - Large Cap'}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.schemeName}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {item.rating || 5}</Text>
              </View>
            </View>

            <View style={styles.stats}>
              <View>
                <Text style={styles.statLabel}>NAV</Text>
                <Text style={styles.statVal}>₹{item.nav?.toFixed(2)}</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>1Y Return</Text>
                <Text style={[styles.statVal, { color: Colors.gainGreen }]}>+{item.cagr1y || 18.5}%</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>3Y Return</Text>
                <Text style={[styles.statVal, { color: Colors.gainGreen }]}>+{item.cagr3y || 22.4}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* SIP Calculator & Invest Modal */}
      {selectedFund && (
        <Modal visible={!!selectedFund} animationType="slide" transparent>
          <View style={styles.backdrop}>
            <View style={styles.modalCard}>
              <View style={styles.mHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mTitle}>{selectedFund.schemeName}</Text>
                  <Text style={styles.mSub}>SIP Compound Returns Projection</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFund(null)}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Monthly Investment Amount</Text>
              <TextInput
                style={styles.input}
                value={sipAmount}
                onChangeText={setSipAmount}
                keyboardType="numeric"
                placeholder="₹ Amount"
              />

              <Text style={styles.label}>Duration (Years)</Text>
              <View style={styles.pillRow}>
                {['1', '3', '5', '10', '15'].map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.pill, sipDuration === y && styles.pillActive]}
                    onPress={() => setSipDuration(y)}
                  >
                    <Text style={[styles.pillText, sipDuration === y && styles.pillTextActive]}>{y}Y</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {projection && (
                <View style={styles.projCard}>
                  <View style={styles.projRow}>
                    <Text style={styles.projLabel}>Total Invested:</Text>
                    <Text style={styles.projVal}>₹{projection.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  </View>
                  <View style={styles.projRow}>
                    <Text style={styles.projLabel}>Est. Returns:</Text>
                    <Text style={[styles.projVal, { color: Colors.gainGreen }]}>+₹{projection.gains.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  </View>
                  <View style={[styles.projRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingTop: 6 }]}>
                    <Text style={[styles.projLabel, { fontWeight: '800', color: Colors.textPrimary }]}>Total Expected Value:</Text>
                    <Text style={[styles.projVal, { fontSize: 16, color: Colors.brandPrimary }]}>₹{projection.maturity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.investBtn} onPress={handleStartSip}>
                <Text style={styles.investBtnText}>🌱 Start Simulated Monthly SIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentBlue,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: Colors.gainBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gainGreen,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 10,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
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
  mHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  mSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  close: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: Colors.brandPrimary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#000',
  },
  projCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
  },
  projRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  projLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  projVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  investBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  investBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
});

export default MutualFundsScreen;
