import api from './api'

export const walletService = {
  // Get wallet balance
  getBalance: async () => {
    const response = await api.get('/wallet/balance')
    return response.data
  },

  // Initiate deposit
  deposit: async (data) => {
    const response = await api.post('/wallet/deposit', data)
    return response.data
  },

  // Request withdrawal
  withdraw: async (data) => {
    const response = await api.post('/wallet/withdraw', data)
    return response.data
  },

  // Get transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/wallet/transactions', { params })
    return response.data
  },

  // Claim bonus
  claimBonus: async (data) => {
    const response = await api.post('/wallet/claim-bonus', data)
    return response.data
  },
}
