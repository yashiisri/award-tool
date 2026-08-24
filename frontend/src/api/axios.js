import axios from 'axios'

const api = axios.create({
  // 127.0.0.1, not localhost — this machine resolves "localhost" to the IPv6
  // loopback (::1) first, which the backend doesn't listen on, adding a
  // dual-stack fallback delay (or an outright failure) to every request.
  baseURL: 'http://127.0.0.1:8000/api'
})

api.interceptors.request.use((config) => {
  // Always read fresh from localStorage so token is never stale
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      window.location.href = '/select-role'
    }
    return Promise.reject(error)
  }
)

export default api
