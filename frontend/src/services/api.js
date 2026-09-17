import axios from 'axios'

const rawBase = import.meta.env.VITE_API_BASE_URL || ''
const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
export const API_BASE_URL = normalizedBase ? `${normalizedBase}/api` : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getDownloadUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const rootHost = normalizedBase || ''
  return `${rootHost}${path}`
}

// Request interceptor for attaching auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('datalens_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for formatting error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An analytical error occurred. Please try again.'
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail)
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }
    return Promise.reject(new Error(message))
  }
)

export default api

