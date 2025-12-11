// src/utils/dataStore.js
const fs = require('fs');
const path = require('path');

// Paths for config and logs
const configFilePath = path.resolve(__dirname, 'config.json');
const logFilePath = path.resolve(__dirname, 'event-log.json');

// Ensure file exists
function ensureFile(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
}

// Get config
export async function getConfig() {
  ensureFile(configFilePath, { angleMode: 'deg', calculatorMode: 'standard' });
  const data = fs.readFileSync(configFilePath, 'utf8');
  return JSON.parse(data);
}

// Update config
export async function updateConfig(newConfig) {
  fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2));
}

// Log events
export async function logEvent(event) {
  ensureFile(logFilePath, []);
  const logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  logs.push({ ...event, timestamp: new Date().toISOString() });
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
}
