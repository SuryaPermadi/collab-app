import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 10000,
})

// Otomatis attach token di setiap request
api.interceptors.request.use((config) => {
  const state = localStorage.getItem('auth-storage')
  if (state) {
    try {
      const parsed = JSON.parse(state)
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) { }
  }
  return config
})

export default api