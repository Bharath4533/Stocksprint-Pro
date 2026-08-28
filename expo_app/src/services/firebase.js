// Mobile Firebase Cloud Sync Client for StockSprint Pro

import api from './api';

export const FirebaseSync = {
  async getStatus() {
    try {
      return await api.get('/firebase/status');
    } catch (e) {
      return { configured: false, mode: 'LOCAL_SYNC' };
    }
  },

  async triggerFullSync() {
    try {
      return await api.get('/portfolio');
    } catch (e) {
      return null;
    }
  }
};

export default FirebaseSync;
