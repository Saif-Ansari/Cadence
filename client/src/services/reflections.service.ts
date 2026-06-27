import { api } from '../lib/api'
import type { Reflection } from '../types'

interface ReflectionFields {
  overallDay?: string
  accomplished?: string
  win?: string
  wastedTime?: string
  improvement?: string
  focusScore?: number
}

export const reflectionsService = {
  getToday: () => api.get<{ reflection: Reflection | null }>('/reflections/today'),
  upsertToday: (data: ReflectionFields) => api.put<{ reflection: Reflection }>('/reflections/today', data),
  getAll: () => api.get<{ reflections: Reflection[] }>('/reflections'),
  getById: (id: string) => api.get<{ reflection: Reflection }>(`/reflections/${id}`),
}
