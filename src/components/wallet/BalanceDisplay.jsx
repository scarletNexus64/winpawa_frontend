import { Wallet, Gift, Users } from 'lucide-react'
import { useWallet } from '../../hooks/useWallet'

/**
 * Composant pour afficher le solde du wallet
 * @param {string} type - Type de solde à afficher: 'main', 'bonus', 'affiliate', 'total'
 * @param {boolean} showIcon - Afficher l'icône
 * @param {boolean} compact - Mode compact (plus petit)
 * @param {string} className - Classes CSS additionnelles
 */
export default function BalanceDisplay({
  type = 'total',
  showIcon = true,
  compact = false,
  className = '',
}) {
  const { wallet, formatAmount } = useWallet()

  if (!wallet) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-700 rounded w-24"></div>
      </div>
    )
  }

  const getBalanceValue = () => {
    switch (type) {
      case 'main':
        return wallet.main_balance
      case 'bonus':
        return wallet.bonus_balance
      case 'affiliate':
        return wallet.affiliate_balance
      case 'total':
        return wallet.total_balance
      default:
        return 0
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'main':
        return <Wallet className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      case 'bonus':
        return <Gift className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      case 'affiliate':
        return <Users className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      default:
        return <Wallet className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
    }
  }

  const getLabel = () => {
    switch (type) {
      case 'main':
        return 'Solde principal'
      case 'bonus':
        return 'Solde bonus'
      case 'affiliate':
        return 'Affiliation'
      case 'total':
        return 'Solde total'
      default:
        return 'Solde'
    }
  }

  const balance = getBalanceValue()

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && (
          <div className="text-casino-gold">
            {getIcon()}
          </div>
        )}
        <span className="font-bold text-white">
          {formatAmount(balance)} <span className="text-xs text-gray-400">FCFA</span>
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className="w-10 h-10 rounded-xl bg-casino-gold/10 flex items-center justify-center">
          <div className="text-casino-gold">
            {getIcon()}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{getLabel()}</p>
        <p className="text-lg font-bold text-white">
          {formatAmount(balance)} <span className="text-sm text-gray-400">FCFA</span>
        </p>
      </div>
    </div>
  )
}
