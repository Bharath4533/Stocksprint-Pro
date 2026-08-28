import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, handleDemoLogin } = useAuth();

  const handleResetBalance = async () => {
    Alert.alert(
      'Reset Virtual Funds',
      'Reset your simulated portfolio and replenish capital to ₹5,00,000?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await api.post('/funds/reset');
              Alert.alert('Reset Complete', 'Virtual funds replenished to ₹5,00,000!');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1) || 'U'}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Trader'}</Text>
          <Text style={styles.email}>{user?.email || 'trader@stocksprint.in'}</Text>
          <Text style={styles.phone}>{user?.phone || '+91 98765 43210'}</Text>

          <View style={[styles.kycBadge, { backgroundColor: user?.kycStatus === 'VERIFIED' ? Colors.gainBg : Colors.lossBg }]}>
            <Text style={[styles.kycText, { color: user?.kycStatus === 'VERIFIED' ? Colors.gainGreen : Colors.lossRed }]}>
              KYC Status: {user?.kycStatus || 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Kyc')}>
            <Text style={styles.menuIcon}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Indian KYC Verification</Text>
              <Text style={styles.menuSub}>PAN & Bank account verification (No OTP)</Text>
            </View>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Funds')}>
            <Text style={styles.menuIcon}>💵</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Funds & Margins Ledger</Text>
              <Text style={styles.menuSub}>Deposit / Withdraw virtual capital</Text>
            </View>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleResetBalance}>
            <Text style={styles.menuIcon}>🔄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Reset Trading Balance</Text>
              <Text style={styles.menuSub}>Replenish account to ₹5,00,000</Text>
            </View>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <TouchableOpacity style={styles.authBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.authBtnText}>Switch / Login to Another Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  userCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  email: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phone: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  kycBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '800',
  },
  menuCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  menuSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  arrow: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  authBtn: {
    backgroundColor: Colors.bgCard,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  authBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandPrimary,
  },
});

export default ProfileScreen;
