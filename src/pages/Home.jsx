import { useEffect, useState } from 'react'
import { gameService } from '../services/gameService'
import { sportService } from '../services/sportService'
import { useGameStore } from '../store/gameStore'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import GameCard from '../components/games/GameCard'
import BannerCarousel from '../components/home/BannerCarousel'
import AdBanner from '../components/home/AdBanner'
import SportsCard from '../components/home/SportsCard'
import QuickStats from '../components/home/QuickStats'
import ShimmerLoading from '../components/ui/ShimmerLoading'
import toast from 'react-hot-toast'

export default function Home() {
  const { games, setGames, setLoading, isLoading } = useGameStore()
  const [sports, setSports] = useState([])
  const [sportsLoading, setSportsLoading] = useState(false)

  useEffect(() => {
    loadGames()
    loadSports()
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      const data = await gameService.getGames()
      if (data.success && data.data) {
        setGames(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des jeux:', error)
      toast.error('Impossible de charger les jeux')
    } finally {
      setLoading(false)
    }
  }

  const loadSports = async () => {
    try {
      setSportsLoading(true)
      const data = await sportService.getSports()
      if (data.success && data.data) {
        setSports(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sports:', error)
    } finally {
      setSportsLoading(false)
    }
  }

  // Convertir les données API en format pour SportsCard
  const sportsData = sports.map(sport => ({
    name: sport.name,
    type: sport.type,
    description: sport.description || 'Paris sportifs',
    matches: sport.matches_count || 0,
    upcoming: sport.is_virtual ? 'Dans 3min' : 'Prochainement',
    live: sport.is_live,
    is_active: sport.is_active,
    link: sport.is_virtual ? '/virtual-match' : `/sports/${sport.slug}`
  }))

  // Jeux populaires (limités à 6)
  const popularGames = games.slice(0, 6)

  // Jeux en vedette
  const featuredGames = games.filter(game => game.is_featured).slice(0, 4)

  return (
    <div className="space-y-6 md:space-y-8 pb-4">
      {/* Hero Banner */}
      <BannerCarousel />

      {/* Quick Stats */}
      <QuickStats />

      {/* Sports & Virtual Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-casino-gold to-casino-gold-dark rounded-full"></div>
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Sports & Paris
            </h2>
          </div>
          <Link
            to="/sports"
            className="flex items-center gap-1 text-xs md:text-sm text-casino-gold hover:text-casino-gold-dark transition-colors font-semibold"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {sportsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <ShimmerLoading key={i} variant="game-card" className="h-32" />
            ))}
          </div>
        ) : sportsData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {sportsData.map((sport, index) => (
              <SportsCard key={index} sport={sport} index={index} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-400">Aucun sport disponible pour le moment</p>
          </div>
        )}
      </section>

      {/* Ad Banner 1 */}
      <AdBanner type="promo" />

      {/* Jeux Populaires */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-casino-gold" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Jeux Populaires
            </h2>
          </div>
          <Link
            to="/games"
            className="flex items-center gap-1 text-xs md:text-sm text-casino-gold hover:text-casino-gold-dark transition-colors font-semibold"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <ShimmerLoading key={i} variant="game-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {popularGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <GameCard game={game} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Ad Banner 2 */}
      <AdBanner type="jackpot" />

      {/* Jeux en Vedette */}
      {featuredGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-casino-gold" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Jeux en Vedette
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <ShimmerLoading key={i} variant="game-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {featuredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <GameCard game={game} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Ad Banner 3 */}
      <AdBanner type="bonus" />

      {/* Tous les jeux - Aperçu */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-casino-gold to-casino-gold-dark rounded-full"></div>
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Tous les Jeux
            </h2>
          </div>
          <Link
            to="/games"
            className="flex items-center gap-1 px-4 py-2 bg-casino-gold hover:bg-casino-gold-dark text-dark-500 rounded-xl font-bold text-sm transition-all transform hover:scale-105"
          >
            Voir tous les jeux
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <ShimmerLoading key={i} variant="game-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {games.slice(0, 8).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <GameCard game={game} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
