import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * Color Roulette Game Component
 *
 * Configuration backend:
 * - Type: color_roulette
 * - RTP: 77.5%
 * - Win Frequency: 33%
 * - Multiplicateurs: [2, 3]
 * - Couleurs: red, blue, green, yellow
 */
export default function ColorRoulette({ game, onBet, isPlaying }) {
  const [selectedColor, setSelectedColor] = useState(null) // 'red', 'blue', 'green', 'yellow'
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [finalColor, setFinalColor] = useState(null)
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Couleurs de la roulette avec leurs propriétés
  const colors = [
    {
      value: 'red',
      label: 'Rouge',
      hex: '#EF4444',
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-500',
      textColor: 'text-red-400'
    },
    {
      value: 'blue',
      label: 'Bleu',
      hex: '#3B82F6',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-400'
    },
    {
      value: 'green',
      label: 'Vert',
      hex: '#10B981',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500',
      textColor: 'text-green-400'
    },
    {
      value: 'yellow',
      label: 'Jaune',
      hex: '#F59E0B',
      gradient: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-400'
    },
  ]

  /**
   * Gérer le choix de couleur
   */
  const handleColorSelect = (color) => {
    if (isSpinning || isPlaying) return
    playClickSound()
    setSelectedColor(color)
  }

  /**
   * Calculer l'angle pour une couleur donnée
   * L'indicateur est en haut (0°), donc nous devons calculer l'angle pour que
   * la couleur gagnante soit en haut quand la roue s'arrête
   */
  const getAngleForColor = (colorValue) => {
    const colorIndex = colors.findIndex(c => c.value === colorValue)
    // Chaque couleur occupe 90 degrés (360/4)
    // On ajoute 45° pour centrer la couleur sous l'indicateur
    // Et on inverse pour tourner dans le bon sens
    return -(colorIndex * 90 + 45)
  }

  /**
   * Animer la rotation de la roulette
   */
  const animateSpin = async (winningColor) => {
    setIsSpinning(true)
    setFinalColor(null)

    const duration = 4000 // 4 secondes
    const targetAngle = getAngleForColor(winningColor)

    // Faire plusieurs tours complets + l'angle final
    const fullRotations = 5 // 5 tours complets
    const totalRotation = (fullRotations * 360) + targetAngle

    // Animation fluide
    const startTime = Date.now()
    const startRotation = rotation

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing out cubic pour ralentir progressivement
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentRotation = startRotation + (totalRotation * easeOut)
      setRotation(currentRotation)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // S'assurer que la rotation finale est exacte
        setRotation(startRotation + totalRotation)
        setFinalColor(winningColor)
        setIsSpinning(false)
      }
    }

    requestAnimationFrame(animate)
    await new Promise(resolve => setTimeout(resolve, duration + 500))
  }

  /**
   * Lancer la roulette
   */
  const handlePlay = async () => {
    if (isSpinning || isPlaying || !selectedColor) {
      if (!selectedColor) {
        toast.error('Veuillez choisir une couleur')
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
      setFinalColor(null)

      // Son de clic
      playClickSound()

      // Faire le pari via le parent
      const result = await onBet(betAmount, selectedColor)

      if (result?.result) {
        console.log('🎨 ========== COLOR ROULETTE ==========')
        console.log('🎯 Couleur choisie:', selectedColor)
        console.log('🏆 Couleur gagnante:', result.result)
        console.log('✅ Is Winner:', result.is_winner)
        console.log('💰 Payout:', result.payout)
        console.log('✨ Multiplier:', result.multiplier)
        console.log('🎨 ====================================')

        // Sauvegarder le résultat pour la modal
        setModalResult(result)

        // Lancer l'animation de rotation
        await animateSpin(result.result)

        // Afficher le résultat
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
            console.log('💰 Updating wallet after color roulette:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Bet error:', error)
      setIsSpinning(false)
    }
  }

  /**
   * Obtenir l'objet couleur par sa valeur
   */
  const getColorByValue = (value) => {
    return colors.find(c => c.value === value)
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
          🎨 ROULETTE COULEURS
        </h2>
        <p className="text-sm sm:text-base text-gray-300">
          Choisissez votre couleur et faites tourner la roue !
        </p>
      </div>

      {/* Roulette */}
      <div className="relative w-full max-w-md mx-auto mb-8">
        {/* Indicateur (flèche en haut) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-white drop-shadow-xl"></div>
        </div>

        {/* Roue de la roulette */}
        <div className="relative aspect-square max-w-[300px] mx-auto">
          {/* Cercle extérieur décoratif */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shadow-2xl"></div>

          {/* Roulette tournante */}
          <div
            className="absolute inset-4 rounded-full overflow-hidden transition-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '0ms' : '300ms',
            }}
          >
            {/* Segments de couleurs en SVG pour précision */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {colors.map((color, index) => {
                // Calculer les coordonnées du secteur
                // Commencer à -90° (haut) puis ajouter l'index
                const startAngle = (index * 90 - 90) * Math.PI / 180
                const endAngle = ((index + 1) * 90 - 90) * Math.PI / 180

                const x1 = 50 + 50 * Math.cos(startAngle)
                const y1 = 50 + 50 * Math.sin(startAngle)
                const x2 = 50 + 50 * Math.cos(endAngle)
                const y2 = 50 + 50 * Math.sin(endAngle)

                // Créer le path du secteur
                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`

                return (
                  <path
                    key={color.value}
                    d={pathData}
                    fill={color.hex}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                )
              })}
            </svg>

            {/* Centre de la roue */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-white shadow-xl flex items-center justify-center z-10">
              <span className="text-2xl">🎨</span>
            </div>
          </div>

          {/* Ombre de la roue */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/30 rounded-full blur-xl"></div>
        </div>

        {/* Résultat affiché */}
        {finalColor && (
          <div className="mt-6 text-center animate-fade-in">
            <div className={`inline-block px-6 py-3 rounded-xl ${
              getColorByValue(finalColor)?.bgColor
            } border-4 border-white shadow-xl`}>
              <p className="text-white font-black text-xl">
                {getColorByValue(finalColor)?.label.toUpperCase()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Résultat du jeu */}
      {lastResult && !isSpinning && (
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
            {lastResult.is_winner ? '🎉 GAGNÉ !' : '😢 PERDU !'}
          </div>

          {/* Afficher le choix vs le résultat */}
          <div className="flex items-center justify-center gap-4 my-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Votre couleur</p>
              <div className={`px-6 py-4 rounded-lg ${
                getColorByValue(lastResult.choice)?.bgColor
              }/30 border-2 ${getColorByValue(lastResult.choice)?.borderColor}`}>
                <div className={`w-12 h-12 rounded-full ${
                  getColorByValue(lastResult.choice)?.bgColor
                } mx-auto mb-2 border-2 border-white`}></div>
                <p className="text-white font-bold">
                  {getColorByValue(lastResult.choice)?.label}
                </p>
              </div>
            </div>

            <div className="text-3xl">→</div>

            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Résultat</p>
              <div className={`px-6 py-4 rounded-lg ${
                lastResult.is_winner
                  ? 'bg-green-500/30 border-green-500'
                  : getColorByValue(lastResult.result)?.bgColor + '/30 ' + getColorByValue(lastResult.result)?.borderColor
              } border-2`}>
                <div className={`w-12 h-12 rounded-full ${
                  getColorByValue(lastResult.result)?.bgColor
                } mx-auto mb-2 border-2 border-white`}></div>
                <p className="text-white font-bold">
                  {getColorByValue(lastResult.result)?.label}
                  {lastResult.is_winner && ' ✓'}
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
              La roue s'est arrêtée sur {getColorByValue(lastResult.result)?.label} !
            </p>
          )}
        </div>
      )}

      {/* Sélection de couleur */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
          Choisissez votre couleur
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              disabled={isSpinning || isPlaying}
              className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all transform ${
                selectedColor === color.value
                  ? `bg-gradient-to-br ${color.gradient} border-white scale-105 shadow-2xl`
                  : 'bg-dark-200/50 border-dark-100 hover:border-white/30 hover:scale-102'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedColor === color.value && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}

              <div className="text-center">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${color.bgColor} mx-auto mb-2 border-4 border-white/50 shadow-lg`}></div>
                <p className="text-base sm:text-lg font-bold text-white">{color.label}</p>
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
            disabled={isSpinning || isPlaying}
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
                disabled={isSpinning || isPlaying}
              >
                {amount >= 1000 ? `${amount/1000}K` : amount}
              </button>
            ))}
          </div>
        )}

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={isSpinning || isPlaying || !wallet || wallet.total_balance < betAmount || !selectedColor}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isSpinning ? '🎨 Rotation...' : isPlaying ? 'En cours...' : '🎨 Faire tourner'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-sm text-gray-400 space-y-1 mt-6 bg-dark-200 rounded-lg p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold">
          🎨 Multiplicateurs: {game.multipliers?.join('x, ')}x
        </p>
        <p className="text-xs text-gray-500">
          4 couleurs - Faites votre choix et tournez !
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
      `}</style>
    </div>
  )
}

ColorRoulette.propTypes = {
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
