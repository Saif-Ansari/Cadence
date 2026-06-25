import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import Sidebar from './Sidebar'

function ProtectedLayout() {
  const { user } = useAuthStore()

  if (!user) return <Navigate to='/auth' replace />

  return (
    <div className='flex h-screen bg-white'>
      <Sidebar />
      <main className='flex-1 overflow-auto'>
        <Outlet />
      </main>
    </div>
  )
}

export default ProtectedLayout
