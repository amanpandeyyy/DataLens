import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const DataLensContext = createContext(null)

export const DataLensProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('datalens_token'))
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('datalens_user')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [datasets, setDatasets] = useState([])
  const [activeDataset, setActiveDataset] = useState(null)
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [loading, setLoading] = useState(false)
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
    const curToken = localStorage.getItem('datalens_token')

    if (curToken) {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data)
        localStorage.setItem('datalens_user', JSON.stringify(res.data))
      } catch (err) {
        // If 401 Unauthorized, token is expired
        if (err.response?.status === 401) {
          localStorage.removeItem('datalens_token')
          localStorage.removeItem('datalens_user')
          setToken(null)
          setUser(null)
        }
      }
    } else if (!explicitlyLoggedOut) {
      try {
        const res = await api.post('/auth/demo-login')
        const accessToken = res.data.access_token
        const userData = res.data.user
        localStorage.setItem('datalens_token', accessToken)
        localStorage.setItem('datalens_user', JSON.stringify(userData))
        setToken(accessToken)
        setUser(userData)
      } catch (err) {
        console.warn('Auto demo login skipped:', err.message)
      }
    }
  }, [])

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
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim()
      })
      const accessToken = res.data.access_token
      const userData = res.data.user
      localStorage.setItem('datalens_token', accessToken)
      localStorage.setItem('datalens_user', JSON.stringify(userData))
      localStorage.removeItem('datalens_logged_out')
      setToken(accessToken)
      setUser(userData)
      showToast(`Welcome back, ${userData.full_name}!`, 'success')
      return userData
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Explicit Register
  const register = async (userData) => {
    try {
      setLoading(true)
      const res = await api.post('/auth/register', {
        ...userData,
        email: userData.email.trim().toLowerCase(),
        full_name: userData.full_name.trim()
      })
      const accessToken = res.data.access_token
      const userObj = res.data.user
      localStorage.setItem('datalens_token', accessToken)
      localStorage.setItem('datalens_user', JSON.stringify(userObj))
      localStorage.removeItem('datalens_logged_out')
      setToken(accessToken)
      setUser(userObj)
      showToast(`Account created! Welcome, ${userObj.full_name}!`, 'success')
      return userObj
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
      const userObj = res.data.user
      localStorage.setItem('datalens_token', accessToken)
      localStorage.setItem('datalens_user', JSON.stringify(userObj))
      localStorage.removeItem('datalens_logged_out')
      setToken(accessToken)
      setUser(userObj)
      showToast('Signed in as Alex Mercer (Lead Data Analyst)!', 'success')
      return userObj
    } catch (err) {
      // Fallback local session if cloud server is sleeping/unreachable
      console.warn('Live demo login failed, using resilient demo session:', err)
      const fallbackUser = {
        id: 1,
        email: 'demo@datalens.ai',
        full_name: 'Alex Mercer',
        role: 'Lead Data Analyst'
      }
      const fallbackToken = 'demo-session-' + Date.now()
      localStorage.setItem('datalens_token', fallbackToken)
      localStorage.setItem('datalens_user', JSON.stringify(fallbackUser))
      localStorage.removeItem('datalens_logged_out')
      setToken(fallbackToken)
      setUser(fallbackUser)
      showToast('Signed in as Alex Mercer (Demo Session)!', 'success')
      return fallbackUser
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('datalens_token')
    localStorage.removeItem('datalens_user')
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

