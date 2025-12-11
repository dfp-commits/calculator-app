import fs from 'fs';
import path from 'path';

// Paths for JSON files
const configPath = path.resolve('src/utils/config.json');
const logPath = path.resolve('src/utils/event-log.json');

// Ensure files exist
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({}));
if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, JSON.stringify([]));

// Get persisted config
export async function getConfig() {
  try {
    const data = await fs.promises.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading config:', err);
    return {};
  }
}

// Update config
export async function updateConfig(newConfig) {
  try {
    await fs.promises.writeFile(configPath, JSON.stringify(newConfig, null, 2));
  } catch (err) {
    console.error('Error writing config:', err);
  }
}

// Log events
export async function logEvent(event) {
  try {
    const data = await fs.promises.readFile(logPath, 'utf-8');
    const logs = JSON.parse(data);
    logs.push({ ...event, timestamp: new Date().toISOString() });
    await fs.promises.writeFile(logPath, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Error logging event:', err);
  }
}
