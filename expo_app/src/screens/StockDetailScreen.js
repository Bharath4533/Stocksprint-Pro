import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';
import CandleChart from '../components/CandleChart';
import OrderModal from '../components/OrderModal';

export const StockDetailScreen = ({ route, navigation }) => {
  const { symbol = 'RELIANCE' } = route.params || {};
  const [stock, setStock] = useState(null);
  const [candles, setCandles] = useState([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [isLine, setIsLine] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderModalSide, setOrderModalSide] = useState(null); // 'BUY' | 'SELL' | null

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const loadData = async () => {
    try {
      const [stRes, chartRes] = await Promise.all([
        api.get(`/stocks/${symbol}`),
        api.get(`/stocks/${symbol}/chart?range=${timeframe}`),
      ]);
      setStock(stRes);
      setCandles(chartRes.candles || []);
    } catch (e) {
      console.warn('Stock detail error:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !stock) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  const isGain = (stock?.changePercent || 0) >= 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Price Banner */}
        <View style={styles.headerCard}>
          <Text style={styles.symbolTitle}>{stock?.symbol}</Text>
          <Text style={styles.nameSubtitle}>{stock?.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{stock?.currentPrice?.toLocaleString('en-IN')}</Text>
            <View style={[styles.badge, { backgroundColor: isGain ? Colors.gainBg : Colors.lossBg }]}>
              <Text style={[styles.badgeText, { color: isGain ? Colors.gainGreen : Colors.lossRed }]}>
                {isGain ? '▲ +' : '▼ '}{stock?.change?.toFixed(2)} ({stock?.changePercent?.toFixed(2)}%)
              </Text>
            </View>
          </View>

          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>Day Low: ₹{stock?.dayLow?.toLocaleString('en-IN')}</Text>
            <Text style={styles.rangeText}>Day High: ₹{stock?.dayHigh?.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Timeframe & Chart Style Toggles */}
        <View style={styles.chartControls}>
          <View style={styles.tfContainer}>
            {['1D', '1W', '1M', '1Y', '5Y'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tfBtn, timeframe === t && styles.tfBtnActive]}
                onPress={() => setTimeframe(t)}
              >
                <Text style={[styles.tfText, timeframe === t && styles.tfTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.chartTypeToggle} onPress={() => setIsLine(!isLine)}>
            <Text style={styles.chartTypeText}>{isLine ? '🕯️ Candles' : '📈 Line'}</Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Chart Container */}
        <View style={styles.chartCard}>
          <CandleChart candles={candles} height={220} isLine={isLine} />
        </View>

        {/* Fundamentals Section */}
        {stock?.fundamentals && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Fundamentals & Valuation</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Market Cap</Text>
                <Text style={styles.gridVal}>₹{stock.fundamentals.marketCap?.toLocaleString('en-IN')} Cr</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>P/E Ratio</Text>
                <Text style={styles.gridVal}>{stock.fundamentals.peRatio || 'N/A'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>P/B Ratio</Text>
                <Text style={styles.gridVal}>{stock.fundamentals.pbRatio || 'N/A'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Dividend Yield</Text>
                <Text style={styles.gridVal}>{stock.fundamentals.dividendYield || '0.00'}%</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>52W High</Text>
                <Text style={[styles.gridVal, { color: Colors.gainGreen }]}>₹{stock.fundamentals.high52w?.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>52W Low</Text>
                <Text style={[styles.gridVal, { color: Colors.lossRed }]}>₹{stock.fundamentals.low52w?.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Financials Section */}
        {stock?.financials && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quarterly Financials</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Revenue (TTM)</Text>
                <Text style={styles.gridVal}>₹{stock.financials.revenue?.toLocaleString('en-IN')} Cr</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Net Profit (TTM)</Text>
                <Text style={styles.gridVal}>₹{stock.financials.netProfit?.toLocaleString('en-IN')} Cr</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Profit Margin</Text>
                <Text style={styles.gridVal}>{stock.financials.profitMargin || '0.0'}%</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>YoY Growth</Text>
                <Text style={[styles.gridVal, { color: Colors.gainGreen }]}>+{stock.financials.growthYoY || '0'}%</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Buy / Sell Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.gainGreen }]}
          onPress={() => setOrderModalSide('BUY')}
        >
          <Text style={styles.actionBtnText}>BUY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.lossRed }]}
          onPress={() => setOrderModalSide('SELL')}
        >
          <Text style={[styles.actionBtnText, { color: '#fff' }]}>SELL</Text>
        </TouchableOpacity>
      </View>

      {/* Order Modal */}
      <OrderModal
        visible={!!orderModalSide}
        stock={stock}
        defaultSide={orderModalSide || 'BUY'}
        onClose={() => setOrderModalSide(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  headerCard: {
    padding: 20,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  symbolTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  nameSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  currentPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rangeText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  chartControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tfContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tfBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.bgSurface,
  },
  tfBtnActive: {
    backgroundColor: Colors.brandPrimary,
  },
  tfText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tfTextActive: {
    color: '#000',
  },
  chartTypeToggle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.bgSurface,
  },
  chartTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chartCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  gridVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
});

export default StockDetailScreen;
