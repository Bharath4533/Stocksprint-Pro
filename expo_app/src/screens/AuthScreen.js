import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export const AuthScreen = ({ navigation }) => {
  const { loginWithPassword, registerWithPassword, handleDemoLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      if (isLogin) {
        if (!identifier || !password) {
          Alert.alert('Missing Fields', 'Please enter Email/Phone and Password.');
          return;
        }
        await loginWithPassword(identifier, password);
        Alert.alert('Welcome Back! 🚀', 'Logged in successfully.');
        navigation.goBack();
      } else {
        if (!name || !phone || !email || !password) {
          Alert.alert('Missing Fields', 'Please fill all fields.');
          return;
        }
        await registerWithPassword(name, phone, email, password);
        Alert.alert('Account Created! 🎉', 'Welcome to StockSprint Pro! ₹5,00,000 capital added.');
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Authentication Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDemoClick = async () => {
    setIsLoading(true);
    try {
      await handleDemoLogin();
      Alert.alert('Demo Active', 'Logged into Demo Account with ₹5,00,000.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Demo Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.title}>StockSprint Pro</Text>
          <Text style={styles.sub}>Virtual Indian Investment & Trading Platform</Text>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tBtn, isLogin && styles.tBtnActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tText, isLogin && styles.tTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tBtn, !isLogin && styles.tBtnActive]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tText, !isLogin && styles.tTextActive]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {isLogin ? (
          <View>
            <Text style={styles.label}>Email Address or Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. name@domain.com or 9876543210"
              placeholderTextColor={Colors.textTertiary}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your account password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>🔐 Sign In</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Full Legal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>10-Digit Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor={Colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@domain.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Choose Password (min 6 chars)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>🚀 Create Account & Trade</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.demoBtn} onPress={onDemoClick}>
          <Text style={styles.demoText}>⚡ 1-Click Instant Demo Login (₹5,00,000)</Text>
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
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tBtnActive: {
    backgroundColor: Colors.brandPrimary,
  },
  tText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tTextActive: {
    color: '#000',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  submitBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  demoBtn: {
    backgroundColor: Colors.bgSurface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  demoText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentBlue,
  },
});

export default AuthScreen;
