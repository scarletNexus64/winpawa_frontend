import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { user } = useAuthStore()

  const banners = [
    {
      id: 1,
      title: 'Bonus de Bienvenue',
      subtitle: 'Jusqu\'à 50,000 FCFA',
      highlight: '50%',
      description: 'Sur votre premier dépôt',
      gradient: 'from-amber-600 via-yellow-500 to-amber-600',
      image: '🎁',
      cta: user ? 'Profiter' : 'Connexion',
      link: user ? '/wallet' : '/login',
    },
    {
      id: 2,
      title: 'Jackpot Quotidien',
      subtitle: 'Multipliez vos gains',
      highlight: '10x',
      description: 'Tentez votre chance maintenant',
      gradient: 'from-purple-600 via-fuchsia-600 to-purple-600',
      image: '💎',
      cta: 'Jouer',
      link: '/games',
    },
    {
      id: 3,
      title: 'Match Virtuel',
      subtitle: 'Nouveau match',
      highlight: '5min',
      description: 'Paris en direct',
      gradient: 'from-emerald-600 via-green-500 to-emerald-600',
      image: '⚽',
      cta: 'Parier',
      link: '/virtual-match',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl h-[160px] md:h-[200px] shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {/* Background with Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${banners[currentSlide].gradient}`}></div>

          {/* Animated Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/grid.svg')]"></div>
          </div>

          {/* Gradient Overlays */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-3xl"></div>

          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-5 md:px-10 py-5 md:py-8">
            <div className="flex-1 pr-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-xl"
              >
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-2 md:mb-3">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {banners[currentSlide].description}
                  </span>
                </div>

                <h2 className="text-lg md:text-3xl font-gaming font-black text-white mb-2 md:mb-3 leading-tight">
                  {banners[currentSlide].title}
                </h2>

                <div className="flex items-baseline gap-2 mb-3 md:mb-5">
                  <span className="text-2xl md:text-5xl font-black text-white">
                    {banners[currentSlide].highlight}
                  </span>
                  <span className="text-xs md:text-lg text-white/90 font-semibold">
                    {banners[currentSlide].subtitle}
                  </span>
                </div>

                <Link
                  to={banners[currentSlide].link}
                  className="inline-flex items-center gap-2 px-5 md:px-6 py-2 md:py-2.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-xl text-xs md:text-sm"
                >
                  {banners[currentSlide].cta}
                  <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Icon - Visible sur mobile aussi */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-5xl md:text-7xl opacity-20 flex-shrink-0"
            >
              {banners[currentSlide].image}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'w-12 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
