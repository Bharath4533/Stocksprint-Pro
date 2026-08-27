const db = require('../models/db');

class StructuredLogger {
  maskSensitive(str) {
    if (!str || typeof str !== 'string') return str;
    // Mask PAN (e.g. ABCDE1234F -> ABC****34F)
    if (str.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(str)) {
      return str.slice(0, 3) + '****' + str.slice(7);
    }
    // Mask Bank Account / Card (last 4 visible)
    if (str.length >= 8 && /^[0-9]+$/.test(str)) {
      return 'X'.repeat(str.length - 4) + str.slice(-4);
    }
    return str;
  }

  logAudit({ userId, action, details, ipAddress = '127.0.0.1', status = 'SUCCESS' }) {
    const entry = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId: userId || 'SYSTEM',
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress,
      status,
      timestamp: new Date().toISOString()
    };
    db.insert('auditLogs', entry);
    console.log(`[AUDIT] [${entry.timestamp}] [${entry.action}] User: ${entry.userId} - ${entry.status}`);
    return entry;
  }

  info(msg, meta = {}) {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? meta : '');
  }

  warn(msg, meta = {}) {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta);
  }

  error(msg, err = {}) {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, err.message || err);
  }
}

module.exports = new StructuredLogger();
