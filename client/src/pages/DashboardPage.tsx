import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { authService } from '../services/auth.service'

function DashboardPage() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  async function handleLogout() {
    await authService.logout()
    clearAuth()
    navigate('/auth')
  }

  return (
    <div className='p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900'>Dashboard</h1>
          <p className='text-slate-500 mt-1'>Welcome back, {user?.name}.</p>
        </div>
        <button
          onClick={handleLogout}
          className='text-sm text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg px-4 py-2 transition-colors'
        >
          Log out
        </button>
      </div>
    </div>
  )
}

export default DashboardPage
