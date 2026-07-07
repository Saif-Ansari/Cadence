import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import App from './App'
import ToastStack from './components/ui/ToastStack'
import { useAuthStore } from './store/auth.store'
import { useToastStore } from './store/toast.store'
import { authService } from './services/auth.service'
import { applyTheme, getStoredTheme } from './lib/theme'
import './index.css'

// Applied synchronously, before the first render, so there's no light-mode
// flash for users who have dark mode saved.
applyTheme(getStoredTheme())

// A mutation-level onError here fires for every useMutation in the app,
// regardless of whether that call site defines its own onError — one place
// to guarantee a failed delete/toggle/save is never silent.
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      useToastStore.getState().addToast(error instanceof Error ? error.message : 'Something went wrong')
    },
  }),
})

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
          <ToastStack />
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
}

bootstrap()
