import api from './api'

export const gameService = {
  // Get all games
  getGames: async () => {
    const response = await api.get('/games')
    return response.data
  },

  // Get featured games
  getFeaturedGames: async () => {
    const response = await api.get('/games/featured')
    return response.data
  },

  // Get game by slug
  getGame: async (slug) => {
    const response = await api.get(`/games/${slug}`)
    return response.data
  },

  // Play a game
  playGame: async (slug, data) => {
    const response = await api.post(`/games/${slug}/play`, data)
    return response.data
  },

  // Get game history
  getHistory: async (params = {}) => {
    const response = await api.get('/games/history', { params })
    return response.data
  },
}
