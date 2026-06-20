import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ProtectedLayout from './components/layout/ProtectedLayout'
import DashboardPage from './pages/DashboardPage'
import GoalsPage from './pages/GoalsPage'
import HabitsPage from './pages/HabitsPage'
import ReflectionsPage from './pages/ReflectionsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path='/auth' element={<AuthPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path='/' element={<DashboardPage />} />
        <Route path='/goals' element={<GoalsPage />} />
        <Route path='/habits' element={<HabitsPage />} />
        <Route path='/reflections' element={<ReflectionsPage />} />
        <Route path='/settings' element={<SettingsPage />} />
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App
