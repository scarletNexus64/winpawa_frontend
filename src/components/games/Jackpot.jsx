import { useState } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * JACKPOT Game Component (Roue de fortune type Jackpot)
 *
 * Configuration backend:
 * - Type: jackpot
 * - RTP: 75%
 * - Win Frequency: 25%
 * - Multiplicateurs: [2, 3, 5, 10]
 * - Settings: segments (6)
 * - Choice: "auto" (pas de choix du joueur)
 * - Retourne: Un segment (1-6)
 */
export default function Jackpot({ game, onBet, isPlaying }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [lastResult, setLastResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [landedSegment, setLandedSegment] = useState(null)
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Nombre de segments
  const segmentsCount = game.settings?.segments || 6

  // Configuration des segments - Alternance WIN/LOSE
  // Le backend retourne un segment (1-6), on doit afficher WIN ou LOSE
  const segments = [
    { id: 1, isWin: false, label: 'PERDU', color: '#6b7280' }, // Gris
    { id: 2, isWin: true, label: 'BONUS', color: '#fbbf24', multiplier: game.multipliers?.[0] || 2 }, // Jaune
    { id: 3, isWin: false, label: 'PERDU', color: '#6b7280' }, // Gris
    { id: 4, isWin: true, label: 'BONUS', color: '#fbbf24', multiplier: game.multipliers?.[1] || 3 }, // Jaune
    { id: 5, isWin: false, label: 'PERDU', color: '#6b7280' }, // Gris
    { id: 6, isWin: true, label: 'BONUS', color: '#fbbf24', multiplier: game.multipliers?.[2] || 5 }, // Jaune
  ].slice(0, segmentsCount)

  /**
   * Animation de la roue
   * Le backend retourne un segment, mais on doit faire correspondre avec isWinner
   * L'aiguille est fixe en HAUT, donc la roue doit tourner pour que le segment arrive EN HAUT
   */
  const spinWheel = async (backendSegmentId, isWinner) => {
    setIsSpinning(true)
    setLastResult(null)
    setLandedSegment(null)

    const spinDuration = 4000 // 4 secondes
    const minSpins = 5 // Minimum 5 tours complets

    // Trouver un segment qui correspond au résultat (win ou lose)
    // Si isWinner = true, choisir un segment BONUS
    // Si isWinner = false, choisir un segment PERDU
    const matchingSegments = segments.filter(s => s.isWin === isWinner)

    // Utiliser le segment du backend comme index dans les segments correspondants
    const segmentIndex = (parseInt(backendSegmentId) - 1) % matchingSegments.length
    const targetSegment = matchingSegments[segmentIndex]

    // Trouver l'index réel de ce segment dans la roue complète
    const targetSegmentIndex = segments.findIndex(s => s.id === targetSegment.id)

    // Calculer l'angle pour amener le segment sous l'aiguille (en haut = 270°)
    const degreesPerSegment = 360 / segmentsCount

    // L'angle de départ du segment (segment 0 commence à -90° dans notre SVG)
    const segmentStartAngle = targetSegmentIndex * degreesPerSegment - 90

    // L'angle du centre du segment
    const segmentCenterAngle = segmentStartAngle + (degreesPerSegment / 2)

    // Pour que le segment arrive en haut (270°), on doit tourner de :
    // On veut que segmentCenterAngle + rotation = 270° (modulo 360)
    // Donc rotation = 270 - segmentCenterAngle
    let angleToTop = 270 - segmentCenterAngle

    // Normaliser l'angle pour qu'il soit positif
    while (angleToTop < 0) {
      angleToTop += 360
    }
    while (angleToTop >= 360) {
      angleToTop -= 360
    }

    // Ajouter les tours complets + l'angle final
    const finalAngle = minSpins * 360 + angleToTop

    // Animation de rotation
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / spinDuration, 1)

      // Easing function pour ralentir progressivement
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const rotation = easeOut * finalAngle

      setCurrentRotation(rotation)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        setLandedSegment(targetSegment.id)
      }
    }

    requestAnimationFrame(animate)
    return spinDuration
  }

  /**
   * Lancer le jeu
   */
  const handlePlay = async () => {
    if (isSpinning || isPlaying) {
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

      // Faire le pari via le parent (choice = "auto" pour jackpot)
      const result = await onBet(betAmount, 'auto')

      if (result?.result) {
        const winningSegment = result.result
        const isWinner = result.is_winner

        // Sauvegarder le résultat pour la modal
        setModalResult(result)

        // Lancer l'animation de la roue avec le résultat
        const animationDuration = await spinWheel(winningSegment, isWinner)

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
            console.log('💰 Updating wallet after jackpot:', newWallet.total_balance)
            setWallet(newWallet)
          }
        }, animationDuration + 500)
      }
    } catch (error) {
      console.error('Bet error:', error)
    }
  }

  return (
    <div className="relative">
      {/* Zone de jeu */}
      <div className="relative w-full mx-auto mb-6">
        {/* Cadre du Jackpot */}
        <div className="bg-gradient-to-br from-yellow-700 via-yellow-600 to-amber-700 p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border-4 sm:border-8 border-yellow-500">
          {/* Titre */}
          <div className="text-center mb-3 sm:mb-5">
            <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-1 sm:mb-2 tracking-wider">
              💰 JACKPOT 💰
            </h3>
            <p className="text-yellow-200 text-xs sm:text-sm font-semibold">
              Tournez la roue et gagnez jusqu&apos;à 10x !
            </p>
          </div>

          {/* Roue de fortune */}
          <div className="relative w-full max-w-md mx-auto mb-4 sm:mb-6">
            {/* Indicateur (flèche en haut) */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-10">
              <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-r-[15px] sm:border-r-[20px] border-t-[25px] sm:border-t-[35px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg"></div>
            </div>

            {/* Roue */}
            <div className="relative aspect-square">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full drop-shadow-2xl"
                style={{
                  transform: `rotate(${currentRotation}deg)`,
                  transition: isSpinning ? 'none' : 'transform 0.5s ease-out'
                }}
              >
                {/* Bordure extérieure */}
                <circle cx="100" cy="100" r="98" fill="#1a1a1a" />
                <circle cx="100" cy="100" r="95" fill="#2a2a2a" />

                {/* Segments */}
                {segments.map((segment, index) => {
                  const angle = (360 / segmentsCount) * index
                  const nextAngle = (360 / segmentsCount) * (index + 1)
                  const startRad = (angle - 90) * (Math.PI / 180)
                  const endRad = (nextAngle - 90) * (Math.PI / 180)

                  const x1 = 100 + 90 * Math.cos(startRad)
                  const y1 = 100 + 90 * Math.sin(startRad)
                  const x2 = 100 + 90 * Math.cos(endRad)
                  const y2 = 100 + 90 * Math.sin(endRad)

                  const largeArcFlag = (nextAngle - angle) > 180 ? 1 : 0

                  return (
                    <g key={segment.id}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        style={{
                          fill: segment.color
                        }}
                        stroke="#fff"
                        strokeWidth="2"
                      />
                    </g>
                  )
                })}

                {/* Labels sur les segments */}
                {segments.map((segment, index) => {
                  const angle = (360 / segmentsCount) * index + (360 / segmentsCount) / 2
                  const rad = (angle - 90) * (Math.PI / 180)
                  const x = 100 + 60 * Math.cos(rad)
                  const y = 100 + 60 * Math.sin(rad)

                  return (
                    <g key={`text-${segment.id}`}>
                      {segment.isWin ? (
                        <>
                          <text
                            x={x}
                            y={y - 5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-black fill-black"
                            style={{ fontSize: '14px' }}
                          >
                            {segment.label}
                          </text>
                          <text
                            x={x}
                            y={y + 10}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-bold fill-black"
                            style={{ fontSize: '12px' }}
                          >
                            ×{segment.multiplier}
                          </text>
                        </>
                      ) : (
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="font-black fill-white"
                          style={{ fontSize: '12px' }}
                        >
                          {segment.label}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Centre de la roue */}
                <circle cx="100" cy="100" r="20" fill="#fbbf24" stroke="#fff" strokeWidth="3" />
                <text
                  x="100"
                  y="105"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-black fill-black"
                  style={{ fontSize: '12px' }}
                >
                  SPIN
                </text>
              </svg>
            </div>
          </div>

          {/* Résultat du jeu */}
          {lastResult && !isSpinning && landedSegment && (
            <div
              className={`text-center mb-3 sm:mb-5 p-3 sm:p-5 rounded-lg sm:rounded-xl border-2 sm:border-4 animate-fade-in ${
                lastResult.is_winner
                  ? 'bg-green-500/30 border-green-400'
                  : 'bg-red-500/30 border-red-400'
              }`}
            >
              <p className={`text-lg sm:text-2xl md:text-3xl font-black mb-1 sm:mb-2 ${
                lastResult.is_winner ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {lastResult.is_winner ? '💰 BONUS ! 💰' : '😢 PERDU !'}
              </p>

              {lastResult.is_winner ? (
                <div>
                  <p className="text-yellow-200 text-xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2">
                    +{formatCurrency(lastResult.payout)}
                  </p>
                  <p className="text-yellow-300 text-sm sm:text-lg font-bold">
                    Multiplicateur: ×{lastResult.multiplier}
                  </p>
                  <p className="text-yellow-200 text-xs sm:text-sm mt-1 sm:mt-2">
                    L&apos;aiguille s&apos;est arrêtée sur BONUS !
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-red-300 text-base sm:text-xl font-bold">
                    Pas de chance
                  </p>
                  <p className="text-red-200 text-[10px] sm:text-xs mt-1">
                    L&apos;aiguille s&apos;est arrêtée sur PERDU - Réessayez !
                  </p>
                </div>
              )}
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
            disabled={isSpinning || isPlaying}
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
              disabled={isSpinning || isPlaying}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={isSpinning || isPlaying || !wallet || wallet.total_balance < betAmount}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {isSpinning ? '🎰 La roue tourne...' : isPlaying ? 'En cours...' : '🎰 Tourner la roue !'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Tableau des gains possibles */}
      <div className="mt-4 sm:mt-6 bg-dark-200 rounded-lg p-3 sm:p-4 border border-dark-100">
        <h4 className="text-center text-sm sm:text-base font-bold text-yellow-400 mb-2 sm:mb-3">
          💰 Gains possibles
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="text-center p-3 bg-gray-600 rounded border-2 border-gray-500">
            <p className="text-white font-black text-sm sm:text-base mb-1">PERDU</p>
            <p className="text-gray-300 text-xs">Pas de gain</p>
          </div>
          <div className="text-center p-3 bg-yellow-500 rounded border-2 border-yellow-400">
            <p className="text-black font-black text-sm sm:text-base mb-1">BONUS</p>
            <p className="text-black text-xs">×2, ×3 ou ×5</p>
          </div>
        </div>
        <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2">
          Tentez de décrocher le BONUS !
        </p>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-xs sm:text-sm text-gray-400 space-y-1 mt-4 bg-dark-200 rounded-lg p-3 sm:p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold">
          🎰 Multiplicateurs: {game.multipliers?.join('x, ')}x
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500">
          La roue tourne et s&apos;arrête sur un segment - Bonne chance !
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
      `}</style>
    </div>
  )
}

Jackpot.propTypes = {
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
