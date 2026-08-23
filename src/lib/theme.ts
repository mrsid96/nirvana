import type { ThemeMode } from '@/types/user'

const STORAGE_KEY = 'nirvana-theme'

export function getStoredTheme(): ThemeMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
    return null
  } catch {
    return null
  }
}

export function persistTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore quota / private mode
  }
}

export function resolveDarkMode(theme: ThemeMode): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyThemeToDocument(theme: ThemeMode) {
  const dark = resolveDarkMode(theme)
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  root.style.backgroundColor = dark ? '#1c1a17' : '#f8f7f3'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#1c1a17' : '#6657E8')
}

/** Apply saved theme before React mounts — call from index.html inline script too. */
export function applyStoredTheme() {
  const theme = getStoredTheme() ?? 'light'
  applyThemeToDocument(theme)
}
