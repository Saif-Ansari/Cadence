import { api } from '../lib/api'
import type { Task } from '../types'

interface TaskFilters {
  goalId?: string
  done?: boolean
  today?: boolean
}

export const tasksService = {
  getTasks: (filters: TaskFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.goalId) params.set('goalId', filters.goalId)
    if (filters.done !== undefined) params.set('done', String(filters.done))
    if (filters.today) params.set('today', 'true')
    const query = params.toString() ? `?${params}` : ''
    return api.get<{ tasks: Task[] }>(`/tasks${query}`)
  },
  createTask: (data: { title: string; goalId?: string; dueDate?: string }) =>
    api.post<{ task: Task }>('/tasks', data),
  updateTask: (id: string, data: Partial<Pick<Task, 'title' | 'goalId' | 'dueDate' | 'done'>>) =>
    api.patch<{ task: Task }>(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete<{ message: string }>(`/tasks/${id}`),
}
