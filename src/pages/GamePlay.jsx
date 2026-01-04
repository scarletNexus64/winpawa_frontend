import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { gameService } from '../services/gameService'
import { walletService } from '../services/walletService'
import { useGameStore } from '../store/gameStore'
import { useWalletStore } from '../store/walletStore'
import { GAME_TYPES, validateBetAmount, formatCurrency } from '../config/gameConfig'
import GameLayout from '../layouts/GameLayout'
import AppleOfFortune from '../components/games/AppleOfFortune'
import ScratchCard from '../components/games/ScratchCard'
import toast from 'react-hot-toast'

export default function GamePlay() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { currentGame, setCurrentGame } = useGameStore()
  const { wallet, setWallet, updateBalance } = useWalletStore()
  const [betAmount, setBetAmount] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameResult, setGameResult] = useState(null)

  useEffect(() => {
    loadGame()
    loadWallet()
  }, [slug])

  const loadGame = async () => {
    try {
      const response = await gameService.getGame(slug)
      const gameData = response.data || response

      // 🔍 DEBUG: Log game configuration
      console.log('🎮 ===== GAME CONFIGURATION =====')
      console.log('📊 Game Name:', gameData.name)
      console.log('🎯 Win Frequency (%):', gameData.win_frequency)
      console.log('💰 RTP (%):', gameData.rtp)
      console.log('🎲 Multipliers:', gameData.multipliers)
      console.log('⚙️ Settings:', gameData.settings)
      console.log('💵 Min Bet:', gameData.min_bet)
      console.log('💵 Max Bet:', gameData.max_bet)
      console.log('🎮 ================================')

      setCurrentGame(gameData)
      setBetAmount(gameData.min_bet || 100)
    } catch (error) {
      toast.error('Jeu introuvable')
      navigate('/games')
    }
  }

  const loadWallet = async () => {
    try {
      const response = await walletService.getBalance()
      const walletData = response.data || response
      setWallet(walletData)
    } catch (error) {
      console.error('Erreur lors du chargement du wallet:', error)
    }
  }

  const handleBet = async (amount, choice = 'auto') => {
    // Validate bet amount
    const validation = validateBetAmount(
      amount,
      currentGame.min_bet,
      currentGame.max_bet,
      wallet?.total_balance || 0
    )

    if (!validation.valid) {
      toast.error(validation.message)
      return null
    }

    try {
      setIsPlaying(true)
      setGameResult(null)

      const response = await gameService.playGame(slug, {
        amount: amount,
        choice: choice,
      })

      const data = response.data || response

      // 🔍 DEBUG: Log bet result
      console.log('\n🎲 ========== BET RESULT ==========')
      console.log('🎯 Is Winner:', data.bet.is_winner ? '✅ VICTOIRE' : '❌ DÉFAITE')
      console.log('💵 Bet Amount:', data.bet.amount)
      console.log('🎁 Payout:', data.bet.payout)
      console.log('✨ Multiplier:', data.bet.multiplier + 'x')
      console.log('🔢 Result Segment:', data.bet.result)

      // Calcul détaillé
      const balanceBefore = wallet?.total_balance || 0
      const balanceAfter = data.wallet?.total_balance || 0
      const netChange = balanceAfter - balanceBefore

      console.log('\n💰 ========== WALLET CHANGE ==========')
      console.log('💰 Solde AVANT:', balanceBefore)
      console.log('💰 Solde APRÈS:', balanceAfter)
      console.log('💰 Changement NET:', netChange >= 0 ? `+${netChange}` : netChange)
      if (data.bet.is_winner) {
        console.log('✅ GAIN TOTAL: +' + (data.bet.payout - data.bet.amount))
        console.log('   (Payout ' + data.bet.payout + ' - Mise ' + data.bet.amount + ')')
      } else {
        console.log('❌ PERTE: -' + data.bet.amount)
      }
      console.log('🎲 =====================================\n')

      setGameResult(data.bet)

      // DON'T update wallet immediately - let the game component do it after animation
      // Return both bet result and wallet data to the game component
      return {
        ...data.bet,
        wallet: data.wallet // Pass wallet data to game component
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du jeu')
      return null
    } finally {
      setIsPlaying(false)
    }
  }

  const handlePlay = async () => {
    const result = await handleBet(betAmount)

    if (result) {
      if (result.is_winner) {
        toast.success(`Félicitations ! Vous avez gagné ${formatCurrency(result.payout)} !`)
      } else {
        toast.error('Pas de chance ! Réessayez.')
      }
    }
  }

  if (!currentGame) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-400">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-casino-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du jeu...</p>
        </div>
      </div>
    )
  }

  return (
    <GameLayout game={currentGame}>
      <div className="max-w-6xl mx-auto">
      {/* Game Area */}
      <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* Render game-specific component based on type */}
        {currentGame.type === GAME_TYPES.ROULETTE ? (
          <AppleOfFortune
            game={currentGame}
            onBet={handleBet}
            isPlaying={isPlaying}
          />
        ) : currentGame.type === GAME_TYPES.SCRATCH_CARD ? (
          <ScratchCard
            game={currentGame}
            onBet={handleBet}
            isPlaying={isPlaying}
          />
        ) : (
          <div className="aspect-video bg-dark-300 rounded-xl flex items-center justify-center mb-6 relative overflow-hidden">
            {gameResult ? (
              <div className={`text-center ${gameResult.is_winner ? 'animate-bounce' : ''}`}>
                <div className={`text-6xl mb-4 ${gameResult.is_winner ? 'text-casino-gold' : 'text-gray-500'}`}>
                  {gameResult.is_winner ? '🎉' : '😢'}
                </div>
                <p className={`text-2xl font-bold ${gameResult.is_winner ? 'text-casino-gold' : 'text-gray-400'}`}>
                  {gameResult.is_winner ? `+${formatCurrency(gameResult.payout)}` : 'Perdu'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-8xl mb-4">🎮</div>
                <p className="text-gray-400">Placez votre mise et jouez</p>
              </div>
            )}
          </div>
        )}

        {/* Bet Controls - Only show for non-game-specific components */}
        {currentGame.type !== GAME_TYPES.ROULETTE && currentGame.type !== GAME_TYPES.SCRATCH_CARD && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Montant de la mise
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={currentGame.min_bet}
                max={currentGame.max_bet}
                step={100}
                className="input w-full text-center text-xl font-bold"
                disabled={isPlaying}
              />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>Min: {formatCurrency(currentGame.min_bet)}</span>
                <span>Max: {formatCurrency(currentGame.max_bet)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className="btn-secondary text-sm py-2"
                  disabled={isPlaying}
                >
                  {amount}
                </button>
              ))}
            </div>

            <button
              onClick={handlePlay}
              disabled={isPlaying || !wallet || wallet.total_balance < betAmount}
              className="btn-primary w-full text-lg font-bold"
            >
              {isPlaying ? 'En cours...' : 'Jouer'}
            </button>

            <div className="text-center text-sm text-gray-400">
              Solde disponible: {formatCurrency(wallet?.total_balance || 0)}
            </div>
          </div>
        )}
      </div>
      </div>
    </GameLayout>
  )
}
