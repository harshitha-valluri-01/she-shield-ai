const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determine the path for the SQLite database file
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Initialize the Database Connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB Error] Could not connect to SQLite database:', err.message);
  } else {
    console.log('[DB] Connected securely to the persistent SQLite database.');
  }
});

// Function to initialize tables
const initDB = () => {
  db.serialize(() => {
    // 1. SOS Alerts Table
    db.run(`CREATE TABLE IF NOT EXISTS sos_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT,
      location TEXT,
      dangerScore INTEGER,
      time TEXT,
      source TEXT
    )`);

    // 2. Wearable Logs Table
    db.run(`CREATE TABLE IF NOT EXISTS wearable_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT,
      batteryLevel INTEGER,
      time TEXT
    )`);

    // 3. Voice Triggers Table
    db.run(`CREATE TABLE IF NOT EXISTS voice_triggers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT,
      confidence INTEGER,
      time TEXT
    )`);

    // 4. Geofence Alerts Table
    db.run(`CREATE TABLE IF NOT EXISTS geofence_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL,
      lng REAL,
      zoneAnalysis TEXT,
      riskLevel TEXT,
      time TEXT
    )`);

    // 5. Evidence Logs Table
    db.run(`CREATE TABLE IF NOT EXISTS evidence_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      status TEXT,
      time TEXT
    )`);

    // 6. Config/Guardian Table
    db.run(`CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);
    
    // Initialize Guardian mode false by default if not exists
    db.run(`INSERT OR IGNORE INTO config (key, value) VALUES ('guardianMode', 'false')`);

    console.log('[DB] All database tables are initialized and ready.');
  });
};

// Start initialization
initDB();

module.exports = db;
