import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Lock } from 'lucide-react'

export default function SportsCard({ sport, index }) {
  const isInactive = sport.is_active === false

  const getIcon = (type) => {
    const icons = {
      football: '⚽',
      basketball: '🏀',
      tennis: '🎾',
      virtual: '🎮',
    }
    return icons[type] || '🏆'
  }

  const CardWrapper = isInactive ? 'div' : Link
  const cardProps = isInactive
    ? { className: "block group cursor-not-allowed" }
    : { to: sport.link, className: "block group" }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <CardWrapper {...cardProps}>
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-dark-200 to-dark-300 border border-gray-800/50 transition-all duration-300 ${
          isInactive
            ? 'opacity-60 grayscale'
            : 'hover:border-casino-gold/50 hover:shadow-xl hover:shadow-casino-gold/10 hover:-translate-y-1'
        }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('/grid.svg')]"></div>
          </div>

          {/* Gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-casino-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative p-4">
            {/* Inactive Overlay */}
            {isInactive && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center border-2 border-gray-600">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
                <div className="px-3 py-1 bg-gray-700/70 backdrop-blur-sm border border-gray-600 rounded-full">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Coming Soon</span>
                </div>
              </div>
            )}

            {/* Icon & Badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                {getIcon(sport.type)}
              </div>
              {!isInactive && sport.live && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-white mb-1 text-sm group-hover:text-casino-gold transition-colors">
              {sport.name}
            </h3>
            <p className="text-xs text-gray-400 mb-3">{sport.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1 text-gray-400">
                <TrendingUp className="w-3 h-3" />
                <span>{sport.matches} matchs</span>
              </div>
              {sport.upcoming && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{sport.upcoming}</span>
                </div>
              )}
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          </div>
        </div>
      </CardWrapper>
    </motion.div>
  )
}
