import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sun, Moon, Bell, BellOff } from 'lucide-react'
import UserMenu from '../components/layout/UserMenu'
import QueryState from '../components/ui/QueryState'
import Skeleton from '../components/ui/Skeleton'
import { useAuthStore } from '../store/auth.store'
import { api } from '../lib/api'
import { authService } from '../services/auth.service'
import { habitsService } from '../services/habits.service'
import { applyTheme, getStoredTheme, type Theme } from '../lib/theme'
import type { EmailReminders } from '../types'

// Backend is fully built and tested, but sending only works against Resend's
// sandbox restrictions (delivers to the account owner's own address only)
// until a domain is verified — hide the UI until that's done. Flip this back
// to true once REMINDER_FROM_EMAIL is on a verified domain.
const EMAIL_REMINDERS_ENABLED = false

function NotificationsSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-4 w-40' />
      <Skeleton className='h-9 w-full' />
    </div>
  )
}

function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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

  // Notifications — GET /auth/me is the only response that includes
  // emailReminders (the login/signup responses in the auth store don't), so
  // this section fetches its own fresh copy rather than trusting the store.
  const {
    data: meData,
    isLoading: meLoading,
    isError: meError,
    refetch: refetchMe,
  } = useQuery({
    queryKey: ['auth', 'me', 'settings'],
    queryFn: () => authService.me(),
    enabled: EMAIL_REMINDERS_ENABLED,
  })

  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsService.getHabits(),
    enabled: EMAIL_REMINDERS_ENABLED,
  })
  const habits = habitsData?.habits ?? []

  const [notifEnabled, setNotifEnabled] = useState(false)
  const [notifMode, setNotifMode] = useState<EmailReminders['mode']>('all')
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([])
  const [notifSaved, setNotifSaved] = useState(false)

  useEffect(() => {
    const prefs = meData?.user.emailReminders
    if (!prefs) return
    setNotifEnabled(prefs.enabled)
    setNotifMode(prefs.mode)
    setSelectedHabitIds(prefs.habitIds)
  }, [meData?.user.emailReminders])

  const updateNotifications = useMutation({
    mutationFn: (data: Partial<EmailReminders>) => authService.updateNotifications(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 2000)
    },
  })

  function toggleHabitSelection(habitId: string) {
    setSelectedHabitIds((ids) =>
      ids.includes(habitId) ? ids.filter((id) => id !== habitId) : [...ids, habitId]
    )
  }

  function handleNotifEnabledChange(enabled: boolean) {
    setNotifEnabled(enabled)
    updateNotifications.mutate({ enabled })
  }

  function handleNotifModeChange(mode: EmailReminders['mode']) {
    setNotifMode(mode)
    updateNotifications.mutate({ mode })
  }

  function handleSaveHabitSelection() {
    updateNotifications.mutate({ habitIds: selectedHabitIds })
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

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>

      {/* Left column */}
      <div className='lg:col-span-3 space-y-6'>

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
      </div>

      {/* Right column */}
      <div className='lg:col-span-2 space-y-6'>

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

        {/* Notifications card — hidden until Resend domain verification is done, see EMAIL_REMINDERS_ENABLED above */}
        {EMAIL_REMINDERS_ENABLED && (
        <div className='border border-slate-200 dark:border-slate-700 rounded-2xl p-6'>
          <h2 className='text-base font-semibold text-slate-900 dark:text-slate-100 mb-5'>Email reminders</h2>

          <QueryState isLoading={meLoading} isError={meError} onRetry={refetchMe} skeleton={<NotificationsSkeleton />}>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>Daily habit reminder</p>
                <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>
                  Get an email at 11pm IST if any of your habits are still undone for the day
                </p>
              </div>
              <div className='flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0'>
                <button
                  onClick={() => handleNotifEnabledChange(false)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    !notifEnabled
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <BellOff size={14} />
                  Off
                </button>
                <button
                  onClick={() => handleNotifEnabledChange(true)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700 ${
                    notifEnabled
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <Bell size={14} />
                  On
                </button>
              </div>
            </div>

            {notifEnabled && (
              <div className='mt-5 pt-5 border-t border-slate-100 dark:border-slate-800'>
                <p className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-3'>Which habits?</p>
                <div className='flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-fit mb-4'>
                  <button
                    onClick={() => handleNotifModeChange('all')}
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                      notifMode === 'all'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    All habits
                  </button>
                  <button
                    onClick={() => handleNotifModeChange('specific')}
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700 ${
                      notifMode === 'specific'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    Specific habits
                  </button>
                </div>

                {notifMode === 'specific' && (
                  <div>
                    {habits.length === 0 ? (
                      <div className='mb-3'>
                        <p className='text-xs text-slate-400 dark:text-slate-500 mb-2'>No habits yet.</p>
                        <button
                          onClick={() => navigate('/habits')}
                          className='text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer'
                        >
                          + Add habit
                        </button>
                      </div>
                    ) : (
                      <div className='space-y-2 mb-3'>
                        {habits.map((habit) => (
                          <label key={habit._id} className='flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={selectedHabitIds.includes(habit._id)}
                              onChange={() => toggleHabitSelection(habit._id)}
                              className='w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 cursor-pointer'
                            />
                            {habit.name}
                          </label>
                        ))}
                      </div>
                    )}
                    {habits.length > 0 && (
                      <button
                        onClick={handleSaveHabitSelection}
                        disabled={updateNotifications.isPending}
                        className='bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors'
                      >
                        {updateNotifications.isPending ? 'Saving...' : notifSaved ? 'Saved!' : 'Save selection'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </QueryState>
        </div>
        )}

      </div>
      {/* end right column */}
      </div>
      {/* end grid */}
    </div>
  )
}

export default SettingsPage
