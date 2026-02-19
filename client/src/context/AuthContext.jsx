import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  /* ================= INIT ================= */

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken) {
        setToken(storedToken)
        setUser(storedUser ? JSON.parse(storedUser) : null)
      }
    } catch (err) {
      console.error('Auth parse error:', err)
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [])

  /* ================= CROSS-TAB SYNC ================= */

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'token') {
        const newToken = localStorage.getItem('token')
        setToken(newToken)

        if (!newToken) {
          setUser(null)
        }
      }

      if (e.key === 'user') {
        try {
          const newUser = localStorage.getItem('user')
          setUser(newUser ? JSON.parse(newUser) : null)
        } catch {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /* ================= ACTIONS ================= */

  const login = (userData, authToken) => {
    if (!authToken) return

    setUser(userData || null)
    setToken(authToken)

    localStorage.setItem('token', authToken)
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /* ================= MEMO ================= */

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
    }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ================= HOOK ================= */

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
