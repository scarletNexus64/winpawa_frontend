import React from 'react'
import { useVirtualMatches } from '../hooks/useVirtualMatches'

/**
 * Composant de démonstration pour tester les matchs virtuels
 * Utilisez ce composant pour vérifier que l'API fonctionne correctement
 */
const VirtualMatchDemo = () => {
  const {
    upcomingMatches,
    liveMatches,
    results,
    loading,
    error,
    fetchAllMatches,
  } = useVirtualMatches({ autoRefresh: true, refreshInterval: 30000 })

  if (loading && upcomingMatches.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des matchs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Erreur</p>
          <p>{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Virtual Matches - Démo
          </h1>
          <button
            onClick={fetchAllMatches}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Actualiser
          </button>
        </div>

        {/* Matchs en live */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="animate-pulse inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              En Direct ({liveMatches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} isLive />
              ))}
            </div>
          </section>
        )}

        {/* Matchs à venir */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            À Venir ({upcomingMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMatches.slice(0, 6).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>

        {/* Résultats */}
        {results.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Résultats Récents ({results.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.slice(0, 6).map((match) => (
                <MatchCard key={match.id} match={match} isResult />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// Composant de carte de match
const MatchCard = ({ match, isLive = false, isResult = false }) => {
  const getCountdownText = (seconds) => {
    if (seconds <= 0) return 'Commence bientôt'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 1) return `${seconds}s`
    return `${minutes}min`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold text-gray-500 uppercase">
          {match.sport_type}
        </span>
        {isLive && (
          <span className="text-xs font-bold text-red-600 flex items-center">
            <span className="animate-pulse inline-block w-2 h-2 bg-red-600 rounded-full mr-1"></span>
            LIVE
          </span>
        )}
        {!isLive && !isResult && (
          <span className="text-xs font-semibold text-blue-600">
            {getCountdownText(match.countdown)}
          </span>
        )}
        <span className="text-xs text-gray-500">{match.duration} min</span>
      </div>

      {/* Équipes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">{match.team_home}</span>
          <span className="text-2xl font-bold text-gray-900">
            {isResult || isLive ? match.score.split(' - ')[0] : '-'}
          </span>
        </div>
        <div className="border-t border-gray-200"></div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">{match.team_away}</span>
          <span className="text-2xl font-bold text-gray-900">
            {isResult || isLive ? match.score.split(' - ')[1] : '-'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>{match.reference}</span>
          {match.is_open_for_bets && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
              Paris ouverts
            </span>
          )}
          {isResult && (
            <span className="text-gray-500">
              {match.status_label}
            </span>
          )}
        </div>
      </div>

      {/* Cotes */}
      {!isResult && match.multipliers && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-600">1</div>
            <div className="text-sm font-bold text-gray-900">
              {match.multipliers.home_win}
            </div>
          </div>
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-600">X</div>
            <div className="text-sm font-bold text-gray-900">
              {match.multipliers.draw}
            </div>
          </div>
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-600">2</div>
            <div className="text-sm font-bold text-gray-900">
              {match.multipliers.away_win}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VirtualMatchDemo
