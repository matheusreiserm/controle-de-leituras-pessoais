import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTheme, currentTheme, THEME_STORAGE_KEY } from '../src/lib/theme';

// The suite shares one process in CI: stub the browser globals per test and put them back.
function withBrowser(storage: { setItem(key: string, value: string): void }, run: () => void) {
  const g = globalThis as any;
  const saved = { document: g.document, localStorage: g.localStorage };
  g.document = { documentElement: { dataset: {} as Record<string, string> } };
  g.localStorage = storage;
  try {
    run();
  } finally {
    g.document = saved.document;
    g.localStorage = saved.localStorage;
  }
}

test('the light theme is a remembered switch on <html>, dark stays the default', () => {
  const stored = new Map<string, string>();
  withBrowser({ setItem: (key, value) => stored.set(key, value) }, () => {
    assert.equal(currentTheme(), 'dark');
    applyTheme('light');
    assert.equal(currentTheme(), 'light');
    assert.equal(stored.get(THEME_STORAGE_KEY), 'claro');
    applyTheme('dark');
    assert.equal(currentTheme(), 'dark');
    assert.equal('theme' in (globalThis as any).document.documentElement.dataset, false);
    assert.equal(stored.get(THEME_STORAGE_KEY), 'escuro');
  });
});

test('the theme still switches when storage is blocked', () => {
  withBrowser({ setItem: () => { throw new Error('blocked'); } }, () => {
    applyTheme('light');
    assert.equal(currentTheme(), 'light');
  });
});
