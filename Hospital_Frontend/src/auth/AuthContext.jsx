import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { apiRequest } from '../services/api'

const TOKEN_KEY = 'hospital_access_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(window.sessionStorage.getItem(TOKEN_KEY)))

  const clearSession = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!window.sessionStorage.getItem(TOKEN_KEY)) return
    let active = true
    apiRequest('/auth/me')
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) clearSession()
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [clearSession])

  useEffect(() => {
    const handleExpired = () => clearSession()
    window.addEventListener('hospital-auth-expired', handleExpired)
    return () => window.removeEventListener('hospital-auth-expired', handleExpired)
  }, [clearSession])

  const login = useCallback(async (email, password) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    window.sessionStorage.setItem(TOKEN_KEY, result.access_token)
    setUser(result.user)
    return result.user
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
    window.sessionStorage.setItem(
      'hospital_login_notice',
      'Password updated. Sign in again with your new password.',
    )
    clearSession()
  }, [clearSession])

  const logout = useCallback(async () => {
    try {
      if (window.sessionStorage.getItem(TOKEN_KEY)) {
        await apiRequest('/auth/logout', { method: 'POST' })
      }
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(
    () => ({ user, loading, login, logout, changePassword }),
    [user, loading, login, logout, changePassword],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
