import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../services/auth.service'
import { SettingsIcon, LogOutIcon } from '../icons'
import Sidebar from './Sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/goals': 'Goals',
  '/habits': 'Habits',
  '/reflections': 'Reflections',
  '/settings': 'Settings',
}

function ProtectedLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return <Navigate to='/auth' replace />

  async function handleLogout() {
    await authService.logout()
    clearAuth()
    navigate('/auth')
  }

  const pageTitle = PAGE_TITLES[location.pathname] ?? ''
  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div className='flex h-screen bg-white'>
      <Sidebar />

      <div className='flex-1 flex flex-col overflow-hidden'>

        {/* Header */}
        <header className='h-14 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0'>
          <span className='text-sm font-medium text-slate-700'>{pageTitle}</span>

          <div className='relative' ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className='w-9 h-9 rounded-full bg-teal-600 text-white text-sm font-semibold flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors'
            >
              {initial}
            </button>

            {dropdownOpen && (
              <div className='absolute right-0 top-11 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50'>
                <div className='px-4 py-3 border-b border-slate-100'>
                  <p className='text-sm font-medium text-slate-900'>{user.name}</p>
                  <p className='text-xs text-slate-500 truncate'>{user.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                  className='w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer'
                >
                  <SettingsIcon />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className='w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer'
                >
                  <LogOutIcon />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className='flex-1 overflow-auto'>
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default ProtectedLayout
