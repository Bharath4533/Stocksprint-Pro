import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';

const UNDERLYINGS = [
  { label: 'NIFTY 50', value: 'NIFTY', spot: 24825.40, step: 50 },
  { label: 'BANK NIFTY', value: 'BANKNIFTY', spot: 51240.80, step: 100 },
  { label: 'FIN NIFTY', value: 'FINNIFTY', spot: 23110.50, step: 50 },
  { label: 'RELIANCE', value: 'RELIANCE', spot: 3012.40, step: 20 },
];

export const OptionsChainScreen = () => {
  const [selectedUnderlying, setSelectedUnderlying] = useState(UNDERLYINGS[0]);
  const [expiry, setExpiry] = useState('28-AUG-2026');

  const spot = selectedUnderlying.spot;
  const step = selectedUnderlying.step;
  const atmStrike = Math.round(spot / step) * step;

  // Generate strikes around ATM
  const strikes = [];
  for (let i = -7; i <= 7; i++) {
    const strike = atmStrike + i * step;
    const isCallItm = strike < spot;
    const isPutItm = strike > spot;
    const diff = spot - strike;
    
    // Greeks simulation
    const iv = Math.max(8.5, (13.5 + Math.abs(diff) * 0.003)).toFixed(1);
    const callDelta = Math.min(0.99, Math.max(0.01, (0.5 + diff / (step * 8)))).toFixed(2);
    const putDelta = -(1 - parseFloat(callDelta)).toFixed(2);
    const callPrice = Math.max(0.5, (isCallItm ? Math.abs(diff) + 40 : Math.max(1, 120 - Math.abs(diff) * 0.2))).toFixed(1);
    const putPrice = Math.max(0.5, (isPutItm ? Math.abs(diff) + 40 : Math.max(1, 120 - Math.abs(diff) * 0.2))).toFixed(1);
    const callOi = Math.floor(Math.abs(Math.sin(strike)) * 85000 + 12000);
    const putOi = Math.floor(Math.abs(Math.cos(strike)) * 92000 + 15000);

    strikes.push({
      strike,
      isAtm: strike === atmStrike,
      isCallItm,
      isPutItm,
      callPrice,
      putPrice,
      callOi,
      putOi,
      callDelta,
      putDelta,
      iv
    });
  }

  const totalCallOi = strikes.reduce((a, s) => a + s.callOi, 0);
  const totalPutOi = strikes.reduce((a, s) => a + s.putOi, 0);
  const pcr = (totalPutOi / (totalCallOi || 1)).toFixed(2);

  return (
    <View style={styles.container}>
      {/* Underlying Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.underlyingRow}>
        {UNDERLYINGS.map(u => (
          <TouchableOpacity
            key={u.value}
            style={[styles.uChip, selectedUnderlying.value === u.value && styles.uChipActive]}
            onPress={() => setSelectedUnderlying(u)}
          >
            <Text style={[styles.uText, selectedUnderlying.value === u.value && styles.uTextActive]}>
              {u.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Spot Price & PCR Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.spotLabel}>SPOT PRICE</Text>
          <Text style={styles.spotVal}>₹{spot.toLocaleString('en-IN')}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.spotLabel}>MAX PAIN</Text>
          <Text style={[styles.spotVal, { color: Colors.accentBlue }]}>₹{atmStrike}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.spotLabel}>PCR RATIO</Text>
          <Text style={[styles.spotVal, { color: pcr >= 1 ? Colors.gainGreen : Colors.lossRed }]}>{pcr}</Text>
        </View>
      </View>

      {/* Ladder Header */}
      <View style={styles.ladderHeader}>
        <Text style={[styles.hCol, { color: Colors.gainGreen }]}>CALL OI / LTP</Text>
        <Text style={[styles.hCol, { textAlign: 'center', fontWeight: '800' }]}>STRIKE</Text>
        <Text style={[styles.hCol, { color: Colors.lossRed, textAlign: 'right' }]}>PUT LTP / OI</Text>
      </View>

      {/* Strikes List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {strikes.map((s, idx) => (
          <View
            key={idx}
            style={[
              styles.strikeRow,
              s.isAtm && styles.atmRow,
            ]}
          >
            {/* CALLS */}
            <View style={[styles.sideCol, s.isCallItm && styles.itmBg]}>
              <Text style={styles.oiText}>{(s.callOi / 1000).toFixed(0)}k</Text>
              <Text style={[styles.ltpText, { color: Colors.gainGreen }]}>₹{s.callPrice}</Text>
            </View>

            {/* STRIKE */}
            <View style={styles.strikeCol}>
              <Text style={[styles.strikeText, s.isAtm && styles.atmStrikeText]}>{s.strike}</Text>
              {s.isAtm && <Text style={styles.atmBadge}>ATM</Text>}
            </View>

            {/* PUTS */}
            <View style={[styles.sideCol, { alignItems: 'flex-end' }, s.isPutItm && styles.itmBg]}>
              <Text style={[styles.ltpText, { color: Colors.lossRed }]}>₹{s.putPrice}</Text>
              <Text style={styles.oiText}>{(s.putOi / 1000).toFixed(0)}k</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  underlyingRow: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxHeight: 50,
  },
  uChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  uChipActive: {
    backgroundColor: Colors.brandPrimary,
  },
  uText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  uTextActive: {
    color: '#000',
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: Colors.bgSurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  spotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  spotVal: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  ladderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  hCol: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  strikeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  atmRow: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentBlue,
  },
  sideCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  itmBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
  },
  strikeCol: {
    width: 90,
    alignItems: 'center',
  },
  strikeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  atmStrikeText: {
    color: Colors.accentBlue,
  },
  atmBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accentBlue,
  },
  oiText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: 'monospace',
  },
  ltpText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

export default OptionsChainScreen;
