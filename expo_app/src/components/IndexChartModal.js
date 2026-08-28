import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';
import CandleChart from './CandleChart';

export const IndexChartModal = ({ visible, symbol, onClose }) => {
  const [range, setRange] = useState('1M');
  const [details, setDetails] = useState(null);
  const [candles, setCandles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible && symbol) {
      loadData();
    }
  }, [visible, symbol, range]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [detRes, chartRes] = await Promise.all([
        api.get(`/markets/indices/${encodeURIComponent(symbol)}`),
        api.get(`/markets/indices/${encodeURIComponent(symbol)}/chart?range=${range}`),
      ]);
      setDetails(detRes);
      setCandles(chartRes.candles || []);
    } catch (e) {
      console.warn('Index load error:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{symbol} 📊</Text>
              <Text style={styles.subtitle}>1-Month Benchmark Index Performance</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading && !details ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Metrics Ribbon */}
              {details && (
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>1M High</Text>
                    <Text style={[styles.metricVal, { color: Colors.gainGreen }]}>₹{details.monthHigh?.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>1M Low</Text>
                    <Text style={[styles.metricVal, { color: Colors.lossRed }]}>₹{details.monthLow?.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>1M Return</Text>
                    <Text style={[styles.metricVal, { color: details.monthReturnPercent >= 0 ? Colors.gainGreen : Colors.lossRed }]}>
                      {details.monthReturnPercent >= 0 ? '+' : ''}{details.monthReturnPercent}%
                    </Text>
                  </View>
                </View>
              )}

              {/* Timeframe Selector */}
              <View style={styles.timeframeRow}>
                {['1D', '1W', '1M', '3M', '1Y'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tfBtn, range === t && styles.tfBtnActive]}
                    onPress={() => setRange(t)}
                  >
                    <Text style={[styles.tfText, range === t && styles.tfTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Candlestick / Line Chart */}
              <View style={styles.chartContainer}>
                <CandleChart candles={candles} height={200} />
              </View>

              {/* Top Heavyweights Breakdown */}
              {details?.constituents && (
                <View style={styles.constituentsCard}>
                  <Text style={styles.sectionTitle}>Top Index Heavyweight Constituents</Text>
                  {details.constituents.map((c, idx) => (
                    <View key={idx} style={styles.constituentRow}>
                      <Text style={styles.cName}>{c.symbol}</Text>
                      <Text style={styles.cWeight}>{c.weight}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
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
    maxHeight: '85%',
    padding: 20,
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
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tfBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
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
  chartContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 8,
    marginBottom: 16,
  },
  constituentsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  constituentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  cName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cWeight: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandPrimary,
  },
});

export default IndexChartModal;
