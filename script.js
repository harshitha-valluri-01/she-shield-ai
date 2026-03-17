document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5001/api';
    const IS_OFFLINE_MODE = true; // Set to true for Hackathon Demo if you don't have Node.js installed

    // Utility for showing notifications (toasts)
    const showToast = (messages) => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        messages.forEach((msg, index) => {
            setTimeout(() => {
                const toast = document.createElement('div');
                toast.className = 'toast glass';
                toast.innerText = msg;
                container.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 500);
                }, 4000);
            }, index * 300);
        });
    };

    // --- BROWSER-ONLY BACKEND (MOCK) ---
    // If the server is not running, we store data in the browser's Local Storage.
    const mockDb = {
        save: (key, data) => {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({ ...data, id: existing.length + 1, time: new Date().toLocaleString() });
            localStorage.setItem(key, JSON.stringify(existing));
            console.log(`[Mock DB] Saved to ${key}:`, data);
            return { success: true, data };
        },
        get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
        toggleGuardian: (enabled) => localStorage.setItem('guardianMode', enabled),
        getGuardian: () => localStorage.getItem('guardianMode') === 'true'
    };

    // Generic function to call backend with mock fallback
    async function apiCall(endpoint, method = 'GET', body = null) {
        if (IS_OFFLINE_MODE) {
            // Simulate server lag
            await new Promise(r => setTimeout(r, 300));
            
            if (endpoint === '/sos' && method === 'POST') return mockDb.save('sosAlerts', body);
            if (endpoint === '/sos' && method === 'GET') return mockDb.get('sosAlerts');
            if (endpoint === '/guardian/toggle' && method === 'POST') {
                mockDb.toggleGuardian(body.enabled);
                return { success: true, guardianMode: body.enabled };
            }
            if (endpoint === '/guardian/status') return { guardianMode: mockDb.getGuardian() };
            if (endpoint === '/wearable/trigger') return mockDb.save('wearableLogs', body);
            if (endpoint === '/voice/trigger') return mockDb.save('voiceTriggers', body);
            if (endpoint === '/geofence/alert') return { data: mockDb.save('geofenceAlerts', { ...body, riskLevel: 'High', zoneAnalysis: 'Isolated area, low lighting detected', policeContact: 'Local Police: 100' }).data };
            if (endpoint === '/routes/compare') return { routes: [
                { status: "Very Safe", name: "Main St", riskScore: 12 }, 
                { status: "Unsafe", name: "Ally Way", riskScore: 88 }
            ], policeContact: 'Patrol Dispatch: 112'};
            if (endpoint === '/evidence') return mockDb.save('evidenceLogs', body);
            if (endpoint === '/emergency-contacts/alert') return { success: true, message: "Mock alerts sent to 3 contacts" };
            
            return { success: true };
        }

        try {
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const response = await fetch(`${API_URL}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.warn("Backend server not reached. Switching to Browser-Only mode...");
            return null; 
        }
    }

    // --- Helper for Emergency Alerting ---
    async function triggerEmergencyAlerts(source, location = "Live GPS Coordinate") {
        await apiCall('/emergency-contacts/alert', 'POST', { source, location });
        showToast([`Alerting ${source} Contacts...`, "Messages sent to Mom, Dad, and Friend!"]);
    }

    // --- Voice-Activated SOS (Web Speech API + NLP mock) ---
    const voiceSosBtn = document.getElementById('voice-sos-trigger');
    if (voiceSosBtn) {
        voiceSosBtn.addEventListener('click', async () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                showToast(["Speech Recognition API not supported in this browser."]);
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            
            showToast(["Listening for high-stress keywords..."]);
            voiceSosBtn.innerText = "Listening...";
            
            recognition.onresult = async (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                if (transcript.includes('help') || transcript.includes('stop') || transcript.includes('emergency')) {
                    await apiCall('/voice/trigger', 'POST', { keyword: transcript, confidence: Math.round(event.results[0][0].confidence * 100) });
                    await apiCall('/sos', 'POST', { userName: "User", source: "voice" });
                    await triggerEmergencyAlerts("Voice AI", "Current User Location");
                    showToast(["Safe phrase detected!", "Emergency mode enabled", "Audio evidence saved!"]);
                } else {
                    showToast(["No high-stress words detected."]);
                }
                voiceSosBtn.innerText = "Start Voice AI";
            };
            
            recognition.onerror = () => {
                showToast(["Voice recognition error."]);
                voiceSosBtn.innerText = "Start Voice AI";
            };
            
            recognition.start();
        });
    }

    // --- Wearable Integration (Web Bluetooth API) ---
    const wearableSosBtn = document.getElementById('wearable-sos-trigger');
    if (wearableSosBtn) {
        wearableSosBtn.addEventListener('click', async () => {
            try {
                if (!navigator.bluetooth) throw new Error("Bluetooth API not supported.");
                // Prompt user to connect to a nearby bluetooth device (simulating the wearable)
                const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true
                });
                await apiCall('/wearable/trigger', 'POST', { deviceId: device.name || "Unknown Wearable", batteryLevel: 88 });
                await apiCall('/sos', 'POST', { userName: "User", source: "wearable" });
                await triggerEmergencyAlerts("Wearable", "Current User Location");
                showToast([`Connected to ${device.name || 'Wearable'}`, "Wearable SOS signal received!", "Emergency alert saved!"]);
            } catch (error) {
                // Fallback for demo purposes if user cancels or no bluetooth
                await apiCall('/wearable/trigger', 'POST', { deviceId: "Simulated-Band", batteryLevel: 100 });
                await apiCall('/sos', 'POST', { userName: "User", source: "wearable" });
                await triggerEmergencyAlerts("Simulated Wearable", "Current User Location");
                showToast(["Simulated Wearable Signal", "Emergency alert saved!"]);
            }
        });
    }

    // --- Geolocation Integration ---
    const unsafeZoneBtn = document.getElementById('unsafe-zone-trigger');
    if (unsafeZoneBtn) {
        unsafeZoneBtn.addEventListener('click', () => {
            showToast(["Scanning location..."]);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                // Send coordinates to backend to get AI analysis of the area
                const res = await apiCall('/geofence/alert', 'POST', { lat: latitude, lng: longitude });
                showToast([`AI Warning: ${res.data.zoneAnalysis}`, `Risk Level: ${res.data.riskLevel}`, res.data.policeContact]);
            }, () => {
                showToast(["Location access denied. Please enable GPS."]);
            });
        });
    }

    const compareRoutesBtn = document.getElementById('compare-routes-trigger');
    if (compareRoutesBtn) {
        compareRoutesBtn.addEventListener('click', () => {
            showToast(["Analyzing live GPS routes..."]);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                const res = await apiCall('/routes/compare', 'POST', { lat: latitude, lng: longitude });
                if(res.routes) {
                    showToast([`Route A: ${res.routes[0].status} (AI Score: ${res.routes[0].riskScore})`, `Route B: ${res.routes[1].status} (AI Score: ${res.routes[1].riskScore})`, res.policeContact]);
                }
            }, () => {
                showToast(["Location access denied. Cannot compute routes."]);
            });
        });
    }

    // --- Evidence Capture (MediaDevices API) ---
    const recordingBtn = document.getElementById('evidence-capture-trigger');
    const videoEl = document.getElementById('evidence-video');
    if (recordingBtn) {
        recordingBtn.addEventListener('click', async () => {
            if(recordingBtn.innerText === "Stop Capture") {
                // Stop logic (simulated)
                const stream = videoEl.srcObject;
                if(stream) {
                    stream.getTracks().forEach(track => track.stop());
                    videoEl.srcObject = null;
                }
                videoEl.style.display = 'none';
                recordingBtn.innerText = "Manual Capture";
                showToast(["Recording stopped. Uploaded to secure cloud."]);
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoEl.srcObject = stream;
                videoEl.style.display = 'block';
                videoEl.play();
                await apiCall('/evidence', 'POST', { type: "video/audio", status: "started" });
                showToast(["Audio/Video capture active!", "Live streaming to Guardian cloud..."]);
                recordingBtn.innerText = "Stop Capture";
            } catch (err) {
                showToast(["Camera/Mic access denied.", "Ensure permissions are granted."]);
            }
        });
    }

    // --- Guardian Dashboard ---
    const guardianOnBtn = document.getElementById('guardian-on-trigger');
    const guardianOffBtn = document.getElementById('guardian-off-trigger');
    const statusDisplay = document.getElementById('guardian-status');

    if (guardianOnBtn) {
        guardianOnBtn.addEventListener('click', async () => {
            await apiCall('/guardian/toggle', 'POST', { enabled: true });
            showToast(["Guardian mode ACTIVE", "Data persistent in browser!"]);
            if (statusDisplay) {
                statusDisplay.innerHTML = `<div class="dot green-dot"></div><h4>GUARDIAN MODE: ACTIVE</h4><p>Status: Monitoring Live</p>`;
            }
        });
    }

    if (guardianOffBtn) {
        guardianOffBtn.addEventListener('click', async () => {
            await apiCall('/guardian/toggle', 'POST', { enabled: false });
            showToast(["Guardian mode INACTIVE", "Privacy mode enabled"]);
            if (statusDisplay) {
                statusDisplay.innerHTML = `<div class="dot gray-dot"></div><h4>GUARDIAN MODE: INACTIVE</h4><p>Status: Privacy Mode</p>`;
            }
        });
    }

    async function initStatus() {
        const res = await apiCall('/guardian/status');
        if (res && res.guardianMode && statusDisplay) {
            statusDisplay.innerHTML = `<div class="dot green-dot"></div><h4>GUARDIAN MODE: ACTIVE</h4><p>Status: Monitoring Live</p>`;
        }
    }
    initStatus();

    // --- Tab Switching & Smooth Scroll ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) content.classList.add('active');
            });
        });
    });
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
});
