import { create } from 'zustand'

export const useGameStore = create((set) => ({
  games: [],
  categories: [],
  currentGame: null,
  gameHistory: [],
  isLoading: false,

  setGames: (games) => set({ games }),
  setCategories: (categories) => set({ categories }),
  setCurrentGame: (game) => set({ currentGame: game }),
  setGameHistory: (history) => set({ gameHistory: history }),
  setLoading: (isLoading) => set({ isLoading }),

  addToHistory: (bet) =>
    set((state) => ({
      gameHistory: [bet, ...state.gameHistory],
    })),
}))
