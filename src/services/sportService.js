import api from './api'

export const sportService = {
  getCategories: async () => {
    const response = await api.get('/sports/categories')
    return response.data
  },

  getSports: async () => {
    const response = await api.get('/sports')
    return response.data
  },

  getLeagues: async (sportSlug) => {
    const response = await api.get(`/sports/${sportSlug}/leagues`)
    return response.data
  },

  getLiveFixtures: async (sportSlug) => {
    const response = await api.get(`/sports/${sportSlug}/live`)
    return response.data
  },

  getLeagueFixtures: async (sportSlug, leagueId, params = {}) => {
    const response = await api.get(`/sports/${sportSlug}/leagues/${leagueId}/fixtures`, { params })
    return response.data
  },

  getMatches: async (sportSlug = null, params = {}) => {
    const url = sportSlug ? `/sports/${sportSlug}/matches` : '/sports/matches'
    const response = await api.get(url, { params })
    return response.data
  },

  getPopularMatches: async () => {
    const response = await api.get('/sports/matches/popular')
    return response.data
  },

  getPopularFixtures: async () => {
    const response = await api.get('/sports/matches/popular-grouped')
    return response.data
  },

  getLiveMatches: async () => {
    const response = await api.get('/sports/matches/live')
    return response.data
  },

  getFinishedMatches: async (sportSlug = 'football') => {
    const response = await api.get('/sports/matches/finished', { params: { sport: sportSlug } })
    return response.data
  },

  getMatchDetail: async (id, sportSlug = 'football') => {
    const response = await api.get(`/sports/matches/${id}`, { params: { sport: sportSlug } })
    return response.data
  },
}
