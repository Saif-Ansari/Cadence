import { describe, it, expect, afterEach, vi } from 'vitest'
import { quotes, getTodaysQuote } from '../quotes'

describe('getTodaysQuote', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('always returns a quote from the fixed list', () => {
    expect(quotes).toContain(getTodaysQuote())
  })

  it('returns the same quote for two calls on the same day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-18T08:00:00'))
    const morning = getTodaysQuote()
    vi.setSystemTime(new Date('2026-03-18T22:00:00'))
    const night = getTodaysQuote()
    expect(morning).toBe(night)
  })

  it('can return a different quote on a different day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-18T08:00:00'))
    const day1 = getTodaysQuote()
    // Rotation is dayOfYear % quotes.length — moving forward by exactly one
    // day always shifts that index by one (mod length), so it's never equal
    // to the previous day's index. Proves the rotation is day-driven, not
    // just always returning quotes[0].
    vi.setSystemTime(new Date('2026-03-19T08:00:00'))
    const day2 = getTodaysQuote()
    expect(quotes.indexOf(day1)).not.toBe(quotes.indexOf(day2))
  })
})
