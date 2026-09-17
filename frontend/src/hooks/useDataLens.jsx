import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const DataLensContext = createContext(null)

export const DataLensProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('datalens_token'))
  const [datasets, setDatasets] = useState([])
  const [activeDataset, setActiveDataset] = useState(null)
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Auto-login or verify current user
  const initUser = useCallback(async () => {
    const explicitlyLoggedOut = localStorage.getItem('datalens_logged_out') === 'true'
    try {
      let curToken = token
      if (!curToken) {
        if (!explicitlyLoggedOut) {
          const res = await api.post('/auth/demo-login')
          curToken = res.data.access_token
          localStorage.setItem('datalens_token', curToken)
          setToken(curToken)
          setUser(res.data.user)
        } else {
          setUser(null)
        }
      } else {
        const res = await api.get('/auth/me')
        setUser(res.data)
      }
    } catch {
      if (!explicitlyLoggedOut) {
        try {
          const res = await api.post('/auth/demo-login')
          localStorage.setItem('datalens_token', res.data.access_token)
          setToken(res.data.access_token)
          setUser(res.data.user)
        } catch (err) {
          console.error('Auth initialization error:', err)
        }
      } else {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await api.get('/datasets')
      setDatasets(res.data)
      if (res.data.length > 0) {
        // Keep currently selected or pick the first
        setActiveDataset((prev) => {
          if (prev) {
            const found = res.data.find((d) => d.id === prev.id)
            if (found) return found
          }
          return res.data[0]
        })
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects')
      setProjects(res.data)
      if (res.data.length > 0 && !activeProject) {
        setActiveProject(res.data[0])
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }, [activeProject])

  useEffect(() => {
    initUser()
  }, [initUser])

  useEffect(() => {
    if (user) {
      fetchDatasets()
      fetchProjects()
    }
  }, [user, fetchDatasets, fetchProjects])

  const loadSampleDataset = async () => {
    try {
      setLoading(true)
      const res = await api.post('/datasets/sample')
      showToast('Loaded enterprise sales sample dataset!', 'success')
      await fetchDatasets()
      setActiveDataset(res.data)
      return res.data
    } catch (err) {
      showToast(err.message, 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Explicit Login
  const login = async (email, password) => {
    try {
      setLoading(true)
      const res = await api.post('/auth/login', { email, password })
      const accessToken = res.data.access_token
      localStorage.setItem('datalens_token', accessToken)
      localStorage.removeItem('datalens_logged_out')
      setToken(accessToken)
      setUser(res.data.user)
      showToast(`Welcome back, ${res.data.user.full_name}!`, 'success')
      return res.data.user
    } catch (err) {
      showToast(err.message || 'Login failed', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Explicit Register
  const register = async (userData) => {
    try {
      setLoading(true)
      const res = await api.post('/auth/register', userData)
      const accessToken = res.data.access_token
      localStorage.setItem('datalens_token', accessToken)
      localStorage.removeItem('datalens_logged_out')
      setToken(accessToken)
      setUser(res.data.user)
      showToast(`Account created! Welcome, ${res.data.user.full_name}!`, 'success')
      return res.data.user
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 1-Click Demo Login
  const demoLogin = async () => {
    try {
      setLoading(true)
      const res = await api.post('/auth/demo-login')
      const accessToken = res.data.access_token
      localStorage.setItem('datalens_token', accessToken)
      localStorage.removeItem('datalens_logged_out')
      setToken(accessToken)
      setUser(res.data.user)
      showToast('Signed in as Alex Mercer (Lead Data Analyst)!', 'success')
      return res.data.user
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('datalens_token')
    localStorage.setItem('datalens_logged_out', 'true')
    setToken(null)
    setUser(null)
    setDatasets([])
    setActiveDataset(null)
    showToast('Logged out successfully', 'info')
  }

  return (
    <DataLensContext.Provider
      value={{
        user,
        token,
        loading,
        datasets,
        activeDataset,
        setActiveDataset,
        projects,
        activeProject,
        setActiveProject,
        fetchDatasets,
        fetchProjects,
        loadSampleDataset,
        login,
        register,
        demoLogin,
        logout,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </DataLensContext.Provider>
  )
}

export const useDataLens = () => {
  const context = useContext(DataLensContext)
  if (!context) {
    throw new Error('useDataLens must be used within DataLensProvider')
  }
  return context
}

