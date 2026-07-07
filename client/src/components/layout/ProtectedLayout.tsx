import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import Sidebar from './Sidebar'
import { LogoBarsIcon } from '../icons'

function ProtectedLayout() {
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to='/auth' replace />

  return (
    <div className='flex h-screen bg-white dark:bg-slate-900 overflow-hidden'>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/30 z-30 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className='flex-1 overflow-auto flex flex-col min-w-0'>
        {/* Mobile top bar — hidden on desktop */}
        <div className='lg:hidden flex items-center gap-3 px-4 h-14 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors'
          >
            <Menu size={18} className='text-slate-600 dark:text-slate-400' />
          </button>
          <div className='flex items-center gap-2'>
            <div className='w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0'>
              <LogoBarsIcon />
            </div>
            <span className='font-semibold text-slate-900 dark:text-slate-100 text-sm'>Cadence</span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}

export default ProtectedLayout
