import { createContext, useContext, useState, useCallback } from 'react'
import { login as loginApi } from '../api/services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (username, password) => {
    const res = await loginApi({ username, password })
    const { token, role, username: name } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify({ username: name, role }))
    setUser({ username: name, role })
    return { role }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
