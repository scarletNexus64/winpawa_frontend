import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * Course de Pions (Ludo Race) Game Component
 *
 * Configuration backend:
 * - Type: ludo
 * - RTP: 77.5%
 * - Win Frequency: 35%
 * - Multiplicateurs: [2, 3, 5]
 * - Options: Choisir une couleur (red, blue, green, yellow)
 */
export default function CourseDesPions({ game, onBet, isPlaying }) {
  const [selectedPion, setSelectedPion] = useState(null) // 'red', 'blue', 'green', 'yellow'
  const [isRacing, setIsRacing] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [pionPositions, setPionPositions] = useState({
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
  })
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Options de pions avec leurs couleurs
  const pions = [
    {
      value: 'red',
      label: 'Rouge',
      emoji: '🔴',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-500',
      textColor: 'text-red-400'
    },
    {
      value: 'blue',
      label: 'Bleu',
      emoji: '🔵',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-400'
    },
    {
      value: 'green',
      label: 'Vert',
      emoji: '🟢',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500',
      textColor: 'text-green-400'
    },
    {
      value: 'yellow',
      label: 'Jaune',
      emoji: '🟡',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-400'
    },
  ]

  /**
   * Gérer le choix du pion
   */
  const handlePionSelect = (pion) => {
    if (isRacing || isPlaying) return
    playClickSound()
    setSelectedPion(pion)
  }

  /**
   * Animer la course des pions
   */
  const animateRace = async (winnerColor) => {
    setIsRacing(true)

    // Réinitialiser les positions
    setPionPositions({ red: 0, blue: 0, green: 0, yellow: 0 })

    const duration = 3000 // 3 secondes
    const finishLine = 100
    const startTime = Date.now()

    // Définir les vitesses aléatoires pour chaque pion
    // Le gagnant aura une vitesse légèrement plus rapide
    const speeds = {
      red: winnerColor === 'red' ? 1.0 : 0.7 + Math.random() * 0.25,
      blue: winnerColor === 'blue' ? 1.0 : 0.7 + Math.random() * 0.25,
      green: winnerColor === 'green' ? 1.0 : 0.7 + Math.random() * 0.25,
      yellow: winnerColor === 'yellow' ? 1.0 : 0.7 + Math.random() * 0.25,
    }

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing pour un effet plus naturel
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Mettre à jour les positions avec un peu de randomisation
      const newPositions = {}
      Object.keys(speeds).forEach(color => {
        const baseProgress = easeOut * speeds[color]
        const wobble = Math.sin(progress * 20) * 2 // Petit mouvement de gauche à droite
        newPositions[color] = Math.min(baseProgress * finishLine + wobble, finishLine)
      })

      setPionPositions(newPositions)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // S'assurer que le gagnant est à la ligne d'arrivée
        setPionPositions(prev => ({
          ...prev,
          [winnerColor]: finishLine
        }))
      }
    }

    requestAnimationFrame(animate)
    await new Promise(resolve => setTimeout(resolve, duration + 500))
  }

  /**
   * Lancer la course
   */
  const handlePlay = async () => {
    if (isRacing || isPlaying || !selectedPion) {
      if (!selectedPion) {
        toast.error('Veuillez choisir un pion')
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

      // Son de clic
      playClickSound()

      // Faire le pari via le parent
      const result = await onBet(betAmount, selectedPion)

      if (result?.result) {
        console.log('🏁 ========== COURSE DE PIONS ==========')
        console.log('🎯 Pion choisi:', selectedPion)
        console.log('🏆 Pion gagnant backend:', result.result)
        console.log('✅ Is Winner:', result.is_winner)
        console.log('💰 Payout:', result.payout)
        console.log('✨ Multiplier:', result.multiplier)
        console.log('🏁 ====================================')

        // Sauvegarder le résultat pour la modal
        setModalResult(result)

        // Lancer l'animation de la course
        // IMPORTANT: Le pion gagnant de l'animation est toujours result.result (décidé par le backend)
        // result.is_winner indique si LE JOUEUR a gagné (son choix == result.result)
        await animateRace(result.result)

        // Attendre un peu avant d'afficher le résultat
        setTimeout(() => {
          setIsRacing(false)
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
            console.log('💰 Updating wallet after race:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Bet error:', error)
      setIsRacing(false)
    }
  }

  /**
   * Obtenir l'objet pion par sa couleur
   */
  const getPionByColor = (color) => {
    return pions.find(p => p.value === color)
  }

  /**
   * Obtenir les recommandations de mise rapide
   */
  const getQuickBetAmounts = () => {
    const min = game.min_bet || 100
    const max = game.max_bet || 10000
    const balance = wallet?.total_balance || 0

    const amounts = [min, min * 5, min * 10, min * 50]
    return amounts.filter(amount => amount <= max && amount <= balance)
  }

  const quickBetAmounts = getQuickBetAmounts()

  return (
    <div className="relative">
      {/* En-tête du jeu */}
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
          🏁 COURSE DE PIONS
        </h2>
        <p className="text-sm sm:text-base text-gray-300">
          Choisissez votre pion et regardez-le courir !
        </p>
      </div>

      {/* Piste de course */}
      <div className="relative w-full max-w-3xl mx-auto mb-8">
        <div className="relative bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg overflow-hidden shadow-2xl border-4 border-white/20 p-4 sm:p-6">
          {/* Ligne de départ */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 z-10">
            <div className="absolute top-1/2 -translate-y-1/2 -left-2 text-xs font-bold text-green-400 transform -rotate-90 whitespace-nowrap">
              DÉPART
            </div>
          </div>

          {/* Ligne d'arrivée */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500 z-10">
            <div className="absolute top-1/2 -translate-y-1/2 -right-2 text-xs font-bold text-red-400 transform -rotate-90 whitespace-nowrap">
              ARRIVÉE
            </div>
          </div>

          {/* Lignes de course pour chaque pion */}
          <div className="space-y-3 sm:space-y-4">
            {pions.map((pion, index) => {
              const position = pionPositions[pion.value]
              const isWinner = lastResult?.result === pion.value
              const isPlayerChoice = selectedPion === pion.value

              return (
                <div key={pion.value} className="relative">
                  {/* Piste */}
                  <div className={`relative h-12 sm:h-16 bg-gray-800/50 rounded-lg border-2 ${
                    isPlayerChoice ? pion.borderColor : 'border-gray-700'
                  } overflow-hidden`}>
                    {/* Marques de distance */}
                    <div className="absolute inset-0 flex">
                      {[25, 50, 75].map(mark => (
                        <div
                          key={mark}
                          className="absolute h-full w-0.5 bg-white/10"
                          style={{ left: `${mark}%` }}
                        />
                      ))}
                    </div>

                    {/* Pion en mouvement */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 transition-all ${
                        isRacing ? 'duration-100' : 'duration-300'
                      }`}
                      style={{
                        left: `${position}%`,
                        transform: `translate(-50%, -50%) ${isRacing ? 'scale(1.1)' : 'scale(1)'}`
                      }}
                    >
                      <div className={`relative ${
                        isWinner && !isRacing ? 'animate-bounce' : ''
                      }`}>
                        {/* Pion */}
                        <div className={`text-3xl sm:text-4xl ${
                          isPlayerChoice ? 'filter drop-shadow-lg' : ''
                        }`}>
                          {pion.emoji}
                        </div>

                        {/* Indicateur de choix du joueur */}
                        {isPlayerChoice && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                            VOUS
                          </div>
                        )}

                        {/* Couronne pour le gagnant */}
                        {isWinner && !isRacing && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                            👑
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nom de la couleur */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <span className={`text-xs sm:text-sm font-bold ${pion.textColor}`}>
                        {pion.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Animation de départ */}
          {isRacing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20 animate-fade-in">
              <div className="text-center">
                <div className="text-6xl sm:text-8xl font-black text-white mb-4 animate-pulse">
                  🏁
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400 animate-bounce">
                  EN COURSE !
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Résultat de la course */}
      {lastResult && !isRacing && (
        <div
          className={`mb-6 p-4 sm:p-6 rounded-xl border-2 text-center animate-fade-in ${
            lastResult.is_winner
              ? 'bg-green-500/20 border-green-500'
              : 'bg-red-500/20 border-red-500'
          }`}
        >
          <div className={`text-3xl sm:text-4xl font-black mb-3 ${
            lastResult.is_winner ? 'text-green-400' : 'text-red-400'
          }`}>
            {lastResult.is_winner ? '🏆 VICTOIRE !' : '😢 DÉFAITE !'}
          </div>

          {/* Afficher le choix vs le résultat */}
          <div className="flex items-center justify-center gap-4 my-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Votre pion</p>
              <div className={`px-4 py-3 rounded-lg ${
                getPionByColor(lastResult.choice)?.bgColor
              }/30 border-2 ${getPionByColor(lastResult.choice)?.borderColor}`}>
                <p className="text-4xl mb-1">{getPionByColor(lastResult.choice)?.emoji}</p>
                <p className="text-white font-bold text-sm">
                  {getPionByColor(lastResult.choice)?.label}
                </p>
              </div>
            </div>

            <div className="text-3xl">→</div>

            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Gagnant</p>
              <div className={`px-4 py-3 rounded-lg ${
                getPionByColor(lastResult.result)?.bgColor
              }/30 border-2 border-yellow-500`}>
                <p className="text-4xl mb-1">
                  {getPionByColor(lastResult.result)?.emoji}
                  {lastResult.is_winner && ' 👑'}
                </p>
                <p className="text-white font-bold text-sm">
                  {getPionByColor(lastResult.result)?.label}
                </p>
              </div>
            </div>
          </div>

          {/* Afficher le gain ou message de défaite */}
          {lastResult.is_winner ? (
            <div>
              <p className="text-green-300 text-2xl sm:text-3xl font-bold mt-3">
                +{formatCurrency(lastResult.payout)}
              </p>
              <p className="text-green-400 text-sm sm:text-base mt-1">
                Multiplicateur ×{lastResult.multiplier}
              </p>
            </div>
          ) : (
            <p className="text-red-300 text-base sm:text-lg mt-2">
              Votre pion n'a pas gagné cette fois !
            </p>
          )}
        </div>
      )}

      {/* Sélection du pion */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
          Choisissez votre pion
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {pions.map((pion) => (
            <button
              key={pion.value}
              onClick={() => handlePionSelect(pion.value)}
              disabled={isRacing || isPlaying}
              className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all transform ${
                selectedPion === pion.value
                  ? `bg-gradient-to-br ${pion.color} border-white scale-105 shadow-2xl`
                  : 'bg-dark-200/50 border-dark-100 hover:border-white/30 hover:scale-102'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedPion === pion.value && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}

              <div className="text-center">
                <div className="text-5xl sm:text-6xl mb-2">{pion.emoji}</div>
                <p className="text-base sm:text-lg font-bold text-white">{pion.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contrôles de mise */}
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
            disabled={isRacing || isPlaying}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Min: {formatCurrency(game.min_bet)}</span>
            <span>Max: {formatCurrency(game.max_bet)}</span>
          </div>
        </div>

        {/* Boutons de mise rapide */}
        {quickBetAmounts.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {quickBetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                className="px-3 py-2 bg-dark-200 hover:bg-dark-100 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                disabled={isRacing || isPlaying}
              >
                {amount >= 1000 ? `${amount/1000}K` : amount}
              </button>
            ))}
          </div>
        )}

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={isRacing || isPlaying || !wallet || wallet.total_balance < betAmount || !selectedPion}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isRacing ? '🏁 Course en cours...' : isPlaying ? 'En cours...' : '🏁 Lancer la course'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-sm text-gray-400 space-y-1 mt-6 bg-dark-200 rounded-lg p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold">
          🏁 Multiplicateurs: {game.multipliers?.join('x, ')}x
        </p>
        <p className="text-xs text-gray-500">
          Choisissez votre pion et regardez la course !
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

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce {
          animation: bounce 0.6s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 1s infinite;
        }
      `}</style>
    </div>
  )
}

CourseDesPions.propTypes = {
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
