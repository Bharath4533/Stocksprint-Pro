import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

export const SectorHeatmapScreen = ({ navigation }) => {
  const [stocks, setStocks] = useState([]);
  const [selectedSector, setSelectedSector] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/stocks');
      setStocks(res || []);
    } catch (e) {
      console.warn('Heatmap load error:', e.message);
    }
  };

  const sectors = ['ALL', 'Banking', 'Information Tech', 'Energy', 'Automobile', 'Pharma'];

  const filtered = selectedSector === 'ALL'
    ? stocks
    : stocks.filter(s => (s.sector || '').toLowerCase().includes(selectedSector.toLowerCase()));

  const getHeatmapColor = (change) => {
    if (change >= 2.0) return '#059669';
    if (change > 0) return '#10B981';
    if (change === 0) return '#475569';
    if (change > -2.0) return '#EF4444';
    return '#DC2626';
  };

  return (
    <View style={styles.container}>
      {/* Sector Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectorBar}>
        {sectors.map(sec => (
          <TouchableOpacity
            key={sec}
            style={[styles.secChip, selectedSector === sec && styles.secChipActive]}
            onPress={() => setSelectedSector(sec)}
          >
            <Text style={[styles.secText, selectedSector === sec && styles.secTextActive]}>{sec}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Heatmap Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {filtered.map(st => {
          const bg = getHeatmapColor(st.changePercent || 0);
          return (
            <TouchableOpacity
              key={st.symbol}
              style={[styles.tile, { backgroundColor: bg }]}
              onPress={() => navigation.navigate('StockDetail', { symbol: st.symbol })}
              activeOpacity={0.8}
            >
              <Text style={styles.tileSym}>{st.symbol}</Text>
              <Text style={styles.tilePrice}>₹{st.currentPrice?.toLocaleString('en-IN')}</Text>
              <Text style={styles.tileChange}>
                {(st.changePercent || 0) >= 0 ? '+' : ''}{(st.changePercent || 0).toFixed(2)}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  sectorBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxHeight: 52,
  },
  secChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.bgSurface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  secChipActive: {
    backgroundColor: Colors.brandPrimary,
  },
  secText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  secTextActive: {
    color: '#000',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  tile: {
    width: '31%',
    aspectRatio: 1.1,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileSym: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  tilePrice: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  tileChange: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
});

export default SectorHeatmapScreen;
