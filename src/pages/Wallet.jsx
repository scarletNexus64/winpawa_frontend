import { useEffect, useState } from 'react'
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Gift, Users } from 'lucide-react'
import { walletService } from '../services/walletService'
import { useWalletStore } from '../store/walletStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Wallet() {
  const { wallet, transactions, setWallet, setTransactions } = useWalletStore()
  const [activeTab, setActiveTab] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mtn')

  useEffect(() => {
    loadWallet()
    loadTransactions()
  }, [])

  const loadWallet = async () => {
    try {
      const response = await walletService.getBalance()
      // L'API retourne { success: true, data: { main_balance, bonus_balance, ... } }
      setWallet(response.data)
    } catch (error) {
      toast.error('Erreur lors du chargement du wallet')
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await walletService.getTransactions()
      // L'API retourne { success: true, data: [...] }
      setTransactions(response.data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      setTransactions([])
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
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
      const data = await walletService.deposit({
        amount: depositAmount,
        payment_method: paymentMethod,
      })
      toast.success('Dépôt initié avec succès')
      setAmount('')
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

    if (withdrawAmount > wallet.main_balance) {
      toast.error('Solde insuffisant')
      return
    }

    try {
      const data = await walletService.withdraw({
        amount: withdrawAmount,
        payment_method: paymentMethod,
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="w-5 h-5 text-casino-green" />
      case 'withdrawal':
        return <ArrowUpCircle className="w-5 h-5 text-casino-red" />
      case 'win':
        return <Gift className="w-5 h-5 text-casino-gold" />
      default:
        return <WalletIcon className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wallet Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-casino-purple to-casino-purple-dark"
        >
          <div className="flex items-center gap-3 mb-2">
            <WalletIcon className="w-6 h-6 text-white" />
            <p className="text-white/80 font-medium">Solde Principal</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatAmount(wallet?.main_balance)} FCFA</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-casino-gold to-casino-gold-dark"
        >
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-6 h-6 text-dark-500" />
            <p className="text-dark-500/80 font-medium">Solde Bonus</p>
          </div>
          <p className="text-3xl font-bold text-dark-500">{formatAmount(wallet?.bonus_balance)} FCFA</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-casino-green to-casino-green-dark"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-white" />
            <p className="text-white/80 font-medium">Affiliation</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatAmount(wallet?.affiliate_balance)} FCFA</p>
        </motion.div>
      </div>

      {/* Deposit/Withdraw Form */}
      <div className="card">
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'deposit'
                ? 'text-casino-green border-b-2 border-casino-green'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Dépôt
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'withdraw'
                ? 'text-casino-red border-b-2 border-casino-red'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Retrait
          </button>
        </div>

        <form onSubmit={activeTab === 'deposit' ? handleDeposit : handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Montant (FCFA)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input w-full text-center text-xl font-bold"
              placeholder="10000"
              min={activeTab === 'deposit' ? 200 : 1000}
            />
            <p className="text-xs text-gray-400 mt-2">
              {activeTab === 'deposit'
                ? 'Min: 200 FCFA | Max: 1,000,000 FCFA'
                : 'Min: 1,000 FCFA | Max: 500,000 FCFA'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Méthode de paiement
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('mtn')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'mtn'
                    ? 'border-casino-gold bg-casino-gold/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-bold text-white mb-1">MTN Mobile Money</div>
                <div className="text-xs text-gray-400">MTN MoMo</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('orange')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'orange'
                    ? 'border-casino-gold bg-casino-gold/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-bold text-white mb-1">Orange Money</div>
                <div className="text-xs text-gray-400">Orange CM</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full ${
              activeTab === 'deposit' ? 'btn-primary bg-casino-green hover:bg-casino-green-dark' : 'btn-primary bg-casino-red hover:bg-casino-red-dark'
            }`}
          >
            {activeTab === 'deposit' ? 'Déposer' : 'Retirer'}
          </button>
        </form>
      </div>

      {/* Transactions History */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Historique des transactions</h3>
        <div className="space-y-3">
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-dark-300 rounded-xl hover:bg-dark-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="font-medium text-white">{transaction.type}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === 'deposit' || transaction.type === 'win'
                      ? 'text-casino-green'
                      : 'text-casino-red'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'win' ? '+' : '-'}
                    {formatAmount(transaction.amount)} FCFA
                  </p>
                  <span className={`text-xs badge ${
                    transaction.status === 'completed' ? 'badge-green' :
                    transaction.status === 'pending' ? 'badge-purple' :
                    'badge-red'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              Aucune transaction
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
