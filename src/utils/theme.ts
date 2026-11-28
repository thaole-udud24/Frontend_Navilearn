// N14 "Giao diện": a real light/dark toggle — the CSS already has a full `.dark` variable set
// (src/styles/tailwind.css, "ready for later steps"), just no toggle wired to it until now. Per-
// browser display preference, so localStorage (not the account) is the right place for it.
const STORAGE_KEY = 'navilearn-theme';
export type ThemeMode = 'light' | 'dark';

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    // private browsing / blocked storage — fall back to light.
  }
  return 'light';
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // best-effort only; the class is still applied for this page view.
  }
}
