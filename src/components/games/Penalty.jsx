import { useState, useRef } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import { penaltyLogic } from '../../services/penaltyLogic'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * PENALTY Game Component (Tir au But)
 * Avec interaction swipe pour tirer
 * - Tir dans le cadre → Backend décide (Win Frequency)
 * - Tir hors cadre → Perdu automatiquement
 */
export default function Penalty({ game, onBet, isPlaying }) {
  const [isShooting, setIsShooting] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [ballAnimating, setBallAnimating] = useState(false)
  const [goalkeeperDiving, setGoalkeeperDiving] = useState(false)
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 85 })
  const [goalkeeperPosition, setGoalkeeperPosition] = useState({ x: 50, y: 60 })
  const [swipeStart, setSwipeStart] = useState(null)
  const [swipeEnd, setSwipeEnd] = useState(null)
  const [isSwping, setIsSwping] = useState(false)
  const [targetPosition, setTargetPosition] = useState(null)
  const [missedShot, setMissedShot] = useState(false)
  const fieldRef = useRef(null)

  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Positions de tir disponibles (DANS le cadre)
  const positions = [
    { id: 1, label: 'Gauche Bas', x: 15, y: 65 },
    { id: 2, label: 'Gauche Haut', x: 20, y: 30 },
    { id: 3, label: 'Centre', x: 50, y: 35 },
    { id: 4, label: 'Droite Haut', x: 80, y: 30 },
    { id: 5, label: 'Droite Bas', x: 85, y: 65 },
  ]

  /**
   * Vérifier si le tir est dans le cadre du but
   * Zone du but : 10-90% horizontal, 0-40% vertical
   */
  const isInGoalFrame = (x, y) => {
    return x >= 10 && x <= 90 && y >= 0 && y <= 40
  }

  /**
   * Calculer la position ciblée basée sur le swipe
   */
  const calculateTargetFromSwipe = (startPos, endPos) => {
    if (!fieldRef.current) return null

    const rect = fieldRef.current.getBoundingClientRect()

    // Convertir les coordonnées en pourcentages
    const endX = ((endPos.x - rect.left) / rect.width) * 100
    const endY = ((endPos.y - rect.top) / rect.height) * 100

    // Vérifier si le tir est dans le cadre
    const inFrame = isInGoalFrame(endX, endY)

    if (!inFrame) {
      // Tir hors cadre - retourner la position exacte pour l'animation
      return {
        id: null,
        label: 'Hors cadre',
        actualX: endX,
        actualY: endY,
        isOutside: true
      }
    }

    // Tir dans le cadre - trouver la position la plus proche
    let closestPosition = positions[0]
    let minDistance = Infinity

    positions.forEach(pos => {
      const distance = Math.sqrt(
        Math.pow(pos.x - endX, 2) + Math.pow(pos.y - endY, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        closestPosition = pos
      }
    })

    return {
      ...closestPosition,
      actualX: endX,
      actualY: endY,
      isOutside: false
    }
  }

  /**
   * Gérer le début du swipe
   */
  const handleSwipeStart = (e) => {
    if (isShooting || isPlaying) return

    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY

    // Vérifier que le swipe commence dans la zone du ballon (bas du terrain)
    const startY = ((clientY - rect.top) / rect.height) * 100
    if (startY > 75) { // Zone du ballon
      setSwipeStart({ x: clientX, y: clientY })
      setSwipeEnd({ x: clientX, y: clientY })
      setIsSwping(true)
      playClickSound()
    }
  }

  /**
   * Gérer le mouvement du swipe
   */
  const handleSwipeMove = (e) => {
    if (!isSwping || !swipeStart) return

    e.preventDefault()

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY

    setSwipeEnd({ x: clientX, y: clientY })
  }

  /**
   * Gérer la fin du swipe (tir)
   */
  const handleSwipeEnd = async () => {
    if (!isSwping || !swipeStart || !swipeEnd) return

    setIsSwping(false)

    // Calculer la distance du swipe
    const distance = Math.sqrt(
      Math.pow(swipeEnd.x - swipeStart.x, 2) + Math.pow(swipeEnd.y - swipeStart.y, 2)
    )

    // Swipe minimum requis (50px)
    if (distance < 50) {
      toast.error('Glissez plus fort pour tirer !')
      setSwipeStart(null)
      setSwipeEnd(null)
      return
    }

    // Calculer la cible
    const target = calculateTargetFromSwipe(swipeStart, swipeEnd)
    if (!target) return

    // Validation du pari
    const validation = validateBetAmount(
      betAmount,
      game.min_bet,
      game.max_bet,
      wallet?.total_balance || 0
    )

    if (!validation.valid) {
      toast.error(validation.message)
      setSwipeStart(null)
      setSwipeEnd(null)
      return
    }

    try {
      // Réinitialiser
      setLastResult(null)
      setModalResult(null)
      setShowResultModal(false)
      setSwipeStart(null)
      setSwipeEnd(null)
      setMissedShot(false)

      // Si le tir est HORS CADRE
      if (target.isOutside) {
        console.log('⚽ ========== TIR HORS CADRE ==========')
        console.log('🎯 Position:', target.actualX, target.actualY)
        console.log('❌ Résultat: RATÉ (hors du but)')
        console.log('⚽ ====================================')

        // Créer un résultat de perte simulé
        const missedResult = {
          is_winner: false,
          payout: 0,
          multiplier: 0,
          amount: betAmount,
          choice: 'outside',
          result: 'missed'
        }

        setModalResult(missedResult)
        setMissedShot(true)

        // Animer le tir raté (sans appeler le backend)
        await animateMissedShot(target)

        // Débiter le wallet manuellement pour tir raté
        const newBalance = wallet.total_balance - betAmount
        const newWallet = {
          ...wallet,
          main_balance: newBalance,
          total_balance: newBalance,
        }
        setWallet(newWallet)

        // Afficher le résultat
        setTimeout(() => {
          setIsShooting(false)
          setLastResult(missedResult)
          playLoseSound()

          setTimeout(() => {
            setShowResultModal(true)
          }, 500)

          setTargetPosition(null)
        }, 500)

        return
      }

      // TIR DANS LE CADRE - Appeler le backend
      const result = await onBet(betAmount, target.id.toString())

      if (result) {
        // 🔍 DEBUG
        console.log('⚽ ========== PENALTY RESULT ==========')
        console.log('🎯 Position choisie:', target.id, target.label)
        console.log('🏆 Is Winner:', result.is_winner)
        console.log('💰 Payout:', result.payout)
        console.log('✨ Multiplier:', result.multiplier)
        console.log('⚽ ====================================')

        setModalResult(result)

        // Déterminer où le gardien plonge
        const keeperPos = penaltyLogic.getGoalkeeperPosition(
          target.id,
          result.is_winner,
          positions
        )

        console.log('🧤 Gardien plonge vers:', keeperPos.id, keeperPos.label)
        console.log('⚽ Ballon va vers:', target.actualX, target.actualY)

        // Animer le tir
        await animateShoot(target, result.is_winner, keeperPos)

        // Afficher le résultat
        setTimeout(() => {
          setIsShooting(false)
          setLastResult(result)

          if (result.is_winner) {
            playWinSound()
          } else {
            playLoseSound()
          }

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
            setWallet(newWallet)
          }

          // Réinitialiser
          setTargetPosition(null)
        }, 500)
      }
    } catch (error) {
      setIsShooting(false)
      setBallAnimating(false)
      setGoalkeeperDiving(false)
      setMissedShot(false)
      console.error('Bet error:', error)
    }
  }

  /**
   * Animation du tir (dans le cadre)
   */
  const animateShoot = async (target, isWinner, keeperPos) => {
    setIsShooting(true)
    setBallAnimating(true)
    setGoalkeeperDiving(true)
    setTargetPosition(target)

    // Animation du gardien
    setGoalkeeperPosition({ x: keeperPos.x, y: keeperPos.y })

    // Animation du ballon
    const duration = 1000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Trajectoire avec arc
      const currentX = 50 + (target.actualX - 50) * easeOut
      const currentY = 85 - (85 - target.actualY) * easeOut - (Math.sin(progress * Math.PI) * 15)

      setBallPosition({ x: currentX, y: currentY })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setBallAnimating(false)
        setGoalkeeperDiving(false)
      }
    }

    requestAnimationFrame(animate)
    await new Promise(resolve => setTimeout(resolve, duration))
  }

  /**
   * Animation pour tir raté (hors cadre)
   */
  const animateMissedShot = async (target) => {
    setIsShooting(true)
    setBallAnimating(true)
    setTargetPosition(target)

    // Le gardien ne bouge pas pour les tirs hors cadre
    setGoalkeeperDiving(false)

    // Animation du ballon qui sort
    const duration = 1200
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Trajectoire qui sort du cadre
      const currentX = 50 + (target.actualX - 50) * easeOut
      const currentY = 85 - (85 - target.actualY) * easeOut - (Math.sin(progress * Math.PI) * 10)

      setBallPosition({ x: currentX, y: currentY })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setBallAnimating(false)
      }
    }

    requestAnimationFrame(animate)
    await new Promise(resolve => setTimeout(resolve, duration))
  }

  /**
   * Dessiner la ligne de trajectoire pendant le swipe
   */
  const renderSwipeLine = () => {
    if (!isSwping || !swipeStart || !swipeEnd || !fieldRef.current) return null

    const rect = fieldRef.current.getBoundingClientRect()

    const startX = ((swipeStart.x - rect.left) / rect.width) * 100
    const startY = ((swipeStart.y - rect.top) / rect.height) * 100
    const endX = ((swipeEnd.x - rect.left) / rect.width) * 100
    const endY = ((swipeEnd.y - rect.top) / rect.height) * 100

    // Vérifier si le tir sera dans le cadre
    const willBeInFrame = isInGoalFrame(endX, endY)
    const lineColor = willBeInFrame ? '#FFD700' : '#FF4444' // Or si dans le cadre, Rouge si dehors

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 100 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill={lineColor} />
          </marker>
        </defs>
        <line
          x1={`${startX}%`}
          y1={`${startY}%`}
          x2={`${endX}%`}
          y2={`${endY}%`}
          stroke={lineColor}
          strokeWidth="3"
          strokeDasharray="5,5"
          markerEnd="url(#arrowhead)"
          opacity="0.8"
        />
        {/* Indicateur visuel */}
        {!willBeInFrame && (
          <text
            x={`${endX}%`}
            y={`${endY}%`}
            fill="#FF4444"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            ❌
          </text>
        )}
      </svg>
    )
  }

  /**
   * Obtenir les recommandations de mise rapide
   */
  const quickBetAmounts = penaltyLogic.getBetRecommendations(
    game.min_bet,
    game.max_bet,
    wallet?.total_balance || 0
  )

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* En-tête du jeu */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">
          ⚽ TIR AU BUT
        </h2>
        <p className="text-sm sm:text-base text-gray-300">
          Glissez vers le but pour tirer !
        </p>
        <p className="text-xs sm:text-sm text-yellow-400 mt-1">
          🎯 Visez dans le cadre • ❌ Hors cadre = Raté
        </p>
      </div>

      {/* Terrain de jeu */}
      <div className="relative w-full mb-6 sm:mb-8">
        <div className="relative w-full max-w-2xl mx-auto">
          <div
            ref={fieldRef}
            className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden shadow-2xl border-4 border-white/20 touch-none"
            style={{ aspectRatio: '16/10' }}
            onMouseDown={handleSwipeStart}
            onMouseMove={handleSwipeMove}
            onMouseUp={handleSwipeEnd}
            onMouseLeave={() => isSwping && handleSwipeEnd()}
            onTouchStart={handleSwipeStart}
            onTouchMove={handleSwipeMove}
            onTouchEnd={handleSwipeEnd}
          >
            {/* Lignes du terrain */}
            <div className="absolute inset-0">
              {/* Surface de réparation */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-1/3 border-2 border-white/30"></div>

              {/* Point de penalty */}
              <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
            </div>

            {/* Cage de but avec indicateur visuel */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-2/5 sm:w-3/4 sm:h-2/5">
              {/* Zone du cadre (pour visualisation) */}
              <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-sm"></div>

              {/* Poteaux */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-lg"></div>
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-lg"></div>
              <div className="absolute top-0 left-0 right-0 h-2 bg-white rounded-full shadow-lg"></div>

              {/* Filet */}
              <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                <defs>
                  <pattern id="net" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 0 0 L 20 20 M 20 0 L 0 20" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#net)"/>
              </svg>

              {/* Gardien de but */}
              <div
                className={`absolute transition-all ${
                  goalkeeperDiving ? 'duration-700 ease-out' : 'duration-300 ease-in-out'
                }`}
                style={{
                  left: `${goalkeeperPosition.x}%`,
                  top: `${goalkeeperPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  {/* Tête */}
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-200 rounded-full border-2 border-amber-300 mx-auto mb-1"></div>

                  {/* Corps */}
                  <div className={`w-8 h-10 sm:w-10 sm:h-12 bg-yellow-500 rounded-lg border-2 border-yellow-600 ${
                    goalkeeperDiving ? 'rotate-45' : ''
                  } transition-transform duration-700`}>
                    <div className="flex items-center justify-center h-full text-xs sm:text-sm font-bold text-black">
                      1
                    </div>
                  </div>

                  {/* Bras en plongeon */}
                  {goalkeeperDiving && (
                    <div className="absolute top-4 -left-6 -right-6 flex justify-between">
                      <div className="w-8 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-8 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ballon */}
              <div
                className={`absolute transition-all ${
                  ballAnimating ? 'duration-1000 ease-out' : 'duration-300'
                }`}
                style={{
                  left: `${ballPosition.x}%`,
                  top: `${ballPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  opacity: isShooting ? 1 : 0.8,
                  zIndex: 50,
                }}
              >
                <div className="relative">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full border-2 border-gray-800 shadow-lg">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <polygon points="50,20 35,40 50,45 65,40" fill="black" opacity="0.8"/>
                      <polygon points="30,50 35,40 25,60" fill="black" opacity="0.6"/>
                      <polygon points="70,50 65,40 75,60" fill="black" opacity="0.6"/>
                    </svg>
                  </div>

                  {/* Ombre */}
                  {ballAnimating && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-6 h-2 bg-black/30 rounded-full blur-sm"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Ligne de trajectoire pendant le swipe */}
            {renderSwipeLine()}

            {/* Instruction visuelle */}
            {!isShooting && !lastResult && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 animate-pulse">
                  <p className="text-white text-xs sm:text-sm font-bold flex items-center gap-2">
                    <span className="text-xl">👆</span>
                    Glissez depuis le ballon vers le but
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Résultat */}
      {lastResult && !isShooting && (
        <div
          className={`mb-6 p-4 sm:p-6 rounded-xl border-2 text-center animate-fade-in ${
            lastResult.is_winner
              ? 'bg-green-500/20 border-green-500'
              : missedShot
              ? 'bg-orange-500/20 border-orange-500'
              : 'bg-red-500/20 border-red-500'
          }`}
        >
          <div className={`text-3xl sm:text-4xl font-black mb-2 ${
            lastResult.is_winner
              ? 'text-green-400'
              : missedShot
              ? 'text-orange-400'
              : 'text-red-400'
          }`}>
            {lastResult.is_winner
              ? '⚽ BUUUUT !'
              : missedShot
              ? '🎯 HORS CADRE !'
              : '🧤 ARRÊTÉ !'}
          </div>

          {lastResult.is_winner ? (
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                +{formatCurrency(lastResult.payout)}
              </div>
              <div className="text-sm sm:text-base text-green-300">
                Multiplicateur ×{lastResult.multiplier}
              </div>
            </div>
          ) : missedShot ? (
            <div className="text-base sm:text-lg text-orange-300">
              Votre tir est passé à côté du but !
            </div>
          ) : (
            <div className="text-base sm:text-lg text-red-300">
              Le gardien a stoppé votre tir !
            </div>
          )}
        </div>
      )}

      {/* Contrôles de mise */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 space-y-4">
        {/* Montant */}
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
            className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-lg text-white text-center text-xl font-bold focus:outline-none focus:border-yellow-500 transition-colors"
            disabled={isShooting || isPlaying}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Min: {formatCurrency(game.min_bet)}</span>
            <span>Max: {formatCurrency(game.max_bet)}</span>
          </div>
        </div>

        {/* Boutons de mise rapide */}
        <div className="grid grid-cols-4 gap-2">
          {quickBetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className="px-3 py-2 bg-dark-300 hover:bg-dark-100 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              disabled={isShooting || isPlaying}
            >
              {amount >= 1000 ? `${amount/1000}K` : amount}
            </button>
          ))}
        </div>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Taux de réussite</div>
          <div className="text-lg font-bold text-green-400">{game.win_frequency}%</div>
        </div>

        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">RTP</div>
          <div className="text-lg font-bold text-yellow-400">{game.rtp}%</div>
        </div>
      </div>

      {/* Modal de résultat */}
      <GameResultModal
        result={showResultModal ? modalResult : null}
        onClose={() => {
          setShowResultModal(false)
          setModalResult(null)
        }}
      />

      {/* Animations CSS */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

Penalty.propTypes = {
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
