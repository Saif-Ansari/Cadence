export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

export function getStoredTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light'
}

// Toggles the .dark class that the `dark:` variant (declared in index.css)
// keys off, and persists the choice. Called once at boot (before first
// paint, to avoid a light-mode flash) and again whenever Settings changes it.
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
}
