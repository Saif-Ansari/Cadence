import { api } from '../lib/api'
import { todayLocalDateString } from '../lib/date'
import type { AuthResponse, User } from '../types'

export const authService = {
  signup: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/signup', { name, email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password, localDate: todayLocalDateString() }),

  logout: () =>
    api.post<void>('/auth/logout', {}),

  me: () =>
    api.get<{ user: User }>(`/auth/me?localDate=${todayLocalDateString()}`),
}
