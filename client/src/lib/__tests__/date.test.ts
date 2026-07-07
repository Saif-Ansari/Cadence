import { describe, it, expect, afterEach, vi } from 'vitest'
import { todayLocalDateString } from '../date'

describe('todayLocalDateString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats the local date as YYYY-MM-DD', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 8)) // local March 8, 2026 (month is 0-indexed)
    expect(todayLocalDateString()).toBe('2026-03-08')
  })

  it('pads single-digit months and days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5)) // local January 5, 2026
    expect(todayLocalDateString()).toBe('2026-01-05')
  })

  it('uses local date components, not a UTC conversion', () => {
    // Pinning to local midnight and checking the same calendar day comes
    // back is the behavior this function exists for — toISOString() would
    // shift to the previous day for any negative-UTC-offset timezone.
    vi.useFakeTimers()
    const localMidnight = new Date(2026, 5, 20, 0, 0, 0)
    vi.setSystemTime(localMidnight)
    expect(todayLocalDateString()).toBe('2026-06-20')
  })
})
