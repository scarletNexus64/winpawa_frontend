import { useEffect } from 'react'
import { Trophy, X } from 'lucide-react'
import { gameService } from '../services/gameService'
import { useGameStore } from '../store/gameStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function History() {
  const { gameHistory, setGameHistory } = useGameStore()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await gameService.getHistory()
      setGameHistory(data.bets || [])
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique')
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-gaming font-bold text-white">Historique des paris</h1>

      {gameHistory.length > 0 ? (
        <div className="space-y-3">
          {gameHistory.map((bet) => (
            <div
              key={bet.id}
              className={`card ${
                bet.is_winner
                  ? 'border-casino-green bg-casino-green/5'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {bet.is_winner ? (
                      <Trophy className="w-5 h-5 text-casino-gold" />
                    ) : (
                      <X className="w-5 h-5 text-casino-red" />
                    )}
                    <h3 className="font-bold text-white">{bet.game?.name}</h3>
                    <span className={`badge ${bet.is_winner ? 'badge-gold' : 'badge-red'}`}>
                      {bet.is_winner ? 'Gagné' : 'Perdu'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Mise</p>
                      <p className="font-semibold text-white">{formatAmount(bet.amount)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Multiplicateur</p>
                      <p className="font-semibold text-casino-purple">{bet.multiplier}x</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Gain</p>
                      <p className={`font-semibold ${bet.is_winner ? 'text-casino-gold' : 'text-gray-500'}`}>
                        {formatAmount(bet.payout)} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Date</p>
                      <p className="font-semibold text-white text-sm">
                        {format(new Date(bet.created_at), 'dd MMM HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {bet.reference && (
                    <p className="text-xs text-gray-500 mt-2">Réf: {bet.reference}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Aucun historique</p>
          <p className="text-gray-500">Vos paris apparaîtront ici</p>
        </div>
      )}
    </div>
  )
}
