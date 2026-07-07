import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme, getStoredTheme } from '../theme'

// This project's Vitest setup runs in the default 'node' environment (no
// jsdom installed), so `document`/`localStorage` don't exist here — stub
// just enough of each to exercise theme.ts's two lines of real logic.
let store: Record<string, string>
let classList: Set<string>

beforeEach(() => {
  store = {}
  classList = new Set<string>()

  // @ts-expect-error minimal Storage stub, not the full interface
  global.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
  }
  // @ts-expect-error minimal Document stub, not the full interface
  global.document = {
    documentElement: {
      classList: {
        toggle: (cls: string, condition: boolean) => {
          condition ? classList.add(cls) : classList.delete(cls)
        },
      },
    },
  }
})

describe('getStoredTheme', () => {
  it('defaults to light when nothing is stored', () => {
    expect(getStoredTheme()).toBe('light')
  })

  it('reflects a previously persisted theme', () => {
    applyTheme('dark')
    expect(getStoredTheme()).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('persists the choice to localStorage', () => {
    applyTheme('dark')
    expect(store.theme).toBe('dark')
  })

  it('toggles the .dark class on <html> to match the theme', () => {
    applyTheme('dark')
    expect(classList.has('dark')).toBe(true)

    applyTheme('light')
    expect(classList.has('dark')).toBe(false)
  })
})
