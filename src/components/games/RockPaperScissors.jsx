import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * PIERRE-PAPIER-CISEAUX Game Component
 *
 * Configuration backend:
 * - Type: rock_paper_scissors
 * - RTP: 77.5%
 * - Win Frequency: 33%
 * - Multiplicateur: [2]
 * - Options: rock, paper, scissors
 */
export default function RockPaperScissors({ game, onBet, isPlaying }) {
  const [selectedChoice, setSelectedChoice] = useState(null) // 'rock', 'paper', 'scissors'
  const [isAnimating, setIsAnimating] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [computerChoice, setComputerChoice] = useState(null)
  const [showComputerChoice, setShowComputerChoice] = useState(false)
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Configuration des choix
  const choices = [
    {
      value: 'rock',
      label: 'Pierre',
      emoji: '✊',
      color: 'from-gray-500 to-gray-600',
      hoverColor: 'hover:from-gray-600 hover:to-gray-700'
    },
    {
      value: 'paper',
      label: 'Papier',
      emoji: '✋',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      value: 'scissors',
      label: 'Ciseaux',
      emoji: '✌️',
      color: 'from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700'
    },
  ]

  /**
   * Obtenir les infos d'un choix par sa valeur
   */
  const getChoiceInfo = (value) => {
    return choices.find(c => c.value === value)
  }

  /**
   * Gérer le choix du joueur
   */
  const handleChoiceSelect = (choice) => {
    if (isAnimating || isPlaying) return
    playClickSound()
    setSelectedChoice(choice)
  }

  /**
   * Animation de révélation du choix de l'ordinateur
   */
  const animateComputerChoice = async (finalChoice) => {
    setIsAnimating(true)
    setShowComputerChoice(false)
    setComputerChoice(null)

    const animationDuration = 2000 // 2 secondes
    const changeSpeed = 150 // Changement toutes les 150ms

    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += changeSpeed

      // Changer aléatoirement le choix de l'ordinateur
      if (elapsed < animationDuration * 0.8) {
        const randomChoice = choices[Math.floor(Math.random() * choices.length)].value
        setComputerChoice(randomChoice)
        setShowComputerChoice(true)
      } else {
        // Derniers 20%, stabiliser sur le résultat final
        setComputerChoice(finalChoice)
        setShowComputerChoice(true)
      }
    }, changeSpeed)

    // Arrêter l'animation et afficher le résultat final
    setTimeout(() => {
      clearInterval(interval)
      setComputerChoice(finalChoice)
      setShowComputerChoice(true)
      setIsAnimating(false)
    }, animationDuration)

    return animationDuration
  }

  /**
   * Lancer le jeu
   */
  const handlePlay = async () => {
    if (isAnimating || isPlaying || !selectedChoice) {
      if (!selectedChoice) {
        toast.error('Veuillez choisir Pierre, Papier ou Ciseaux')
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
      setShowComputerChoice(false)
      setComputerChoice(null)

      // Son de clic
      playClickSound()

      // Faire le pari via le parent
      const result = await onBet(betAmount, selectedChoice)

      if (result?.result) {
        // Lancer l'animation du choix de l'ordinateur
        const animationDuration = await animateComputerChoice(result.result)

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
            console.log('💰 Updating wallet after rock-paper-scissors:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, animationDuration + 500)
      }
    } catch (error) {
      console.error('Bet error:', error)
    }
  }

  /**
   * Déterminer le résultat du match (affichage)
   */
  const getMatchResult = () => {
    if (!lastResult || !selectedChoice || !computerChoice) return null

    if (selectedChoice === computerChoice) {
      return { type: 'draw', message: 'Égalité !', color: 'text-yellow-400' }
    }

    if (lastResult.is_winner) {
      return { type: 'win', message: 'Vous gagnez !', color: 'text-green-400' }
    } else {
      return { type: 'lose', message: 'Vous perdez !', color: 'text-red-400' }
    }
  }

  const matchResult = getMatchResult()
  const playerChoiceInfo = selectedChoice ? getChoiceInfo(selectedChoice) : null
  const computerChoiceInfo = computerChoice ? getChoiceInfo(computerChoice) : null

  return (
    <div className="relative">
      {/* Zone de jeu */}
      <div className="relative w-full max-w-2xl mx-auto mb-8">
        {/* Arène de bataille */}
        <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl border-4 border-purple-500">
          {/* Titre */}
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-2">
              ✊ Pierre-Papier-Ciseaux ✋
            </h3>
            <p className="text-purple-200 text-xs sm:text-sm">
              Battez l'ordinateur et doublez votre mise !
            </p>
          </div>

          {/* Zone de combat */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 items-center">
            {/* Choix du joueur */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-purple-200 mb-2 sm:mb-3 font-semibold">Vous</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-white/30 min-h-[100px] sm:min-h-[120px] md:min-h-[150px] flex items-center justify-center">
                {playerChoiceInfo ? (
                  <div className="animate-bounce-once">
                    <div className="text-4xl sm:text-5xl md:text-7xl mb-1 sm:mb-2">{playerChoiceInfo.emoji}</div>
                    <p className="text-white font-bold text-xs sm:text-sm md:text-base">{playerChoiceInfo.label}</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">❓</div>
                    <p className="text-xs sm:text-sm">Choisissez</p>
                  </div>
                )}
              </div>
            </div>

            {/* VS au milieu */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-dark-400 font-black text-lg sm:text-2xl md:text-3xl rounded-full w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto flex items-center justify-center shadow-2xl border-2 sm:border-4 border-white">
                VS
              </div>
            </div>

            {/* Choix de l'ordinateur */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-purple-200 mb-2 sm:mb-3 font-semibold">Ordinateur</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-white/30 min-h-[100px] sm:min-h-[120px] md:min-h-[150px] flex items-center justify-center">
                {showComputerChoice && computerChoiceInfo ? (
                  <div className={isAnimating ? 'animate-pulse' : 'animate-bounce-once'}>
                    <div className="text-4xl sm:text-5xl md:text-7xl mb-1 sm:mb-2">{computerChoiceInfo.emoji}</div>
                    <p className="text-white font-bold text-xs sm:text-sm md:text-base">{computerChoiceInfo.label}</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">❓</div>
                    <p className="text-xs sm:text-sm">En attente...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Résultat du match */}
          {lastResult && matchResult && !isAnimating && (
            <div
              className={`text-center mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl border-2 animate-fade-in ${
                matchResult.type === 'win'
                  ? 'bg-green-500/20 border-green-500'
                  : matchResult.type === 'lose'
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-yellow-500/20 border-yellow-500'
              }`}
            >
              <p className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 ${matchResult.color}`}>
                {matchResult.type === 'win' && '🎉 '}
                {matchResult.message}
                {matchResult.type === 'win' && ' 🎉'}
              </p>

              {/* Afficher le gain ou message */}
              {lastResult.is_winner ? (
                <div>
                  <p className="text-green-300 text-lg sm:text-xl md:text-2xl font-bold">
                    +{formatCurrency(lastResult.payout)} (×{lastResult.multiplier})
                  </p>
                  <p className="text-green-200 text-xs sm:text-sm mt-2">
                    {playerChoiceInfo?.label} bat {computerChoiceInfo?.label} !
                  </p>
                </div>
              ) : matchResult.type === 'draw' ? (
                <p className="text-yellow-300 text-xs sm:text-sm">
                  Aucun gagnant, mise remboursée
                </p>
              ) : (
                <p className="text-red-300 text-xs sm:text-sm">
                  {computerChoiceInfo?.label} bat {playerChoiceInfo?.label}
                </p>
              )}
            </div>
          )}

          {/* Sélection du choix */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2 sm:mb-3 text-center">
              Faites votre choix
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {choices.map((choice) => (
                <button
                  key={choice.value}
                  onClick={() => handleChoiceSelect(choice.value)}
                  disabled={isAnimating || isPlaying}
                  className={`relative p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border-2 transition-all transform overflow-hidden ${
                    selectedChoice === choice.value
                      ? `bg-gradient-to-br ${choice.color} border-white scale-105 shadow-2xl ring-2 sm:ring-4 ring-yellow-400`
                      : `bg-white/10 border-purple-300/50 ${choice.hoverColor} hover:scale-105 hover:border-white/50`
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {selectedChoice === choice.value && (
                    <div className="absolute top-1 right-1 sm:-top-2 sm:-right-2 md:-top-3 md:-right-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10">
                      <span className="text-white text-sm sm:text-lg md:text-xl">✓</span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-3xl sm:text-5xl md:text-6xl mb-1 sm:mb-2 md:mb-3">{choice.emoji}</div>
                    <p className="text-xs sm:text-sm md:text-lg font-bold text-white">{choice.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
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
          disabled={isAnimating || isPlaying || !wallet || wallet.total_balance < betAmount || !selectedChoice}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isAnimating ? '⚔️ Combat en cours...' : isPlaying ? 'En cours...' : '⚔️ Jouer !'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-xs sm:text-sm text-gray-400 space-y-1 mt-4 sm:mt-6 bg-dark-200 rounded-lg p-3 sm:p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold text-xs sm:text-sm">
          ✊ Multiplicateur: ×{game.multipliers?.[0] || 2}
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500">
          Pierre bat Ciseaux | Ciseaux bat Papier | Papier bat Pierre
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

RockPaperScissors.propTypes = {
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
