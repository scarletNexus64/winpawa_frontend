import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { gameService } from '../services/gameService'
import { useGameStore } from '../store/gameStore'
import { motion } from 'framer-motion'
import GameCard from '../components/games/GameCard'
import ShimmerLoading from '../components/ui/ShimmerLoading'
import toast from 'react-hot-toast'

export default function Games() {
  const [searchParams] = useSearchParams()
  const { games, setGames, setLoading, isLoading } = useGameStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')

  useEffect(() => {
    loadGames()
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
      toast.error('Erreur lors du chargement des jeux')
    } finally {
      setLoading(false)
    }
  }

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || game.category_id === parseInt(selectedCategory)
    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: '', name: 'Tous' },
    { id: '1', name: 'Jeux de Chance' },
    { id: '2', name: 'Prédiction' },
    { id: '3', name: 'Action' },
    { id: '4', name: 'Stratégie' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-gaming font-bold text-white mb-2">
          Tous les Jeux
        </h1>
        <p className="text-gray-400">
          Découvrez nos {games.length} jeux de casino excitants
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-11 w-full"
            placeholder="Rechercher un jeu..."
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input pl-11 pr-8 appearance-none cursor-pointer min-w-[200px]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <ShimmerLoading key={i} variant="game-card" />
          ))}
        </div>
      ) : filteredGames.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GameCard game={game} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">Aucun jeu trouvé</p>
        </div>
      )}
    </div>
  )
}
