const TOKEN_KEY = 'google_drive_oauth_token';
const TIME_KEY = 'google_drive_oauth_token_time';
const MAX_AGE = 50 * 60 * 1000;
let cached: { token: string; savedAt: number } | null = null;

export function setAccessToken(token: string | null) {
  cached = token ? { token, savedAt: Date.now() } : null;
  for (const storageName of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[storageName];
      if (cached) {
        storage.setItem(TOKEN_KEY, cached.token);
        storage.setItem(TIME_KEY, String(cached.savedAt));
      } else { storage.removeItem(TOKEN_KEY); storage.removeItem(TIME_KEY); }
    } catch { /* Memory-only operation when storage is unavailable. */ }
  }
}

export function getAccessToken(): string | null {
  if (!cached) {
    for (const storageName of ['localStorage', 'sessionStorage'] as const) {
      try {
        const storage = window[storageName];
        const token = storage.getItem(TOKEN_KEY);
        const savedAt = Number(storage.getItem(TIME_KEY));
        if (token && savedAt > 0) { cached = { token, savedAt }; break; }
      } catch { /* Storage is optional. */ }
    }
  }
  if (!cached) return null;
  const age = Date.now() - cached.savedAt;
  if (!Number.isFinite(age) || age < 0 || age >= MAX_AGE) { setAccessToken(null); return null; }
  return cached.token;
}
