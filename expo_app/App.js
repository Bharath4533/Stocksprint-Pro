import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/context/AuthContext';
import { Colors } from './src/constants/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import MarketsScreen from './src/screens/MarketsScreen';
import StockDetailScreen from './src/screens/StockDetailScreen';
import OptionsChainScreen from './src/screens/OptionsChainScreen';
import SectorHeatmapScreen from './src/screens/SectorHeatmapScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MutualFundsScreen from './src/screens/MutualFundsScreen';
import IpoScreen from './src/screens/IpoScreen';
import KycScreen from './src/screens/KycScreen';
import FundsScreen from './src/screens/FundsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DarkAppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bgPrimary,
    card: Colors.bgSurface,
    text: Colors.textPrimary,
    border: Colors.borderSubtle,
    primary: Colors.brandPrimary,
  },
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.bgSurface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.borderSubtle,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 18,
          color: Colors.textPrimary,
        },
        tabBarStyle: {
          backgroundColor: Colors.bgSurface,
          borderTopWidth: 1,
          borderTopColor: Colors.borderSubtle,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'StockSprint Pro',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Markets"
        component={MarketsScreen}
        options={{
          title: 'Markets & Discover',
          tabBarLabel: 'Markets',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="OptionsChain"
        component={OptionsChainScreen}
        options={{
          title: 'Options Chain (Greeks)',
          tabBarLabel: 'Options',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>⚡</Text>,
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          title: 'Portfolio & Holdings',
          tabBarLabel: 'Portfolio',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>💼</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Account & Settings',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={DarkAppTheme}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.bgSurface,
            },
            headerTitleStyle: {
              fontWeight: '800',
              color: Colors.textPrimary,
            },
            headerTintColor: Colors.brandPrimary,
          }}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StockDetail"
            component={StockDetailScreen}
            options={({ route }) => ({ title: route.params?.symbol || 'Stock Details' })}
          />
          <Stack.Screen
            name="SectorHeatmap"
            component={SectorHeatmapScreen}
            options={{ title: 'NSE Sector Heatmap' }}
          />
          <Stack.Screen
            name="MutualFunds"
            component={MutualFundsScreen}
            options={{ title: 'Mutual Funds & SIP' }}
          />
          <Stack.Screen
            name="Ipos"
            component={IpoScreen}
            options={{ title: 'IPO Hub' }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'Order Book' }}
          />
          <Stack.Screen
            name="Kyc"
            component={KycScreen}
            options={{ title: 'Indian KYC Verification' }}
          />
          <Stack.Screen
            name="Funds"
            component={FundsScreen}
            options={{ title: 'Funds & Margins' }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ title: 'Sign In / Register' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
