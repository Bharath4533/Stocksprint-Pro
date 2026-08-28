import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

export const PortfolioScreen = ({ navigation }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [activeTab, setActiveTab] = useState('HOLDINGS'); // 'HOLDINGS' | 'POSITIONS'
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const [portRes, posRes] = await Promise.all([
        api.get('/portfolio'),
        api.get('/portfolio/positions').catch(() => []),
      ]);
      setPortfolio(portRes);
      setPositions(posRes || []);
    } catch (e) {
      console.warn('Portfolio load error:', e.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  };

  const handleSquareOff = async (position) => {
    Alert.alert(
      'Square Off Position',
      `Are you sure you want to close your ${position.quantity} shares position in ${position.symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Square Off',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/orders/square-off/${position.id}`);
              Alert.alert('Position Squared Off!', `Successfully exited position in ${position.symbol}.`);
              loadPortfolio();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const isGain = (portfolio?.totalUnrealizedPnl || 0) >= 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brandPrimary} />}
      >
        {/* Portfolio Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.label}>CURRENT VALUE</Text>
              <Text style={styles.mainVal}>₹{(portfolio?.totalCurrentValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>INVESTED</Text>
              <Text style={styles.subVal}>₹{(portfolio?.totalInvestment || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.label}>TOTAL P&L</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.plText, { color: isGain ? Colors.gainGreen : Colors.lossRed }]}>
                {isGain ? '▲ +' : '▼ '}₹{Math.abs(portfolio?.totalUnrealizedPnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
              <View style={[styles.badge, { backgroundColor: isGain ? Colors.gainBg : Colors.lossBg }]}>
                <Text style={[styles.badgeText, { color: isGain ? Colors.gainGreen : Colors.lossRed }]}>
                  {isGain ? '+' : ''}{portfolio?.totalReturnPercent?.toFixed(2) || '0.00'}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'HOLDINGS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('HOLDINGS')}
          >
            <Text style={[styles.tabText, activeTab === 'HOLDINGS' && styles.tabTextActive]}>
              Holdings ({portfolio?.holdings?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'POSITIONS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('POSITIONS')}
          >
            <Text style={[styles.tabText, activeTab === 'POSITIONS' && styles.tabTextActive]}>
              Intraday Positions ({positions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Holdings List */}
        {activeTab === 'HOLDINGS' && (
          <View>
            {(!portfolio?.holdings || portfolio.holdings.length === 0) ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💼</Text>
                <Text style={styles.emptyTitle}>No Holdings Yet</Text>
                <Text style={styles.emptySub}>Start trading equities to build your long-term portfolio.</Text>
                <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Markets')}>
                  <Text style={styles.exploreText}>Explore Stocks</Text>
                </TouchableOpacity>
              </View>
            ) : (
              portfolio.holdings.map((h) => {
                const hGain = (h.unrealizedPnl || 0) >= 0;
                return (
                  <TouchableOpacity
                    key={h.symbol}
                    style={styles.holdingRow}
                    onPress={() => navigation.navigate('StockDetail', { symbol: h.symbol })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.left}>
                      <Text style={styles.sym}>{h.symbol}</Text>
                      <Text style={styles.sub}>{h.quantity} Qty • Avg ₹{h.averagePrice?.toFixed(2)}</Text>
                    </View>

                    <View style={styles.right}>
                      <Text style={styles.curVal}>₹{(h.currentValue || (h.quantity * h.currentPrice)).toLocaleString('en-IN')}</Text>
                      <Text style={[styles.plSub, { color: hGain ? Colors.gainGreen : Colors.lossRed }]}>
                        {hGain ? '+' : ''}₹{h.unrealizedPnl?.toFixed(2)} ({h.unrealizedPnlPercent?.toFixed(2)}%)
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Positions List */}
        {activeTab === 'POSITIONS' && (
          <View>
            {positions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>⚡</Text>
                <Text style={styles.emptyTitle}>No Open Positions</Text>
                <Text style={styles.emptySub}>Execute MIS Intraday trades to take advantage of 5x leverage.</Text>
              </View>
            ) : (
              positions.map((pos) => (
                <View key={pos.id} style={styles.holdingRow}>
                  <View style={styles.left}>
                    <Text style={styles.sym}>{pos.symbol} <Text style={{ fontSize: 10, color: Colors.accentBlue }}>(MIS)</Text></Text>
                    <Text style={styles.sub}>{pos.side} {pos.quantity} Qty • ₹{pos.averagePrice}</Text>
                  </View>

                  <View style={styles.right}>
                    <TouchableOpacity style={styles.sqBtn} onPress={() => handleSquareOff(pos)}>
                      <Text style={styles.sqText}>Square Off</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  mainVal: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  subVal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 14,
  },
  plText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.bgCard,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  left: {
    flex: 1,
  },
  sym: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  curVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  plSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  sqBtn: {
    backgroundColor: Colors.lossBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sqText: {
    color: Colors.lossRed,
    fontWeight: '700',
    fontSize: 12,
  },
});

export default PortfolioScreen;
