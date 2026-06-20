import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { authService } from '../services/auth.service'
import { quotes } from '../constants/quotes'

type Mode = 'login' | 'signup'

function AuthPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const quote = quotes[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = mode === 'login'
        ? await authService.login(email, password)
        : await authService.signup(name, email, password)

      setAuth(result.user, result.token)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className='min-h-screen flex'>

      {/* ── Left panel ── */}
      <div className='hidden md:flex md:w-2/5 bg-teal-600 flex-col justify-between p-10'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
              <rect x='1' y='10' width='3' height='5' rx='1' fill='white' />
              <rect x='6' y='6' width='3' height='9' rx='1' fill='white' />
              <rect x='11' y='2' width='3' height='13' rx='1' fill='white' />
            </svg>
          </div>
          <span className='text-white font-semibold text-lg'>Cadence</span>
        </div>

        <div>
          <p className='text-teal-200 text-xs font-semibold uppercase tracking-widest mb-4'>
            Your personal system
          </p>
          <h1 className='text-white text-4xl font-bold leading-tight mb-4'>
            Build the habits.<br />Reach the goals.
          </h1>
          <p className='text-teal-100 text-sm leading-relaxed'>
            One place to track what matters —{' '}
            goals, habits, tasks, and daily reflections.
          </p>
        </div>

        <div>
          <p className='text-teal-100 text-sm italic leading-relaxed'>
            "{quote.text}"
          </p>
          <p className='text-teal-300 text-sm mt-2'>— {quote.author}</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className='flex-1 flex items-center justify-center p-8'>
        <div className='w-full max-w-sm'>

          <h2 className='text-2xl font-semibold text-slate-900 mb-6'>
            {mode === 'login' ? 'Log in to Cadence' : 'Create your account'}
          </h2>

          {/* Google button — non-functional in Phase 1 */}
          <button
            type='button'
            disabled
            className='w-full flex items-center justify-center gap-3 border border-slate-200 rounded-lg py-2.5 text-sm text-slate-500 cursor-not-allowed mb-4'
          >
            <svg width='18' height='18' viewBox='0 0 18 18'>
              <path fill='#4285F4' d='M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z' />
              <path fill='#34A853' d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z' />
              <path fill='#FBBC05' d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z' />
              <path fill='#EA4335' d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z' />
            </svg>
            Continue with Google
          </button>

          <div className='flex items-center gap-3 mb-4'>
            <div className='flex-1 h-px bg-slate-200' />
            <span className='text-xs text-slate-400'>or</span>
            <div className='flex-1 h-px bg-slate-200' />
          </div>

          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {mode === 'signup' && (
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Full name</label>
                <input
                  type='text'
                  placeholder='Saif Ansari'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                />
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>Email address</label>
              <input
                type='email'
                placeholder='saif@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
              />
            </div>

            <div>
              <div className='flex items-center justify-between mb-1'>
                <label className='block text-sm font-medium text-slate-700'>Password</label>
                {mode === 'login' && (
                  <span className='text-xs text-teal-600 cursor-not-allowed'>Forgot password?</span>
                )}
              </div>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Confirm password</label>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                />
              </div>
            )}

            {error && (
              <p className='text-sm text-red-500'>{error}</p>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer'
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className='text-center text-sm text-slate-500 mt-4'>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={switchMode} className='text-teal-600 hover:underline cursor-pointer'>Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={switchMode} className='text-teal-600 hover:underline cursor-pointer'>Log in</button>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  )
}

export default AuthPage
