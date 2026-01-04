import api from './api'

export const sportService = {
  // Get sport categories
  getCategories: async () => {
    const response = await api.get('/sports/categories')
    return response.data
  },

  // Get all sports
  getSports: async () => {
    const response = await api.get('/sports')
    return response.data
  },

  // Get matches
  getMatches: async (sportSlug = null) => {
    const url = sportSlug
      ? `/sports/${sportSlug}/matches`
      : '/sports/matches'
    const response = await api.get(url)
    return response.data
  },

  // Get live matches
  getLiveMatches: async () => {
    const response = await api.get('/sports/matches/live')
    return response.data
  },
}
