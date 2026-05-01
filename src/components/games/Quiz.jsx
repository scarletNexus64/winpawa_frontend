import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * Quiz Chance Game Component
 *
 * Configuration backend:
 * - Type: quiz
 * - RTP: 77.5%
 * - Win Frequency: 50%
 * - Multiplicateurs: [2]
 * - Options: A, B, C, D
 */
export default function Quiz({ game, onBet, isPlaying }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null) // 'A', 'B', 'C', 'D'
  const [isRevealing, setIsRevealing] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [revealedAnswer, setRevealedAnswer] = useState(null)
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Options de réponses avec leurs couleurs
  const answers = [
    {
      value: 'A',
      label: 'Réponse A',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-400',
      hoverColor: 'hover:border-blue-400'
    },
    {
      value: 'B',
      label: 'Réponse B',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500',
      textColor: 'text-green-400',
      hoverColor: 'hover:border-green-400'
    },
    {
      value: 'C',
      label: 'Réponse C',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-400',
      hoverColor: 'hover:border-orange-400'
    },
    {
      value: 'D',
      label: 'Réponse D',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-400',
      hoverColor: 'hover:border-purple-400'
    },
  ]

  /**
   * Questions aléatoires pour l'ambiance (cosmétique uniquement)
   */
  const quizQuestions = [
    "Quelle est la bonne réponse ?",
    "Faites le bon choix !",
    "Choisissez votre chance !",
    "Quelle option gagnera ?",
    "Testez votre intuition !",
    "Êtes-vous prêt à gagner ?",
  ]

  const [currentQuestion] = useState(
    quizQuestions[Math.floor(Math.random() * quizQuestions.length)]
  )

  /**
   * Gérer le choix de la réponse
   */
  const handleAnswerSelect = (answer) => {
    if (isRevealing || isPlaying) return
    playClickSound()
    setSelectedAnswer(answer)
  }

  /**
   * Animation de révélation de la bonne réponse
   */
  const animateReveal = async (correctAnswer) => {
    setIsRevealing(true)
    setRevealedAnswer(null)

    // Attendre 1 seconde avant de révéler
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Révéler la bonne réponse
    setRevealedAnswer(correctAnswer)

    // Attendre encore 1.5 secondes
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsRevealing(false)
  }

  /**
   * Lancer le jeu
   */
  const handlePlay = async () => {
    if (isRevealing || isPlaying || !selectedAnswer) {
      if (!selectedAnswer) {
        toast.error('Veuillez choisir une réponse')
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
      setRevealedAnswer(null)

      // Son de clic
      playClickSound()

      // Faire le pari via le parent
      const result = await onBet(betAmount, selectedAnswer)

      if (result?.result) {
        console.log('❓ ========== QUIZ CHANCE ==========')
        console.log('🎯 Réponse choisie:', selectedAnswer)
        console.log('✅ Bonne réponse:', result.result)
        console.log('🏆 Is Winner:', result.is_winner)
        console.log('💰 Payout:', result.payout)
        console.log('✨ Multiplier:', result.multiplier)
        console.log('❓ ====================================')

        // Sauvegarder le résultat pour la modal
        setModalResult(result)

        // Lancer l'animation de révélation
        await animateReveal(result.result)

        // Afficher le résultat
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
          console.log('💰 Updating wallet after quiz:', newWallet.total_balance)
          setWallet(newWallet)
        }
      }
    } catch (error) {
      console.error('Bet error:', error)
      setIsRevealing(false)
    }
  }

  /**
   * Obtenir l'objet réponse par sa valeur
   */
  const getAnswerByValue = (value) => {
    return answers.find(a => a.value === value)
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
          ❓ QUIZ CHANCE
        </h2>
        <p className="text-sm sm:text-base text-gray-300">
          Choisissez la bonne réponse et doublez votre mise !
        </p>
      </div>

      {/* Zone de question */}
      <div className="relative w-full max-w-2xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 sm:p-8 shadow-2xl border-4 border-white/20">
          {/* Question */}
          <div className="text-center mb-6">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 mb-4">
              <span className="text-2xl">❓</span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {currentQuestion}
            </h3>
          </div>

          {/* Grille de réponses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {answers.map((answer) => {
              const isSelected = selectedAnswer === answer.value
              const isCorrect = revealedAnswer === answer.value
              const isWrong = revealedAnswer && selectedAnswer === answer.value && !isCorrect
              const shouldReveal = revealedAnswer && (isCorrect || isWrong)

              return (
                <button
                  key={answer.value}
                  onClick={() => handleAnswerSelect(answer.value)}
                  disabled={isRevealing || isPlaying}
                  className={`relative p-6 rounded-xl border-4 transition-all transform ${
                    shouldReveal && isCorrect
                      ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-300 scale-105 shadow-2xl animate-bounce'
                      : shouldReveal && isWrong
                      ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-300 opacity-50'
                      : isSelected
                      ? `bg-gradient-to-br ${answer.color} border-white scale-105 shadow-xl`
                      : `bg-white/5 backdrop-blur-sm border-white/30 ${answer.hoverColor} hover:scale-102`
                  } disabled:cursor-not-allowed`}
                >
                  {/* Checkmark si sélectionné */}
                  {isSelected && !shouldReveal && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg z-10">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  )}

                  {/* Checkmark vert si bonne réponse */}
                  {isCorrect && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10 animate-pulse">
                      <span className="text-white text-2xl">✓</span>
                    </div>
                  )}

                  {/* Croix rouge si mauvaise réponse */}
                  {isWrong && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg z-10">
                      <span className="text-white text-2xl">✗</span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl font-black text-white mb-2">
                      {answer.value}
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-white/90">
                      {answer.label}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Message pendant la révélation */}
          {isRevealing && !revealedAnswer && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🤔</div>
                <div className="text-2xl font-bold text-white animate-pulse">
                  Révélation...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Résultat du quiz */}
      {lastResult && !isRevealing && (
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
            {lastResult.is_winner ? '🎉 CORRECT !' : '❌ INCORRECT !'}
          </div>

          {/* Afficher le choix vs la bonne réponse */}
          <div className="flex items-center justify-center gap-4 my-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Votre réponse</p>
              <div className={`px-6 py-4 rounded-lg ${
                getAnswerByValue(lastResult.choice)?.bgColor
              }/30 border-2 ${getAnswerByValue(lastResult.choice)?.borderColor}`}>
                <p className="text-4xl font-black text-white mb-1">
                  {lastResult.choice}
                </p>
                <p className="text-sm text-gray-300">
                  {getAnswerByValue(lastResult.choice)?.label}
                </p>
              </div>
            </div>

            <div className="text-3xl">→</div>

            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Bonne réponse</p>
              <div className={`px-6 py-4 rounded-lg ${
                lastResult.is_winner
                  ? 'bg-green-500/30 border-green-500'
                  : 'bg-yellow-500/30 border-yellow-500'
              } border-2`}>
                <p className="text-4xl font-black text-white mb-1">
                  {lastResult.result}
                  {lastResult.is_winner && ' ✓'}
                </p>
                <p className="text-sm text-gray-300">
                  {getAnswerByValue(lastResult.result)?.label}
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
              Mauvaise réponse ! Réessayez votre chance.
            </p>
          )}
        </div>
      )}

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
            disabled={isRevealing || isPlaying}
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
                disabled={isRevealing || isPlaying}
              >
                {amount >= 1000 ? `${amount/1000}K` : amount}
              </button>
            ))}
          </div>
        )}

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={isRevealing || isPlaying || !wallet || wallet.total_balance < betAmount || !selectedAnswer}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isRevealing ? '🤔 Révélation...' : isPlaying ? 'En cours...' : '❓ Valider ma réponse'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-sm text-gray-400 space-y-1 mt-6 bg-dark-200 rounded-lg p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold">
          ❓ Multiplicateur: ×{game.multipliers?.[0] || 2}
        </p>
        <p className="text-xs text-gray-500">
          4 réponses possibles - Trouvez la bonne !
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

Quiz.propTypes = {
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
