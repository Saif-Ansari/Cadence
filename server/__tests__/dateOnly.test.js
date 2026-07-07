const { parseDateOnly, todayFallbackUTC, resolveDateOnly } = require('../utils/dateOnly')

describe('parseDateOnly', () => {
  it('anchors a YYYY-MM-DD string to UTC midnight', () => {
    expect(parseDateOnly('2026-07-08').toISOString()).toBe('2026-07-08T00:00:00.000Z')
  })

  it('is independent of the host process timezone', () => {
    // The whole point of this util is that it never touches local Date
    // getters/setters — Date.UTC ignores process.env.TZ entirely, so this
    // must produce the same instant no matter where the test runner sits.
    const originalTZ = process.env.TZ
    process.env.TZ = 'Pacific/Kiritimati' // UTC+14, about as far from UTC as it gets
    try {
      expect(parseDateOnly('2026-01-01').toISOString()).toBe('2026-01-01T00:00:00.000Z')
    } finally {
      process.env.TZ = originalTZ
    }
  })
})

describe('todayFallbackUTC', () => {
  it('returns a UTC-midnight instant matching the current UTC calendar day', () => {
    const now = new Date()
    const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    expect(todayFallbackUTC().getTime()).toBe(expected.getTime())
  })
})

describe('resolveDateOnly', () => {
  it('uses the provided date string when given one', () => {
    expect(resolveDateOnly('2026-03-15').toISOString()).toBe('2026-03-15T00:00:00.000Z')
  })

  it('falls back to the server UTC day when no date string is given', () => {
    expect(resolveDateOnly(undefined).getTime()).toBe(todayFallbackUTC().getTime())
  })
})
