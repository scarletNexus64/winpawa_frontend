import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react'
import { Trophy, Clock, TrendingUp, Play, CircleDot, Timer, RefreshCw, History, TrendingDown, Award, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { virtualMatchService } from '../services/virtualMatchService'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import echo from '../lib/echo'
import { useWallet } from '../hooks/useWallet'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://10.38.76.65:8000'

console.log('🔧 [VirtualMatch] Module chargé', { API_BASE_URL })

export default function VirtualMatch() {
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [historyMatches, setHistoryMatches] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showBetModal, setShowBetModal] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const hasLoadedHistory = useRef(false)
  const [matchBets, setMatchBets] = useState({}) // Paris par match: { matchId: [bets] }
  const [showMyBetsModal, setShowMyBetsModal] = useState(false)
  const [selectedMatchForBets, setSelectedMatchForBets] = useState(null)
  const [betToEdit, setBetToEdit] = useState(null) // Pari à éditer

  // Hook pour gérer le wallet
  const { refreshBalance } = useWallet()

  // Filtres pour l'historique
  const [historyFilter, setHistoryFilter] = useState('all') // 'all' ou 'my_bets'
  const [searchQuery, setSearchQuery] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyMeta, setHistoryMeta] = useState(null)

  console.log('🔄 [VirtualMatch] Component render', {
    upcomingCount: upcomingMatches.length,
    liveCount: liveMatches.length,
    activeTab,
    currentTime: new Date(currentTime).toLocaleTimeString()
  })

  // Demander la permission pour les notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📢 [Notification] Permission:', permission)
      })
    }
  }, [])

  // Système de notifications pour les matchs à venir
  useEffect(() => {
    if (upcomingMatches.length === 0) return

    const checkIntervals = []

    upcomingMatches.forEach(match => {
      const matchStartTime = new Date(match.starts_at).getTime()
      const now = Date.now()
      const timeUntilStart = matchStartTime - now

      // Notification 5 minutes avant
      if (timeUntilStart > 0 && timeUntilStart <= 5 * 60 * 1000) {
        const fiveMinCheck = setInterval(() => {
          const remaining = matchStartTime - Date.now()
          if (remaining <= 5 * 60 * 1000 && remaining > 4 * 60 * 1000) {
            sendNotification(
              '⚽ Match dans 5 minutes !',
              `${match.team_home} vs ${match.team_away} commence bientôt`,
              match.id
            )
            clearInterval(fiveMinCheck)
          }
        }, 10000) // Vérifier toutes les 10 secondes
        checkIntervals.push(fiveMinCheck)
      }

      // Notification 1 minute avant
      if (timeUntilStart > 0 && timeUntilStart <= 1 * 60 * 1000) {
        const oneMinCheck = setInterval(() => {
          const remaining = matchStartTime - Date.now()
          if (remaining <= 1 * 60 * 1000 && remaining > 30 * 1000) {
            sendNotification(
              '🔥 Match dans 1 minute !',
              `${match.team_home} vs ${match.team_away} - Dernière chance de parier !`,
              match.id
            )
            clearInterval(oneMinCheck)
          }
        }, 5000) // Vérifier toutes les 5 secondes
        checkIntervals.push(oneMinCheck)
      }

      // Notification quand les paris ferment
      const betClosureTime = matchStartTime - (match.bet_closure_seconds * 1000)
      const timeUntilClosure = betClosureTime - now
      if (timeUntilClosure > 0 && timeUntilClosure <= 30 * 1000) {
        const closureCheck = setInterval(() => {
          const remaining = betClosureTime - Date.now()
          if (remaining <= 30 * 1000 && remaining > 20 * 1000) {
            sendNotification(
              '⚠️ Paris ferment bientôt !',
              `${match.team_home} vs ${match.team_away} - Plus que ${Math.floor(remaining / 1000)}s pour parier`,
              match.id
            )
            // Toast dans l'app aussi
            toast(`⚠️ Paris ferment dans ${Math.floor(remaining / 1000)}s pour ${match.team_home} vs ${match.team_away}`, {
              duration: 5000,
              icon: '⚠️'
            })
            clearInterval(closureCheck)
          }
        }, 5000)
        checkIntervals.push(closureCheck)
      }
    })

    return () => {
      checkIntervals.forEach(interval => clearInterval(interval))
    }
  }, [upcomingMatches])

  const sendNotification = (title, body, matchId) => {
    console.log('📢 [Notification] Envoi:', { title, body, matchId })

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `match-${matchId}`,
        requireInteraction: false,
        silent: false
      })

      notification.onclick = () => {
        window.focus()
        setActiveTab('upcoming')
        notification.close()
      }
    } else {
      // Fallback : toast dans l'app
      toast(body, {
        icon: '🔔',
        duration: 5000
      })
    }
  }

  // Définir loadMatches et loadHistory AVANT le useEffect principal
  const loadMatches = useCallback(async (showToast = false) => {
    console.log('📥 [loadMatches] Début du chargement', { showToast })
    try {
      setIsRefreshing(true)
      console.log('🌐 [API] Appel API pour upcoming et live...')

      const [upcoming, live] = await Promise.all([
        virtualMatchService.getUpcoming(),
        virtualMatchService.getLive(),
      ])

      console.log('✅ [API] Réponse reçue:', {
        upcomingCount: upcoming.data?.length || 0,
        liveCount: live.data?.length || 0
      })

      setUpcomingMatches(upcoming.data || [])
      setLiveMatches(live.data || [])

      if (showToast) {
        toast.success('Matchs actualisés')
      }
    } catch (error) {
      console.error('❌ [API] Error loading matches:', error)
      if (showToast) {
        toast.error('Erreur lors du chargement des matchs')
      }
    } finally {
      setIsRefreshing(false)
      console.log('📥 [loadMatches] Fin du chargement')
    }
  }, [])

  const loadHistory = useCallback(async (showToast = false, page = 1) => {
    console.log('📜 [loadHistory] Début du chargement de l\'historique', { page, filter: historyFilter, search: searchQuery })
    try {
      setIsLoadingHistory(true)
      const params = {
        my_bets_only: historyFilter === 'my_bets',
        search: searchQuery || undefined,
        page,
        per_page: 20,
      }
      const history = await virtualMatchService.getMyHistory(params)
      console.log('✅ [API] Historique reçu:', { count: history.data?.length || 0, meta: history.meta })
      setHistoryMatches(history.data || [])
      setHistoryMeta(history.meta || null)
      setHistoryPage(page)
      hasLoadedHistory.current = true
      if (showToast) {
        toast.success('Historique actualisé')
      }
    } catch (error) {
      console.error('❌ [API] Error loading history:', error)
      // Si erreur 401 (non authentifié), ne pas afficher de toast d'erreur
      if (error.response?.status === 401) {
        console.log('⚠️ [loadHistory] Utilisateur non authentifié')
      } else if (showToast) {
        toast.error('Erreur lors du chargement de l\'historique')
      }
    } finally {
      setIsLoadingHistory(false)
      console.log('📜 [loadHistory] Fin du chargement')
    }
  }, [historyFilter, searchQuery])

  useEffect(() => {
    console.log('🚀 [VirtualMatch] useEffect - Initialisation')

    // Initial load
    loadMatches()

    // Setup WebSocket connection with Laravel Echo + Reverb
    console.log('🔌 [WebSocket] Connexion au channel virtual-matches...')
    const channel = echo.channel('virtual-matches')

    // Vérifier la connexion après 2 secondes
    setTimeout(() => {
      if (echo.connector && echo.connector.pusher) {
        const state = echo.connector.pusher.connection.state
        console.log('🔍 [WebSocket] État de connexion après 2s:', state)
        if (state !== 'connected') {
          console.warn('⚠️ [WebSocket] Pas connecté ! État:', state)
          console.warn('⚠️ Vérifiez que Reverb tourne : php artisan reverb:start --host=0.0.0.0 --port=8080')
        }
      }
    }, 2000)

    console.log('👂 [WebSocket] Configuration des listeners...')

    // 🆕 Écouter la création d'un nouveau match
    channel.listen('.match.created', (data) => {
      console.log('🆕 [WebSocket] Match created EVENT reçu:', data)
      toast.success(`Nouveau match disponible : ${data.match.team_home} vs ${data.match.team_away}`, {
        icon: '⚽',
        duration: 4000,
      })
      console.log('🔄 [WebSocket] Ajout du nouveau match à la liste')

      // Ajouter le nouveau match à la liste appropriée selon son statut
      if (data.match.status === 'upcoming') {
        setUpcomingMatches(prev => {
          // Vérifier si le match n'existe pas déjà
          if (prev.some(m => m.id === data.match.id)) {
            console.log('⚠️ [WebSocket] Match déjà présent dans upcoming, ignoré')
            return prev
          }
          console.log('✅ [WebSocket] Nouveau match ajouté à upcoming')
          return [...prev, data.match]
        })
      } else if (data.match.status === 'live') {
        setLiveMatches(prev => {
          if (prev.some(m => m.id === data.match.id)) {
            console.log('⚠️ [WebSocket] Match déjà présent dans live, ignoré')
            return prev
          }
          console.log('✅ [WebSocket] Nouveau match ajouté à live')
          return [...prev, data.match]
        })
      }
    })

    // Écouter l'événement de démarrage d'un match
    channel.listen('.match.started', (data) => {
      console.log('🎮 [WebSocket] Match started EVENT reçu:', data)
      toast.success(`Match démarré : ${data.match.team_home} vs ${data.match.team_away}`, {
        icon: '🔴',
        duration: 4000,
      })
      console.log('🔄 [WebSocket] Déplacement du match vers LIVE et bascule vers onglet En direct')

      // Retirer de upcoming et ajouter à live
      setUpcomingMatches(prev => prev.filter(m => m.id !== data.match.id))
      setLiveMatches(prev => [...prev, data.match])

      // Basculer automatiquement vers l'onglet "En direct"
      setActiveTab('live')
    })

    // Écouter les mises à jour de score en temps réel
    channel.listen('.match.updated', (data) => {
      console.log('⚡ [WebSocket] Match updated EVENT reçu:', data)
      console.log('📊 [WebSocket] Données complètes du match:', data.match)
      console.log('📊 [WebSocket] Mise à jour du score:', {
        matchId: data.match.id,
        scoreHome: data.match.score_home,
        scoreAway: data.match.score_away,
        event: data.event
      })

      // Mettre à jour le match dans la liste des matchs live SANS recharger
      setLiveMatches((prevMatches) => {
        console.log('🔄 [State] Mise à jour de liveMatches (avant):', prevMatches.length)
        const updated = prevMatches.map((match) => {
          if (match.id === data.match.id) {
            const updatedMatch = {
              ...match,
              ...data.match,
              score: `${data.match.score_home} - ${data.match.score_away}`
            }
            console.log('✅ [State] Match mis à jour:', {
              id: updatedMatch.id,
              score_home: updatedMatch.score_home,
              score_away: updatedMatch.score_away,
            })
            return updatedMatch
          }
          return match
        })
        console.log('🔄 [State] Mise à jour de liveMatches (après):', updated.length)
        return updated
      })

      // Afficher une notification si un événement spécifique s'est produit
      if (data.event) {
        console.log('🎯 [Event] Événement spécifique détecté:', data.event.type)
        if (data.event.type === 'goal') {
          toast.success(`⚽ But ! ${data.event.team_name} (${data.match.score_home}-${data.match.score_away})`, {
            duration: 3000,
          })
        } else if (data.event.type === 'yellow_card') {
          toast(`🟨 Carton jaune - ${data.event.player} (${data.event.team_name})`, {
            duration: 2000,
          })
        }
      }
    })

    // ✏️ Écouter la modification d'un match
    channel.listen('.match.edited', (data) => {
      console.log('✏️ [WebSocket] Match edited EVENT reçu:', data)
      console.log('🔄 [WebSocket] Mise à jour du match dans la liste')

      // Mettre à jour le match dans la liste appropriée selon son nouveau statut
      const updatedMatch = data.match

      // Fonction helper pour mettre à jour un match dans une liste
      const updateMatchInList = (prevMatches) => {
        const matchExists = prevMatches.some(m => m.id === updatedMatch.id)
        if (matchExists) {
          return prevMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m)
        }
        return prevMatches
      }

      // Si le match change de statut, on doit le déplacer
      if (updatedMatch.status === 'upcoming') {
        setUpcomingMatches(prev => {
          if (prev.some(m => m.id === updatedMatch.id)) {
            return updateMatchInList(prev)
          }
          // Le match a été déplacé vers upcoming depuis une autre liste
          return [...prev, updatedMatch]
        })
        setLiveMatches(prev => prev.filter(m => m.id !== updatedMatch.id))
      } else if (updatedMatch.status === 'live') {
        setLiveMatches(prev => {
          if (prev.some(m => m.id === updatedMatch.id)) {
            return updateMatchInList(prev)
          }
          // Le match a été déplacé vers live depuis une autre liste
          return [...prev, updatedMatch]
        })
        setUpcomingMatches(prev => prev.filter(m => m.id !== updatedMatch.id))
      } else if (updatedMatch.status === 'completed' || updatedMatch.status === 'cancelled') {
        // Retirer le match des deux listes s'il est terminé ou annulé
        setUpcomingMatches(prev => prev.filter(m => m.id !== updatedMatch.id))
        setLiveMatches(prev => prev.filter(m => m.id !== updatedMatch.id))
      }

      toast(`Match mis à jour : ${data.match.team_home} vs ${data.match.team_away}`, {
        duration: 2000,
      })
    })

    // Écouter la fin d'un match
    channel.listen('.match.completed', (data) => {
      console.log('🏁 [WebSocket] Match completed EVENT reçu:', data)
      toast.success(
        `Match terminé : ${data.match.team_home} ${data.match.score_home}-${data.match.score_away} ${data.match.team_away}`,
        {
          icon: '🏆',
          duration: 5000,
        }
      )
      console.log('🔄 [WebSocket] Retrait du match de LIVE')

      // Retirer de live
      setLiveMatches(prev => prev.filter(m => m.id !== data.match.id))

      // Recharger l'historique pour inclure ce match (si l'utilisateur a parié dessus)
      // On attend 1 seconde pour laisser le temps au backend de traiter les paris
      setTimeout(() => {
        loadHistory()
      }, 1000)
    })

    console.log('⏰ [Timer] Démarrage du timer de countdown (1s)')
    // Update countdown every second
    const timeInterval = setInterval(() => {
      const newTime = Date.now()
      console.log('⏱️ [Timer] Mise à jour currentTime:', new Date(newTime).toLocaleTimeString())
      setCurrentTime(newTime)
    }, 1000)

    return () => {
      console.log('🧹 [Cleanup] Nettoyage des listeners et timer')
      // Cleanup WebSocket listeners
      channel.stopListening('.match.created')
      channel.stopListening('.match.started')
      channel.stopListening('.match.updated')
      channel.stopListening('.match.edited')
      channel.stopListening('.match.completed')
      echo.leaveChannel('virtual-matches')
      clearInterval(timeInterval)
    }
  }, [loadMatches, loadHistory])

  // Charger l'historique quand on bascule sur l'onglet (une seule fois)
  useEffect(() => {
    if (activeTab === 'history' && !hasLoadedHistory.current && !isLoadingHistory) {
      console.log('📜 [useEffect] Chargement initial de l\'historique')
      loadHistory()
    }
  }, [activeTab, isLoadingHistory, loadHistory])

  // Recharger l'historique quand les filtres changent
  useEffect(() => {
    if (activeTab === 'history' && hasLoadedHistory.current) {
      console.log('🔄 [useEffect] Rechargement de l\'historique (filtres modifiés)')
      setHistoryPage(1)
      loadHistory(false, 1)
    }
  }, [historyFilter, searchQuery])

  // Charger les paris existants pour un match
  const loadMatchBets = useCallback(async (matchId) => {
    try {
      const response = await virtualMatchService.getMatchBets(matchId)
      setMatchBets(prev => ({ ...prev, [matchId]: response.data || [] }))
      return response.data || []
    } catch (error) {
      // Silencieux si non connecté
      if (error.response?.status !== 401) {
        console.error('❌ Erreur chargement paris match:', error)
      }
      return []
    }
  }, [])

  // Ouvrir le modal des paris existants
  const openMyBetsModal = useCallback(async (match) => {
    setSelectedMatchForBets(match)
    setShowMyBetsModal(true)
    // Charger les paris si pas déjà chargés
    if (!matchBets[match.id]) {
      await loadMatchBets(match.id)
    }
  }, [matchBets, loadMatchBets])

  const handlePlaceBet = useCallback(async (matchId, choice, betType = 'result', betAmount = 500) => {
    console.log('💰 [Bet] Placement de pari:', { matchId, choice, betType, betAmount })
    try {
      await virtualMatchService.placeBet(matchId, {
        bet_type: betType,
        choice: choice,
        amount: betAmount,
      })
      toast.success('Pari placé avec succès !')
      console.log('💰 [Bet] Pari placé, rechargement des matchs et du solde...')

      // Rafraîchir le solde du wallet
      await refreshBalance()

      // Recharger les paris du match
      await loadMatchBets(matchId)

      loadMatches()
    } catch (error) {
      console.error('❌ [Bet] Erreur lors du pari:', error)
      toast.error(error.response?.data?.message || 'Erreur lors du pari')
    }
  }, [loadMatches, refreshBalance, loadMatchBets])

  const MatchCard = memo(({ match, isLive = false, currentTime }) => {
    console.log('🎴 [MatchCard] Render', {
      matchId: match.id,
      team: `${match.team_home} vs ${match.team_away}`,
      isLive,
      score: match.score
    })

    // State pour gérer le chargement des images (éviter le scintillement)
    const [homeLogoError, setHomeLogoError] = useState(false)
    const [awayLogoError, setAwayLogoError] = useState(false)

    // Réinitialiser les erreurs si les logos changent
    useEffect(() => {
      setHomeLogoError(false)
      setAwayLogoError(false)
    }, [match.team_home_logo, match.team_away_logo])

    // ==================== CALCUL DU TEMPS ET MINUTE EN TEMPS RÉEL ====================
    // Pour les matchs live, on calcule la minute actuelle basée sur le temps écoulé
    const calculateLiveMinute = () => {
      if (!isLive || !match.starts_at) {
        return { currentMinute: 0, isFirstHalf: true }
      }

      // Calculer le temps écoulé depuis le début du match (en millisecondes)
      const startTime = new Date(match.starts_at).getTime()
      const elapsed = currentTime - startTime
      const elapsedSeconds = Math.floor(elapsed / 1000)

      // Durée du match en secondes
      const matchDurationSeconds = match.duration * 60

      // Calculer la minute actuelle du match (1 minute virtuelle = durée_match / durée_totale secondes réelles)
      const secondsPerVirtualMinute = matchDurationSeconds / match.duration
      const currentMinute = Math.min(
        Math.floor(elapsedSeconds / secondsPerVirtualMinute) + 1,
        match.duration
      )

      // Déterminer si on est en première ou deuxième mi-temps
      const halfTime = match.duration / 2
      const isFirstHalf = currentMinute <= halfTime

      return { currentMinute, isFirstHalf }
    }

    // Calculer la minute actuelle pour les matchs live
    const liveData = isLive ? calculateLiveMinute() : null

    // UTILISER DIRECTEMENT LES SCORES DU BACKEND (envoyés via WebSocket)
    // Le backend met à jour score_home et score_away en temps réel
    const homeScore = match.score_home || 0
    const awayScore = match.score_away || 0

    // Calculer le temps restant avant le match
    const matchStartTime = new Date(match.starts_at).getTime()
    const timeUntilStart = Math.max(0, matchStartTime - currentTime)
    const secondsUntilStart = Math.floor(timeUntilStart / 1000)
    const minutesUntilStart = Math.floor(secondsUntilStart / 60)

    // Calculer le temps restant avant la fermeture des paris
    const betClosureTime = matchStartTime - (match.bet_closure_seconds * 1000)
    const timeUntilClosure = Math.max(0, betClosureTime - currentTime)
    const secondsUntilClosure = Math.floor(timeUntilClosure / 1000)

    // Les paris sont ouverts si on n'a pas dépassé le temps de fermeture
    const isBettingOpen = match.is_open_for_bets && timeUntilClosure > 0

    const openBetModal = () => {
      setSelectedMatch(match)
      setShowBetModal(true)
    }

    // Charger les paris de ce match
    useEffect(() => {
      if (!matchBets[match.id] && match.is_open_for_bets) {
        loadMatchBets(match.id)
      }
    }, [match.id])

    const bets = matchBets[match.id] || []
    const hasBets = bets.length > 0

    // CARD POUR MATCHS LIVE (avec scores)
    if (isLive) {
      return (
        <div className={`card relative overflow-hidden border-2 border-casino-red`}>
          {/* Live indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-casino-red via-red-600 to-casino-red animate-pulse"></div>

          {/* Live Badge */}
          <div className="flex items-center justify-between mb-4">
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-2 px-3 py-1 bg-casino-red/20 border border-casino-red rounded-full text-casino-red text-xs font-bold"
            >
              <CircleDot className="w-3 h-3 animate-pulse" />
              EN DIRECT
            </motion.span>
            <div className="flex items-center gap-2">
              {/* Minute actuelle et mi-temps */}
              {liveData && (
                <span className="px-3 py-1 bg-casino-gold/20 border border-casino-gold/50 rounded-full text-casino-gold text-xs font-bold">
                  {liveData.currentMinute}'
                  {liveData.isFirstHalf ? ' (1ère MT)' : ' (2ème MT)'}
                </span>
              )}
              {match.league && (
                <span className="text-xs px-2 py-1 bg-dark-300 text-gray-400 rounded">
                  {match.league}
                </span>
              )}
              <span className="badge badge-purple">
                <Timer className="w-3 h-3 mr-1" />
                {match.duration}min
              </span>
            </div>
          </div>

          {/* Score Display - Horizontal */}
          <div className="flex items-center justify-between gap-4 p-6 bg-gradient-to-r from-dark-300 to-dark-200 rounded-xl">
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1">
              {match.team_home_logo && !homeLogoError ? (
                <img
                  src={`${API_BASE_URL}/images/${match.team_home_logo}`}
                  alt={match.team_home}
                  className="w-16 h-16 object-contain rounded-full bg-white p-1 mb-2"
                  onError={() => setHomeLogoError(true)}
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-casino rounded-full flex items-center justify-center text-2xl mb-2">
                  🏠
                </div>
              )}
              <span className="font-bold text-white text-center text-sm">{match.team_home}</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4">
              <span className={`text-5xl font-bold ${homeScore > awayScore ? 'text-casino-gold' : 'text-white'}`}>
                {homeScore}
              </span>
              <span className="text-2xl text-gray-500">-</span>
              <span className={`text-5xl font-bold ${awayScore > homeScore ? 'text-casino-gold' : 'text-white'}`}>
                {awayScore}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1">
              {match.team_away_logo && !awayLogoError ? (
                <img
                  src={`${API_BASE_URL}/images/${match.team_away_logo}`}
                  alt={match.team_away}
                  className="w-16 h-16 object-contain rounded-full bg-white p-1 mb-2"
                  onError={() => setAwayLogoError(true)}
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-casino-blue to-casino-purple rounded-full flex items-center justify-center text-2xl mb-2">
                  ✈️
                </div>
              )}
              <span className="font-bold text-white text-center text-sm">{match.team_away}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
            <span>Réf: {match.reference}</span>
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {match.sport_type}
            </span>
          </div>
        </div>
      )
    }

    // CARD POUR MATCHS À VENIR (simplifié, sans scores)
    // Déterminer si le match approche (moins de 5 minutes)
    const isApproaching = minutesUntilStart < 5 && secondsUntilStart > 0
    const isUrgent = minutesUntilStart < 1 && secondsUntilStart > 0

    return (
      <div className={`card relative overflow-hidden border-2 transition-all cursor-pointer ${
        isUrgent ? 'border-red-500 animate-pulse' :
        isApproaching ? 'border-casino-gold' :
        'border-gray-700 hover:border-casino-purple'
      }`} onClick={openBetModal}>
        {/* Barre de progression */}
        {isApproaching && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-casino-gold to-transparent animate-pulse"></div>
        )}

        {/* Décompte GÉANT au centre */}
        <div className={`text-center py-6 mb-4 rounded-xl ${
          isUrgent ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500' :
          isApproaching ? 'bg-gradient-to-r from-casino-gold/20 to-yellow-600/20 border-2 border-casino-gold' :
          'bg-gradient-to-r from-casino-purple/20 to-casino-blue/20'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className={`w-6 h-6 ${isUrgent ? 'text-red-500' : isApproaching ? 'text-casino-gold' : 'text-casino-purple'}`} />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {isUrgent ? 'URGENT - Commence dans' :
               isApproaching ? 'Bientôt' :
               'Débute dans'}
            </span>
          </div>
          <div className={`text-5xl font-bold ${
            isUrgent ? 'text-red-500' :
            isApproaching ? 'text-casino-gold' :
            'text-white'
          }`}>
            {minutesUntilStart < 60 ? (
              <>
                <span>{Math.floor(secondsUntilStart / 60)}</span>
                <span className="text-2xl mx-1">:</span>
                <span>{String(secondsUntilStart % 60).padStart(2, '0')}</span>
              </>
            ) : (
              <>
                {Math.floor(minutesUntilStart / 60)}<span className="text-3xl">h</span>
                {minutesUntilStart % 60 > 0 && <>{minutesUntilStart % 60}<span className="text-2xl">m</span></>}
              </>
            )}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            {match.league && (
              <span className="text-xs px-2 py-1 bg-dark-300 text-gray-400 rounded">
                {match.league}
              </span>
            )}
          </div>
        </div>

        {/* Teams Horizontal */}
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1">
            {match.team_home_logo && !homeLogoError ? (
              <img
                src={`${API_BASE_URL}/images/${match.team_home_logo}`}
                alt={match.team_home}
                className="w-14 h-14 object-contain rounded-full bg-white p-1 mb-2"
                onError={() => setHomeLogoError(true)}
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-casino rounded-full flex items-center justify-center text-xl mb-2">
                🏠
              </div>
            )}
            <span className="font-bold text-white text-center text-sm line-clamp-2">{match.team_home}</span>
          </div>

          {/* VS Badge */}
          <div className="flex flex-col items-center px-3">
            <div className="px-4 py-2 bg-gradient-to-r from-casino-purple to-casino-blue rounded-full mb-1">
              <span className="text-sm font-bold text-white">VS</span>
            </div>
            {match.league && (
              <span className="text-xs text-gray-400 text-center">{match.league}</span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1">
            {match.team_away_logo && !awayLogoError ? (
              <img
                src={`${API_BASE_URL}/images/${match.team_away_logo}`}
                alt={match.team_away}
                className="w-14 h-14 object-contain rounded-full bg-white p-1 mb-2"
                onError={() => setAwayLogoError(true)}
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-casino-blue to-casino-purple rounded-full flex items-center justify-center text-xl mb-2">
                ✈️
              </div>
            )}
            <span className="font-bold text-white text-center text-sm line-clamp-2">{match.team_away}</span>
          </div>
        </div>

        {/* Bet Status */}
        {isBettingOpen ? (
          <div className={`mt-4 p-4 rounded-xl border-2 ${
            secondsUntilClosure < 30 ? 'bg-red-500/20 border-red-500 animate-pulse' :
            secondsUntilClosure < 60 ? 'bg-orange-500/20 border-orange-500' :
            'bg-casino-gold/10 border-casino-gold/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-bold flex items-center gap-2 ${
                secondsUntilClosure < 30 ? 'text-red-500' :
                secondsUntilClosure < 60 ? 'text-orange-500' :
                'text-casino-gold'
              }`}>
                <TrendingUp className="w-4 h-4" />
                {secondsUntilClosure < 30 ? '🚨 URGENT - Paris ferment !' :
                 secondsUntilClosure < 60 ? '⚠️ Dépêchez-vous !' :
                 'Parier maintenant'}
              </p>
              {secondsUntilClosure < 60 && (
                <span className={`text-lg font-bold ${
                  secondsUntilClosure < 30 ? 'text-red-500' : 'text-orange-500'
                }`}>
                  {secondsUntilClosure}s
                </span>
              )}
            </div>
            {secondsUntilClosure < 60 && (
              <div className="w-full bg-dark-300 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    secondsUntilClosure < 30 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${(secondsUntilClosure / 60) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-3 bg-gray-700/20 border border-gray-600 rounded-lg">
            <p className="text-gray-400 text-sm text-center flex items-center justify-center gap-2">
              <Timer className="w-4 h-4" />
              Paris fermés
            </p>
          </div>
        )}

        {/* Bouton Mes Paris */}
        {hasBets && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              openMyBetsModal(match)
            }}
            className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-green-400">
              Mes paris ({bets.length})
            </span>
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {match.sport_type}
          </span>
          <span>Réf: {match.reference}</span>
        </div>
      </div>
    )
  }, (prevProps, nextProps) => {
    // Custom comparison pour éviter les re-renders inutiles
    // On ne re-render que si le match change vraiment (score, statut)
    const prevMatch = prevProps.match
    const nextMatch = nextProps.match

    // Ne re-render que si ces propriétés changent
    const matchChanged = (
      prevMatch.id !== nextMatch.id ||
      prevMatch.score !== nextMatch.score ||
      prevMatch.status !== nextMatch.status ||
      prevMatch.score_home !== nextMatch.score_home ||
      prevMatch.score_away !== nextMatch.score_away ||
      JSON.stringify(prevMatch.match_events) !== JSON.stringify(nextMatch.match_events)
    )

    // Pour les matchs live, re-render chaque seconde pour mettre à jour le score en temps réel
    // Pour les autres matchs, re-render toutes les 10 secondes pour le countdown
    const isLive = nextProps.isLive
    const interval = isLive ? 1000 : 10000
    const prevSeconds = Math.floor(prevProps.currentTime / interval)
    const nextSeconds = Math.floor(nextProps.currentTime / interval)
    const timeChanged = prevSeconds !== nextSeconds

    // Retourner true = NE PAS re-render, false = re-render
    return !matchChanged && !timeChanged
  })

  MatchCard.displayName = 'MatchCard'

  // CARD POUR HISTORIQUE DES MATCHS
  const HistoryCard = memo(({ historyItem }) => {
    const { match, bets, summary, has_bets } = historyItem
    const [homeLogoError, setHomeLogoError] = useState(false)
    const [awayLogoError, setAwayLogoError] = useState(false)

    // Déterminer le résultat pour l'utilisateur
    const isWinner = has_bets && summary?.has_won
    const isLoser = has_bets && summary?.net_result < 0
    const noBets = !has_bets

    return (
      <div className={`card relative overflow-hidden border-2 ${
        isWinner ? 'border-green-500/50 bg-green-500/5' :
        isLoser ? 'border-red-500/50 bg-red-500/5' :
        noBets ? 'border-gray-700/50 bg-gray-800/20' :
        'border-gray-700'
      }`}>
        {/* Header avec résultat */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-dark-300 border border-gray-600 rounded-full text-gray-400 text-xs font-semibold">
              Terminé
            </span>
            {match.ends_at && (
              <span className="text-xs text-gray-500">
                {format(new Date(match.ends_at), 'dd MMM yyyy • HH:mm', { locale: fr })}
              </span>
            )}
          </div>
          {isWinner && (
            <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-xs font-bold">
              <Trophy className="w-3 h-3" />
              GAGNÉ
            </div>
          )}
          {isLoser && (
            <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-red-400 text-xs font-bold">
              <TrendingDown className="w-3 h-3" />
              PERDU
            </div>
          )}
          {noBets && (
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-600/20 border border-gray-600 rounded-full text-gray-400 text-xs font-bold">
              Aucun pari
            </div>
          )}
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-between gap-4 p-6 bg-gradient-to-r from-dark-300 to-dark-200 rounded-xl mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1">
            {match.team_home_logo && !homeLogoError ? (
              <img
                src={`${API_BASE_URL}/images/${match.team_home_logo}`}
                alt={match.team_home}
                className="w-14 h-14 object-contain rounded-full bg-white p-1 mb-2"
                onError={() => setHomeLogoError(true)}
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-casino rounded-full flex items-center justify-center text-xl mb-2">
                🏠
              </div>
            )}
            <span className="font-bold text-white text-center text-sm">{match.team_home}</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-2">
              <span className={`text-4xl font-bold ${match.score_home > match.score_away ? 'text-casino-gold' : 'text-white'}`}>
                {match.score_home}
              </span>
              <span className="text-2xl text-gray-500">-</span>
              <span className={`text-4xl font-bold ${match.score_away > match.score_home ? 'text-casino-gold' : 'text-white'}`}>
                {match.score_away}
              </span>
            </div>
            {match.result && (
              <span className="text-xs px-2 py-1 bg-dark-100 text-gray-400 rounded">
                {match.result === 'home_win' && 'Victoire Domicile'}
                {match.result === 'away_win' && 'Victoire Extérieur'}
                {match.result === 'draw' && 'Match Nul'}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1">
            {match.team_away_logo && !awayLogoError ? (
              <img
                src={`${API_BASE_URL}/images/${match.team_away_logo}`}
                alt={match.team_away}
                className="w-14 h-14 object-contain rounded-full bg-white p-1 mb-2"
                onError={() => setAwayLogoError(true)}
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-casino-blue to-casino-purple rounded-full flex items-center justify-center text-xl mb-2">
                ✈️
              </div>
            )}
            <span className="font-bold text-white text-center text-sm">{match.team_away}</span>
          </div>
        </div>

        {/* Bets Summary - Seulement si l'utilisateur a des paris */}
        {has_bets && summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dark-300 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-1">Misé</p>
            <p className="text-lg font-bold text-white">{summary.total_staked.toFixed(0)}</p>
            <p className="text-xs text-gray-500">FCFA</p>
          </div>
          <div className="bg-dark-300 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-1">Gagné</p>
            <p className="text-lg font-bold text-casino-gold">{summary.total_payout.toFixed(0)}</p>
            <p className="text-xs text-gray-500">FCFA</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            summary.net_result > 0 ? 'bg-green-500/20' :
            summary.net_result < 0 ? 'bg-red-500/20' :
            'bg-dark-300'
          }`}>
            <p className="text-xs text-gray-400 mb-1">Net</p>
            <p className={`text-lg font-bold ${
              summary.net_result > 0 ? 'text-green-400' :
              summary.net_result < 0 ? 'text-red-400' :
              'text-white'
            }`}>
              {summary.net_result > 0 ? '+' : ''}{summary.net_result.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">FCFA</p>
          </div>
        </div>
        )}

        {/* Bets Details - Seulement si l'utilisateur a des paris */}
        {has_bets && bets && bets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-300">
              Mes paris ({summary?.bets_count || bets.length})
            </h4>
          </div>
          {bets.map((bet) => (
            <div key={bet.id} className={`p-3 rounded-lg border ${
              bet.is_winner ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {bet.is_winner ? (
                    <Award className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-xs font-semibold text-white">
                    {bet.bet_type === 'result' && 'Résultat (1X2)'}
                    {bet.bet_type === 'both_teams_score' && 'Les 2 marquent'}
                    {bet.bet_type === 'over_under' && 'Plus/Moins'}
                  </span>
                </div>
                <span className={`text-xs font-bold ${bet.is_winner ? 'text-green-400' : 'text-red-400'}`}>
                  {bet.is_winner ? 'GAGNÉ' : 'PERDU'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="text-gray-400">
                  Choix: <span className="text-white font-semibold">
                    {bet.choice === 'home_win' && 'Victoire Domicile'}
                    {bet.choice === 'away_win' && 'Victoire Extérieur'}
                    {bet.choice === 'draw' && 'Match Nul'}
                    {bet.choice === 'yes' && 'Oui'}
                    {bet.choice === 'no' && 'Non'}
                  </span>
                </div>
                <div className="text-gray-400">
                  Mise: <span className="text-white font-semibold">{bet.amount.toFixed(0)} FCFA</span>
                </div>
                <div className="text-gray-400">
                  Cote: <span className="text-casino-gold font-semibold">{bet.multiplier}</span>
                </div>
                {bet.is_winner && (
                  <div className="text-gray-400">
                    Gain: <span className="text-green-400 font-bold">{bet.payout.toFixed(0)} FCFA</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <span>Réf: {match.reference}</span>
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {match.sport_type}
          </span>
        </div>
      </div>
    )
  })

  HistoryCard.displayName = 'HistoryCard'

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-r from-casino-purple/20 to-casino-blue/20 p-6 rounded-2xl border border-casino-purple/30">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-gaming font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-casino-gold" />
            Matchs Virtuels
          </h1>
          <button
            onClick={() => activeTab === 'history' ? loadHistory(true) : loadMatches(true)}
            disabled={isRefreshing || isLoadingHistory}
            className="btn-secondary px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(isRefreshing || isLoadingHistory) ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
        <p className="text-gray-300">
          Paris en direct sur des matchs de football simulés • Résultats instantanés
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-300 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'live'
              ? 'bg-gradient-to-r from-casino-red to-red-600 text-white shadow-lg shadow-casino-red/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <CircleDot className="w-4 h-4" />
            <span className="hidden sm:inline">En direct</span>
            <span className="sm:hidden">Live</span>
            {liveMatches.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{liveMatches.length}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-gradient-to-r from-casino-purple to-casino-blue text-white shadow-lg shadow-casino-purple/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">À venir</span>
            <span className="sm:hidden">Bientôt</span>
            {upcomingMatches.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{upcomingMatches.length}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-casino-gold to-yellow-600 text-dark-100 shadow-lg shadow-casino-gold/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <History className="w-4 h-4" />
            Historique
            {historyMatches.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{historyMatches.length}</span>
            )}
          </span>
        </button>
      </div>

      {/* Matches */}
      <AnimatePresence mode="wait">
        {activeTab === 'live' && (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {liveMatches.length > 0 ? (
              liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} isLive currentTime={currentTime} />
              ))
            ) : (
              <div className="col-span-full card text-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-4"
                >
                  <Trophy className="w-full h-full text-gray-600" />
                </motion.div>
                <p className="text-gray-400 text-lg">Aucun match en direct pour le moment</p>
                <p className="text-gray-500 text-sm mt-2">Les matchs à venir commenceront bientôt</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'upcoming' && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} currentTime={currentTime} />
              ))
            ) : (
              <div className="col-span-full card text-center py-16">
                <Clock className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Aucun match à venir</p>
                <p className="text-gray-500 text-sm mt-2">Revenez plus tard pour de nouveaux matchs</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Filtres et Recherche */}
            <div className="card">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Filtres */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      historyFilter === 'all'
                        ? 'bg-gradient-to-r from-casino-gold to-yellow-600 text-dark-100 shadow-lg'
                        : 'bg-dark-300 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Filter className="w-4 h-4 inline mr-2" />
                    Tous les matchs
                  </button>
                  <button
                    onClick={() => setHistoryFilter('my_bets')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      historyFilter === 'my_bets'
                        ? 'bg-gradient-to-r from-casino-purple to-casino-blue text-white shadow-lg'
                        : 'bg-dark-300 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Trophy className="w-4 h-4 inline mr-2" />
                    Mes paris
                  </button>
                </div>

                {/* Recherche */}
                <div className="relative w-full md:w-auto md:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par équipe ou référence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-300 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-casino-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Liste des matchs */}
            {isLoadingHistory ? (
              <div className="col-span-full card text-center py-16">
                <RefreshCw className="w-20 h-20 text-casino-gold mx-auto mb-4 animate-spin" />
                <p className="text-gray-400 text-lg">Chargement de l'historique...</p>
              </div>
            ) : historyMatches.length > 0 ? (
              <>
                {historyMatches.map((historyItem) => (
                  <HistoryCard key={historyItem.match.id} historyItem={historyItem} />
                ))}

                {/* Pagination */}
                {historyMeta && historyMeta.last_page > 1 && (
                  <div className="card flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Page {historyMeta.current_page} sur {historyMeta.last_page}
                      <span className="ml-2">({historyMeta.total} matchs)</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadHistory(false, historyPage - 1)}
                        disabled={historyPage === 1 || isLoadingHistory}
                        className="px-4 py-2 bg-dark-300 text-white rounded-lg font-semibold text-sm hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => loadHistory(false, historyPage + 1)}
                        disabled={historyPage === historyMeta.last_page || isLoadingHistory}
                        className="px-4 py-2 bg-dark-300 text-white rounded-lg font-semibold text-sm hover:bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full card text-center py-16">
                <History className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Aucun résultat</p>
                <p className="text-gray-500 text-sm mt-2">
                  {searchQuery
                    ? `Aucun match trouvé pour "${searchQuery}"`
                    : historyFilter === 'my_bets'
                      ? 'Vous n\'avez parié sur aucun match'
                      : 'Aucun match terminé pour le moment'
                  }
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet Modal */}
      {showBetModal && selectedMatch && (
        <BetModal
          match={selectedMatch}
          onClose={() => {
            setShowBetModal(false)
            setBetToEdit(null) // Reset le bet à éditer
          }}
          onPlaceBet={handlePlaceBet}
          refreshBalance={refreshBalance}
          betToEdit={betToEdit} // Passer le bet à éditer
        />
      )}

      {/* Modal Mes Paris Existants */}
      {showMyBetsModal && selectedMatchForBets && (
        <MyBetsModal
          match={selectedMatchForBets}
          bets={matchBets[selectedMatchForBets.id] || []}
          onClose={() => setShowMyBetsModal(false)}
          onDelete={async (betId) => {
            try {
              await virtualMatchService.deleteBet(betId)
              toast.success('Pari annulé et remboursé !')
              await refreshBalance()
              await loadMatchBets(selectedMatchForBets.id)
            } catch (error) {
              toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation')
            }
          }}
          onEdit={(bet) => {
            // Fermer ce modal et ouvrir le modal de pari avec le bet pré-chargé
            setShowMyBetsModal(false)
            setBetToEdit(bet) // Stocker le bet à éditer
            setSelectedMatch(selectedMatchForBets)
            setShowBetModal(true)
          }}
        />
      )}
    </div>
  )
}

// MODAL MES PARIS EXISTANTS - Compact et simple
const MyBetsModal = memo(({ match, bets, onClose, onDelete, onEdit }) => {
  const getMarketLabel = (betType) => {
    const labels = {
      result: 'Résultat',
      both_teams_score: 'Les deux équipes marquent',
      over_under: 'Plus/Moins',
      exact_score: 'Score exact',
      double_chance: 'Double chance',
      first_half: 'Mi-temps',
      handicap: 'Handicap'
    }
    return labels[betType] || betType
  }

  const getChoiceLabel = (choice) => {
    if (choice === 'home_win') return 'Victoire Domicile'
    if (choice === 'away_win') return 'Victoire Extérieur'
    if (choice === 'draw') return 'Match Nul'
    if (choice === 'yes') return 'Oui'
    if (choice === 'no') return 'Non'
    return choice
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gradient-to-b from-dark-100 to-dark-200 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border-2 border-green-500/30 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mes paris actifs
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Match Info */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
            <span className="font-semibold">{match.team_home}</span>
            <span className="text-green-400">vs</span>
            <span className="font-semibold">{match.team_away}</span>
          </div>
        </div>

        {/* Liste des paris */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Aucun pari sur ce match</p>
            </div>
          ) : (
            bets.map((bet) => (
              <div key={bet.id} className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-green-400 mb-1">{getMarketLabel(bet.bet_type)}</p>
                    <p className="text-base font-bold text-white">{getChoiceLabel(bet.choice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">{bet.amount} F</p>
                    <p className="text-xs text-gray-500">×{bet.multiplier.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-green-500/20">
                  <div>
                    <p className="text-xs text-gray-400">Gain potentiel</p>
                    <p className="text-sm font-bold text-green-400">{bet.potential_win.toFixed(0)} F</p>
                  </div>

                  {match.is_open_for_bets && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(bet)}
                        className="px-3 py-1.5 bg-casino-blue/20 hover:bg-casino-blue/30 text-casino-blue text-xs font-semibold rounded transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier
                      </button>
                      <button
                        onClick={() => onDelete(bet.id)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {match.is_open_for_bets && (
          <div className="flex-shrink-0 border-t border-green-500/20 p-4 bg-dark-100">
            <p className="text-xs text-center text-gray-400">
              💡 Vous pouvez placer plusieurs paris sur ce match
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

MyBetsModal.displayName = 'MyBetsModal'

// MODAL DE PARIS - Système de coupon avec sélection multiple
const BetModal = memo(({ match, onClose, onPlaceBet, refreshBalance, betToEdit }) => {
  const [betAmount, setBetAmount] = useState(match.min_bet_amount || 500)
  const [coupon, setCoupon] = useState([]) // Liste des paris sélectionnés
  const [expandedMarket, setExpandedMarket] = useState('result') // Marché ouvert par défaut
  const [activeView, setActiveView] = useState('markets') // 'markets' ou 'coupon' pour mobile
  const [existingBets, setExistingBets] = useState([]) // Paris existants de l'utilisateur
  const [isLoadingBets, setIsLoadingBets] = useState(true)

  console.log('🎰 [BetModal] Render', { matchId: match.id, coupon, existingBets, betToEdit, odds: match.odds })

  const isBettingOpen = match.is_open_for_bets

  // Charger les paris existants de l'utilisateur pour ce match
  useEffect(() => {
    const loadExistingBets = async () => {
      try {
        setIsLoadingBets(true)
        const response = await virtualMatchService.getMatchBets(match.id)
        setExistingBets(response.data || [])
      } catch (error) {
        console.error('❌ [BetModal] Erreur chargement paris:', error)
        // Pas de toast d'erreur si l'utilisateur n'est pas connecté
        if (error.response?.status !== 401) {
          toast.error('Erreur lors du chargement de vos paris')
        }
      } finally {
        setIsLoadingBets(false)
      }
    }

    loadExistingBets()
  }, [match.id])

  // Pré-remplir le coupon si on édite un pari existant
  useEffect(() => {
    if (betToEdit) {
      console.log('📝 [BetModal] Chargement pari à éditer:', betToEdit)

      // Définir le montant
      setBetAmount(betToEdit.amount)

      // Définir le marché à ouvrir
      setExpandedMarket(betToEdit.bet_type)

      // Créer l'objet de sélection pour le coupon
      const selection = {
        id: `${betToEdit.bet_type}:${betToEdit.choice}`,
        market: betToEdit.bet_type,
        choice: betToEdit.choice,
        label: betToEdit.choice === 'home_win' ? 'Victoire Domicile' :
               betToEdit.choice === 'away_win' ? 'Victoire Extérieur' :
               betToEdit.choice === 'draw' ? 'Match Nul' :
               betToEdit.choice === 'yes' ? 'Oui' :
               betToEdit.choice === 'no' ? 'Non' : betToEdit.choice,
        description: getMarketLabel(betToEdit.bet_type),
        odd: betToEdit.multiplier
      }

      setCoupon([selection])

      // Basculer sur la vue coupon sur mobile
      setActiveView('coupon')

      toast('✏️ Modifiez votre pari et validez')
    }
  }, [betToEdit])

  // Ajouter/retirer un pari du coupon
  const toggleSelection = (marketKey, choiceKey, option) => {
    const selectionId = `${marketKey}:${choiceKey}`
    const existingIndex = coupon.findIndex(item => item.id === selectionId)

    if (existingIndex >= 0) {
      // Retirer la sélection
      setCoupon(coupon.filter((_, i) => i !== existingIndex))
    } else {
      // Ajouter la sélection
      setCoupon([...coupon, {
        id: selectionId,
        market: marketKey,
        choice: choiceKey,
        label: option.label,
        description: option.description,
        odd: option.odd
      }])
    }
  }

  const isSelected = (marketKey, choiceKey) => {
    return coupon.some(item => item.id === `${marketKey}:${choiceKey}`)
  }

  // Calculer la cote totale (multiplication des cotes)
  const totalOdd = coupon.length > 0
    ? coupon.reduce((acc, item) => acc * item.odd, 1)
    : 1

  const potentialWin = betAmount * totalOdd

  const placeBet = async () => {
    if (coupon.length === 0) {
      toast.error('Sélectionnez au moins un pari')
      return
    }

    console.log('💰 [BetModal] Placement coupon:', { matchId: match.id, coupon, betAmount, betToEdit })

    try {
      // Si on modifie un pari existant, le supprimer d'abord
      if (betToEdit) {
        console.log('🗑️ [BetModal] Suppression ancien pari avant modification')
        await virtualMatchService.deleteBet(betToEdit.id)
      }

      // Placer le nouveau pari
      const firstBet = coupon[0]
      await onPlaceBet(match.id, firstBet.choice, firstBet.market, betAmount)

      // Recharger les paris existants après placement
      const response = await virtualMatchService.getMatchBets(match.id)
      setExistingBets(response.data || [])
      setCoupon([]) // Vider le coupon après placement

      if (betToEdit) {
        toast.success('✏️ Pari modifié avec succès !')
        onClose() // Fermer le modal après modification
      } else {
        toast.success('Nouveau pari placé ! Vous pouvez en placer un autre.')
      }

      // Rafraîchir le solde du wallet
      if (refreshBalance) {
        await refreshBalance()
      }
    } catch (error) {
      console.error('❌ [BetModal] Erreur placement/modification pari:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de l\'opération')
    }
  }

  // Supprimer un pari existant
  const deleteBet = async (betId) => {
    try {
      await virtualMatchService.deleteBet(betId)
      toast.success('Pari annulé et remboursé !')

      // Recharger les paris existants
      const response = await virtualMatchService.getMatchBets(match.id)
      setExistingBets(response.data || [])

      // Rafraîchir le solde du wallet
      if (refreshBalance) {
        await refreshBalance()
      }
    } catch (error) {
      console.error('❌ [BetModal] Erreur suppression pari:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation du pari')
    }
  }

  // Labels des marchés
  const getMarketLabel = (marketKey) => {
    const labels = {
      'result': '🎯 Résultat du match (1X2)',
      'both_teams_score': '⚽ Les deux équipes marquent',
      'over_under': '📊 Plus/Moins de buts',
      'double_chance': '🔀 Double Chance',
      'exact_score': '🎲 Score Exact',
      'first_half': '⏱️ Résultat Mi-temps',
      'handicap': '⚖️ Handicap'
    }
    return labels[marketKey] || marketKey
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-gradient-to-b from-dark-100 to-dark-200 rounded-none sm:rounded-2xl w-full max-w-full sm:max-w-6xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden border-0 sm:border-2 border-casino-purple/30 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header - STICKY */}
        <div className="flex-shrink-0 bg-gradient-to-r from-casino-purple/20 to-casino-blue/20 border-b border-casino-purple/30 p-3 sm:p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-xl font-bold text-white truncate">🎰 Composer votre coupon</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg flex-shrink-0 ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Match Info Compact */}
          <div className="flex items-center gap-2 sm:gap-3 bg-dark-300/50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
              {match.team_home_logo ? (
                <img src={`${API_BASE_URL}/images/${match.team_home_logo}`} alt={match.team_home} className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded-full bg-white p-0.5 sm:p-1 flex-shrink-0" />
              ) : <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-casino rounded-full flex items-center justify-center text-xs flex-shrink-0">🏠</div>}
              <span className="text-xs sm:text-sm font-semibold text-white truncate">{match.team_home}</span>
            </div>
            <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-casino-purple to-casino-blue rounded flex-shrink-0">
              <span className="text-xs font-bold text-white">VS</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-white truncate">{match.team_away}</span>
              {match.team_away_logo ? (
                <img src={`${API_BASE_URL}/images/${match.team_away_logo}`} alt={match.team_away} className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded-full bg-white p-0.5 sm:p-1 flex-shrink-0" />
              ) : <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-casino-blue to-casino-purple rounded-full flex items-center justify-center text-xs flex-shrink-0">✈️</div>}
            </div>
          </div>
        </div>

        {/* Betting Closure Warning */}
        {!isBettingOpen && (
          <div className="p-4 sm:p-6">
            <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-xs sm:text-sm font-semibold text-center">⚠️ Paris fermés pour ce match</p>
            </div>
          </div>
        )}

        {/* Mobile Tabs - STICKY */}
        {isBettingOpen && (
          <div className="lg:hidden flex-shrink-0 flex gap-1 bg-dark-300 p-1 mx-3 mt-2 rounded-lg sticky top-[130px] z-10">
            <button
              onClick={() => setActiveView('markets')}
              className={`flex-1 py-2.5 px-3 rounded-md font-semibold text-xs transition-all ${
                activeView === 'markets'
                  ? 'bg-gradient-to-r from-casino-purple to-casino-blue text-white shadow-lg'
                  : 'text-gray-400'
              }`}
            >
              📊 Marchés
            </button>
            <button
              onClick={() => setActiveView('coupon')}
              className={`flex-1 py-2.5 px-3 rounded-md font-semibold text-xs transition-all relative ${
                activeView === 'coupon'
                  ? 'bg-gradient-to-r from-casino-gold to-yellow-600 text-dark-100 shadow-lg'
                  : 'text-gray-400'
              }`}
            >
              🎫 Coupon
              {(coupon.length > 0 || existingBets.length > 0) && (
                <span className="absolute -top-1 -right-1 bg-casino-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {coupon.length + existingBets.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Content - SCROLLABLE */}
        {isBettingOpen && (
          <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 lg:p-4 overflow-hidden min-h-0">
            {/* LEFT: Markets List - MOBILE: vue conditionnelle, DESKTOP: toujours visible */}
            <div className={`flex-1 lg:flex-initial lg:flex-[1] flex flex-col overflow-hidden ${
              activeView === 'markets' ? 'flex' : 'hidden lg:flex'
            }`}>
              <div className="overflow-y-auto overscroll-contain flex-1 space-y-2 p-3 lg:pr-2 pb-24 lg:pb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 sticky top-0 bg-dark-100 py-2 z-[5] hidden lg:block">Sélectionnez vos paris</h3>

                {match.odds && Object.entries(match.odds).map(([marketKey, options]) => {
                  const isExpanded = expandedMarket === marketKey
                  const hasOptions = Object.keys(options).length > 0

                  return (
                    <div key={marketKey} className="bg-dark-300/50 rounded-lg border border-gray-700 overflow-hidden">
                      {/* Market Header - Accordion Toggle */}
                      <button
                        onClick={() => setExpandedMarket(isExpanded ? null : marketKey)}
                        className="w-full p-3 flex items-center justify-between hover:bg-dark-300 transition-colors active:bg-dark-200"
                      >
                        <span className="text-sm font-semibold text-white text-left">{getMarketLabel(marketKey)}</span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Market Options - Collapsible */}
                      {isExpanded && hasOptions && (
                        <div className="p-2 space-y-2 border-t border-gray-700">
                          {Object.entries(options).map(([choiceKey, option]) => {
                            const selected = isSelected(marketKey, choiceKey)

                            return (
                              <button
                                key={choiceKey}
                                onClick={() => {
                                  toggleSelection(marketKey, choiceKey, option)
                                  // Sur mobile, basculer vers le coupon après sélection
                                  if (window.innerWidth < 1024) {
                                    setTimeout(() => setActiveView('coupon'), 150)
                                  }
                                }}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left active:scale-[0.98] ${
                                  selected
                                    ? 'border-casino-gold bg-casino-gold/20 shadow-lg'
                                    : 'border-gray-700 bg-dark-300/30 hover:border-gray-600 hover:bg-dark-300/60 active:bg-dark-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className={`font-semibold text-sm flex-1 ${selected ? 'text-white' : 'text-gray-300'}`}>
                                    {option.label}
                                  </span>
                                  <span className={`font-bold text-lg ${selected ? 'text-casino-gold' : 'text-gray-400'}`}>
                                    {option.odd?.toFixed(2)}
                                  </span>
                                </div>
                                {option.description && (
                                  <p className={`text-xs ${selected ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {option.description}
                                  </p>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {isExpanded && !hasOptions && (
                        <div className="p-4 text-center text-gray-500 text-xs">
                          Aucune option configurée
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT: Coupon Panel - Résumé en haut, liste scrollable en bas */}
            <div className={`flex-1 lg:flex-initial lg:w-96 flex flex-col bg-dark-300/30 rounded-none lg:rounded-lg border-0 lg:border-2 border-casino-gold/30 overflow-hidden ${
              activeView === 'coupon' ? 'flex' : 'hidden lg:flex'
            }`}>
              {/* Coupon Header - FIXE */}
              <div className="shrink-0 p-3 border-b border-gray-700 flex items-center justify-between bg-dark-100">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  🎫 Mon Coupon
                  {coupon.length > 0 && (
                    <span className="text-xs bg-casino-gold text-dark-100 px-2 py-0.5 rounded-full font-bold">
                      {coupon.length}
                    </span>
                  )}
                </h3>
                {/* Bouton retour sur mobile */}
                <button
                  onClick={() => setActiveView('markets')}
                  className="lg:hidden text-gray-400 hover:text-white text-xs flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition-colors active:bg-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour
                </button>
              </div>

              {coupon.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="bg-dark-300/50 rounded-lg p-8 text-center max-w-xs">
                    <div className="text-5xl mb-3">🎰</div>
                    <p className="text-sm font-semibold text-gray-300 mb-1">Coupon vide</p>
                    <p className="text-xs text-gray-500">Sélectionnez des paris dans les marchés pour commencer</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Section RÉSUMÉ + ACTION - TOUJOURS VISIBLE EN HAUT */}
                  <div className="shrink-0 bg-dark-100 border-b-2 border-gray-700">
                    <div className="p-3 space-y-2.5">
                      {/* Montant de la mise */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                          💵 Mise
                        </label>
                        <input
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(Math.max(match.min_bet_amount || 0, Math.min(match.max_bet_amount || 100000, parseInt(e.target.value) || 0)))}
                          className="w-full px-3 py-3 bg-dark-300 border-2 border-gray-700 rounded-lg text-white text-center font-bold text-xl focus:border-casino-gold focus:outline-none transition-colors"
                          min={match.min_bet_amount}
                          max={match.max_bet_amount}
                        />
                      </div>

                      {/* Résumé compact en grille */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-casino-purple/10 border border-casino-purple/30 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-gray-400 mb-0.5">Cote</p>
                          <p className="text-lg font-bold text-casino-purple">{totalOdd.toFixed(2)}×</p>
                        </div>
                        <div className="bg-casino-gold/10 border border-casino-gold/30 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-gray-400 mb-0.5">Gain</p>
                          <p className="text-lg font-bold text-casino-gold">{potentialWin.toFixed(0)} F</p>
                        </div>
                      </div>

                      {/* Bouton VALIDER - EN HAUT */}
                      <button
                        onClick={placeBet}
                        className="w-full bg-gradient-to-r from-casino-gold via-yellow-500 to-casino-gold text-dark-100 py-3.5 rounded-lg text-base font-bold shadow-lg shadow-casino-gold/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {betToEdit ? '✏️ Confirmer la modification' : 'Valider le coupon'}
                      </button>
                    </div>
                  </div>

                  {/* Liste des paris - SCROLLABLE */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="p-3 pb-24">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Vos sélections</h4>
                        <button
                          onClick={() => setCoupon([])}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 px-2 py-1 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Vider
                        </button>
                      </div>

                      <div className="space-y-2">
                        {coupon.map((item, index) => (
                          <div key={item.id} className="bg-dark-300 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                                  <span className="inline-block w-1 h-1 rounded-full bg-casino-gold"></span>
                                  {getMarketLabel(item.market)}
                                </p>
                                <p className="text-sm font-bold text-white">{item.label}</p>
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="bg-casino-gold/20 px-2.5 py-1 rounded-md">
                                  <span className="text-sm font-bold text-casino-gold">{item.odd.toFixed(2)}</span>
                                </div>
                                <button
                                  onClick={() => setCoupon(coupon.filter((_, i) => i !== index))}
                                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-colors"
                                  title="Retirer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Séparateur si on a des paris existants */}
                      {!isLoadingBets && existingBets.length > 0 && (
                        <div className="relative py-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-dark-100 px-3 text-xs font-semibold text-gray-400 uppercase">Paris déjà placés</span>
                          </div>
                        </div>
                      )}

                      {/* Section Paris Existants - Intégrée dans le coupon */}
                      {!isLoadingBets && existingBets.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1 mb-2">
                            <h4 className="text-xs font-bold text-green-400 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {existingBets.length} pari{existingBets.length > 1 ? 's' : ''} actif{existingBets.length > 1 ? 's' : ''}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {isBettingOpen ? '✏️ Modifiables' : '🔒 Fermés'}
                            </span>
                          </div>

                          {existingBets.map((bet) => (
                            <div key={bet.id} className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-lg p-3 border border-green-500/20">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-green-400 mb-0.5 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-green-400"></span>
                                    {getMarketLabel(bet.bet_type)}
                                  </p>
                                  <p className="text-sm font-bold text-white">
                                    {bet.choice === 'home_win' && 'Victoire Domicile'}
                                    {bet.choice === 'away_win' && 'Victoire Extérieur'}
                                    {bet.choice === 'draw' && 'Match Nul'}
                                    {bet.choice === 'yes' && 'Oui'}
                                    {bet.choice === 'no' && 'Non'}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-sm font-bold text-green-400">{bet.amount} F</span>
                                  <span className="text-xs text-gray-500">×{bet.multiplier.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
                                <span className="text-xs text-gray-400">
                                  Gain: <span className="text-green-400 font-bold">{bet.potential_win.toFixed(0)} F</span>
                                </span>

                                {isBettingOpen && (
                                  <button
                                    onClick={() => deleteBet(bet.id)}
                                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                                    title="Annuler"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Annuler
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {isBettingOpen && (
                            <div className="text-xs text-center text-gray-500 mt-3 pt-3 border-t border-gray-700/50 space-y-1">
                              <p>💡 Vous pouvez placer plusieurs paris sur ce match</p>
                              <p className="text-gray-600">✏️ Pour modifier un pari, fermez ce modal et cliquez sur "Mes paris"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

BetModal.displayName = 'BetModal'
