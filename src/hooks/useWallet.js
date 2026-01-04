import { useCallback } from 'react'
import { useWalletStore } from '../store/walletStore'
import { walletService } from '../services/walletService'
import toast from 'react-hot-toast'

/**
 * Hook personnalisé pour gérer le wallet de l'utilisateur
 * Fournit des méthodes pour charger, rafraîchir et mettre à jour le solde
 */
export const useWallet = () => {
  const { wallet, setWallet, setLoading } = useWalletStore()

  /**
   * Charge le solde du wallet depuis l'API
   */
  const loadBalance = useCallback(async () => {
    try {
      setLoading(true)
      const response = await walletService.getBalance()
      setWallet(response.data)
      return response.data
    } catch (error) {
      console.error('Error loading wallet balance:', error)
      toast.error('Erreur lors du chargement du solde')
      throw error
    } finally {
      setLoading(false)
    }
  }, [setWallet, setLoading])

  /**
   * Rafraîchit le solde du wallet (sans afficher de toast d'erreur)
   * Utile pour les rafraîchissements automatiques après un pari
   */
  const refreshBalance = useCallback(async () => {
    try {
      const response = await walletService.getBalance()
      setWallet(response.data)
      return response.data
    } catch (error) {
      console.error('Error refreshing wallet balance:', error)
      return null
    }
  }, [setWallet])

  /**
   * Vérifie si l'utilisateur a assez de solde pour jouer
   */
  const hasEnoughBalance = useCallback((amount) => {
    if (!wallet) return false
    const totalBalance = wallet.main_balance + wallet.bonus_balance
    return totalBalance >= amount
  }, [wallet])

  /**
   * Formate un montant en FCFA
   */
  const formatAmount = useCallback((amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0)
  }, [])

  return {
    wallet,
    loadBalance,
    refreshBalance,
    hasEnoughBalance,
    formatAmount,
  }
}
