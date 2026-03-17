# She Shield AI Backend Documentation

This backend is specifically designed to support **all feature cards** in the She Shield AI dashboard. It uses Node.js and Express to manage data in memory.

## 🚀 How to Run the Backend

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Server:**
   ```bash
   npm start
   ```
   *The server will start at `http://localhost:5000`.*

---

## 🛠 API Endpoints & Frontend Examples

Here is how you can use `fetch()` in your `script.js` to connect the UI cards to the backend.

### 1. SOS Alert (Manual, Voice, or Wearable)
**Endpoint**: `POST /api/sos`
```javascript
async function triggerSOS(source = "manual") {
    const response = await fetch('http://localhost:5000/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: "Demo User",
            location: "28.61, 77.20",
            dangerScore: 90,
            time: new Date().toLocaleTimeString(),
            source: source
        })
    });
    const result = await response.json();
    console.log(result.message);
}
```

### 2. Wearable Integration
**Endpoint**: `POST /api/wearable/trigger`
```javascript
async function simulateWearable() {
    await fetch('http://localhost:5000/api/wearable/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: "Bangle-JS-01", batteryLevel: 85 })
    });
    triggerSOS("wearable"); // Also trigger an SOS alert
}
```

### 3. Voice-Activated SOS
**Endpoint**: `POST /api/voice/trigger`
```javascript
async function testVoiceRecording() {
    await fetch('http://localhost:5000/api/voice/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: "Help", confidence: 98 })
    });
    triggerSOS("voice"); // Also trigger an SOS alert
}
```

### 4. Safe Geofencing
**Endpoint**: `POST /api/geofence/alert`
```javascript
async function detectUnsafeZone() {
    const response = await fetch('http://localhost:5000/api/geofence/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneName: "Red Zone Sector 7", riskLevel: "High" })
    });
    const data = await response.json();
    alert("Warning: " + data.data.zoneName);
}
```

### 5. Safe Route AI
**Endpoint**: `GET /api/routes/compare`
```javascript
async function compareRoutes() {
    const response = await fetch('http://localhost:5000/api/routes/compare');
    const data = await response.json();
    console.log("Safe Routes:", data.routes);
}
```

### 6. Guardian Mode Toggle
**Endpoint**: `POST /api/guardian/toggle`
```javascript
async function toggleGuardian(isEnabled) {
    await fetch('http://localhost:5000/api/guardian/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: isEnabled })
    });
}
```

### 7. Dashboard Data
**Endpoint**: `GET /api/dashboard`
```javascript
async function updateDashboardUI() {
    const response = await fetch('http://localhost:5000/api/dashboard');
    const data = await response.json();
    console.log("Stats:", data);
}
```
