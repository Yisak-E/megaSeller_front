import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MoviesPage   from './pages/MoviesPage'
import MovieDetailPage from './pages/MovieDetailPage'
import OrdersPage   from './pages/OrdersPage'
import AdminPage    from './pages/AdminPage'

function PrivateRoute({ children, adminOnly = false }) {
  const { auth, isAdmin } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/movies" replace />
  return children
}

function AppRoutes() {
  const { auth, isAdmin } = useAuth()
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Navigate to={auth ? (isAdmin ? '/admin' : '/movies') : '/login'} replace />} />
        <Route path="/login"    element={auth ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={auth ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/movies"   element={<PrivateRoute><MoviesPage /></PrivateRoute>} />
        <Route path="/movies/:id" element={<PrivateRoute><MovieDetailPage /></PrivateRoute>} />
        <Route path="/orders"   element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/admin"    element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
