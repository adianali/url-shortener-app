import { createContext, useCallback, useEffect, useState } from 'react'
import * as authService from '../services/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null)
  const [loading, setLoading] = useState(false)

  const persistAuth = useCallback((userData, access, refresh) => {
    setUser(userData)
    setAccessToken(access)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', access)
    if (refresh) localStorage.setItem('refreshToken', refresh)
  }, [])

  const clearAuth = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      const data = await authService.login({ email, password })
      persistAuth(data.user, data.accessToken, data.refreshToken)
      return data
    } finally {
      setLoading(false)
    }
  }, [persistAuth])

  const register = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      const data = await authService.register({ email, password })
      persistAuth(data.user, data.accessToken, data.refreshToken)
      return data
    } finally {
      setLoading(false)
    }
  }, [persistAuth])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    clearAuth()
    await authService.logout(refreshToken)
  }, [clearAuth])

  const isAuthenticated = Boolean(accessToken && user)

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
