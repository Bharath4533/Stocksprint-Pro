// StockSprint Pro Mobile API Client with Dynamic Host IP Resolution for Expo Go & USB

import Constants from 'expo-constants';
import { Platform } from 'react-native';

class ApiService {
  constructor() {
    this.token = null;
    this.baseUrl = this.resolveBaseUrl();
  }

  resolveBaseUrl() {
    // 1. Check if running in Expo Go on a physical device over USB or Wi-Fi
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000/api`;
    }

    // 2. Android Emulator fallback
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';
    }

    // 3. iOS Simulator & Web fallback
    return 'http://localhost:3000/api';
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[API ERROR] ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
export default api;
