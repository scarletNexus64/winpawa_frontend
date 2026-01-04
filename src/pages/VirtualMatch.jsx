import { useEffect, useState } from 'react'
import { Trophy, Clock, TrendingUp } from 'lucide-react'
import { virtualMatchService } from '../services/virtualMatchService'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function VirtualMatch() {
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    loadMatches()
    const interval = setInterval(loadMatches, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadMatches = async () => {
    try {
      const [upcoming, live] = await Promise.all([
        virtualMatchService.getUpcoming(),
        virtualMatchService.getLive(),
      ])
      setUpcomingMatches(upcoming.matches || [])
      setLiveMatches(live.matches || [])
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const handlePlaceBet = async (matchId, betType) => {
    try {
      const betAmount = 500 // Default bet amount
      await virtualMatchService.placeBet(matchId, {
        amount: betAmount,
        bet_type: betType,
      })
      toast.success('Pari placé avec succès !')
      loadMatches()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du pari')
    }
  }

  const getOdds = (betType) => {
    const odds = {
      home_win: 2.5,
      away_win: 2.8,
      draw: 3.2,
    }
    return odds[betType] || 2.0
  }

  const MatchCard = ({ match, isLive = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${isLive ? 'border-casino-red animate-pulse-slow' : ''}`}
    >
      {/* Match Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 badge badge-red animate-pulse">
              <span className="w-2 h-2 bg-casino-red rounded-full"></span>
              LIVE
            </span>
          )}
          <span className="text-sm text-gray-400">
            {format(new Date(match.start_time), 'HH:mm', { locale: fr })}
          </span>
        </div>
        <span className="badge badge-purple">
          <Clock className="w-3 h-3 mr-1" />
          {match.duration}min
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-dark-300 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-casino rounded-lg flex items-center justify-center">
              <span className="text-xl">🏠</span>
            </div>
            <span className="font-semibold text-white">{match.home_team}</span>
          </div>
          {isLive && match.home_score !== null && (
            <span className="text-2xl font-bold text-white">{match.home_score}</span>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-dark-300 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-casino-blue to-casino-purple rounded-lg flex items-center justify-center">
              <span className="text-xl">✈️</span>
            </div>
            <span className="font-semibold text-white">{match.away_team}</span>
          </div>
          {isLive && match.away_score !== null && (
            <span className="text-2xl font-bold text-white">{match.away_score}</span>
          )}
        </div>
      </div>

      {/* Betting Options */}
      {!isLive && match.status === 'upcoming' && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handlePlaceBet(match.id, 'home_win')}
            className="btn-secondary text-xs py-3"
          >
            <div className="font-bold">1</div>
            <div className="text-casino-gold">{getOdds('home_win')}x</div>
          </button>
          <button
            onClick={() => handlePlaceBet(match.id, 'draw')}
            className="btn-secondary text-xs py-3"
          >
            <div className="font-bold">X</div>
            <div className="text-casino-gold">{getOdds('draw')}x</div>
          </button>
          <button
            onClick={() => handlePlaceBet(match.id, 'away_win')}
            className="btn-secondary text-xs py-3"
          >
            <div className="font-bold">2</div>
            <div className="text-casino-gold">{getOdds('away_win')}x</div>
          </button>
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-gaming font-bold text-white mb-2">
          Match Virtuel
        </h1>
        <p className="text-gray-400">
          Pariez sur des matchs de football virtuels en temps réel
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 px-4 font-semibold transition-colors ${
            activeTab === 'live'
              ? 'text-casino-red border-b-2 border-casino-red'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            En direct
            {liveMatches.length > 0 && (
              <span className="badge badge-red">{liveMatches.length}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 font-semibold transition-colors ${
            activeTab === 'upcoming'
              ? 'text-casino-purple border-b-2 border-casino-purple'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            À venir
            {upcomingMatches.length > 0 && (
              <span className="badge badge-purple">{upcomingMatches.length}</span>
            )}
          </span>
        </button>
      </div>

      {/* Matches */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveMatches.length > 0 ? (
            liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} isLive />
            ))
          ) : (
            <div className="col-span-2 card text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun match en direct</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
            <div className="col-span-2 card text-center py-12">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun match à venir</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
