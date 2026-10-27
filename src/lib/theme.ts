export type Theme = 'dark' | 'light';

/** Same key and values the inline script in index.html reads before the first paint. */
export const THEME_STORAGE_KEY = 'leituras-tema';

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'light') root.dataset.theme = 'light';
  else delete root.dataset.theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme === 'light' ? 'claro' : 'escuro');
  } catch {
    /* Without storage the choice lasts for this visit only. */
  }
}
