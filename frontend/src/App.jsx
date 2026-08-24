import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import RoleSelect from './pages/RoleSelect'
import AuthPage from './pages/AuthPage'
import AdminDashboard from './pages/AdminDashboard'
import JuryDashboard from './pages/JuryDashboard'
import HeadJuryDashboard from './pages/HeadJuryDashboard'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const username = localStorage.getItem('username')
    if (token && role) setUser({ token, role, username })
  }, [])

  const handleLogin = (token, role, username) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('username', username || '')
    setUser({ token, role, username })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setUser(null)
  }

  const dashboardRoute = user?.role === 'admin'
    ? '/admin/awards'
    : user?.role === 'head_jury'
    ? '/head_jury/awards'
    : '/jury/awards'

  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/select-role" element={user ? <Navigate to={dashboardRoute} /> : <RoleSelect />} />
        <Route path="/login/:role" element={user ? <Navigate to={dashboardRoute} /> : <AuthPage onLogin={handleLogin} />} />

        <Route path="/admin/*" element={
          user?.role === 'admin'
            ? <AdminDashboard onLogout={handleLogout} username={user.username} />
            : <Navigate to="/select-role" />
        } />
        <Route path="/jury/*" element={
          user?.role === 'jury'
            ? <JuryDashboard onLogout={handleLogout} username={user.username} />
            : <Navigate to="/select-role" />
        } />
        <Route path="/head_jury/*" element={
          user?.role === 'head_jury'
            ? <HeadJuryDashboard onLogout={handleLogout} username={user.username} />
            : <Navigate to="/select-role" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
