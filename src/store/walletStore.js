import { create } from 'zustand'

export const useWalletStore = create((set) => ({
  wallet: null,
  transactions: [],
  isLoading: false,

  setWallet: (wallet) => set({ wallet }),
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (isLoading) => set({ isLoading }),

  updateBalance: (balances) =>
    set((state) => ({
      wallet: state.wallet ? { ...state.wallet, ...balances } : null,
    })),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
}))
