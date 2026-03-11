import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/index.js'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RoomPage from './pages/RoomPage.jsx'

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const initToken = useAuthStore(s => s.initToken)

  useEffect(() => {
    initToken() // Pasang token ke axios header saat app load
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/room/:roomId" element={
          <ProtectedRoute>
            <RoomPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
