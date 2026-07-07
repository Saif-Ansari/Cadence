import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Target, ListChecks, NotebookPen, Settings } from 'lucide-react'
import { LogoBarsIcon } from '../icons'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/habits', label: 'Habits', icon: ListChecks },
  { path: '/reflections', label: 'Reflections', icon: NotebookPen },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={[
        'fixed lg:static inset-y-0 left-0 z-40',
        'w-48 h-screen bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
    >
      {/* Logo */}
      <div className='flex items-center gap-2 px-4 py-5'>
        <div className='w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0'>
          <LogoBarsIcon />
        </div>
        <span className='font-semibold text-slate-900 dark:text-slate-100'>Cadence</span>
      </div>

      {/* Nav links */}
      <nav className='flex-1 px-2 flex flex-col gap-0.5'>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className='px-2 pb-4'>
        <NavLink
          to='/settings'
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
            }`
          }
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
