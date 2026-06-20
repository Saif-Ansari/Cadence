export interface User {
  id: string
  name: string
  email: string
  loginCount: number
}

export interface AuthResponse {
  token: string
  user: User
}
