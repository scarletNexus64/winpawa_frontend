import { useState, useEffect, useCallback } from 'react'
import { virtualMatchService } from '../services/virtualMatchService'
import toast from 'react-hot-toast'

/**
 * Hook personnalisé pour gérer les matchs virtuels
 * @param {Object} options - Options de configuration
 * @param {boolean} options.autoRefresh - Active le rafraîchissement automatique
 * @param {number} options.refreshInterval - Intervalle de rafraîchissement en ms (défaut: 30000 = 30s)
 * @returns {Object} State et fonctions pour gérer les matchs virtuels
 */
export const useVirtualMatches = ({ autoRefresh = false, refreshInterval = 30000 } = {}) => {
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Récupérer les matchs à venir
  const fetchUpcoming = useCallback(async () => {
    try {
      const response = await virtualMatchService.getUpcoming()
      if (response.success) {
        setUpcomingMatches(response.data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des matchs à venir:', err)
      setError(err)
    }
  }, [])

  // Récupérer les matchs en live
  const fetchLive = useCallback(async () => {
    try {
      const response = await virtualMatchService.getLive()
      if (response.success) {
        setLiveMatches(response.data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des matchs en live:', err)
      setError(err)
    }
  }, [])

  // Récupérer les résultats
  const fetchResults = useCallback(async () => {
    try {
      const response = await virtualMatchService.getResults()
      if (response.success) {
        setResults(response.data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des résultats:', err)
      setError(err)
    }
  }, [])

  // Charger tous les matchs
  const fetchAllMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchUpcoming(), fetchLive(), fetchResults()])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [fetchUpcoming, fetchLive, fetchResults])

  // Placer un pari
  const placeBet = useCallback(async (matchId, betData) => {
    try {
      const response = await virtualMatchService.placeBet(matchId, betData)
      if (response.success) {
        toast.success('Pari placé avec succès !')
        // Rafraîchir les matchs pour mettre à jour les compteurs
        await fetchAllMatches()
        return response.data
      }
    } catch (err) {
      console.error('Erreur lors du placement du pari:', err)
      toast.error(err.response?.data?.message || 'Erreur lors du placement du pari')
      throw err
    }
  }, [fetchAllMatches])

  // Récupérer mes paris
  const fetchMyBets = useCallback(async () => {
    try {
      const response = await virtualMatchService.getMyBets()
      return response.data
    } catch (err) {
      console.error('Erreur lors du chargement des paris:', err)
      throw err
    }
  }, [])

  // Charger les données au montage
  useEffect(() => {
    fetchAllMatches()
  }, [fetchAllMatches])

  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAllMatches()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchAllMatches])

  return {
    // State
    upcomingMatches,
    liveMatches,
    results,
    loading,
    error,

    // Actions
    fetchUpcoming,
    fetchLive,
    fetchResults,
    fetchAllMatches,
    placeBet,
    fetchMyBets,
  }
}

export default useVirtualMatches
