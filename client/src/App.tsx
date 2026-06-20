import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ProtectedLayout from './components/layout/ProtectedLayout'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path='/auth' element={<AuthPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path='/' element={<DashboardPage />} />
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App
