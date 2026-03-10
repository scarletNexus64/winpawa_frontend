import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'
import { useWalletStore } from '../store/walletStore'
import { useAudioStore } from '../store/audioStore'
import { formatCurrency } from '../config/gameConfig'
import PropTypes from 'prop-types'

/**
 * Fullscreen immersive game layout
 */
export default function GameLayout({ children, game, onExit }) {
  const navigate = useNavigate()
  const wallet = useWalletStore((state) => state.wallet)
  const { isMuted, toggleMute } = useAudioStore()
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Debug: Log wallet changes
  useEffect(() => {
    console.log('💳 GameLayout: Wallet state updated:', wallet?.total_balance)
  }, [wallet])

  const handleExit = () => {
    if (onExit) {
      onExit()
    }
    navigate('/games')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-dark-400 via-dark-300 to-dark-400 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-casino-gold rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-casino-purple rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-casino-green rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Top bar */}
      <div className="relative z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Game title */}
          <div>
            <h1 className="text-base sm:text-xl font-gaming font-bold text-white drop-shadow-lg whitespace-nowrap">
              {game?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Wallet balance */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
            <p className="text-xs text-gray-400 mb-1">Solde</p>
            <p className="text-lg font-bold text-casino-gold" key={wallet?.total_balance}>
              {(() => {
                const balance = wallet?.total_balance || 0
                console.log('🖥️ Rendering balance:', balance)
                return formatCurrency(balance)
              })()}
            </p>
          </div>

          {/* Sound toggle */}
          <button
            onClick={toggleMute}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center transition-all"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Fullscreen toggle - Hidden on mobile */}
          <button
            onClick={toggleFullscreen}
            className="hidden md:flex w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl items-center justify-center transition-all"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Game content */}
      <div className="relative z-10 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>

      {/* Bottom particles effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
    </div>
  )
}

GameLayout.propTypes = {
  children: PropTypes.node.isRequired,
  game: PropTypes.shape({
    name: PropTypes.string,
    rtp: PropTypes.number,
  }),
  onExit: PropTypes.func,
}
