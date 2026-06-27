import { api } from '../lib/api'
import type { Step } from '../types'

export const stepsService = {
  createStep: (data: { goalId: string; title: string; description?: string }) =>
    api.post<{ step: Step }>('/steps', data),
  updateStep: (id: string, data: { done?: boolean; title?: string }) =>
    api.patch<{ step: Step }>(`/steps/${id}`, data),
  deleteStep: (id: string) =>
    api.delete<{ message: string }>(`/steps/${id}`),
}
