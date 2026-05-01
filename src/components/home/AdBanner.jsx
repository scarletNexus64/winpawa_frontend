import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AdBanner({ type = 'promo' }) {
  const banners = {
    promo: {
      title: 'Programme Affiliation',
      description: 'Gagnez jusqu\'à 30% de commission',
      icon: '💰',
      gradient: 'from-blue-600 to-cyan-500',
      link: '/affiliate',
      cta: 'En savoir plus'
    },
    jackpot: {
      title: 'Jackpot Progressif',
      description: '5,000,000 FCFA à gagner',
      icon: '🎰',
      gradient: 'from-orange-600 to-red-500',
      link: '/games/jackpot',
      cta: 'Tenter ma chance'
    },
    bonus: {
      title: 'Bonus Quotidien',
      description: 'Réclamez votre bonus chaque jour',
      icon: '🎁',
      gradient: 'from-purple-600 to-pink-500',
      link: '/wallet',
      cta: 'Réclamer'
    }
  }

  const banner = banners[type] || banners.promo

  return (
    <Link to={banner.link}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${banner.gradient} p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        {/* Pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')]"></div>
        </div>

        {/* Animated circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-black/10 rounded-full blur-2xl"></div>

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-white font-bold text-base md:text-lg mb-1">
              {banner.title}
            </h3>
            <p className="text-white/90 text-xs md:text-sm mb-3">
              {banner.description}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-semibold group-hover:bg-white/30 transition-all">
              {banner.cta}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
          <div className="text-4xl md:text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">
            {banner.icon}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
