// Browser-compatible datastore using localStorage

const CONFIG_KEY = 'calculator_config';
const LOG_KEY = 'calculator_logs';
const MAX_LOG_ENTRIES = 1000;

// Get persisted config
export async function getConfig() {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Error reading config:', err);
    return {};
  }
}

// Update config
export async function updateConfig(newConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
  } catch (err) {
    console.error('Error writing config:', err);
  }
}

// Log events
export async function logEvent(event) {
  try {
    const data = localStorage.getItem(LOG_KEY);
    const logs = data ? JSON.parse(data) : [];
    logs.push({ ...event, timestamp: new Date().toISOString() });
    
    // Keep only the most recent entries
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - MAX_LOG_ENTRIES);
    }
    
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Error logging event:', err);
  }
}
