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
  // Use backend prizes
  const prizes = game.settings?.prizes || {}
  const { spinDuration, minSpins } = ROULETTE_CONFIG
  const segments = Object.keys(prizes).length
  const segmentAngle = 360 / segments

  // No initial rotation needed - segments are rendered with #1 centered at top
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

  // DEBUG: Log configuration on mount
  console.log('🎮 WHEEL CONFIGURATION:', {
    totalSegments: segments,
    segmentAngle: segmentAngle,
    prizes: Object.keys(prizes).map(k => `#${k}: ${prizes[k].multiplier > 0 ? prizes[k].multiplier + 'x' : '💀'}`)
  })

  /**
   * Spin the wheel to a specific segment
   */
  const spinToSegment = (targetSegment, isWinner) => {
    setIsSpinning(true)
    setWinningSegment(null)

    console.log(`🎡 Spinning to segment #${targetSegment}`)

    // Play spin sound and tick sequence
    playSpinSound()
    const stopTicks = playTickSequence(spinDuration)

    // Calculate target rotation
    const segmentIndex = targetSegment - 1 // Convert to 0-based index
    const baseRotation = minSpins * 360 // Minimum rotations

    // CORRECTED ALGORITHM:
    // Segments are rendered with #1 centered at top (-90°)
    // To point at segment N (index N-1), we need to rotate so that segment is at top
    // Segment N center is at: (segmentIndex * segmentAngle) - 90°
    // We want it to end at -90° (top), so rotation needed is:
    // rotation = -90° - [(segmentIndex * segmentAngle) - 90°]
    // rotation = -90° - segmentIndex * segmentAngle + 90°
    // rotation = -(segmentIndex * segmentAngle)

    // The target angle (where we want to end up after rotation)
    let targetAngle = -(segmentIndex * segmentAngle)

    // Normalize target angle to 0-360
    targetAngle = targetAngle % 360
    if (targetAngle < 0) targetAngle += 360

    // Current angle (normalize to 0-360)
    let currentAngle = rotation % 360
    if (currentAngle < 0) currentAngle += 360

    // Calculate the incremental rotation needed
    let incrementalRotation = targetAngle - currentAngle

    // Ensure we rotate in the positive direction and add base rotations
    if (incrementalRotation <= 0) {
      incrementalRotation += 360
    }
    incrementalRotation += baseRotation

    // Final rotation = current + incremental
    const finalRotation = rotation + incrementalRotation

    console.log(`🎯 Rotation calculation:`, {
      targetSegment,
      segmentIndex,
      segmentAngle,
      targetAngle,
      currentAngle,
      incrementalRotation,
      finalRotation,
      currentRotation: rotation
    })

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

        // DEBUG: Log backend result
        console.log('🎲 BACKEND RESULT:', {
          segment: segment,
          is_winner: result.is_winner,
          multiplier: result.multiplier,
          payout: result.payout
        })

        // DEBUG: Check what segment we're landing on
        const targetPrize = prizes[segment]
        console.log(`🎯 Landing on segment #${segment}:`, targetPrize)

        if (targetPrize) {
          const shouldBeWinner = targetPrize.multiplier > 0
          console.log(`🔍 Visual check: Segment #${segment} should be ${shouldBeWinner ? 'WINNER' : 'LOSER'}`)
          console.log(`🔍 Backend says: ${result.is_winner ? 'WINNER' : 'LOSER'}`)

          if (shouldBeWinner !== result.is_winner) {
            console.error('⚠️ MISMATCH! Visual does not match backend result!')
          } else {
            console.log('✅ MATCH! Visual and backend are aligned.')
          }
        }

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
   * Render wheel segments using SVG for better precision
   */
  const renderSegments = () => {
    const radius = 150 // Wheel radius
    const centerX = 160
    const centerY = 160

    // DEBUG: Log segments order
    console.log('🎨 FRONTEND - Rendering segments in order:', Object.keys(prizes).map(k => {
      const p = prizes[k]
      return `#${k}: ${p.multiplier > 0 ? p.multiplier + 'x' : '💀'}`
    }).join(', '))

    return Object.entries(prizes).map(([segmentNumber, prize]) => {
      const index = parseInt(segmentNumber) - 1
      // CORRECTED: Start from top (270° or -90°) with segment #1 centered at top
      // Segment #1 center should be at -90° (270° = top), so segment #1 starts at -90° - (segmentAngle/2)
      const segmentMiddleAngle = index * segmentAngle - 90
      const startAngle = segmentMiddleAngle - (segmentAngle / 2)
      const endAngle = segmentMiddleAngle + (segmentAngle / 2)
      const isWinner = winningSegment === parseInt(segmentNumber)
      const isLosingSegment = prize.multiplier === 0 || prize.multiplier === '0'

      // DEBUG: Log winning segment
      if (isWinner) {
        console.log(`🎯 SEGMENT GAGNANT: #${segmentNumber} = ${prize.multiplier > 0 ? prize.multiplier + 'x' : '💀 0x'} (${prize.is_winner ? 'WIN' : 'LOSE'})`)
      }

      // Convert angles to radians
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      // Calculate path for segment
      const x1 = centerX + radius * Math.cos(startRad)
      const y1 = centerY + radius * Math.sin(startRad)
      const x2 = centerX + radius * Math.cos(endRad)
      const y2 = centerY + radius * Math.sin(endRad)

      const largeArcFlag = segmentAngle > 180 ? 1 : 0

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ')

      // Calculate text position (middle of segment)
      const midAngle = (startAngle + endAngle) / 2
      const midRad = (midAngle * Math.PI) / 180
      const textRadius = radius * 0.65
      const textX = centerX + textRadius * Math.cos(midRad)
      const textY = centerY + textRadius * Math.sin(midRad)

      return (
        <g key={segmentNumber}>
          {/* Segment path */}
          <path
            d={pathData}
            fill={prize.color}
            stroke="#fff"
            strokeWidth="2"
            opacity={isWinner ? 1 : 0.95}
            filter={isWinner ? 'brightness(1.3) drop-shadow(0 0 10px currentColor)' : 'none'}
            style={{
              transition: 'all 0.3s ease',
            }}
          />

          {/* Multiplier text */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isLosingSegment ? '#ef4444' : '#ffffff'}
            fontSize={segments > 6 ? '18' : '22'}
            fontWeight="bold"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
              pointerEvents: 'none',
            }}
          >
            {isLosingSegment ? '💀' : `${prize.multiplier}x`}
          </text>
        </g>
      )
    })
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Wheel Container */}
      <div className="relative w-full max-w-md mx-auto aspect-square mb-8">
        {/* Pointer/Arrow at top - IMPROVED FOR BETTER VISIBILITY */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ top: '-15px' }}>
          <div className="relative flex flex-col items-center">
            {/* Pointer circle */}
            <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-500 mb-1"
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.8))',
                boxShadow: '0 0 15px rgba(251, 191, 36, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.5)'
              }}
            />
            {/* Arrow pointing down */}
            <div className="relative">
              <div
                className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[40px] border-t-yellow-400"
                style={{
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))',
                }}
              />
              {/* Inner arrow for 3D effect */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[30px] border-t-yellow-300"
                style={{
                  top: '5px'
                }}
              />
            </div>
            {/* Landing zone indicator line */}
            <div className="absolute w-1 bg-gradient-to-b from-yellow-400 to-transparent"
              style={{
                height: '60px',
                top: '48px',
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
              }}
            />
          </div>
        </div>

        {/* Wheel SVG */}
        <div className="relative w-full h-full">
          <svg
            ref={wheelRef}
            viewBox="0 0 320 320"
            className="w-full h-full transition-transform ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transitionDuration: isSpinning ? `${spinDuration}ms` : '0ms',
              transitionTimingFunction: isSpinning ? 'cubic-bezier(0.25, 0.1, 0.25, 1)' : 'linear',
            }}
          >
            {/* Outer circle background */}
            <circle
              cx="160"
              cy="160"
              r="155"
              fill="url(#gradient)"
              stroke="#d4af37"
              strokeWidth="8"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0f0f1e" />
              </linearGradient>
              <radialGradient id="centerGradient">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>
            </defs>

            {/* Segments */}
            {renderSegments()}

            {/* Center hub */}
            <circle
              cx="160"
              cy="160"
              r="35"
              fill="url(#centerGradient)"
              stroke="#ffffff"
              strokeWidth="4"
            />

            {/* Apple emoji in center */}
            <text
              x="160"
              y="160"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="32"
              style={{ pointerEvents: 'none' }}
            >
              🍎
            </text>
          </svg>

          {/* Decorative outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-yellow-500/30 pointer-events-none" style={{ boxShadow: 'inset 0 0 30px rgba(212, 175, 55, 0.3)' }} />
        </div>

        {/* Winning animation overlay */}
        {winningSegment && prizes[winningSegment] && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-2">
                {prizes[winningSegment]?.multiplier > 0 ? '🎉' : '😢'}
              </div>
              <div className={`text-3xl font-bold px-6 py-3 rounded-lg ${
                prizes[winningSegment]?.multiplier > 0
                  ? 'text-yellow-400 bg-black/80'
                  : 'text-red-400 bg-black/80'
              }`}>
                {prizes[winningSegment]?.multiplier > 0
                  ? `${prizes[winningSegment]?.multiplier}x`
                  : '0x'
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={`p-4 rounded-lg mb-6 text-center ${
          lastResult.is_winner ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
        }`}>
          <p className={`text-lg font-bold ${lastResult.is_winner ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.is_winner
              ? `🎉 Gagné ${formatCurrency(lastResult.payout)} !`
              : '😢 Perdu ! Réessayez.'}
          </p>
          {lastResult.is_winner && (
            <p className="text-sm text-gray-300 mt-1">
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
          {isSpinning ? '🎰 Rotation en cours...' : isPlaying ? 'En cours...' : '🍎 Faire tourner la roue'}
        </button>
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
    min_bet: PropTypes.number,
    max_bet: PropTypes.number,
    win_frequency: PropTypes.number,
    multipliers: PropTypes.array,
  }).isRequired,
  onBet: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool,
}
