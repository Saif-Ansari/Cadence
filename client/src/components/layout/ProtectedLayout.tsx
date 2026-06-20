import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'

function ProtectedLayout() {
  const user = useAuthStore((state) => state.user)

  if (!user) return <Navigate to='/auth' replace />

  return <Outlet />
}

export default ProtectedLayout
