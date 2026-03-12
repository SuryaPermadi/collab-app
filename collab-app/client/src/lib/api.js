import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api',
})

// Inject Clerk token dari window (diset oleh ClerkTokenProvider)
api.interceptors.request.use((config) => {
  const token = window.__clerk_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api