import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { computeWeeklyRate } from '../habitStats'
import type { Habit, HabitDay } from '../../types'

function makeHabit(targetFrequency: number, days: HabitDay[]): Habit {
  return {
    _id: 'habit-id',
    userId: 'user-id',
    name: 'Test Habit',
    targetFrequency,
    status: 'active',
    weekGrid: days,
    streak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function day(offsetFromToday: number, done: boolean): HabitDay {
  const d = new Date()
  d.setDate(d.getDate() + offsetFromToday)
  return { date: d.toISOString(), done }
}

describe('computeWeeklyRate', () => {
  beforeEach(() => {
    // Pin "today" so day offsets in the fixtures are deterministic —
    // computeWeeklyRate reads the real clock internally.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-18T12:00:00.000Z')) // a Wednesday
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 0 for no habits', () => {
    expect(computeWeeklyRate([])).toBe(0)
  })

  it('returns the fraction of target frequency met so far, as a percentage', () => {
    const habit = makeHabit(5, [day(-2, true), day(-1, false), day(0, false)])
    expect(computeWeeklyRate([habit])).toBe(20) // 1 of 5 target days done
  })

  it('caps a single habit\'s contribution at 100% even if done more than the target', () => {
    const habit = makeHabit(2, [day(-2, true), day(-1, true), day(0, true)])
    expect(computeWeeklyRate([habit])).toBe(100)
  })

  it('does not count a future day marked done', () => {
    const habit = makeHabit(5, [day(0, true), day(1, true), day(2, true)])
    // Only today (offset 0) should count — the two future days must not
    expect(computeWeeklyRate([habit])).toBe(20)
  })

  it('averages the rate across multiple habits', () => {
    const fullyDone = makeHabit(1, [day(0, true)]) // 100%
    const notStarted = makeHabit(5, [day(0, false)]) // 0%
    expect(computeWeeklyRate([fullyDone, notStarted])).toBe(50)
  })
})
