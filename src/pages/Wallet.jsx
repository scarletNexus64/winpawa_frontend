import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useWalletStore } from '../store/walletStore'
import { walletService } from '../services/walletService'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Import logos
import omLogo from '../img/om.png'
import momoLogo from '../img/momo.png'
import btcLogo from '../img/btc.png'
import visaLogo from '../img/visa.png'
import masterLogo from '../img/master.png'
import paypalLogo from '../img/paypal.png'

// Liste des pays africains
const AFRICAN_COUNTRIES = [
  'CM', 'CI', 'SN', 'GA', 'CG', 'CD', 'BF', 'ML', 'NE', 'TD', 'BJ', 'TG',
  'CF', 'GQ', 'NG', 'GH', 'ZA', 'KE', 'UG', 'TZ', 'ET', 'MA', 'DZ', 'TN', 'EG'
]

export default function Wallet() {
  const { user } = useAuthStore()
  const { wallet, transactions, setWallet, setTransactions } = useWalletStore()
  const [activeTab, setActiveTab] = useState('deposit')
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [amount, setAmount] = useState('')

  const isAfricanCountry = user?.country && AFRICAN_COUNTRIES.includes(user.country)

  // Méthodes de paiement pour les pays africains
  const africanPaymentMethods = [
    {
      id: 'orange_money',
      name: 'Orange Money',
      logo: omLogo,
      available: true,
      priority: true
    },
    {
      id: 'mtn_momo',
      name: 'MTN Mobile Money',
      logo: momoLogo,
      available: true,
      priority: true
    },
    {
      id: 'coinbase',
      name: 'Crypto',
      logo: btcLogo,
      available: true,
      priority: true,
      description: 'Bitcoin, ETH, USDC...'
    },
    {
      id: 'visa',
      name: 'VISA',
      logo: visaLogo,
      available: false,
      priority: false
    },
    {
      id: 'mastercard',
      name: 'MasterCard',
      logo: masterLogo,
      available: false,
      priority: false
    },
    {
      id: 'paypal',
      name: 'PayPal',
      logo: paypalLogo,
      available: false,
      priority: false
    }
  ]

  // Méthodes de paiement pour les autres pays
  const internationalPaymentMethods = [
    {
      id: 'coinbase',
      name: 'Crypto',
      logo: btcLogo,
      available: true,
      priority: true,
      description: 'Bitcoin, ETH, USDC...'
    },
    {
      id: 'visa',
      name: 'VISA',
      logo: visaLogo,
      available: true,
      priority: true
    },
    {
      id: 'mastercard',
      name: 'MasterCard',
      logo: masterLogo,
      available: true,
      priority: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      logo: paypalLogo,
      available: true,
      priority: true
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      logo: omLogo,
      available: false,
      priority: false
    },
    {
      id: 'mtn_momo',
      name: 'MTN Mobile Money',
      logo: momoLogo,
      available: false,
      priority: false
    }
  ]

  const paymentMethods = isAfricanCountry ? africanPaymentMethods : internationalPaymentMethods

  useEffect(() => {
    loadWallet()
    loadTransactions()
  }, [])

  const loadWallet = async () => {
    try {
      const response = await walletService.getBalance()
      setWallet(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement du wallet:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await walletService.getTransactions()
      setTransactions(response.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error)
      setTransactions([])
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()

    if (!selectedMethod) {
      toast.error('Veuillez sélectionner une méthode de paiement')
      return
    }

    const depositAmount = parseFloat(amount)

    if (!depositAmount || depositAmount < 200) {
      toast.error('Montant minimum: 200 FCFA')
      return
    }

    if (depositAmount > 1000000) {
      toast.error('Montant maximum: 1,000,000 FCFA')
      return
    }

    try {
      const response = await walletService.deposit({
        amount: depositAmount,
        payment_method: selectedMethod,
      })

      // Cas spécifique pour Coinbase - ouvrir l'URL de paiement
      if (selectedMethod === 'coinbase' && response.data?.payment_url) {
        toast.success('Redirection vers la page de paiement Coinbase...')

        // Ouvrir l'URL de paiement Coinbase dans un nouvel onglet
        window.open(response.data.payment_url, '_blank')

        toast.success('Complétez le paiement sur la page Coinbase. Votre wallet sera crédité automatiquement.', {
          duration: 6000
        })
      } else {
        // Pour les autres méthodes (MTN, Orange Money)
        toast.success('Dépôt initié avec succès')
      }

      setAmount('')
      setSelectedMethod(null)
      loadWallet()
      loadTransactions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du dépôt')
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    const withdrawAmount = parseFloat(amount)

    if (!withdrawAmount || withdrawAmount < 1000) {
      toast.error('Montant minimum: 1,000 FCFA')
      return
    }

    if (withdrawAmount > wallet?.main_balance) {
      toast.error('Solde insuffisant')
      return
    }

    try {
      await walletService.withdraw({
        amount: withdrawAmount,
        payment_method: selectedMethod,
      })
      toast.success('Retrait demandé avec succès')
      setAmount('')
      loadWallet()
      loadTransactions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du retrait')
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-casino-green" />
      case 'pending':
        return <Clock className="w-4 h-4 text-casino-gold" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-casino-red" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Complété'
      case 'pending':
        return 'En attente'
      case 'failed':
        return 'Échoué'
      default:
        return status
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header avec soldes */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="card bg-gradient-to-br from-casino-purple via-casino-purple-dark to-dark-300">
          <div className="text-center">
            <p className="text-sm text-white/60 mb-2">Solde Total</p>
            <p className="text-4xl font-bold text-white mb-6">
              {formatAmount(wallet?.main_balance)} <span className="text-xl text-white/80">FCFA</span>
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/60 mb-1">Bonus</p>
                <p className="text-lg font-bold text-casino-gold">{formatAmount(wallet?.bonus_balance)} FCFA</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/60 mb-1">Affiliation</p>
                <p className="text-lg font-bold text-casino-green">{formatAmount(wallet?.affiliate_balance)} FCFA</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'deposit'
                ? 'bg-casino-green text-white shadow-lg shadow-casino-green/30'
                : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowDownCircle className="w-5 h-5" />
              <span>Dépôt</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'withdraw'
                ? 'bg-casino-red text-white shadow-lg shadow-casino-red/30'
                : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              <span>Retrait</span>
            </div>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'deposit' ? (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleDeposit} className="space-y-6">
                {/* Méthodes de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Choisissez votre méthode de paiement
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => method.available && setSelectedMethod(method.id)}
                        disabled={!method.available}
                        className={`relative p-4 rounded-2xl border-2 transition-all ${
                          selectedMethod === method.id
                            ? 'border-casino-gold bg-casino-gold/10 scale-105'
                            : method.available
                            ? 'border-gray-700 hover:border-gray-600 hover:bg-dark-200'
                            : 'border-gray-800 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="aspect-square rounded-full bg-white/95 p-3 mb-2 overflow-hidden flex items-center justify-center">
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs font-medium text-white text-center truncate">
                          {method.name}
                        </p>
                        {!method.available && (
                          <div className="absolute inset-0 flex items-center justify-center bg-dark-500/80 rounded-2xl">
                            <span className="text-xs font-bold text-casino-red">Non disponible</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Montant du dépôt
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input w-full text-center text-2xl font-bold py-4"
                      placeholder="10000"
                      min={200}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      FCFA
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Min: 200 FCFA | Max: 1,000,000 FCFA
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!selectedMethod || !amount}
                  className="w-full btn-primary bg-casino-green hover:bg-casino-green-dark disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg font-bold"
                >
                  Déposer maintenant
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleWithdraw} className="space-y-6">
                {/* Wallet Info */}
                <div className="bg-gradient-to-br from-casino-gold/10 to-transparent border border-casino-gold/20 rounded-2xl p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Solde disponible pour retrait</p>
                    <p className="text-3xl font-bold text-casino-gold">
                      {formatAmount(wallet?.main_balance)} FCFA
                    </p>
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Montant du retrait
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input w-full text-center text-2xl font-bold py-4"
                      placeholder="10000"
                      min={1000}
                      max={wallet?.main_balance}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      FCFA
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Min: 1,000 FCFA | Max: {formatAmount(wallet?.main_balance)} FCFA
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!amount}
                  className="w-full btn-primary bg-casino-red hover:bg-casino-red-dark disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg font-bold"
                >
                  Retirer maintenant
                </button>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-blue-400 text-center">
                    Les retraits sont traités sous 24-48h ouvrables
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Historique des transactions */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-casino-gold" />
          Historique des transactions
        </h3>

        <div className="space-y-3">
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 20).map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-dark-300 rounded-xl hover:bg-dark-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'deposit' ? 'bg-casino-green/10' : 'bg-casino-red/10'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <ArrowDownCircle className="w-5 h-5 text-casino-green" />
                    ) : (
                      <ArrowUpCircle className="w-5 h-5 text-casino-red" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white capitalize">
                      {transaction.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(transaction.created_at), 'dd MMM yyyy · HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    transaction.type === 'deposit' ? 'text-casino-green' : 'text-casino-red'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}
                    {formatAmount(transaction.amount)}
                  </p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    {getStatusIcon(transaction.status)}
                    <span className="text-xs text-gray-400">
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400">Aucune transaction pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
