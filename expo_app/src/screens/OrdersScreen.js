import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

export const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'EXECUTED' | 'OPEN'
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res || []);
    } catch (e) {
      console.warn('Orders load error:', e.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {['ALL', 'EXECUTED', 'OPEN', 'CANCELLED'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brandPrimary} />}
        renderItem={({ item }) => {
          const isBuy = item.side === 'BUY';
          return (
            <View style={styles.orderCard}>
              <View style={styles.topRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.sideBadge, { backgroundColor: isBuy ? Colors.gainBg : Colors.lossBg }]}>
                    <Text style={[styles.sideText, { color: isBuy ? Colors.gainGreen : Colors.lossRed }]}>
                      {item.side}
                    </Text>
                  </View>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text style={styles.productTag}>{item.productType || 'CNC'}</Text>
                </View>
                <Text style={[styles.statusText, { color: item.status === 'EXECUTED' ? Colors.gainGreen : Colors.textTertiary }]}>
                  {item.status}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <Text style={styles.subText}>Qty: {item.filledQuantity || item.quantity} / {item.quantity}</Text>
                <Text style={styles.priceText}>Avg: ₹{(item.price || item.averagePrice || 0).toLocaleString('en-IN')}</Text>
                <Text style={styles.timeText}>{new Date(item.createdAt || Date.now()).toLocaleTimeString()}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>↕️</Text>
            <Text style={styles.emptyTitle}>No Orders Placed</Text>
            <Text style={styles.emptySub}>Executed and open trades will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    margin: 16,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.bgCard,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  orderCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  sideText: {
    fontSize: 10,
    fontWeight: '900',
  },
  symbol: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginRight: 6,
  },
  productTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentBlue,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  timeText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default OrdersScreen;
