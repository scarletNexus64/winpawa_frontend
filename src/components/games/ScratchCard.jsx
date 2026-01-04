import { useState, useEffect } from 'react'
import { formatCurrency, validateBetAmount } from '../../config/gameConfig'
import { useWalletStore } from '../../store/walletStore'
import { useGameAudio } from '../../hooks/useGameAudio'
import GameResultModal from '../ui/GameResultModal'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'

/**
 * CARTE À GRATTER - VERSION SIMPLE
 *
 * Principe simplifié :
 * - Cliquez sur une carte pour la révéler
 * - Après 3 cartes révélées, tout se révèle automatiquement
 * - Affichage du résultat (gain ou perte)
 */
export default function ScratchCard({ game, onBet, isPlaying }) {
  const [scratchedCells, setScratchedCells] = useState([])
  const [revealedSymbols, setRevealedSymbols] = useState([])
  const [betAmount, setBetAmount] = useState(game.min_bet || 100)
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const { wallet, setWallet } = useWalletStore()
  const { playWinSound, playLoseSound, playClickSound } = useGameAudio()

  // Configuration des symboles (mapping backend → frontend)
  const symbolMap = {
    'star': '⭐',
    'diamond': '💎',
    'heart': '❤️',
    'club': '♣️',
    'spade': '♠️',
  }

  const gridSize = game.settings?.cards_count || 9
  const revealThreshold = 3 // Nombre de cartes à révéler avant auto-reveal

  /**
   * Parse les symboles du backend
   */
  const parseResultSymbols = (resultString) => {
    if (!resultString) return []
    const backendSymbols = resultString.split(',')
    return backendSymbols.map(s => symbolMap[s.trim()] || '⭐')
  }

  /**
   * Révèle une carte au clic
   */
  const handleCardClick = (index) => {
    if (!gameStarted || scratchedCells.includes(index)) return

    console.log(`🎫 Revealing card ${index}`)
    playClickSound()
    setScratchedCells(prev => [...prev, index])
  }

  /**
   * Lance une nouvelle partie
   */
  const handlePlay = async () => {
    if (isPlaying || gameStarted) return

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
      // Réinitialiser l'état
      setScratchedCells([])
      setRevealedSymbols([])
      setGameStarted(false)
      setModalResult(null)
      setShowResultModal(false)

      // Son de clic
      playClickSound()

      // Appeler l'API
      const result = await onBet(betAmount, 'auto')

      if (result?.result) {
        // Parser les symboles
        const symbols = parseResultSymbols(result.result)
        console.log('🎫 Game started! Symbols:', symbols)
        setRevealedSymbols(symbols)
        setModalResult(result)
        setGameStarted(true)

        // Mettre à jour le wallet immédiatement
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
      }
    } catch (error) {
      console.error('Erreur lors du pari:', error)
      toast.error('Erreur lors du lancement du jeu')
    }
  }

  /**
   * Auto-révèle toutes les cartes après le seuil atteint
   */
  useEffect(() => {
    if (gameStarted && scratchedCells.length === revealThreshold && scratchedCells.length < gridSize) {
      console.log('🎯 Threshold reached! Auto-revealing all cards...')

      // Révéler toutes les cartes progressivement
      setTimeout(() => {
        setScratchedCells([...Array(gridSize).keys()])
      }, 500)
    }
  }, [scratchedCells, gameStarted, gridSize])

  /**
   * Affiche le résultat final quand toutes les cartes sont révélées
   */
  useEffect(() => {
    if (gameStarted && scratchedCells.length === gridSize && modalResult) {
      console.log('🎉 All cards revealed! Showing result...')

      setTimeout(() => {
        setShowResultModal(true)

        // Jouer le son
        if (modalResult.is_winner) {
          playWinSound()
        } else {
          playLoseSound()
        }
      }, 1000)
    }
  }, [scratchedCells, gameStarted, gridSize, modalResult])

  /**
   * Obtenir les infos de victoire
   */
  const getWinningInfo = () => {
    if (!revealedSymbols.length) return null

    const symbolCounts = {}
    revealedSymbols.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1
    })

    const maxCount = Math.max(...Object.values(symbolCounts))
    const winningSymbol = Object.keys(symbolCounts).find(
      symbol => symbolCounts[symbol] === maxCount
    )

    return { symbol: winningSymbol, count: maxCount }
  }

  /**
   * Compte les symboles révélés
   */
  const getVisibleSymbolCounts = () => {
    if (scratchedCells.length === 0) return null

    const visibleSymbols = scratchedCells.map(index => revealedSymbols[index])
    const counts = {}

    visibleSymbols.forEach(symbol => {
      counts[symbol] = (counts[symbol] || 0) + 1
    })

    return counts
  }

  const winningInfo = getWinningInfo()
  const visibleCounts = getVisibleSymbolCounts()

  return (
    <div className="relative">
      {/* Zone de jeu */}
      <div className="relative w-full max-w-2xl mx-auto mb-8">
        {/* Grille de cartes à gratter */}
        <div className="bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-900 p-6 rounded-2xl shadow-2xl border-4 border-yellow-500">
          {/* Titre */}
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg">
              🎫 Carte à Gratter
            </h3>
            {!gameStarted && (
              <p className="text-yellow-200 text-sm mt-1">
                Cliquez sur les cartes pour les révéler !
              </p>
            )}
            {gameStarted && scratchedCells.length < revealThreshold && (
              <p className="text-yellow-200 text-sm mt-1">
                Cliquez sur {revealThreshold - scratchedCells.length} carte(s) de plus...
              </p>
            )}
          </div>

          {/* Grille 3x3 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Array.from({ length: gridSize }).map((_, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(index)}
                className={`relative aspect-square rounded-xl overflow-hidden shadow-xl border-2 transition-all duration-300 ${
                  scratchedCells.includes(index)
                    ? 'border-green-400 bg-white cursor-default'
                    : gameStarted
                    ? 'border-gray-300 bg-gradient-to-br from-gray-300 to-gray-400 cursor-pointer hover:scale-105 hover:shadow-2xl'
                    : 'border-gray-300 bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed'
                }`}
              >
                {/* Carte non grattée */}
                {!scratchedCells.includes(index) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-2">🎫</div>
                      {gameStarted && (
                        <div className="text-white text-xs font-bold bg-black/20 px-2 py-1 rounded">
                          CLIQUEZ
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Carte révélée */}
                {scratchedCells.includes(index) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white animate-flip">
                    <span className="text-6xl select-none animate-bounce-once">
                      {revealedSymbols[index] || '?'}
                    </span>
                  </div>
                )}

                {/* Indicateur de carte révélée */}
                {scratchedCells.includes(index) && (
                  <div className="absolute inset-0 border-4 border-green-400 rounded-xl pointer-events-none animate-pulse-once" />
                )}
              </div>
            ))}
          </div>

          {/* Compteur de symboles en temps réel */}
          {gameStarted && scratchedCells.length > 0 && scratchedCells.length < gridSize && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
              <p className="text-white text-center text-sm font-medium mb-2">
                📊 Symboles découverts ({scratchedCells.length}/{gridSize})
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {visibleCounts && Object.entries(visibleCounts).map(([symbol, count]) => (
                  <div key={symbol} className="bg-white/30 rounded-lg px-3 py-1 flex items-center gap-1">
                    <span className="text-2xl">{symbol}</span>
                    <span className="text-white font-bold">×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résultat final */}
          {winningInfo && scratchedCells.length === gridSize && (
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4 border-2 border-white/30">
              {winningInfo.count >= 3 ? (
                <div className="space-y-2">
                  <div className="text-5xl animate-bounce">{winningInfo.symbol}</div>
                  <p className="text-white text-xl font-bold">
                    × {winningInfo.count} symboles !
                  </p>
                  <p className="text-yellow-300 text-2xl font-extrabold drop-shadow-lg">
                    🎉 GAGNANT ! 🎉
                  </p>
                  <p className="text-white text-lg">
                    Multiplicateur: {modalResult?.multiplier}x
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-200 text-lg">Pas de correspondance</p>
                  <p className="text-white text-sm">
                    Maximum: {winningInfo.symbol} × {winningInfo.count}
                  </p>
                  <p className="text-red-300 text-xl font-bold">
                    Réessayez ! 🎯
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
            disabled={gameStarted || isPlaying}
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
              disabled={gameStarted || isPlaying}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Bouton Jouer */}
        <button
          onClick={handlePlay}
          disabled={gameStarted || isPlaying || !wallet || wallet.total_balance < betAmount}
          className="w-full py-4 bg-gradient-to-r from-casino-gold to-yellow-500 hover:from-yellow-500 hover:to-casino-gold text-dark-400 font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
        >
          {gameStarted ? '🎫 Cliquez sur les cartes...' : isPlaying ? 'En cours...' : '🎫 Nouvelle Carte'}
        </button>

        {/* Solde */}
        <div className="text-center text-sm text-gray-400">
          Solde disponible: <span className="text-white font-semibold">{formatCurrency(wallet?.total_balance || 0)}</span>
        </div>
      </div>

      {/* Informations du jeu */}
      <div className="text-center text-sm text-gray-400 space-y-1 mt-6 bg-dark-200 rounded-lg p-4 border border-dark-100">
        <p className="text-yellow-400 font-semibold">
          🎰 Multiplicateurs: {game.multipliers?.join('x, ')}x
        </p>
        <p>RTP: {game.rtp}% | Taux de gain: {game.win_frequency}%</p>
        <p className="text-xs text-gray-500">
          Trouvez 3+ symboles identiques pour gagner !
        </p>
      </div>

      {/* Modal de résultat */}
      <GameResultModal
        result={showResultModal ? modalResult : null}
        onClose={() => {
          setShowResultModal(false)
          setModalResult(null)
          setGameStarted(false)
          setRevealedSymbols([])
          setScratchedCells([])
        }}
      />
    </div>
  )
}

ScratchCard.propTypes = {
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
