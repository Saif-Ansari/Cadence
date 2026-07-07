import type { Habit } from '../types'

// Fraction of target frequency met so far this week, averaged across habits,
// as a whole-number percentage. Shared between HabitsPage and the dashboard
// stat strip so the two never disagree on what "this week" means.
export function computeWeeklyRate(habits: Habit[]): number {
  if (habits.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const total = habits.reduce((sum, h) => {
    const doneSoFar = h.weekGrid.filter((d) => {
      const dd = new Date(d.date)
      dd.setHours(0, 0, 0, 0)
      return d.done && dd <= today
    }).length
    return sum + Math.min(doneSoFar / h.targetFrequency, 1)
  }, 0)

  return Math.round((total / habits.length) * 100)
}
