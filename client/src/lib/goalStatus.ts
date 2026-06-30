import type { Goal } from '../types'

export type GoalStatus = 'on-track' | 'at-risk' | 'overdue' | 'completed'

export const STATUS_STYLES: Record<string, string> = {
  'on-track': 'bg-teal-50 text-teal-700',
  'at-risk': 'bg-amber-50 text-amber-700',
  'overdue': 'bg-red-50 text-red-600',
  'completed': 'bg-slate-100 text-slate-500',
}

export const STATUS_LABELS: Record<string, string> = {
  'on-track': 'ON TRACK',
  'at-risk': 'AT RISK',
  'overdue': 'OVERDUE',
  'completed': 'COMPLETED',
}

export const PROGRESS_COLOR: Record<string, string> = {
  'on-track': 'bg-teal-600',
  'at-risk': 'bg-amber-400',
  'overdue': 'bg-red-400',
  'completed': 'bg-slate-300',
}

export function computeGoalStatus(goal: Goal): GoalStatus {
  if (goal.status === 'completed') return 'completed'
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 7 && goal.progress < 80) return 'at-risk'
  if (daysLeft <= 14 && goal.progress < 50) return 'at-risk'
  return 'on-track'
}
