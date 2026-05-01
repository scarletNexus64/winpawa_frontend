import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * NOMBRE CHANCEUX Game Component
 *
 * Configuration backend:
 * - Type: lucky_number
 * - RTP: 77.5%
 * - Win Frequency: 20%
 * - Multiplicateurs: [2, 3]
 * - Settings: range_min (1), range_max (10)
 */
export default function LuckyNumber({ game, onBet, isPlaying }) {
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [drawnNumber, setDrawnNumber] = useState(null)
  const [showDrawnNumber, setShowDrawnNumber] = useState(false)
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Récupérer la plage de nombres depuis les settings du jeu
  const rangeMin = game.settings?.range_min || 1
  const rangeMax = game.settings?.range_max || 10

  // Générer les nombres disponibles
  const numbers = Array.from({ length: rangeMax - rangeMin + 1 }, (_, i) => rangeMin + i)

  /**
   * Gérer la sélection du nombre par le joueur
   */
  const handleNumberSelect = (number) => {
    if (isAnimating || isPlaying) return
    playClickSound()
    setSelectedNumber(number)
  }

  /**
   * Animation du tirage du nombre
   */
  const animateNumberDraw = async (finalNumber) => {
    setIsAnimating(true)
    setShowDrawnNumber(false)
    setDrawnNumber(null)

    const animationDuration = 3000 // 3 secondes
    const changeSpeed = 100 // Changement toutes les 100ms

    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += changeSpeed

      // Changer aléatoirement le nombre affiché
      if (elapsed < animationDuration * 0.8) {
        const randomNumber = numbers[Math.floor(Math.random() * numbers.length)]
        setDrawnNumber(randomNumber)
        setShowDrawnNumber(true)
      } else {
        // Derniers 20%, stabiliser sur le résultat final
        setDrawnNumber(parseInt(finalNumber))
        setShowDrawnNumber(true)
      }
    }, changeSpeed)

    // Arrêter l'animation et afficher le résultat final
    setTimeout(() => {
      clearInterval(interval)
      setDrawnNumber(parseInt(finalNumber))
      setShowDrawnNumber(true)
      setIsAnimating(false)
    }, animationDuration)

    return animationDuration
  }

  /**
   * Lancer le jeu
   */
  const handlePlay = async () => {
    if (isAnimating || isPlaying || selectedNumber === null) {
      if (selectedNumber === null) {
        toast.error('Veuillez choisir un nombre')
      }
      return
    }

    // Validation du pari
    const validation = validateBetAmount(
      betAmount,
      game.min_bet,
      game.max_bet,
      wallet?.total_balance || 0
    )

    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    try {
      // Réinitialiser les résultats précédents
      setLastResult(null)
      setModalResult(null)
      setShowResultModal(false)
      setShowDrawnNumber(false)
      setDrawnNumber(null)

      // Son de clic
      playClickSound()

      // Faire le pari via le parent (choix = nombre)
      const result = await onBet(betAmount, String(selectedNumber))

      if (result?.result) {
        const winningNumber = parseInt(result.result)

        // Sauvegarder le résultat pour la modal
        setModalResult(result)

        // Lancer l'animation du tirage
        const animationDuration = await animateNumberDraw(winningNumber)

        // Attendre la fin de l'animation avant d'afficher le résultat
        setTimeout(() => {
          setLastResult(result)

          // Jouer le son approprié
          if (result.is_winner) {
            playWinSound()
          } else {
            playLoseSound()
          }

          // Afficher la modal de résultat
          setTimeout(() => {
            setShowResultModal(true)
          }, 500)

          // Mettre à jour le wallet
          if (result.wallet) {
            const newWallet = {
              ...wallet,
              main_balance: parseFloat(result.wallet.main_balance),
              bonus_balance: parseFloat(result.wallet.bonus_balance),
              total_balance: parseFloat(result.wallet.total_balance),
              currency: wallet?.currency || 'XAF',
            }
            console.log('💰 Updating wallet after lucky number:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, animationDuration + 500)
      }
    } catch (error) {
      console.error('Bet error:', error)
    }
  }

  /**
   * Réinitialiser le jeu pour rejouer
   */
  const handleReset = () => {
    setShowDrawnNumber(false)
    setDrawnNumber(null)
    setLastResult(null)
    setSelectedNumber(null)
    playClickSound()
  }

  return (
    <div className="relative">
      {/* Zone de jeu */}
      <div className="relative w-full mx-auto mb-6">
        {/* Arène du tirage */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 border-purple-500">
          {/* Titre */}
          <div className="text-center mb-3 sm:mb-5">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-1 sm:mb-2">
              🔢 Nombre Chanceux 🍀
            </h3>
            <p className="text-purple-200 text-xs sm:text-sm">
              Devinez le bon nombre entre {rangeMin} et {rangeMax} !
            </p>
          </div>

          {/* Zone de tirage (boule de loterie) */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border-2 border-white/30 min-h-[150px] sm:min-h-[200px] flex items-center justify-center">
              {showDrawnNumber ? (
                <div className={`text-center ${isAnimating ? 'animate-pulse' : 'animate-bounce-once'}`}>
                  <div className="relative">
                    {/* Boule de loterie */}
                    <div className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xl ${
                      lastResult?.is_winner && drawnNumber === selectedNumber
                        ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 animate-bounce'
                        : 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
                    } border-4 sm:border-8 border-white`}>
                      <span className="text-4xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-lg">
                        {drawnNumber}
                      </span>
                    </div>

                    {/* Effet de lueur pour le gagnant */}
                    {lastResult?.is_winner && drawnNumber === selectedNumber && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-yellow-400/30 animate-ping"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-white font-bold text-sm sm:text-lg md:text-xl">
                    {isAnimating ? 'Tirage en cours...' : 'Nombre tiré'}
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 sm:mb-3 border-4 sm:border-8 border-white/30">
                    <span className="text-4xl sm:text-5xl md:text-6xl">❓</span>
                  </div>
                  <p className="text-xs sm:text-sm">En attente du tirage...</p>
                </div>
              )}
            </div>
          </div>

          {/* Résultat du jeu */}
          {lastResult && !isAnimating && (
            <div
              className={`text-center mb-3 sm:mb-5 p-3 sm:p-5 rounded-lg sm:rounded-xl border-2 animate-fade-in ${
                lastResult.is_winner
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-red-500/20 border-red-500'
              }`}
            >
              <p className={`text-base sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 ${
                lastResult.is_winner ? 'text-green-400' : 'text-red-400'
              }`}>
                {lastResult.is_winner ? '🎉 Bravo ! Bonne intuition !' : '😢 Pas cette fois !'}
              </p>

              {lastResult.is_winner ? (
                <div>
                  <p className="text-green-300 text-sm sm:text-lg md:text-xl font-bold">
                    +{formatCurrency(lastResult.payout)} (×{lastResult.multiplier})
                  </p>
                  <p className="text-green-200 text-[10px] sm:text-xs mt-1 sm:mt-2">
                    Vous avez deviné le nombre {drawnNumber} !
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-red-300 text-sm sm:text-lg md:text-xl font-bold">
                    Perdu
                  </p>
                  <p className="text-red-200 text-[10px] sm:text-xs mt-1 sm:mt-2">
                    C&apos;était le {drawnNumber}, vous aviez choisi le {selectedNumber}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sélection du nombre */}
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-purple-200 mb-2 sm:mb-3 text-center">
              🎯 Choisissez votre nombre porte-bonheur
            </label>
            <div className={`grid gap-2 sm:gap-3 ${
              numbers.length <= 10 ? 'grid-cols-5' :
              numbers.length <= 20 ? 'grid-cols-5 sm:grid-cols-10' :
              'grid-cols-5 sm:grid-cols-10'
            }`}>
              {numbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handleNumberSelect(number)}
                  disabled={isAnimating || isPlaying || showDrawnNumber}
                  className={`group relative p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 sm:border-4 transition-all duration-300 transform overflow-hidden ${
                    selectedNumber === number
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600 border-yellow-300 scale-105 sm:scale-110 shadow-[0_0_20px_rgba(168,85,247,0.6)] ring-2 sm:ring-4 ring-purple-300'
                      : 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-400 hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] opacity-80 hover:opacity-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {selectedNumber === number && (
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl animate-bounce z-10 border border-white">
                      <span className="text-white text-[10px] sm:text-sm md:text-base">✓</span>
                    </div>
                  )}

                  <div className="text-center relative z-10">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                      {number}
                    </span>
                  </div>

                  {selectedNumber === number && (
                    <div className="absolute inset-0 animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-pink-400/20 rounded-lg sm:rounded-xl" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton pour rejouer après un résultat */}
          {showDrawnNumber && !isAnimating && (
            <div className="text-center mt-4 sm:mt-6">
              <button
                onClick={handleReset}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm sm:text-base font-bold rounded-lg transition-all transform hover:scale-105 shadow-xl"
              >
                🔄 Rejouer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contrôles de pari */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Montant de la mise
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={game.min_bet}
            max={game.max_bet}
            step={100}
            className="w-full px-4 py-3 bg-dark-200 border border-dark-100 rounded-lg text-white text-center text-xl font-bold focus:outline-none focus:border-casino-gold transition-colors"
            disabled={isAnimating || isPlaying}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Min: {formatCurrency(game.min_bet)}</span>
            <span>Max: {formatCurrency(game.max_bet)}</span>
          </div>
        </div>

        {/* Boutons de mise rapide */}
        <div className="grid grid-cols-4 gap-2">
          {[100, 500, 1000, 5000].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className="px-3 py-2 bg-dark-200 hover:bg-dark-100 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isAnimating || isPlaying}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={isAnimating || isPlaying || !wallet || wallet.total_balance < betAmount || selectedNumber === null || showDrawnNumber}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isAnimating ? '🎲 Tirage en cours...' : isPlaying ? 'En cours...' : '🍀 Tirer le nombre !'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-xs sm:text-sm text-gray-400 space-y-1 mt-4 sm:mt-6 bg-dark-200 rounded-lg p-3 sm:p-4 border border-dark-100">
        <p className="text-purple-400 font-semibold text-xs sm:text-sm">
          🔢 Multiplicateurs: ×{game.multipliers?.join(', ×') || '2, 3'}
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500">
          Devinez le bon nombre parmi {numbers.length} possibilités !
        </p>
      </div>

      {/* Modal de résultat */}
      <GameResultModal
        result={showResultModal ? modalResult : null}
        onClose={() => {
          setShowResultModal(false)
          setModalResult(null)
        }}
      />

      {/* Styles CSS pour les animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

LuckyNumber.propTypes = {
  game: PropTypes.shape({
    settings: PropTypes.object,
    rtp: PropTypes.number,
    win_frequency: PropTypes.number,
    min_bet: PropTypes.number,
    max_bet: PropTypes.number,
    multipliers: PropTypes.array,
  }).isRequired,
  onBet: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool,
}
