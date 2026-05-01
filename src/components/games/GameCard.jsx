import { Link } from 'react-router-dom'
import { Sparkles, Play, Lock } from 'lucide-react'
import { memo } from 'react'

const GameCard = memo(function GameCard({ game }) {
  const isInactive = game.is_active === false
  const isNotConfigured = game.is_configured === false
  const isDisabled = isInactive || isNotConfigured
  const getGameIcon = (type) => {
    const icons = {
      roulette: '🎰',
      scratch_card: '🎫',
      coin_flip: '🪙',
      dice: '🎲',
      rock_paper_scissors: '✊',
      treasure_box: '🎁',
      lucky_number: '🍀',
      jackpot: '💎',
      penalty: '⚽',
      ludo: '🎯',
      quiz: '❓',
      color_roulette: '🌈',
    }
    return icons[type] || '🎮'
  }

  const getGradient = (type) => {
    const gradients = {
      roulette: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
      scratch_card: 'from-yellow-500/20 via-orange-500/20 to-red-500/20',
      coin_flip: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
      dice: 'from-green-500/20 via-emerald-500/20 to-green-500/20',
      rock_paper_scissors: 'from-red-500/20 via-rose-500/20 to-red-500/20',
      treasure_box: 'from-yellow-500/20 via-amber-500/20 to-yellow-500/20',
      lucky_number: 'from-green-500/20 via-teal-500/20 to-green-500/20',
      jackpot: 'from-purple-500/20 via-fuchsia-500/20 to-purple-500/20',
      penalty: 'from-green-500/20 via-lime-500/20 to-green-500/20',
      ludo: 'from-blue-500/20 via-indigo-500/20 to-blue-500/20',
      quiz: 'from-orange-500/20 via-yellow-500/20 to-orange-500/20',
      color_roulette: 'from-pink-500/20 via-purple-500/20 to-pink-500/20',
    }
    return gradients[type] || 'from-gray-500/20 via-gray-600/20 to-gray-500/20'
  }

  const CardWrapper = isDisabled ? 'div' : Link
  const cardProps = isDisabled
    ? { className: "group block cursor-not-allowed" }
    : { to: `/games/${game.slug}`, className: "group block" }

  return (
    <CardWrapper {...cardProps}>
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-200 to-dark-300 border border-gray-800/50 transition-all duration-500 ${
        isDisabled
          ? 'opacity-60 grayscale'
          : 'hover:border-casino-gold/50 hover:shadow-2xl hover:shadow-casino-gold/20 hover:-translate-y-1'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/grid.svg')]"></div>
        </div>

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(game.type)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

        {/* Game Image/Icon */}
        <div className="relative aspect-[4/3] flex items-center justify-center p-6">
          {game.thumbnail ? (
            <img
              src={game.thumbnail}
              alt={game.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-lg"
            />
          ) : (
            <div className="text-7xl group-hover:scale-110 transition-transform duration-500 filter drop-shadow-lg">
              {getGameIcon(game.type)}
            </div>
          )}

          {/* Play Button Overlay or Inactive/Not Configured Overlay */}
          {isDisabled ? (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center border-2 border-gray-600">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <div className="px-4 py-1.5 bg-gray-700/70 backdrop-blur-sm border border-gray-600 rounded-full">
                <span className="text-sm font-bold text-gray-300 uppercase tracking-wide">
                  {isNotConfigured ? 'En configuration' : 'Bientôt disponible'}
                </span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-casino-gold flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-casino-gold/50">
                <Play className="w-8 h-8 text-dark-500 fill-dark-500" />
              </div>
            </div>
          )}

          {/* RTP Badge */}
          {game.rtp && (
            <div className="absolute top-3 right-3">
              <div className="px-2.5 py-1 bg-dark-400/90 backdrop-blur-sm border border-casino-gold/30 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-casino-gold" />
                <span className="text-xs font-bold text-casino-gold">
                  {typeof game.rtp === 'number' ? game.rtp.toFixed(0) : game.rtp}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="relative p-4 pt-3 border-t border-gray-800/50">
          <h3 className="font-bold text-white mb-2 text-sm truncate group-hover:text-casino-gold transition-colors">
            {game.name}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Mise min</span>
              <span className="text-xs font-semibold text-gray-300">{game.min_bet} F</span>
            </div>
            <div className="h-6 w-px bg-gray-800"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Max gain</span>
              <span className="text-xs font-bold text-casino-gold">
                {game.multipliers && game.multipliers.length > 0
                  ? Math.max(...game.multipliers)
                  : game.max_multiplier || 2}x
              </span>
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>
      </div>
    </CardWrapper>
  )
})

export default GameCard
