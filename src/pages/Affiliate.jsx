import { useEffect, useState } from 'react'
import { Users, TrendingUp, DollarSign, Copy, Check } from 'lucide-react'
import { affiliateService } from '../services/affiliateService'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Affiliate() {
  const [stats, setStats] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [commissions, setCommissions] = useState([])
  const [copied, setCopied] = useState(false)
  const [referralLink, setReferralLink] = useState('')

  useEffect(() => {
    loadAffiliateData()
  }, [])

  const loadAffiliateData = async () => {
    try {
      const [statsData, referralsData, commissionsData] = await Promise.all([
        affiliateService.getStats(),
        affiliateService.getReferrals(),
        affiliateService.getCommissions(),
      ])
      setStats(statsData.stats)
      setReferrals(referralsData.referrals || [])
      setCommissions(commissionsData.commissions || [])
      setReferralLink(`${window.location.origin}/register?ref=${statsData.stats.referral_code}`)
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-gaming font-bold text-white mb-2">
          Programme d'affiliation
        </h1>
        <p className="text-gray-400">
          Gagnez 5% sur les dépôts et 25% sur les pertes de vos filleuls
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-casino-purple to-casino-purple-dark"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-white" />
            <p className="text-white/80 font-medium">Filleuls</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.total_referrals || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-casino-gold to-casino-gold-dark"
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-dark-500" />
            <p className="text-dark-500/80 font-medium">Commissions totales</p>
          </div>
          <p className="text-3xl font-bold text-dark-500">
            {formatAmount(stats?.total_commissions)} FCFA
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-casino-green to-casino-green-dark"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-white" />
            <p className="text-white/80 font-medium">Ce mois</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatAmount(stats?.this_month_commissions)} FCFA
          </p>
        </motion.div>
      </div>

      {/* Referral Link */}
      <div className="card bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border-casino-purple/30">
        <h2 className="text-xl font-bold text-white mb-4">Votre lien de parrainage</h2>
        <p className="text-gray-400 mb-4">
          Partagez ce lien avec vos amis pour gagner des commissions
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="input flex-1"
          />
          <button onClick={handleCopyLink} className="btn-gold">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referrals */}
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Mes filleuls</h3>
          <div className="space-y-3">
            {referrals.length > 0 ? (
              referrals.slice(0, 5).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-dark-300 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-casino rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{referral.name}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(referral.created_at), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-green">Actif</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                Aucun filleul
              </div>
            )}
          </div>
        </div>

        {/* Commissions */}
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Dernières commissions</h3>
          <div className="space-y-3">
            {commissions.length > 0 ? (
              commissions.slice(0, 5).map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-3 bg-dark-300 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-white">
                      {commission.type === 'deposit' ? 'Commission dépôt' : 'Commission perte'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-casino-gold">
                      +{formatAmount(commission.amount)} FCFA
                    </p>
                    <p className="text-xs text-gray-400">
                      {commission.type === 'deposit' ? '5%' : '25%'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                Aucune commission
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card border-casino-blue/30">
        <h3 className="text-lg font-bold text-white mb-3">Comment ça marche ?</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-casino-gold">1.</span>
            <span>Partagez votre lien de parrainage avec vos amis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-casino-gold">2.</span>
            <span>Gagnez 5% de commission sur chaque dépôt de vos filleuls</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-casino-gold">3.</span>
            <span>Gagnez 25% de commission sur les pertes nettes de vos filleuls</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-casino-gold">4.</span>
            <span>Retrait minimum: 5,000 FCFA</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
