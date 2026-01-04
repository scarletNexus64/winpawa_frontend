import api from './api'

export const authService = {
  // Register new user
  register: async (data) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  // Get current user
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data)
    return response.data
  },

  // Change password
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data)
    return response.data
  },
}
