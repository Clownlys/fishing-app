import type { Spot, LogEntry } from '../types';

const SPOTS_KEY = 'fishing_spots';
const LOGS_KEY = 'fishing_logs';

// ==================== 钓点 ====================
export function getSpots(): Spot[] {
  try {
    const raw = localStorage.getItem(SPOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSpot(spot: Spot): void {
  const spots = getSpots();
  const idx = spots.findIndex(s => s.id === spot.id);
  if (idx >= 0) spots[idx] = spot;
  else spots.push(spot);
  localStorage.setItem(SPOTS_KEY, JSON.stringify(spots));
}

export function deleteSpot(id: string): void {
  const spots = getSpots().filter(s => s.id !== id);
  localStorage.setItem(SPOTS_KEY, JSON.stringify(spots));
}

export function getSpot(id: string): Spot | undefined {
  return getSpots().find(s => s.id === id);
}

// ==================== 日志 ====================
export function getLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw).sort((a: LogEntry, b: LogEntry) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ) : [];
  } catch {
    return [];
  }
}

export function getLogsBySpot(spotId: string): LogEntry[] {
  return getLogs().filter(l => l.spotId === spotId);
}

export function saveLog(entry: LogEntry): void {
  const logs = getLogs();
  const idx = logs.findIndex(l => l.id === entry.id);
  if (idx >= 0) logs[idx] = entry;
  else logs.push(entry);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function deleteLog(id: string): void {
  const logs = getLogs().filter(l => l.id !== id);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

// ==================== 工具 ====================
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
