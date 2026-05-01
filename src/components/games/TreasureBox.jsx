import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * COFFRE AU TRÉSOR Game Component
 *
 * Configuration backend:
 * - Type: treasure_box
 * - RTP: 77.5%
 * - Win Frequency: 30%
 * - Multiplicateurs: [2, 3, 5]
 * - Settings: boxes_count (nombre de coffres, par défaut 3)
 */
export default function TreasureBox({ game, onBet, isPlaying }) {
  const [selectedBox, setSelectedBox] = useState(null) // 1, 2, 3, etc.
  const [isAnimating, setIsAnimating] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [openedBoxes, setOpenedBoxes] = useState([]) // Coffres ouverts après le résultat
  const [revealedBox, setRevealedBox] = useState(null) // Le coffre gagnant révélé
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Récupérer le nombre de coffres depuis les settings du jeu
  const boxesCount = game.settings?.boxes_count || 3

  // Générer les coffres dynamiquement avec différentes couleurs
  const boxColors = [
    { color: 'from-yellow-600 to-amber-700', hoverColor: 'hover:from-yellow-700 hover:to-amber-800', border: 'border-yellow-400' },
    { color: 'from-purple-600 to-purple-700', hoverColor: 'hover:from-purple-700 hover:to-purple-800', border: 'border-purple-400' },
    { color: 'from-blue-600 to-blue-700', hoverColor: 'hover:from-blue-700 hover:to-blue-800', border: 'border-blue-400' },
    { color: 'from-green-600 to-green-700', hoverColor: 'hover:from-green-700 hover:to-green-800', border: 'border-green-400' },
    { color: 'from-red-600 to-red-700', hoverColor: 'hover:from-red-700 hover:to-red-800', border: 'border-red-400' },
  ]

  const boxes = Array.from({ length: boxesCount }, (_, i) => ({
    id: i + 1,
    label: `Coffre ${i + 1}`,
    emoji: '🏺',
    ...boxColors[i % boxColors.length]
  }))

  /**
   * Gérer la sélection du coffre par le joueur
   */
  const handleBoxSelect = (boxId) => {
    if (isAnimating || isPlaying) return
    playClickSound()
    setSelectedBox(boxId)
  }

  /**
   * Animation de révélation progressive des coffres
   */
  const animateBoxReveal = async (winningBoxId) => {
    setIsAnimating(true)
    setOpenedBoxes([])
    setRevealedBox(null)

    // Ouvrir le coffre choisi par le joueur en premier
    await new Promise(resolve => {
      setTimeout(() => {
        setOpenedBoxes([selectedBox])
        resolve()
      }, 500)
    })

    // Attendre un peu avant de révéler le résultat
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Révéler le coffre gagnant
    setRevealedBox(winningBoxId)

    // Ouvrir tous les autres coffres après 1 seconde
    setTimeout(() => {
      const allBoxIds = boxes.map(box => box.id)
      setOpenedBoxes(allBoxIds)
      setIsAnimating(false)
    }, 1500)
  }

  /**
   * Lancer le jeu
   */
  const handlePlay = async () => {
    if (isAnimating || isPlaying || !selectedBox) {
      if (!selectedBox) {
        toast.error('Veuillez choisir un coffre')
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
      setOpenedBoxes([])
      setRevealedBox(null)

      // Son de clic
      playClickSound()

      // Faire le pari via le parent (choix = numéro du coffre)
      const result = await onBet(betAmount, String(selectedBox))

      if (result?.result) {
        const winningBox = parseInt(result.result)

        // Sauvegarder le résultat pour la modal
        setModalResult(result)

        // Lancer l'animation de révélation
        await animateBoxReveal(winningBox)

        // Attendre un peu avant de sauvegarder le résultat final
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
            console.log('💰 Updating wallet after treasure box:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, 2500)
      }
    } catch (error) {
      console.error('Bet error:', error)
    }
  }

  /**
   * Déterminer si un coffre est le gagnant, le perdant ou non ouvert
   */
  const getBoxStatus = (boxId) => {
    if (!openedBoxes.includes(boxId)) return 'closed'
    if (revealedBox === null) return 'opened'

    if (boxId === revealedBox) {
      return lastResult?.is_winner && boxId === selectedBox ? 'winner' : 'treasure'
    }
    return 'empty'
  }

  /**
   * Obtenir le contenu d'un coffre selon son statut
   */
  const getBoxContent = (boxId) => {
    const status = getBoxStatus(boxId)
    const box = boxes.find(b => b.id === boxId)

    switch (status) {
      case 'closed':
        return { emoji: box?.emoji || '🏺', label: box?.label || 'Coffre', color: 'text-white' }
      case 'winner':
        return { emoji: '💎', label: 'GAGNÉ !', color: 'text-yellow-300' }
      case 'treasure':
        return { emoji: '💰', label: 'Trésor ici', color: 'text-yellow-300' }
      case 'empty':
        return { emoji: '💨', label: 'Vide', color: 'text-gray-400' }
      default:
        return { emoji: box?.emoji || '🏺', label: box?.label || 'Coffre', color: 'text-white' }
    }
  }

  return (
    <div className="relative">
      {/* Zone de jeu */}
      <div className="relative w-full mx-auto mb-6">
        {/* Arène des coffres */}
        <div className="bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 border-yellow-500">
          {/* Titre */}
          <div className="text-center mb-3 sm:mb-5">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-1 sm:mb-2">
              🏺 Coffre au Trésor 💰
            </h3>
            <p className="text-yellow-200 text-xs sm:text-sm">
              Choisissez le bon coffre et gagnez jusqu&apos;à 5x votre mise !
            </p>
          </div>

          {/* Zone de coffres révélés (après le jeu) */}
          {openedBoxes.length > 0 && (
            <div className={`mb-4 sm:mb-6 grid gap-2 sm:gap-4 md:gap-6 ${
              boxesCount === 3 ? 'grid-cols-3' :
              boxesCount === 4 ? 'grid-cols-2 sm:grid-cols-4' :
              boxesCount === 5 ? 'grid-cols-2 sm:grid-cols-5' :
              'grid-cols-3'
            }`}>
              {boxes.map((box) => {
                const content = getBoxContent(box.id)
                const status = getBoxStatus(box.id)
                const isOpened = openedBoxes.includes(box.id)

                return (
                  <div
                    key={box.id}
                    className={`relative p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-500 ${
                      status === 'winner'
                        ? 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 border-yellow-300 scale-105 sm:scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)] sm:shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-bounce'
                        : status === 'treasure'
                        ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 border-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.4)] sm:shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                        : status === 'empty'
                        ? 'bg-gradient-to-br from-gray-500 to-gray-600 border-gray-400 opacity-50'
                        : `bg-gradient-to-br ${box.color} ${box.border}`
                    } ${isOpened ? 'animate-flip' : ''}`}
                  >
                    {/* Badge du statut en haut */}
                    {(status === 'winner' || status === 'treasure') && (
                      <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg whitespace-nowrap">
                        {status === 'winner' ? '🎉 VOUS !' : '✨ TRÉSOR'}
                      </div>
                    )}

                    <div className="text-center">
                      <div className="text-3xl sm:text-5xl md:text-7xl mb-1 sm:mb-2 md:mb-3 drop-shadow-lg">{content.emoji}</div>
                      <p className={`text-[10px] sm:text-sm md:text-lg font-bold drop-shadow ${content.color}`}>
                        {content.label}
                      </p>
                    </div>

                    {/* Animation de particules pour le gagnant */}
                    {status === 'winner' && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl sm:text-4xl animate-ping">✨</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

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
                {lastResult.is_winner ? '🎉 Félicitations !' : '😢 Dommage !'}
              </p>

              {/* Afficher le gain ou message */}
              {lastResult.is_winner ? (
                <div>
                  <p className="text-green-300 text-sm sm:text-lg md:text-xl font-bold">
                    +{formatCurrency(lastResult.payout)} (×{lastResult.multiplier})
                  </p>
                  <p className="text-green-200 text-[10px] sm:text-xs mt-1 sm:mt-2">
                    Vous avez trouvé le trésor dans le Coffre {selectedBox} !
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-red-300 text-sm sm:text-lg md:text-xl font-bold">
                    Perdu
                  </p>
                  <p className="text-red-200 text-[10px] sm:text-xs mt-1 sm:mt-2">
                    Le trésor était dans le Coffre {revealedBox}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sélection du coffre (avant de jouer) */}
          {openedBoxes.length === 0 && (
            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-yellow-200 mb-2 sm:mb-3 text-center">
                🎯 Choisissez votre coffre
              </label>
              <div className={`grid gap-2 sm:gap-4 md:gap-6 ${
                boxesCount === 3 ? 'grid-cols-3' :
                boxesCount === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                boxesCount === 5 ? 'grid-cols-2 sm:grid-cols-5' :
                'grid-cols-3'
              }`}>
                {boxes.map((box) => (
                  <button
                    key={box.id}
                    onClick={() => handleBoxSelect(box.id)}
                    disabled={isAnimating || isPlaying}
                    className={`group relative p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-300 transform overflow-hidden ${
                      selectedBox === box.id
                        ? `bg-gradient-to-br ${box.color} ${box.border} scale-105 sm:scale-110 shadow-[0_0_20px_rgba(251,191,36,0.5)] sm:shadow-[0_0_30px_rgba(251,191,36,0.6)] ring-2 sm:ring-4 ring-yellow-300`
                        : `bg-gradient-to-br ${box.color} ${box.border} hover:scale-105 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] sm:hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] opacity-80 hover:opacity-100`
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {selectedBox === box.id && (
                      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl animate-bounce z-10 border-2 border-white">
                        <span className="text-white text-sm sm:text-lg md:text-2xl">✓</span>
                      </div>
                    )}

                    {selectedBox !== box.id && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    <div className="text-center relative z-10">
                      <div className="text-3xl sm:text-5xl md:text-7xl mb-1 sm:mb-2 md:mb-3 transform group-hover:scale-110 transition-transform duration-300">
                        {box.emoji}
                      </div>
                      <p className="text-[10px] sm:text-sm md:text-lg font-bold text-white drop-shadow-lg">
                        {box.label}
                      </p>
                    </div>

                    {selectedBox === box.id && (
                      <div className="absolute inset-0 animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-yellow-400/20 rounded-xl sm:rounded-2xl" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bouton pour rejouer après un résultat */}
          {openedBoxes.length > 0 && !isAnimating && (
            <div className="text-center mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setOpenedBoxes([])
                  setRevealedBox(null)
                  setLastResult(null)
                  setSelectedBox(null)
                  playClickSound()
                }}
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
          disabled={isAnimating || isPlaying || !wallet || wallet.total_balance < betAmount || !selectedBox || openedBoxes.length > 0}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isAnimating ? '📦 Ouverture en cours...' : isPlaying ? 'En cours...' : '💎 Ouvrir le coffre !'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-xs sm:text-sm text-gray-400 space-y-1 mt-4 sm:mt-6 bg-dark-200 rounded-lg p-3 sm:p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold text-xs sm:text-sm">
          📦 Multiplicateurs: ×{game.multipliers?.join(', ×') || '2, 3, 5'}
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500">
          Choisissez le bon coffre parmi {boxesCount} pour remporter le trésor !
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

        @keyframes flip {
          0% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(90deg);
          }
          100% {
            transform: rotateY(0deg);
          }
        }

        .animate-flip {
          animation: flip 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

TreasureBox.propTypes = {
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
