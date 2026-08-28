import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import IndexChartModal from '../components/IndexChartModal';
import OrderModal from '../components/OrderModal';

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [indices, setIndices] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [funds, setFunds] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [selectedStockForOrder, setSelectedStockForOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [indRes, stRes, portRes, fundsRes] = await Promise.all([
        api.get('/markets/indices'),
        api.get('/stocks'),
        api.get('/portfolio'),
        api.get('/funds'),
      ]);
      setIndices(indRes || []);
      setStocks(stRes || []);
      setPortfolio(portRes);
      setFunds(fundsRes);
    } catch (e) {
      console.warn('Dashboard load error:', e.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const totalValue = (portfolio?.totalCurrentValue || 0) + (funds?.availableCash || 500000);
  const totalPL = portfolio?.totalUnrealizedPnl || 0;
  const isGain = totalPL >= 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brandPrimary} />}
      >
        {/* Header Ribbon / Benchmark Indices (Touch for 1M Chart) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.indicesRibbon}>
          {indices.map((idx) => {
            const isIdxGain = idx.percentChange >= 0;
            return (
              <TouchableOpacity
                key={idx.symbol}
                style={styles.indexChip}
                onPress={() => setSelectedSymbol(idx.symbol)}
                activeOpacity={0.7}
              >
                <Text style={styles.indexSymbol}>{idx.symbol} 📊</Text>
                <Text style={styles.indexPrice}>₹{idx.value?.toLocaleString('en-IN')}</Text>
                <Text style={[styles.indexChange, { color: isIdxGain ? Colors.gainGreen : Colors.lossRed }]}>
                  {isIdxGain ? '+' : ''}{idx.percentChange}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Portfolio Summary Card */}
        <View style={styles.portfolioCard}>
          <Text style={styles.cardLabel}>TOTAL SIMULATED CAPITAL</Text>
          <Text style={styles.cardVal}>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
          
          <View style={styles.plRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.plText, { color: isGain ? Colors.gainGreen : Colors.lossRed }]}>
                {isGain ? '▲ +' : '▼ '}₹{Math.abs(totalPL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
              <View style={[styles.badge, { backgroundColor: isGain ? Colors.gainBg : Colors.lossBg }]}>
                <Text style={[styles.badgeText, { color: isGain ? Colors.gainGreen : Colors.lossRed }]}>
                  {isGain ? '+' : ''}{portfolio?.totalReturnPercent?.toFixed(2) || '0.00'}%
                </Text>
              </View>
            </View>
            <Text style={styles.availableCash}>Available: ₹{(funds?.availableCash || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Quick Action Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('OptionsChain')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </View>
            <Text style={styles.actionText}>Option Chain</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('SectorHeatmap')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={{ fontSize: 20 }}>🗺️</Text>
            </View>
            <Text style={styles.actionText}>Heatmap</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MutualFunds')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={{ fontSize: 20 }}>🌱</Text>
            </View>
            <Text style={styles.actionText}>Mutual Funds</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Ipos')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(129, 140, 248, 0.15)' }]}>
              <Text style={{ fontSize: 20 }}>🏷️</Text>
            </View>
            <Text style={styles.actionText}>IPO Hub</Text>
          </TouchableOpacity>
        </View>

        {/* KYC Status Banner if Pending */}
        {user?.kycStatus !== 'VERIFIED' && (
          <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('Kyc')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kycTitle}>Complete Indian KYC (No OTP / DigiLocker)</Text>
              <Text style={styles.kycSub}>Validate PAN & Bank details to unlock simulated trading.</Text>
            </View>
            <Text style={styles.kycArrow}>➔</Text>
          </TouchableOpacity>
        )}

        {/* Trending Indian Equities */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Indian Equities</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Markets')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {stocks.slice(0, 8).map((st) => {
          const isStGain = st.changePercent >= 0;
          return (
            <TouchableOpacity
              key={st.symbol}
              style={styles.stockItem}
              onPress={() => navigation.navigate('StockDetail', { symbol: st.symbol })}
              activeOpacity={0.7}
            >
              <View style={styles.stockLeft}>
                <View style={styles.stockLogo}>
                  <Text style={styles.logoText}>{st.symbol.slice(0, 2)}</Text>
                </View>
                <View>
                  <Text style={styles.stockSym}>{st.symbol}</Text>
                  <Text style={styles.stockName} numberOfLines={1}>{st.name}</Text>
                </View>
              </View>

              <View style={styles.stockRight}>
                <Text style={styles.stockPrice}>₹{st.currentPrice?.toLocaleString('en-IN')}</Text>
                <View style={[styles.stockBadge, { backgroundColor: isStGain ? Colors.gainBg : Colors.lossBg }]}>
                  <Text style={[styles.stockChange, { color: isStGain ? Colors.gainGreen : Colors.lossRed }]}>
                    {isStGain ? '+' : ''}{st.changePercent?.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 1-Month Benchmark Index Chart Modal */}
      <IndexChartModal
        visible={!!selectedSymbol}
        symbol={selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
      />

      {/* Order Execution Modal */}
      <OrderModal
        visible={!!selectedStockForOrder}
        stock={selectedStockForOrder}
        onClose={() => setSelectedStockForOrder(null)}
        onOrderPlaced={loadDashboardData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  indicesRibbon: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  indexChip: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    minWidth: 140,
  },
  indexSymbol: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  indexPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  indexChange: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  portfolioCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  cardVal: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginVertical: 6,
    fontFamily: 'monospace',
  },
  plRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  plText: {
    fontSize: 14,
    fontWeight: '700',
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
  availableCash: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  kycBanner: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kycTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brandPrimary,
  },
  kycSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  kycArrow: {
    fontSize: 18,
    color: Colors.brandPrimary,
    fontWeight: '800',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandPrimary,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stockLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  logoText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.brandPrimary,
  },
  stockSym: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stockName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
    maxWidth: 160,
  },
  stockRight: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  stockChange: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default DashboardScreen;
