import api from './api'

export const legalService = {
  // Get legal page by type (privacy, terms, cookies, data_protection)
  getLegalPage: async (type) => {
    const response = await api.get(`/legal/${type}`)
    return response.data
  },

  // Get privacy policy
  getPrivacyPolicy: async () => {
    const response = await api.get('/legal/privacy')
    return response.data
  },

  // Get terms of service
  getTerms: async () => {
    const response = await api.get('/legal/terms')
    return response.data
  },
}
