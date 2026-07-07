import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import UserMenu from '../components/layout/UserMenu'
import { useAuthStore } from '../store/auth.store'
import { api } from '../lib/api'
import { applyTheme, getStoredTheme, type Theme } from '../lib/theme'

function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  function handleTheme(t: Theme) {
    setTheme(t)
    applyTheme(t)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }

    setPwLoading(true)
    try {
      await api.patch('/auth/password', { currentPassword, newPassword })
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPwLoading(false)
    }
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className='p-4 lg:p-8'>

      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900 dark:text-slate-100'>Settings</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Manage your profile and preferences</p>
        </div>
        <UserMenu />
      </div>
      <div className='border-b border-slate-100 dark:border-slate-800 mb-8' />

      <div className='max-w-2xl space-y-6'>

        {/* Account card */}
        <div className='border border-slate-200 dark:border-slate-700 rounded-2xl p-6'>
          <h2 className='text-base font-semibold text-slate-900 dark:text-slate-100 mb-5'>Account</h2>

          {/* Profile */}
          <div className='flex items-center gap-3 mb-7'>
            <div className='w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0'>
              {initial}
            </div>
            <div>
              <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>{user?.name}</p>
              <p className='text-xs text-slate-500 dark:text-slate-400'>{user?.email}</p>
            </div>
          </div>

          {/* Password form */}
          <form onSubmit={handlePasswordSubmit}>
            <p className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>Password</p>
            <div className='space-y-3'>
              <input
                type='password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder='Current password'
                className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                required
              />
              <input
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='New password'
                className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                required
              />
              <input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Confirm new password'
                className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                required
              />
            </div>

            {pwError && (
              <p className='text-xs text-red-500 mt-2'>{pwError}</p>
            )}
            {pwSuccess && (
              <p className='text-xs text-teal-600 mt-2'>Password updated successfully.</p>
            )}

            <button
              type='submit'
              disabled={pwLoading}
              className='mt-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg cursor-pointer transition-colors'
            >
              {pwLoading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        {/* Appearance card */}
        <div className='border border-slate-200 dark:border-slate-700 rounded-2xl p-6'>
          <h2 className='text-base font-semibold text-slate-900 dark:text-slate-100 mb-5'>Appearance</h2>

          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>Theme</p>
              <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>Choose between light and dark mode</p>
            </div>
            <div className='flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden'>
              <button
                onClick={() => handleTheme('light')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800'
                }`}
              >
                <Sun size={14} />
                Light
              </button>
              <button
                onClick={() => handleTheme('dark')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700 ${
                  theme === 'dark'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800'
                }`}
              >
                <Moon size={14} />
                Dark
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SettingsPage
