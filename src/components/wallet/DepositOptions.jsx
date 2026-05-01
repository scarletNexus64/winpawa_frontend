import { CreditCard, Smartphone, Bitcoin, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function DepositOptions({ onClose }) {
  const navigate = useNavigate()

  const paymentMethods = [
    {
      id: 'crypto',
      name: 'Cryptomonnaie',
      description: 'Bitcoin, Ethereum, USDT...',
      icon: Bitcoin,
      color: 'from-orange-500 to-yellow-500',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
      route: '/wallet/deposit/crypto'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Paiement sécurisé PayPal',
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      route: '/wallet/deposit/paypal'
    },
    {
      id: 'card',
      name: 'Visa / Mastercard',
      description: 'Carte bancaire',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      route: '/wallet/deposit/card'
    },
    {
      id: 'orange',
      name: 'Orange Money',
      description: 'Mobile Money Orange',
      icon: Smartphone,
      color: 'from-orange-600 to-orange-700',
      iconBg: 'bg-orange-600/10',
      iconColor: 'text-orange-600',
      route: '/wallet/deposit/orange-money'
    },
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      description: 'Mobile Money MTN',
      icon: Smartphone,
      color: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
      route: '/wallet/deposit/mtn-money'
    }
  ]

  const handleMethodClick = (method) => {
    onClose()
    navigate(method.route)
  }

  return (
    <div className="space-y-3 pb-4">
      {paymentMethods.map((method, index) => {
        const Icon = method.icon

        return (
          <motion.button
            key={method.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleMethodClick(method)}
            className="w-full group"
          >
            <div className="relative overflow-hidden rounded-2xl bg-dark-200 border border-gray-800/50 hover:border-gray-700 transition-all p-4">
              {/* Gradient Background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${method.color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`}></div>

              {/* Content */}
              <div className="relative flex items-center gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${method.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${method.iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <h3 className="text-base font-bold text-white group-hover:text-casino-gold transition-colors">
                    {method.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {method.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className="w-5 h-5 text-gray-600 group-hover:text-casino-gold group-hover:translate-x-1 transition-all"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.button>
        )
      })}

      {/* Info Banner */}
      <div className="mt-4 p-4 bg-casino-gold/5 border border-casino-gold/20 rounded-xl">
        <p className="text-xs text-gray-400 text-center">
          Tous les dépôts sont sécurisés et cryptés. Frais de transaction peuvent s'appliquer.
        </p>
      </div>
    </div>
  )
}
