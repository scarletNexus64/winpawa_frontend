import api from './api'

export const virtualMatchService = {
  // Get upcoming matches
  getUpcoming: async () => {
    const response = await api.get('/virtual-match/upcoming')
    return response.data
  },

  // Get live matches
  getLive: async () => {
    const response = await api.get('/virtual-match/live')
    return response.data
  },

  // Get match results
  getResults: async (params = {}) => {
    const response = await api.get('/virtual-match/results', { params })
    return response.data
  },

  // Place bet on match
  placeBet: async (matchId, data) => {
    const response = await api.post(`/virtual-match/${matchId}/bet`, data)
    return response.data
  },

  // Get user's bets
  getMyBets: async (params = {}) => {
    const response = await api.get('/virtual-match/my-bets', { params })
    return response.data
  },
}
