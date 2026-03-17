/**
 * She Shield AI - Simple Backend Server
 * Built with Node.js and Express.js
 * 
 * This backend supports all feature cards:
 * 1. Wearable Integration
 * 2. Voice-Activated SOS
 * 3. Safe Geofencing
 * 4. Safe Route AI
 * 5. Evidence Capture
 */

const express = require('express'); // Import the Express framework
const cors = require('cors'); // Import CORS to allow our frontend to talk to this backend

const app = express(); // Initialize the Express application
const PORT = 5001; // Define the port number we want our server to run on

// -- MIDDLEWARE --
app.use(cors()); // Enable CORS so different domains/ports can access the API
app.use(express.json()); // Allow the server to understand and parse JSON data in request bodies

// -- DATABASE CONNECTION --
const db = require('./database'); // Import our SQLite setup

// Mock emergency contacts still in memory since it's just config
let emergencyContacts = [
  { name: "Mom", phone: "+91 98765 43210" },
  { name: "Dad", phone: "+91 87654 32109" },
  { name: "Best Friend", phone: "+91 76543 21098" }
];

// -- API ENDPOINTS --

/**
 * 1. Root Route
 * Just a simple message to check if the server is running.
 */
app.get('/', (req, res) => {
  res.send("She Shield AI backend is running");
});

/**
 * 2. POST /api/sos
 * Used to send a new SOS alert (Manual, Wearable, or Voice).
 */
app.post('/api/sos', (req, res) => {
  const { userName, location, dangerScore, time, source = "manual" } = req.body;

  db.run(`INSERT INTO sos_alerts (userName, location, dangerScore, time, source) VALUES (?, ?, ?, ?, ?)`, 
    [userName, location, dangerScore || 0, time || new Date().toISOString(), source], 
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      console.log(`[SOS DB] ${source.toUpperCase()} alert saved to SQLite for ${userName}`);
      res.json({
        success: true,
        message: `${source} SOS alert sent successfully`,
        data: { id: this.lastID, userName, location, dangerScore, time, source }
      });
  });
});

/**
 * 3. GET /api/sos
 * Returns all SOS alerts.
 */
app.get('/api/sos', (req, res) => {
  db.all(`SELECT * FROM sos_alerts`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * 4. POST /api/guardian/toggle
 * Toggles the "Guardian Mode" on or off.
 */
app.post('/api/guardian/toggle', (req, res) => {
  const { enabled } = req.body;
  const val = enabled ? 'true' : 'false';
  
  db.run(`UPDATE config SET value = ? WHERE key = 'guardianMode'`, [val], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    console.log(`[Guardian DB] Mode set to: ${val}`);
    res.json({
      success: true,
      guardianMode: enabled,
      message: "Guardian mode updated in DB"
    });
  });
});

/**
 * 5. GET /api/guardian/status
 * Check if Guardian Mode is currently active.
 */
app.get('/api/guardian/status', (req, res) => {
  db.get(`SELECT value FROM config WHERE key = 'guardianMode'`, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ guardianMode: row ? (row.value === 'true') : false });
  });
});

/**
 * 6. POST /api/wearable/trigger
 * Simulates a trigger from a wearable device.
 */
app.post('/api/wearable/trigger', (req, res) => {
  const { deviceId, batteryLevel } = req.body;
  const time = new Date().toISOString();
  
  db.run(`INSERT INTO wearable_logs (deviceId, batteryLevel, time) VALUES (?, ?, ?)`, 
    [deviceId, batteryLevel, time], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      console.log(`[Wearable DB] Triggered by device: ${deviceId}`);
      res.json({
        success: true,
        message: "Wearable SOS signal saved",
        data: { id: this.lastID, deviceId, batteryLevel, time }
      });
  });
});

/**
 * 7. POST /api/voice/trigger
 * Simulates a voice-activated SOS trigger.
 */
app.post('/api/voice/trigger', (req, res) => {
  const { keyword, confidence } = req.body;
  const time = new Date().toISOString();
  
  db.run(`INSERT INTO voice_triggers (keyword, confidence, time) VALUES (?, ?, ?)`,
    [keyword, confidence, time], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      console.log(`[Voice DB] Keyword detected: ${keyword} (${confidence}%)`);
      res.json({
        success: true,
        message: "Voice SOS saved",
        data: { id: this.lastID, keyword, confidence, time }
      });
  });
});

/**
 * 8. POST /api/geofence/alert
 * Simulates AI analysis of entering an unsafe zone based on GPS.
 */
app.post('/api/geofence/alert', (req, res) => {
  const { lat, lng } = req.body;
  const riskLevel = "High";
  const zoneAnalysis = "Isolated area, low lighting detected. High stray dog activity reported.";
  const time = new Date().toISOString();

  db.run(`INSERT INTO geofence_alerts (lat, lng, zoneAnalysis, riskLevel, time) VALUES (?, ?, ?, ?, ?)`,
    [lat, lng, zoneAnalysis, riskLevel, time], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      console.log(`[Geofence DB] Unsafe zone analyzed at [${lat}, ${lng}]. Risk: ${riskLevel}`);
      res.json({
        success: true,
        message: "Unsafe zone warning logged in DB",
        data: { id: this.lastID, lat, lng, zoneAnalysis, riskLevel, time, policeContact: "Local Police: 100" }
      });
  });
});

/**
 * 9. POST /api/routes/compare
 * Returns Mock AI Route comparison data based on GPS.
 */
app.post('/api/routes/compare', (req, res) => {
  const { lat, lng } = req.body;
  
  // Simulating prediction model predicting safe routes
  res.json({
    routes: [
      { name: "Main Avenue", riskScore: 12, distance: "1.2km", status: "Very Safe", reason: "Well-lit, high foot traffic." },
      { name: "Back Alley 4", riskScore: 88, distance: "0.8km", status: "Unsafe - Avoid", reason: "History of incidents, no cameras." }
    ],
    policeContact: "Patrol Dispatch: 112"
  });
});

/**
 * 10. POST /api/evidence
 * Log evidence collection.
 */
app.post('/api/evidence', (req, res) => {
  const { type, time, status } = req.body;
  
  db.run(`INSERT INTO evidence_logs (type, status, time) VALUES (?, ?, ?)`,
    [type, status, time || new Date().toISOString()], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      console.log(`[Evidence DB] ${type} recording ${status}`);
      res.json({ success: true, message: "Evidence log saved to DB", id: this.lastID });
  });
});

/**
 * 11. POST /api/emergency-contacts/alert
 * Simulates sending alerts to emergency contacts.
 */
app.post('/api/emergency-contacts/alert', (req, res) => {
  const { source, location } = req.body;
  console.log(`[ALERTS] Emergency detected via ${source}! Sending SMS to ${emergencyContacts.length} contacts...`);
  
  emergencyContacts.forEach(contact => {
    console.log(`[SMS SENT] To: ${contact.name} (${contact.phone}) - Msg: EMERGENCY! Help needed at ${location || 'Current Location'}. View Live Stream: http://she-shield.ai/live/user123`);
  });

  res.json({
    success: true,
    message: `Alerts sent to ${emergencyContacts.length} contacts`,
    contacts: emergencyContacts
  });
});

/**
 * 11. GET /api/dashboard
 * Returns a summary of all data.
 */
app.get('/api/dashboard', (req, res) => {
  // Using nested callbacks for simplicity in this basic setup (Promises are better for real apps)
  db.get(`SELECT COUNT(*) as count FROM sos_alerts`, (err, sosRow) => {
    db.get(`SELECT COUNT(*) as count FROM evidence_logs`, (err, evRow) => {
      db.get(`SELECT COUNT(*) as count FROM voice_triggers`, (err, vtRow) => {
        db.get(`SELECT COUNT(*) as count FROM wearable_logs`, (err, wlRow) => {
          db.get(`SELECT COUNT(*) as count FROM geofence_alerts`, (err, gfRow) => {
            db.get(`SELECT value FROM config WHERE key = 'guardianMode'`, (err, configRow) => {
              
              res.json({
                totalAlerts: sosRow ? sosRow.count : 0,
                guardianMode: configRow ? (configRow.value === 'true') : false,
                totalEvidenceLogs: evRow ? evRow.count : 0,
                activeTriggers: {
                  voice: vtRow ? vtRow.count : 0,
                  wearable: wlRow ? wlRow.count : 0,
                  geofence: gfRow ? gfRow.count : 0
                }
              });
              
            });
          });
        });
      });
    });
  });
});

// -- START THE SERVER --
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
