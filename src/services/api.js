import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      // Handle authentication errors
      if (status === 401) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        toast.error('Session expirée. Veuillez vous reconnecter.')
      }

      // Handle validation errors
      if (status === 422) {
        const errors = data.errors
        if (errors) {
          Object.values(errors).forEach((errorMessages) => {
            errorMessages.forEach((message) => toast.error(message))
          })
        }
      }

      // Handle other errors
      if (status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard.')
      }
    } else if (error.request) {
      toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.')
    }

    return Promise.reject(error)
  }
)

export default api
