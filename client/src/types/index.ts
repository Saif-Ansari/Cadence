export interface User {
  id: string
  name: string
  email: string
  loginCount: number
  streak?: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Milestone {
  _id: string
  goalId: string
  userId: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export interface Goal {
  _id: string
  userId: string
  title: string
  description?: string
  deadline: string
  status: 'active' | 'completed' | 'overdue'
  milestones: Milestone[]
  progress: number
  createdAt: string
  updatedAt: string
}

export interface HabitDay {
  date: string
  done: boolean
}

export interface Habit {
  _id: string
  userId: string
  name: string
  targetFrequency: number
  description?: string
  status: 'active' | 'completed'
  weekGrid: HabitDay[]
  streak: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  _id: string
  userId: string
  goalId?: string
  title: string
  dueDate?: string
  done: boolean
  createdAt: string
  updatedAt: string
}
