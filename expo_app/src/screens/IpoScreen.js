import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

export const IpoScreen = () => {
  const [ipos, setIpos] = useState([]);

  useEffect(() => {
    loadIpos();
  }, []);

  const loadIpos = async () => {
    try {
      const res = await api.get('/ipos');
      setIpos(res || []);
    } catch (e) {
      console.warn('IPO load error:', e.message);
    }
  };

  const handleApplyIpo = async (ipo) => {
    Alert.alert(
      `Apply for ${ipo.symbol} IPO`,
      `Apply for 1 lot (${ipo.lotSize} shares) at cut-off price ₹${ipo.priceBand?.split('-')[1]?.trim() || 500}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit ASBA Mandate',
          onPress: async () => {
            try {
              await api.post('/ipos/apply', {
                ipoId: ipo.id || ipo.symbol,
                lots: 1,
                upiId: 'trader@okhdfcbank'
              });
              Alert.alert('IPO Mandate Submitted! 🏷️', `Successfully applied for ${ipo.symbol} IPO via UPI ASBA!`);
              loadIpos();
            } catch (err) {
              Alert.alert('IPO Error', err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ipos}
        keyExtractor={item => item.symbol}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.top}>
              <View>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'OPEN' ? Colors.gainBg : Colors.bgCard }]}>
                <Text style={[styles.statusText, { color: item.status === 'OPEN' ? Colors.gainGreen : Colors.textSecondary }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Price Band</Text>
                <Text style={styles.val}>₹{item.priceBand}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Lot Size</Text>
                <Text style={styles.val}>{item.lotSize} Shares</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Issue Size</Text>
                <Text style={styles.val}>₹{item.issueSize || '1,250'} Cr</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Est. GMP</Text>
                <Text style={[styles.val, { color: Colors.gainGreen }]}>+{item.gmp || 35}%</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.applyBtn, item.status !== 'OPEN' && { opacity: 0.6 }]}
              onPress={() => handleApplyIpo(item)}
              disabled={item.status !== 'OPEN'}
            >
              <Text style={styles.applyBtnText}>
                {item.status === 'OPEN' ? '🏷️ Apply with UPI ASBA' : 'Coming Soon'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  name: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 12,
    marginBottom: 12,
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  val: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
});

export default IpoScreen;
