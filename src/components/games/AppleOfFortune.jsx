import { useState, useRef } from 'react'
import { ROULETTE_CONFIG, formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * Apple of Fortune (Roulette) Game Component
 */
export default function AppleOfFortune({ game, onBet, isPlaying }) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningSegment, setWinningSegment] = useState(null)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const wheelRef = useRef(null)
  const { wallet, setWallet } = useWalletStore()
  const { playSpinSound, playWinSound, playLoseSound, playClickSound, playTickSequence } = useGameAudio()

  // Generate prizes dynamically from backend multipliers
  const generatePrizesFromMultipliers = () => {
    const multipliers = game.multipliers || [2, 5, 10] // Fallback
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFA07A']

    const prizes = {}
    multipliers.forEach((multiplier, index) => {
      const segmentNumber = index + 1
      prizes[segmentNumber] = {
        multiplier: multiplier,
        label: `${multiplier}x`,
        color: colors[index % colors.length]
      }
    })

    return prizes
  }

  // Use backend prizes if available, otherwise generate from multipliers
  const backendPrizes = game.settings?.prizes || generatePrizesFromMultipliers()
  const { spinDuration, minSpins } = ROULETTE_CONFIG
  const prizes = backendPrizes
  const segments = Object.keys(prizes).length

  // Calculate segment angle
  const segmentAngle = 360 / segments

  /**
   * Spin the wheel to a specific segment
   */
  const spinToSegment = (targetSegment, isWinner) => {
    setIsSpinning(true)
    setWinningSegment(null)

    // Play spin sound and tick sequence
    playSpinSound()
    const stopTicks = playTickSequence(spinDuration)

    // Calculate target rotation
    const segmentIndex = targetSegment - 1 // Convert to 0-based index
    const baseRotation = minSpins * 360 // Minimum rotations
    const targetAngle = segmentIndex * segmentAngle

    // Add extra rotation to make it land in the middle of the segment
    const offsetAngle = segmentAngle / 2

    // Calculate final rotation (counter-clockwise, so subtract)
    const finalRotation = rotation + baseRotation + (360 - targetAngle) + offsetAngle

    setRotation(finalRotation)

    // After spin completes, show result
    setTimeout(() => {
      stopTicks()
      setIsSpinning(false)
      setWinningSegment(targetSegment)

      // Play win or lose sound
      setTimeout(() => {
        if (isWinner) {
          playWinSound()
        } else {
          playLoseSound()
        }

        // Show result modal after a short delay
        setTimeout(() => {
          setShowResultModal(true)
        }, 500)
      }, 300)
    }, spinDuration)
  }

  /**
   * Handle play action
   */
  const handlePlay = async () => {
    if (isSpinning || isPlaying) return

    // Validate bet
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
      // Clear previous results
      setLastResult(null)
      setWinningSegment(null)

      // Play click sound
      playClickSound()

      // Make the bet via parent component
      const result = await onBet(betAmount, 'auto') // 'auto' means no choice needed

      // Spin to the winning segment
      if (result?.result) {
        const segment = parseInt(result.result)
        spinToSegment(segment, result.is_winner)

        // Save modal result immediately but don't show lastResult card yet
        setModalResult(result)

        // Update wallet and show lastResult card only after spin completes (spinDuration + delays)
        setTimeout(() => {
          setLastResult(result)

          // Update wallet balance AFTER animation completes
          if (result.wallet) {
            const newWallet = {
              ...wallet,
              main_balance: parseFloat(result.wallet.main_balance),
              bonus_balance: parseFloat(result.wallet.bonus_balance),
              total_balance: parseFloat(result.wallet.total_balance),
              currency: wallet?.currency || 'XAF',
            }

            console.log('💰 Updating wallet AFTER animation:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, spinDuration + 1000)
      }
    } catch (error) {
      console.error('Bet error:', error)
    }
  }

  /**
   * Render wheel segments
   */
  const renderSegments = () => {
    return Array.from({ length: segments }, (_, i) => {
      const segmentNumber = i + 1
      const prize = prizes[segmentNumber]
      const startAngle = i * segmentAngle
      const isWinner = winningSegment === segmentNumber

      return (
        <div
          key={segmentNumber}
          className="absolute w-full h-full"
          style={{
            transform: `rotate(${startAngle}deg)`,
          }}
        >
          {/* Segment */}
          <div
            className={`absolute top-0 left-1/2 origin-bottom -translate-x-1/2 transition-all duration-300 ${
              isWinner ? 'scale-110' : ''
            }`}
            style={{
              width: '0',
              height: '0',
              borderLeft: '80px solid transparent',
              borderRight: '80px solid transparent',
              borderBottom: `160px solid ${prize.color}`,
              filter: isWinner ? 'brightness(1.3) drop-shadow(0 0 20px currentColor)' : 'none',
            }}
          >
            {/* Prize label */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-white font-bold text-xl"
              style={{
                bottom: '60px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {prize.label || `${prize.multiplier}x`}
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="relative">
      {/* Wheel Container */}
      <div className="relative w-full max-w-md mx-auto aspect-square mb-8">
        {/* Pointer/Arrow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <div
            className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-yellow-400"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
            }}
          />
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-full h-full transition-transform ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? `${spinDuration}ms` : '0ms',
            transitionTimingFunction: isSpinning ? 'cubic-bezier(0.25, 0.1, 0.25, 1)' : 'linear',
          }}
        >
          {/* Center circle background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl" />

          {/* Segments */}
          <div className="absolute inset-0">{renderSegments()}</div>

          {/* Center hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg flex items-center justify-center z-10">
            <div className="text-3xl">🍎</div>
          </div>

          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-8 border-yellow-500 shadow-inner" />
        </div>

        {/* Winning animation overlay */}
        {winningSegment && prizes[winningSegment] && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-yellow-400 bg-black/70 px-4 py-2 rounded-lg">
                {prizes[winningSegment]?.label || `${prizes[winningSegment]?.multiplier}x`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prize legend */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {Object.entries(prizes).map(([segment, prize]) => (
          <div
            key={segment}
            className="flex items-center gap-2 p-2 rounded-lg bg-dark-200/50"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: prize.color }}
            />
            <span className="text-sm font-medium text-white">
              {prize.label || `${prize.multiplier}x`}
            </span>
          </div>
        ))}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-center ${
          lastResult.is_winner ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
        }`}>
          <p className={`text-base sm:text-lg font-bold ${lastResult.is_winner ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.is_winner
              ? `🎉 Gagné ${formatCurrency(lastResult.payout)} !`
              : '😢 Perdu ! Réessayez.'}
          </p>
          {lastResult.is_winner && (
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Multiplicateur: {lastResult.multiplier}x
            </p>
          )}
        </div>
      )}

      {/* Bet Controls */}
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

        {/* Quick bet amounts */}
        <div className="grid grid-cols-4 gap-2">
          {[100, 500, 1000, 5000].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className="px-3 py-2 bg-dark-200 hover:bg-dark-100 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isSpinning || isPlaying}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={isSpinning || isPlaying || !wallet || wallet.total_balance < betAmount}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSpinning ? 'Rotation en cours...' : isPlaying ? 'En cours...' : 'Faire tourner la roue 🎰'}
        </button>

        {/* Wallet balance */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: {formatCurrency(wallet?.total_balance || 0)}
        </div>
      </div>

      {/* Game info */}
      <div className="text-center text-sm text-gray-400 space-y-1 mt-6">
        <p>Faites tourner la roue et tentez de gagner jusqu&apos;à 10x votre mise !</p>
        {game.settings?.segments && (
          <p className="text-xs">
            {game.settings.segments} segments - RTP: {game.rtp}%
          </p>
        )}
      </div>

      {/* Result Modal */}
      <GameResultModal
        result={showResultModal ? modalResult : null}
        onClose={() => {
          setShowResultModal(false)
          setModalResult(null)
        }}
      />
    </div>
  )
}

AppleOfFortune.propTypes = {
  game: PropTypes.shape({
    settings: PropTypes.object,
    rtp: PropTypes.number,
  }).isRequired,
  onBet: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool,
}
