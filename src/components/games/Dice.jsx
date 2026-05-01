import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * Dice (Lancé de Dé) Game Component
 *
 * Configuration backend:
 * - Type: dice
 * - RTP: 77.5%
 * - Win Frequency: 40%
 * - Multiplicateurs: [2, 3]
 * - Options: odd (impair), even (pair), ou numéro spécifique (1-6)
 */
export default function Dice({ game, onBet, isPlaying }) {
  const [selectedChoice, setSelectedChoice] = useState(null) // 'odd', 'even', ou '1'-'6'
  const [isRolling, setIsRolling] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [currentDiceValue, setCurrentDiceValue] = useState(1)
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Options de paris
  const betOptions = [
    { value: 'odd', label: 'Impair', emoji: '🔢', color: 'from-red-500 to-red-600', description: '1, 3, 5' },
    { value: 'even', label: 'Pair', emoji: '🎯', color: 'from-blue-500 to-blue-600', description: '2, 4, 6' },
  ]

  // Numéros spécifiques
  const numbers = [1, 2, 3, 4, 5, 6]

  /**
   * Animation du dé qui roule
   */
  const rollDice = async (finalResult) => {
    setIsRolling(true)
    setCurrentDiceValue(1)

    const rollDuration = 2000 // 2 secondes
    const rollSpeed = 100 // Intervalle de changement

    let rollCount = 0
    const maxRolls = rollDuration / rollSpeed

    // Faire rouler le dé rapidement
    const rollInterval = setInterval(() => {
      rollCount++

      // Pour les 85% de l'animation, changer aléatoirement
      if (rollCount < maxRolls * 0.85) {
        setCurrentDiceValue(Math.floor(Math.random() * 6) + 1)
      } else {
        // Les derniers 15%, se stabiliser sur le résultat
        setCurrentDiceValue(parseInt(finalResult))
      }
    }, rollSpeed)

    // Arrêter l'animation et afficher le résultat final
    setTimeout(() => {
      clearInterval(rollInterval)
      setCurrentDiceValue(parseInt(finalResult))
      setIsRolling(false)
    }, rollDuration)

    return rollDuration
  }

  /**
   * Gérer le choix du joueur
   */
  const handleChoiceSelect = (choice) => {
    if (isRolling || isPlaying) return
    playClickSound()
    setSelectedChoice(choice)
  }

  /**
   * Lancer le jeu
   */
  const handlePlay = async () => {
    if (isRolling || isPlaying || !selectedChoice) {
      if (!selectedChoice) {
        toast.error('Veuillez choisir votre pari')
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
      const result = await onBet(betAmount, selectedChoice)

      if (result?.result) {
        // Lancer l'animation du dé
        const rollDuration = await rollDice(result.result)

        // Sauvegarder le résultat pour la modal
        setModalResult(result)

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
            console.log('💰 Updating wallet after dice roll:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, rollDuration + 500)
      }
    } catch (error) {
      console.error('Bet error:', error)
    }
  }

  /**
   * Rendre les points du dé (pips)
   */
  const renderDicePips = (value) => {
    const pipPositions = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
    }

    const positions = pipPositions[value] || []

    const pipClasses = {
      'top-left': 'top-[15%] left-[15%]',
      'top-right': 'top-[15%] right-[15%]',
      'middle-left': 'top-1/2 -translate-y-1/2 left-[15%]',
      'middle-right': 'top-1/2 -translate-y-1/2 right-[15%]',
      'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      'bottom-left': 'bottom-[15%] left-[15%]',
      'bottom-right': 'bottom-[15%] right-[15%]',
    }

    return (
      <div className="relative w-full h-full">
        {positions.map((pos, index) => (
          <div
            key={index}
            className={`absolute w-[18%] aspect-square bg-gray-900 rounded-full shadow-inner ${pipClasses[pos]}`}
          />
        ))}
      </div>
    )
  }

  /**
   * Vérifier si un choix correspond au résultat
   */
  const doesChoiceMatch = (choice, result) => {
    const diceValue = parseInt(result)
    if (choice === 'odd') return diceValue % 2 === 1
    if (choice === 'even') return diceValue % 2 === 0
    return choice === result
  }

  return (
    <div className="relative">
      {/* Zone du dé */}
      <div className="relative w-full max-w-md mx-auto mb-8">
        {/* Dé 3D professionnel */}
        <div className="relative aspect-square max-w-[200px] mx-auto mb-6 perspective-1000">
          <div
            className={`dice-container relative w-full h-full transition-all ${
              isRolling ? 'animate-dice-roll' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Dé avec effet 3D - Couleur dorée */}
            <div className="dice-face absolute inset-0 m-3 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl border-4 border-yellow-700/50 flex items-center justify-center backdrop-blur-sm">
              {/* Points du dé */}
              <div className="w-full h-full p-3">
                {renderDicePips(currentDiceValue)}
              </div>

              {/* Reflet brillant */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-white/10 to-transparent pointer-events-none" />

              {/* Effet de profondeur */}
              <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none"
                   style={{ boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.3)' }} />
            </div>

            {/* Bordure brillante */}
            <div className="absolute inset-0 m-2 rounded-xl border-2 border-white/30 pointer-events-none" />
          </div>

          {/* Ombre réaliste du dé */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-8 bg-black/25 rounded-full blur-xl" />
        </div>

        {/* Résultat du lancer */}
        {lastResult && !isRolling && (
          <div
            className={`text-center mb-6 p-4 rounded-lg border-2 animate-fade-in ${
              lastResult.is_winner
                ? 'bg-green-500/20 border-green-500'
                : 'bg-red-500/20 border-red-500'
            }`}
          >
            <p className={`text-2xl font-bold mb-2 ${
              lastResult.is_winner ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastResult.is_winner ? '🎉 Gagné !' : '😢 Perdu !'}
            </p>

            {/* Afficher le choix vs le résultat */}
            <div className="flex items-center justify-center gap-4 my-3">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Votre pari</p>
                <div className="px-4 py-2 rounded-lg bg-blue-500/30 border border-blue-500">
                  <p className="text-white font-bold">
                    {lastResult.choice === 'odd' && 'Impair 🔢'}
                    {lastResult.choice === 'even' && 'Pair 🎯'}
                    {!['odd', 'even'].includes(lastResult.choice) && `Numéro ${lastResult.choice}`}
                  </p>
                </div>
              </div>

              <div className="text-2xl">→</div>

              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Résultat</p>
                <div className="px-4 py-2 rounded-lg bg-yellow-500/30 border border-yellow-500">
                  <p className="text-white font-bold text-3xl">
                    {lastResult.result}
                  </p>
                </div>
              </div>
            </div>

            {/* Afficher le gain ou message de défaite */}
            {lastResult.is_winner ? (
              <p className="text-green-300 text-xl font-bold mt-2">
                +{formatCurrency(lastResult.payout)} (×{lastResult.multiplier})
              </p>
            ) : (
              <div className="mt-3">
                {doesChoiceMatch(lastResult.choice, lastResult.result) ? (
                  <p className="text-orange-300 text-sm">
                    Bon choix, mais pas cette fois ! 🎲
                  </p>
                ) : (
                  <p className="text-red-300 text-sm">
                    Réessayez ! 🎯
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sélection du type de pari */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
          Type de pari
        </label>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {betOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChoiceSelect(option.value)}
              disabled={isRolling || isPlaying}
              className={`relative p-4 rounded-xl border-2 transition-all transform ${
                selectedChoice === option.value
                  ? `bg-gradient-to-br ${option.color} border-white scale-105 shadow-2xl`
                  : 'bg-dark-200/50 border-dark-100 hover:border-white/30 hover:scale-102'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedChoice === option.value && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}

              <div className="text-center">
                <div className="text-4xl mb-2">{option.emoji}</div>
                <p className="text-lg font-bold text-white">{option.label}</p>
                <p className="text-xs text-gray-300 mt-1">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Sélection de numéro spécifique */}
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2 text-center">Ou choisissez un numéro spécifique</p>
          <div className="grid grid-cols-6 gap-2">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => handleChoiceSelect(String(num))}
                disabled={isRolling || isPlaying}
                className={`relative aspect-square rounded-lg border-2 transition-all transform overflow-hidden ${
                  selectedChoice === String(num)
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-white scale-110 shadow-xl ring-2 ring-green-400'
                    : 'bg-gradient-to-br from-yellow-500 to-yellow-700 border-yellow-800/50 hover:border-white/30 hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Mini dé avec points */}
                <div className="absolute inset-0 p-1">
                  {renderDicePips(num)}
                </div>

                {/* Checkmark si sélectionné */}
                {selectedChoice === String(num) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
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
            disabled={isRolling || isPlaying}
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
              disabled={isRolling || isPlaying}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={isRolling || isPlaying || !wallet || wallet.total_balance < betAmount || !selectedChoice}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isRolling ? '🎲 Lancement...' : isPlaying ? 'En cours...' : '🎲 Lancer le dé'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-sm text-gray-400 space-y-1 mt-6 bg-dark-200 rounded-lg p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold">
          🎲 Multiplicateurs: {game.multipliers?.join('x, ')}x
        </p>
        <p className="text-xs text-gray-500">
          Pariez sur pair/impair ou un numéro spécifique !
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

      {/* Styles CSS pour l'animation */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        @keyframes dice-roll {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0);
          }
          15% {
            transform: rotateX(180deg) rotateY(180deg) rotateZ(90deg) translateY(-20px);
          }
          30% {
            transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg) translateY(0);
          }
          45% {
            transform: rotateX(540deg) rotateY(540deg) rotateZ(270deg) translateY(-15px);
          }
          60% {
            transform: rotateX(720deg) rotateY(720deg) rotateZ(360deg) translateY(0);
          }
          75% {
            transform: rotateX(900deg) rotateY(900deg) rotateZ(450deg) translateY(-8px);
          }
          85% {
            transform: rotateX(1000deg) rotateY(1000deg) rotateZ(500deg) translateY(0);
          }
          95% {
            transform: rotateX(1070deg) rotateY(1070deg) rotateZ(540deg) translateY(-3px);
          }
          100% {
            transform: rotateX(1080deg) rotateY(1080deg) rotateZ(540deg) translateY(0);
          }
        }

        .animate-dice-roll {
          animation: dice-roll 2s cubic-bezier(0.17, 0.67, 0.35, 0.96);
        }

        .dice-container {
          transform-style: preserve-3d;
        }

        .dice-face {
          backface-visibility: visible;
        }

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
      `}</style>
    </div>
  )
}

Dice.propTypes = {
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
