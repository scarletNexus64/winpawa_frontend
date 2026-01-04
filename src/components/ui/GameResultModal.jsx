import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { formatCurrency } from '../../config/gameConfig'

/**
 * Animated modal to show game win/loss results
 */
export default function GameResultModal({ result, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (result) {
      // Show modal with animation
      setIsVisible(true)

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [result])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
      onClose()
    }, 300)
  }

  if (!isVisible || !result) return null

  const isWinner = result.is_winner
  const amount = isWinner ? result.payout : result.amount
  const walletChange = result.wallet?.total_balance
  const previousBalance = walletChange ? (isWinner ? walletChange - result.payout : walletChange + result.amount) : 0

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative max-w-md w-full mx-4 sm:mx-auto transform transition-all duration-300 ${
          isClosing ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Content */}
        <div
          className={`relative rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center overflow-hidden ${
            isWinner
              ? 'bg-gradient-to-br from-green-600 to-green-800 border-2 sm:border-4 border-green-400'
              : 'bg-gradient-to-br from-red-600 to-red-800 border-2 sm:border-4 border-red-400'
          }`}
        >
          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            {isWinner && (
              <>
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-400/20 rounded-full animate-ping" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full animate-ping animation-delay-300" />
              </>
            )}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div className="text-6xl sm:text-8xl mb-3 sm:mb-4 animate-bounce">
              {isWinner ? '🎉' : '😢'}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
              {isWinner ? 'Félicitations !' : 'Dommage !'}
            </h2>

            {/* Result text */}
            <p className="text-base sm:text-xl text-white/90 mb-4 sm:mb-6">
              {isWinner ? 'Vous avez gagné' : 'Vous avez perdu'}
            </p>

            {/* Amount */}
            <div className="bg-black/30 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="text-3xl sm:text-5xl font-bold text-white mb-2">
                {isWinner ? '+' : '-'}{formatCurrency(amount)}
              </div>
              {isWinner && result.multiplier && (
                <div className="text-base sm:text-lg text-yellow-300">
                  Multiplicateur: {result.multiplier}x
                </div>
              )}
            </div>

            {/* Wallet balance change */}
            {walletChange !== undefined && (
              <div className="space-y-2 text-white/80 text-sm sm:text-base">
                <div className="flex items-center justify-between">
                  <span>Solde précédent:</span>
                  <span className="font-semibold">{formatCurrency(previousBalance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{isWinner ? 'Gain:' : 'Perte:'}</span>
                  <span className={`font-semibold ${isWinner ? 'text-green-300' : 'text-red-300'}`}>
                    {isWinner ? '+' : '-'}{formatCurrency(amount)}
                  </span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Nouveau solde:</span>
                    <span className="text-yellow-300">{formatCurrency(walletChange)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className="mt-4 sm:mt-6 px-6 sm:px-8 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 text-white text-sm sm:text-base font-semibold rounded-lg transition-colors"
            >
              Continuer à jouer
            </button>
          </div>

          {/* Confetti effect for wins */}
          {isWinner && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

GameResultModal.propTypes = {
  result: PropTypes.shape({
    is_winner: PropTypes.bool,
    payout: PropTypes.number,
    amount: PropTypes.number,
    multiplier: PropTypes.number,
    wallet: PropTypes.shape({
      main_balance: PropTypes.number,
      bonus_balance: PropTypes.number,
      total_balance: PropTypes.number,
    }),
  }),
  onClose: PropTypes.func.isRequired,
}
