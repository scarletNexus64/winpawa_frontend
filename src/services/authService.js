import api from './api'

export const authService = {
  // Register new user (old method - kept for compatibility)
  register: async (data) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  // Register Flash - Mode 1 (Quick registration with country and currency)
  registerFlash: async (data) => {
    const response = await api.post('/auth/register-flash', data)
    return response.data
  },

  // Register by Phone - Mode 2
  registerPhone: async (data) => {
    const response = await api.post('/auth/register-phone', data)
    return response.data
  },

  // Register by Email - Mode 3
  registerEmail: async (data) => {
    const response = await api.post('/auth/register-email', data)
    return response.data
  },

  // Get available currencies
  getCurrencies: async () => {
    const response = await api.get('/auth/currencies')
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
