import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * Pile ou Face (Coin Flip) Game Component
 *
 * Configuration backend:
 * - Type: coin_flip
 * - RTP: 77.5%
 * - Win Frequency: 50% (jeu équilibré)
 * - Multiplicateur: 2x
 * - Options: 'heads' (Pile) ou 'tails' (Face)
 */
export default function CoinFlip({ game, onBet, isPlaying }) {
  const [selectedChoice, setSelectedChoice] = useState(null) // 'heads' ou 'tails'
  const [isFlipping, setIsFlipping] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [coinFace, setCoinFace] = useState('heads') // État actuel de la pièce
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Choix disponibles
  const choices = [
    { value: 'heads', label: 'Pile', emoji: '👑', color: 'from-yellow-500 to-yellow-600' },
    { value: 'tails', label: 'Face', emoji: '🪙', color: 'from-blue-500 to-blue-600' },
  ]

  /**
   * Animation de la pièce qui tourne
   */
  const flipCoin = async (result) => {
    setIsFlipping(true)

    // Durée de l'animation (3 secondes)
    const flipDuration = 3000
    const flipSpeed = 100 // Intervalle de changement de face

    let flipCount = 0
    const maxFlips = flipDuration / flipSpeed

    // Faire tourner la pièce rapidement
    const flipInterval = setInterval(() => {
      flipCount++

      // Pour les 90% de l'animation, alterner aléatoirement
      if (flipCount < maxFlips * 0.9) {
        setCoinFace(Math.random() > 0.5 ? 'heads' : 'tails')
      } else {
        // Les derniers 10%, ralentir et se stabiliser sur le résultat
        setCoinFace(result)
      }
    }, flipSpeed)

    // Arrêter l'animation et garantir l'affichage du résultat final
    setTimeout(() => {
      clearInterval(flipInterval)
      setCoinFace(result) // heads ou tails (résultat du backend)
      setIsFlipping(false)
    }, flipDuration)

    return flipDuration
  }

  /**
   * Gérer le choix du joueur
   */
  const handleChoiceSelect = (choice) => {
    if (isFlipping || isPlaying) return
    playClickSound()
    setSelectedChoice(choice)
  }

  /**
   * Lancer le jeu
   */
  const handlePlay = async () => {
    if (isFlipping || isPlaying || !selectedChoice) {
      if (!selectedChoice) {
        toast.error('Veuillez choisir Pile ou Face')
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
        // Lancer l'animation de la pièce
        const flipDuration = await flipCoin(result.result)

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
            console.log('💰 Updating wallet after flip:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, flipDuration + 500)
      }
    } catch (error) {
      console.error('Bet error:', error)
    }
  }

  return (
    <div className="relative">
      {/* Zone de la pièce */}
      <div className="relative w-full max-w-md mx-auto mb-8">
        {/* Pièce qui tourne */}
        <div className="relative aspect-square max-w-[280px] mx-auto mb-6">
          <div
            className={`relative w-full h-full transition-transform duration-200 ${
              isFlipping ? 'animate-coin-flip' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Face de la pièce */}
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-br shadow-2xl border-8 flex items-center justify-center ${
                coinFace === 'heads'
                  ? 'from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-300'
                  : 'from-blue-400 via-blue-500 to-blue-600 border-blue-300'
              }`}
            >
              <div className="text-9xl select-none">
                {coinFace === 'heads' ? '👑' : '🪙'}
              </div>
            </div>

            {/* Brillance de la pièce */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
          </div>

          {/* Ombre de la pièce */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 rounded-full blur-xl" />
        </div>

        {/* Résultat de la pièce */}
        {lastResult && !isFlipping && (
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
                <p className="text-xs text-gray-400 mb-1">Votre choix</p>
                <div className={`px-4 py-2 rounded-lg ${
                  lastResult.choice === 'heads'
                    ? 'bg-yellow-500/30 border border-yellow-500'
                    : 'bg-blue-500/30 border border-blue-500'
                }`}>
                  <p className="text-white font-bold">
                    {lastResult.choice === 'heads' ? 'Pile 👑' : 'Face 🪙'}
                  </p>
                </div>
              </div>

              <div className="text-2xl">→</div>

              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Résultat</p>
                <div className={`px-4 py-2 rounded-lg ${
                  lastResult.result === 'heads'
                    ? 'bg-yellow-500/30 border border-yellow-500'
                    : 'bg-blue-500/30 border border-blue-500'
                }`}>
                  <p className="text-white font-bold">
                    {lastResult.result === 'heads' ? 'Pile 👑' : 'Face 🪙'}
                  </p>
                </div>
              </div>
            </div>

            {/* Afficher le gain ou message de défaite */}
            {lastResult.is_winner ? (
              <p className="text-green-300 text-xl font-bold mt-2">
                +{formatCurrency(lastResult.payout)}
              </p>
            ) : (
              <div className="mt-3">
                {lastResult.choice === lastResult.result ? (
                  <p className="text-orange-300 text-sm">
                    Bon choix, mais pas cette fois ! 🎲
                  </p>
                ) : (
                  <p className="text-red-300 text-sm">
                    Mauvais choix ! Réessayez 🎯
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sélection du choix */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
          Choisissez votre côté
        </label>
        <div className="grid grid-cols-2 gap-4">
          {choices.map((choice) => (
            <button
              key={choice.value}
              onClick={() => handleChoiceSelect(choice.value)}
              disabled={isFlipping || isPlaying}
              className={`relative p-6 rounded-xl border-2 transition-all transform ${
                selectedChoice === choice.value
                  ? `bg-gradient-to-br ${choice.color} border-white scale-105 shadow-2xl`
                  : 'bg-dark-200/50 border-dark-100 hover:border-white/30 hover:scale-102'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {/* Badge de sélection */}
              {selectedChoice === choice.value && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}

              {/* Contenu */}
              <div className="text-center">
                <div className="text-5xl mb-2">{choice.emoji}</div>
                <p className="text-xl font-bold text-white">{choice.label}</p>
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
            disabled={isFlipping || isPlaying}
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
              disabled={isFlipping || isPlaying}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={isFlipping || isPlaying || !wallet || wallet.total_balance < betAmount || !selectedChoice}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isFlipping ? '🪙 Lancement...' : isPlaying ? 'En cours...' : '🪙 Lancer la pièce'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-sm text-gray-400 space-y-1 mt-6 bg-dark-200 rounded-lg p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold">
          🪙 Multiplicateur: 2x
        </p>
        <p className="text-xs text-gray-500">
          Le classique ! Pile ou Face, doublez votre mise.
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
        @keyframes coin-flip {
          0% {
            transform: rotateY(0deg) rotateX(0deg);
          }
          25% {
            transform: rotateY(450deg) rotateX(180deg);
          }
          50% {
            transform: rotateY(900deg) rotateX(360deg);
          }
          75% {
            transform: rotateY(1350deg) rotateX(540deg);
          }
          100% {
            transform: rotateY(1800deg) rotateX(720deg);
          }
        }

        .animate-coin-flip {
          animation: coin-flip 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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

CoinFlip.propTypes = {
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
