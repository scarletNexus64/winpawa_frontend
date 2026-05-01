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

  // Get user's match history (completed matches)
  // params: { my_bets_only: boolean, search: string, per_page: number, page: number }
  getMyHistory: async (params = {}) => {
    const response = await api.get('/virtual-match/my-history', { params })
    return response.data
  },

  // Get user's bets for a specific match
  getMatchBets: async (matchId) => {
    const response = await api.get(`/virtual-match/${matchId}/my-bets`)
    return response.data
  },

  // Update a bet (only if match hasn't started)
  updateBet: async (betId, data) => {
    const response = await api.put(`/virtual-match/bets/${betId}`, data)
    return response.data
  },

  // Delete a bet (only if match hasn't started)
  deleteBet: async (betId) => {
    const response = await api.delete(`/virtual-match/bets/${betId}`)
    return response.data
  },
}
