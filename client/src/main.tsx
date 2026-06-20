import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { useAuthStore } from './store/auth.store'
import { authService } from './services/auth.service'
import './index.css'

const queryClient = new QueryClient()

async function bootstrap() {
  const token = localStorage.getItem('token')

  if (token) {
    try {
      const { user } = await authService.me()
      useAuthStore.getState().setAuth(user, token)
    } catch {
      // Token expired or invalid — clear it so the user goes to login
      localStorage.removeItem('token')
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
}

bootstrap()
