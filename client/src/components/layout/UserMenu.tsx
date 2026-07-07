import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, LogOut, Flame } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { authService } from '../../services/auth.service'

function UserMenu() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await authService.logout()
    clearAuth()
    navigate('/auth')
  }

  if (!user) return null

  return (
    <div className='flex items-center gap-3 flex-shrink-0'>
      {user.streak !== undefined && user.streak > 0 && (
        <div className='flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 text-xs font-medium px-3 py-1.5 rounded-full border border-teal-100 dark:border-teal-900'>
          <Flame size={13} className='text-orange-500' />
          <span>{user.streak} day streak</span>
        </div>
      )}

      <div className='relative' ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className='w-9 h-9 rounded-full bg-teal-600 text-white text-sm font-semibold flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors'
        >
          {user.name.charAt(0).toUpperCase()}
        </button>

        {open && (
          <div className='absolute right-0 top-11 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50'>
            <div className='px-4 py-3 border-b border-slate-100 dark:border-slate-800'>
              <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>{user.name}</p>
              <p className='text-xs text-slate-500 dark:text-slate-400 truncate'>{user.email}</p>
            </div>
            <button
              onClick={() => { navigate('/settings'); setOpen(false) }}
              className='w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer'
            >
              <Settings size={15} />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className='w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer'
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserMenu
