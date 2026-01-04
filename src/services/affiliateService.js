import api from './api'

export const affiliateService = {
  // Get affiliate stats
  getStats: async () => {
    const response = await api.get('/affiliate/stats')
    return response.data
  },

  // Get referrals
  getReferrals: async (params = {}) => {
    const response = await api.get('/affiliate/referrals', { params })
    return response.data
  },

  // Get commissions
  getCommissions: async (params = {}) => {
    const response = await api.get('/affiliate/commissions', { params })
    return response.data
  },

  // Withdraw affiliate earnings
  withdraw: async (data) => {
    const response = await api.post('/affiliate/withdraw', data)
    return response.data
  },
}
