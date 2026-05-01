import { useEffect, useState } from 'react'
import { gameService } from '../services/gameService'
import { sportService } from '../services/sportService'
import { useGameStore } from '../store/gameStore'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, ArrowRight, Trophy, Clock, CircleDot, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
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
  const [sportsLoading, setSportsLoading] = useState(true)
  const [popular, setPopular] = useState([])
  const [popularLoading, setPopularLoading] = useState(true)
  const [liveByCategory, setLiveByCategory] = useState({})
  const [liveLoading, setLiveLoading] = useState(true)

  useEffect(() => {
    loadGames()
    loadSports()
    loadPopularFixtures()
    loadLiveByCategory()
    // refresh live every 15s
    const id = setInterval(loadLiveByCategory, 15000)
    return () => clearInterval(id)
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      const data = await gameService.getGames()
      if (data.success && data.data) setGames(data.data)
    } catch {
      toast.error('Impossible de charger les jeux')
    } finally {
      setLoading(false)
    }
  }

  const loadSports = async () => {
    try {
      setSportsLoading(true)
      const res = await sportService.getSports()
      setSports(res?.data || [])
    } catch {
      setSports([])
    } finally {
      setSportsLoading(false)
    }
  }

  const loadPopularFixtures = async () => {
    try {
      setPopularLoading(true)
      const res = await sportService.getPopularFixtures()
      setPopular(res?.data || [])
    } catch {
      setPopular([])
    } finally {
      setPopularLoading(false)
    }
  }

  const loadLiveByCategory = async () => {
    try {
      const res = await sportService.getLiveMatches()
      const list = res?.data || []
      const grouped = list.reduce((acc, m) => {
        const sport = m.sport || 'football'
        ;(acc[sport] ||= []).push(m)
        return acc
      }, {})
      setLiveByCategory(grouped)
    } catch {
      setLiveByCategory({})
    } finally {
      setLiveLoading(false)
    }
  }

  const sportsCards = sports.map((s) => ({
    name: s.name,
    type: 'sport',
    description: s.description,
    matches: 0,
    upcoming: 'Voir les matchs',
    live: false,
    is_active: s.is_active,
    link: `/sports?sport=${s.slug}`,
    icon: s.icon,
    color: s.color,
    liveCount: 0,
  }))

  const popularGames = games.slice(0, 6)
  const featuredGames = games.filter((g) => g.is_featured).slice(0, 4)

  return (
    <div className="space-y-6 md:space-y-8 pb-4">
      <BannerCarousel />
      <QuickStats />

      {/* Section Paris Sportifs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-casino-gold to-casino-gold-dark rounded-full" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
             Sports 
            </h2>
          </div>
          <Link
            to="/sports"
            className="flex items-center gap-1 text-xs md:text-sm text-casino-gold hover:text-casino-gold-dark transition-colors font-semibold"
          >
            Voir tous les sports
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {sportsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {[...Array(5)].map((_, i) => (
              <ShimmerLoading key={i} variant="game-card" className="h-32" />
            ))}
          </div>
        ) : sportsCards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {sportsCards.map((sport, index) => (
              <Link key={sport.name} to={sport.link}>
                <SportsCard sport={sport} index={index} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#0f1923] rounded-lg border border-gray-800/50">
            <p className="text-gray-400">Aucun sport disponible pour le moment</p>
          </div>
        )}
      </section>

      {/* Section EN DIRECT par categorie */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CircleDot className="w-5 h-5 md:w-6 md:h-6 text-red-400 animate-pulse" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Matchs en direct
            </h2>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">
              {Object.values(liveByCategory).reduce((a, l) => a + l.length, 0)}
            </span>
          </div>
        </div>

        {liveLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <ShimmerLoading key={i} variant="game-card" className="h-24" />
            ))}
          </div>
        ) : Object.keys(liveByCategory).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(liveByCategory).map(([sportSlug, matches]) => (
              <LiveCategoryBlock
                key={sportSlug}
                sportSlug={sportSlug}
                sportName={sports.find((s) => s.slug === sportSlug)?.name || sportSlug}
                sportIcon={sports.find((s) => s.slug === sportSlug)?.icon}
                matches={matches}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#0f1923] rounded-lg border border-gray-800/50">
            <CircleDot className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucun match en direct pour le moment</p>
          </div>
        )}
      </section>

      {/* Section Matchs Populaires (par championnat) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-casino-gold" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Matchs Populaires
            </h2>
          </div>
        </div>

        {popularLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <ShimmerLoading key={i} variant="game-card" className="h-32" />
            ))}
          </div>
        ) : popular.length > 0 ? (
          <div className="space-y-3">
            {popular.map((group) => (
              <PopularLeagueBlock key={`${group.sport_slug}-${group.league.id}`} group={group} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#0f1923] rounded-lg border border-gray-800/50">
            <p className="text-gray-400 text-sm">Aucun match populaire à venir pour le moment</p>
          </div>
        )}
      </section>

      <AdBanner type="promo" />

      {/* Jeux Populaires */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-casino-gold" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Jeux de Casino Populaires
            </h2>
          </div>
          <Link
            to="/games"
            className="flex items-center gap-1 text-xs md:text-sm text-casino-gold hover:text-casino-gold-dark transition-colors font-semibold"
          >
            Voir tous les jeux
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
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <GameCard game={game} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AdBanner type="jackpot" />

      {featuredGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-casino-gold" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Jeux de Casino en Vedette
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
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <GameCard game={game} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      <AdBanner type="bonus" />

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-casino-gold to-casino-gold-dark rounded-full" />
            <h2 className="text-xl md:text-2xl font-gaming font-black text-white">
              Tous les Jeux de Casino
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
                viewport={{ once: true, margin: '-50px' }}
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

function LiveCategoryBlock({ sportSlug, sportName, sportIcon, matches }) {
  return (
    <div className="bg-[#0f1923] rounded-lg border border-red-500/20 overflow-hidden">
      <Link
        to={`/sports?sport=${sportSlug}`}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500/10 to-transparent hover:from-red-500/20 transition-colors"
      >
        {sportIcon && <span className="text-xl">{sportIcon}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{sportName}</span>
            <CircleDot className="w-3 h-3 text-red-400 animate-pulse flex-shrink-0" />
          </div>
          <div className="text-[10px] text-red-400 uppercase font-semibold">
            {matches.length} match{matches.length > 1 ? 's' : ''} en direct
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-500" />
      </Link>
      <div className="divide-y divide-gray-800/40">
        {matches.slice(0, 5).map((m) => (
          <LiveMatchRow key={m.id} fixture={m} sportSlug={sportSlug} />
        ))}
        {matches.length > 5 && (
          <Link
            to={`/sports?sport=${sportSlug}`}
            className="block text-center py-2 text-[11px] text-gray-400 hover:text-casino-gold hover:bg-gray-800/30 transition-colors"
          >
            Voir les {matches.length - 5} autres matchs en direct →
          </Link>
        )}
      </div>
    </div>
  )
}

function LiveMatchRow({ fixture, sportSlug }) {
  const odds = fixture.odds || {}
  const has1x2 = odds['1'] || odds['X'] || odds['2']
  return (
    <Link
      to={`/sports?sport=${sportSlug}&league=${fixture.league?.id}&fixture=${fixture.id}`}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/40 transition-colors"
    >
      <div className="w-14 flex-shrink-0 text-center">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold uppercase">
          <CircleDot className="w-2.5 h-2.5 animate-pulse" />
          {fixture.elapsed ? `${fixture.elapsed}'` : 'Live'}
        </span>
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          {fixture.home_logo && (
            <img src={fixture.home_logo} alt="" className="w-5 h-5 object-contain rounded-full bg-white/90 p-0.5" onError={(e) => (e.target.style.display = 'none')} />
          )}
          <span className="text-sm text-white font-semibold truncate flex-1">{fixture.home_team}</span>
          <span className={`text-sm font-bold flex-shrink-0 ${fixture.home_score > fixture.away_score ? 'text-casino-gold' : 'text-gray-300'}`}>
            {fixture.home_score ?? '-'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {fixture.away_logo && (
            <img src={fixture.away_logo} alt="" className="w-5 h-5 object-contain rounded-full bg-white/90 p-0.5" onError={(e) => (e.target.style.display = 'none')} />
          )}
          <span className="text-sm text-white font-semibold truncate flex-1">{fixture.away_team}</span>
          <span className={`text-sm font-bold flex-shrink-0 ${fixture.away_score > fixture.home_score ? 'text-casino-gold' : 'text-gray-300'}`}>
            {fixture.away_score ?? '-'}
          </span>
        </div>
      </div>
      {has1x2 && (
        <div className="hidden sm:flex gap-1 flex-shrink-0">
          {['1', 'X', '2'].map((k) => (
            <div key={k} className="w-12 py-1.5 bg-dark-300/60 border border-gray-700/50 rounded text-center">
              <div className="text-[10px] text-gray-500 leading-none">{k}</div>
              <div className="text-xs font-bold text-white leading-tight">{odds[k]?.toFixed(2) || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}

function PopularLeagueBlock({ group }) {
  return (
    <div className="bg-[#0f1923] rounded-lg border border-gray-800/50 overflow-hidden">
      <Link
        to={`/sports?sport=${group.sport_slug}&league=${group.league.id}`}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#172633] hover:bg-[#1c2f3f] transition-colors"
      >
        <Trophy className="w-4 h-4 text-casino-gold flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{group.league.name}</div>
          <div className="text-[10px] text-gray-500 uppercase">{group.sport_name}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-500" />
      </Link>
      <div className="divide-y divide-gray-800/40">
        {group.fixtures.map((f) => (
          <PopularFixtureRow key={f.id} fixture={f} sportSlug={group.sport_slug} />
        ))}
      </div>
    </div>
  )
}

function PopularFixtureRow({ fixture, sportSlug }) {
  const dt = fixture.date ? new Date(fixture.date) : null
  const odds = fixture.odds || {}
  const has1x2 = odds['1'] || odds['X'] || odds['2']

  return (
    <Link
      to={`/sports?sport=${sportSlug}&league=${fixture.league?.id}&fixture=${fixture.id}`}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/40 transition-colors"
    >
      <div className="w-14 flex-shrink-0 text-center">
        {dt ? (
          <>
            <div className="text-sm font-bold text-white">{format(dt, 'HH:mm')}</div>
            <div className="text-[10px] text-gray-500">{format(dt, 'dd MMM', { locale: fr })}</div>
          </>
        ) : (
          <Clock className="w-4 h-4 text-gray-600 mx-auto" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          {fixture.home_logo && (
            <img src={fixture.home_logo} alt="" className="w-5 h-5 object-contain rounded-full bg-white/90 p-0.5" onError={(e) => (e.target.style.display = 'none')} />
          )}
          <span className="text-sm text-gray-200 truncate">{fixture.home_team}</span>
        </div>
        <div className="flex items-center gap-2">
          {fixture.away_logo && (
            <img src={fixture.away_logo} alt="" className="w-5 h-5 object-contain rounded-full bg-white/90 p-0.5" onError={(e) => (e.target.style.display = 'none')} />
          )}
          <span className="text-sm text-gray-200 truncate">{fixture.away_team}</span>
        </div>
      </div>
      {has1x2 && (
        <div className="hidden sm:flex gap-1 flex-shrink-0">
          {['1', 'X', '2'].map((k) => (
            <div key={k} className="w-12 py-1.5 bg-dark-300/60 border border-gray-700/50 rounded text-center">
              <div className="text-[10px] text-gray-500 leading-none">{k}</div>
              <div className="text-xs font-bold text-white leading-tight">{odds[k]?.toFixed(2) || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}
