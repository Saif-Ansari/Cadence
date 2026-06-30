import { describe, it, expect } from 'vitest'
import { computeGoalStatus } from '../goalStatus'
import type { Goal } from '../../types'

function makeGoal(overrides: Partial<Goal> & { daysFromNow: number }): Goal {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + overrides.daysFromNow)
  return {
    _id: 'test-id',
    userId: 'user-id',
    title: 'Test Goal',
    description: '',
    deadline: deadline.toISOString(),
    status: 'active',
    progress: overrides.progress ?? 0,
    steps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('computeGoalStatus', () => {
  it('returns "completed" when goal status is completed regardless of deadline', () => {
    const goal = makeGoal({ daysFromNow: -5, status: 'completed', progress: 100 })
    expect(computeGoalStatus(goal)).toBe('completed')
  })

  it('returns "overdue" when deadline has passed', () => {
    const goal = makeGoal({ daysFromNow: -1, progress: 50 })
    expect(computeGoalStatus(goal)).toBe('overdue')
  })

  it('returns "at-risk" when ≤7 days left and progress < 80%', () => {
    const goal = makeGoal({ daysFromNow: 5, progress: 50 })
    expect(computeGoalStatus(goal)).toBe('at-risk')
  })

  it('returns "on-track" when ≤7 days left and progress ≥ 80%', () => {
    const goal = makeGoal({ daysFromNow: 5, progress: 85 })
    expect(computeGoalStatus(goal)).toBe('on-track')
  })

  it('returns "at-risk" when ≤14 days left and progress < 50%', () => {
    const goal = makeGoal({ daysFromNow: 10, progress: 30 })
    expect(computeGoalStatus(goal)).toBe('at-risk')
  })

  it('returns "on-track" when ≤14 days left and progress ≥ 50%', () => {
    const goal = makeGoal({ daysFromNow: 10, progress: 60 })
    expect(computeGoalStatus(goal)).toBe('on-track')
  })

  it('returns "on-track" when plenty of time remains', () => {
    const goal = makeGoal({ daysFromNow: 60, progress: 10 })
    expect(computeGoalStatus(goal)).toBe('on-track')
  })
})
