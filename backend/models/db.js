const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Database {
  constructor() {
    this.dbPath = config.DB_PATH;
    this.seedPath = config.SEED_PATH;
    this.data = null;
    this.init();
  }

  init() {
    try {
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (!fs.existsSync(this.dbPath)) {
        this.resetToSeed();
      } else {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure collections exist
        this.ensureSchema();
      }
    } catch (err) {
      console.error('Failed to load database, falling back to seed:', err.message);
      this.resetToSeed();
    }
  }

  ensureSchema() {
    const required = [
      'users', 'funds', 'indices', 'securities', 'mutualFunds', 'sips',
      'ipos', 'ipoApplications', 'watchlists', 'holdings', 'positions',
      'orders', 'fundTransactions', 'alerts', 'notifications', 'news',
      'supportTickets', 'auditLogs'
    ];
    let modified = false;
    for (const key of required) {
      if (!Array.isArray(this.data[key])) {
        this.data[key] = [];
        modified = true;
      }
    }
    if (modified) {
      this.save();
    }
  }

  resetToSeed() {
    const rawSeed = fs.readFileSync(this.seedPath, 'utf8');
    this.data = JSON.parse(rawSeed);
    this.save();
  }

  save() {
    try {
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('Failed to atomically write DB:', err);
    }
  }

  // Generic Query Helpers
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, predicate) {
    const col = this.getCollection(collectionName);
    return predicate ? col.filter(predicate) : [...col];
  }

  findOne(collectionName, predicate) {
    const col = this.getCollection(collectionName);
    return col.find(predicate) || null;
  }

  insert(collectionName, item) {
    const col = this.getCollection(collectionName);
    col.push(item);
    this.save();
    return item;
  }

  update(collectionName, predicate, updater) {
    const col = this.getCollection(collectionName);
    let count = 0;
    for (let i = 0; i < col.length; i++) {
      if (predicate(col[i])) {
        if (typeof updater === 'function') {
          col[i] = updater(col[i]);
        } else {
          col[i] = { ...col[i], ...updater };
        }
        count++;
      }
    }
    if (count > 0) this.save();
    return count;
  }

  remove(collectionName, predicate) {
    const col = this.getCollection(collectionName);
    const initialLen = col.length;
    this.data[collectionName] = col.filter(item => !predicate(item));
    if (this.data[collectionName].length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

const db = new Database();
module.exports = db;
