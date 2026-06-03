import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('megaseller_auth')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = (authData) => {
    localStorage.setItem('megaseller_auth', JSON.stringify(authData))
    setAuth(authData)
  }

  const logout = () => {
    localStorage.removeItem('megaseller_auth')
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAdmin: auth?.role === 'ROLE_ADMIN' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
