import { api } from '../lib/api'
import { todayLocalDateString } from '../lib/date'
import type { AuthResponse, EmailReminders, User } from '../types'

export const authService = {
  signup: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/signup', { name, email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password, localDate: todayLocalDateString() }),

  logout: () =>
    api.post<void>('/auth/logout', {}),

  me: () =>
    api.get<{ user: User }>(`/auth/me?localDate=${todayLocalDateString()}`),

  updateNotifications: (data: Partial<EmailReminders>) =>
    api.patch<{ emailReminders: EmailReminders }>('/auth/notifications', data),
}
