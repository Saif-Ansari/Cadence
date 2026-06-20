import { useAuthStore } from '../store/auth.store'

function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-semibold text-slate-900'>Good morning, {user?.name}.</h1>
      <p className='text-slate-500 mt-1'>Dashboard coming soon.</p>
    </div>
  )
}

export default DashboardPage
