import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';

const SECTORS = ['ALL', 'BANKING', 'IT', 'ENERGY', 'AUTO', 'PHARMA'];

export const MarketsScreen = ({ navigation }) => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStocks();
  }, []);

  useEffect(() => {
    filterData();
  }, [stocks, selectedSector, searchQuery]);

  const loadStocks = async () => {
    try {
      const res = await api.get('/stocks');
      setStocks(res || []);
    } catch (e) {
      console.warn('Markets load error:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let result = [...stocks];

    if (selectedSector !== 'ALL') {
      result = result.filter(s => (s.sector || '').toUpperCase().includes(selectedSector));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(s =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    setFilteredStocks(result);
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search 500+ Indian Equities..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: Colors.textTertiary }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sector Pill Tabs */}
      <View style={styles.sectorRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SECTORS}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.sectorPill, selectedSector === item && styles.sectorPillActive]}
              onPress={() => setSelectedSector(item)}
            >
              <Text style={[styles.sectorText, selectedSector === item && styles.sectorTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredStocks}
          keyExtractor={item => item.symbol}
          renderItem={({ item }) => {
            const isGain = item.changePercent >= 0;
            return (
              <TouchableOpacity
                style={styles.stockRow}
                onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
                activeOpacity={0.7}
              >
                <View style={styles.leftCol}>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoText}>{item.symbol.slice(0, 2)}</Text>
                  </View>
                  <View>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                    <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                  </View>
                </View>

                <View style={styles.rightCol}>
                  <Text style={styles.priceText}>₹{item.currentPrice?.toLocaleString('en-IN')}</Text>
                  <View style={[styles.badge, { backgroundColor: isGain ? Colors.gainBg : Colors.lossBg }]}>
                    <Text style={[styles.changeText, { color: isGain ? Colors.gainGreen : Colors.lossRed }]}>
                      {isGain ? '+' : ''}{item.changePercent?.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: Colors.textSecondary }}>No matching stocks found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectorRow: {
    paddingLeft: 16,
    marginBottom: 8,
  },
  sectorPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectorPillActive: {
    backgroundColor: Colors.brandPrimary,
  },
  sectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectorTextActive: {
    color: '#000',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 40,
    height: 40,
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
  symbolText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  nameText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 180,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default MarketsScreen;
