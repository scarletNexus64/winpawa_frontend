import { motion } from 'framer-motion'
import { Users, TrendingUp, Trophy } from 'lucide-react'

export default function QuickStats() {
  const stats = [
    {
      icon: Users,
      value: '10K+',
      label: 'Joueurs actifs',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Trophy,
      value: '5M+',
      label: 'FCFA gagnés',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: TrendingUp,
      value: '98%',
      label: 'Paiement rapide',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-xl bg-dark-200 border border-gray-800/50 p-3 md:p-4"
        >
          {/* Gradient background */}
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl`}></div>

          <div className="relative">
            <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-casino-gold mb-2" />
            <div className="text-lg md:text-2xl font-bold text-white mb-0.5">
              {stat.value}
            </div>
            <div className="text-[10px] md:text-xs text-gray-400">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
