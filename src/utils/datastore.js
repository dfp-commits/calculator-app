// Centralized datastore for calculator app
// Handles reading/writing JSON for logs and config

export async function readJSON(path) {
    try {
      const response = await fetch(path);
      return await response.json();
    } catch (err) {
      console.error("Error reading JSON:", err);
      return null;
    }
  }
  
  export async function writeJSON(path, data) {
    try {
      // Browsers cannot write to local files directly.
      // Temporary solution using localStorage for persistence.
  
      localStorage.setItem(path, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error("Error writing JSON:", err);
      return false;
    }
  }
  
  // Logging utility
  export async function logEvent(eventType, payload = {}) {
    let logs = JSON.parse(localStorage.getItem("src/data/logs.json")) || [];
  
    const entry = {
      timestamp: new Date().toISOString(),
      eventType,
      payload
    };
  
    logs.push(entry);
  
    localStorage.setItem("src/data/logs.json", JSON.stringify(logs));
  }
  
  // Load config (fallback to file if localStorage empty)
  export async function getConfig() {
    const stored = localStorage.getItem("src/data/config.json");
  
    if (stored) return JSON.parse(stored);
  
    // If nothing stored yet, load initial config.json
    const defaultConfig = await readJSON("/src/data/config.json");
    localStorage.setItem("src/data/config.json", JSON.stringify(defaultConfig));
  
    return defaultConfig;
  }
  
  // Update config
  export async function updateConfig(updates) {
    const config = await getConfig();
    const newConfig = { ...config, ...updates };
  
    localStorage.setItem("src/data/config.json", JSON.stringify(newConfig));
  
    return newConfig;
  }
  saveSettingsBtn.addEventListener("click", async () => {
    const newSettings = {
      angleMode: angleModeSelect.value,
      calculatorMode: modeSelect.value,
      theme: themeSelect.value
    };
  
    await updateConfig(newSettings);
  
    logEvent("settings-updated", "Settings saved by user");
  
    // Apply angle mode immediately
    angleMode = newSettings.angleMode;
  
    // Apply theme (for now we just add an attribute for later CSS)
    document.body.dataset.theme = newSettings.theme;
  
    alert("Settings saved.");
  });
  