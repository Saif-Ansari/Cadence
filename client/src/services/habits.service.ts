import { api } from '../lib/api'
import type { Habit } from '../types'

export const habitsService = {
  getHabits: () => api.get<{ habits: Habit[] }>('/habits'),
  createHabit: (data: { name: string; targetFrequency: number; description?: string }) =>
    api.post<{ habit: Habit }>('/habits', data),
  updateHabit: (id: string, data: Partial<Pick<Habit, 'name' | 'targetFrequency' | 'description' | 'status'>>) =>
    api.patch<{ habit: Habit }>(`/habits/${id}`, data),
  deleteHabit: (id: string) => api.delete<{ message: string }>(`/habits/${id}`),
  toggleDay: (id: string, date: string) =>
    api.patch<{ done: boolean }>(`/habits/${id}/toggle`, { date }),
}
