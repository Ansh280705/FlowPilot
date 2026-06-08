import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { syncLoginToExtension, syncLogoutToExtension } from '../utils/extensionSync'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('fp_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data)
          // Re-sync to extension on page load in case extension was reloaded
          syncLoginToExtension(token, res.data)
        })
        .catch(() => {
          localStorage.removeItem('fp_token')
          delete axios.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token, user: u } = res.data
    localStorage.setItem('fp_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    syncLoginToExtension(token, u)   // ← push to extension
    return u
  }

  const register = async (email, password, name, plan) => {
    const res = await axios.post('/api/auth/register', { email, password, name, plan })
    const { token, user: u } = res.data
    localStorage.setItem('fp_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    syncLoginToExtension(token, u)   // ← push to extension
    return u
  }

  const logout = () => {
    localStorage.removeItem('fp_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    syncLogoutToExtension()          // ← clear from extension
  }

  const refreshUser = async () => {
    const res = await axios.get('/api/auth/me')
    setUser(res.data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
