import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Ticket,
  Trash2,
  Save,
  FolderOpen,
  Plus,
  X,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  History as HistoryIcon,
  ChevronRight,
  MoreVertical,
  Share2,
  Download,
  Copy,
  PlusCircle,
  Search,
  Layers,
  Tag,
  Filter,
  Wallet,
} from 'lucide-react'
import { useCouponStore } from '../store/couponStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

// =============== History column ===============
function HistoryColumn({ history }) {
  const stats = useMemo(() => {
    const total = history.reduce((a, b) => a + (b.betAmount || 0), 0)
    return { count: history.length, total }
  }, [history])

  return (
    <div className="bg-[#0f1923] rounded-xl border border-gray-800/50 overflow-hidden">
      <div className="px-4 py-3 bg-dark-200/60 border-b border-gray-800/50 flex items-center gap-2">
        <HistoryIcon className="w-4 h-4 text-casino-purple" />
        <h2 className="text-sm font-bold text-white">Historique des paris</h2>
        <span className="ml-auto text-[10px] text-gray-500">{history.length}</span>
      </div>

      {/* Actions rapides : depot / vente / filtres */}
      <div className="grid grid-cols-3 gap-1.5 p-3 border-b border-gray-800/50 bg-dark-200/30">
        <Link
          to="/wallet"
          className="flex flex-col items-center justify-center gap-1 py-2 bg-dark-300/60 border border-gray-800/40 rounded-lg text-[11px] font-semibold text-gray-300 hover:text-casino-green hover:border-casino-green/40 transition"
        >
          <PlusCircle className="w-4 h-4 text-casino-green" />
          Effectuer un depot
        </Link>
        <button
          type="button"
          onClick={() => toast('Vente bientot disponible', { icon: 'i' })}
          className="flex flex-col items-center justify-center gap-1 py-2 bg-dark-300/60 border border-gray-800/40 rounded-lg text-[11px] font-semibold text-gray-300 hover:text-casino-gold hover:border-casino-gold/40 transition"
        >
          <Tag className="w-4 h-4 text-casino-gold" />
          Vente
        </button>
        <button
          type="button"
          onClick={() => toast('Filtres bientot disponibles', { icon: 'i' })}
          className="flex flex-col items-center justify-center gap-1 py-2 bg-dark-300/60 border border-gray-800/40 rounded-lg text-[11px] font-semibold text-gray-300 hover:text-casino-purple hover:border-casino-purple/40 transition"
        >
          <Filter className="w-4 h-4 text-casino-purple" />
          Filtres
        </button>
      </div>

      {/* Stats periode */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/50 bg-dark-200/20">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Statistiques</div>
          <div className="text-xs font-semibold text-white mt-0.5">
            Paris : <span className="text-casino-gold">{stats.count}</span>
            <span className="text-gray-600 mx-1.5">-</span>
            <span className="text-casino-gold">{stats.total.toLocaleString('fr-FR')} F</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 px-4">
          <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aucun pari place</p>
          <p className="text-[11px] text-gray-600 mt-1">Vos paris apparaitront ici</p>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto">
          {history.map((bet) => {
            const won = bet.status === 'won'
            const lost = bet.status === 'lost'
            const Icon = won ? CheckCircle2 : lost ? XCircle : Clock
            const color = won ? 'text-casino-green' : lost ? 'text-casino-red' : 'text-casino-gold'
            return (
              <div key={bet.id} className="px-3 py-2.5 border-b border-gray-800/40 last:border-b-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-[10px] text-gray-500">
                    {format(new Date(bet.placedAt), 'dd.MM.yyyy (HH:mm)', { locale: fr })}
                  </span>
                  <span className="ml-auto text-[10px] text-casino-gold font-mono font-bold tracking-wider">N° {bet.id}</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-casino-purple/15 text-casino-purple text-[10px] font-bold">
                    <Layers className="w-3 h-3" />
                    {bet.items.length > 1 ? `Combine ${bet.items.length}` : 'Simple'}
                  </span>
                  {bet.items[0]?.league && (
                    <span className="px-1.5 py-0.5 rounded bg-casino-gold/15 text-casino-gold text-[10px] font-semibold truncate max-w-[140px]">
                      {bet.items[0].league}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 mb-1.5">
                  {bet.items.slice(0, 3).map((it, i) => (
                    <div key={i} className="text-[11px] text-gray-400 truncate">
                      <span className="text-white">{it.label}</span> - {it.matchLabel}
                    </div>
                  ))}
                  {bet.items.length > 3 && (
                    <div className="text-[10px] text-gray-600">+ {bet.items.length - 3} autres</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                  <span className="text-gray-500">
                    Cote : <span className="text-casino-purple font-semibold">{bet.totalOdd.toFixed(3)}</span>
                  </span>
                  <span className="text-gray-500">
                    Mise : <span className="text-white font-semibold">{bet.betAmount} F</span>
                  </span>
                  <span className="text-gray-500">
                    Gains : <span className={`font-semibold ${color}`}>{Math.round(bet.gain)} F</span>
                  </span>
                  <span className="text-gray-500">
                    Statut : <span className={`font-bold ${color}`}>{won ? 'Paye' : lost ? 'Perdu' : 'En cours'}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// =============== Saved coupons list ===============
function SavedCouponsList({ saved, onLoad, onDelete }) {
  if (saved.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-500">
        Aucun coupon sauvegarde
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      {saved.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 bg-dark-300/50 border border-gray-800/40 rounded-lg p-2 hover:border-casino-gold/40 transition-all"
        >
          <button onClick={() => onLoad(c.id)} className="flex-1 min-w-0 text-left">
            <div className="text-xs font-semibold text-white truncate">{c.name}</div>
            <div className="text-[10px] text-gray-500">
              {c.items.length} sel - cote {c.items.reduce((a, x) => a * x.odd, 1).toFixed(2)} - {format(new Date(c.createdAt), 'dd MMM', { locale: fr })}
            </div>
          </button>
          <button
            onClick={() => onLoad(c.id)}
            className="p-1.5 text-casino-gold hover:bg-casino-gold/10 rounded transition-colors"
            title="Charger"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(c.id)}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// =============== Share-code modals ===============
function ShareCodeModal({ open, code, onClose }) {
  if (!open) return null
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copie dans le presse-papier')
    } catch {
      toast.error('Copie impossible, selectionne et copie manuellement')
    }
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-200 rounded-2xl p-5 w-full max-w-md border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-casino-gold" />
          <h3 className="text-base font-bold text-white">Code du coupon</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          Envoie ce code a quelqu'un. Il pourra le coller dans <span className="text-casino-gold font-semibold">Charger un code</span> pour recuperer toutes les selections.
        </p>
        <textarea
          readOnly
          value={code}
          rows={4}
          onFocus={(e) => e.target.select()}
          className="w-full px-3 py-2 bg-dark-300 border border-gray-700 rounded-lg text-white text-xs font-mono break-all focus:border-casino-gold focus:outline-none mb-3"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-dark-300 border border-gray-700 rounded-lg text-sm text-gray-400">
            Fermer
          </button>
          <button onClick={handleCopy} className="flex-1 px-4 py-2 bg-gradient-to-r from-casino-gold to-casino-gold-dark text-dark-500 font-bold rounded-lg text-sm flex items-center justify-center gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            Copier
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function LoadCodeModal({ open, onClose, onLoad }) {
  const [code, setCode] = useState('')
  if (!open) return null
  const handleSubmit = () => {
    if (!code.trim()) {
      toast.error('Colle un code')
      return
    }
    if (onLoad(code.trim())) {
      setCode('')
      onClose()
    } else {
      toast.error('Code invalide')
    }
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-200 rounded-2xl p-5 w-full max-w-md border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-casino-gold" />
          <h3 className="text-base font-bold text-white">Charger un code de coupon</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          Colle le code recu pour remplacer le coupon courant par les memes selections.
        </p>
        <textarea
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Colle le code ici..."
          rows={4}
          className="w-full px-3 py-2 bg-dark-300 border border-gray-700 rounded-lg text-white text-xs font-mono break-all focus:border-casino-gold focus:outline-none mb-3"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-dark-300 border border-gray-700 rounded-lg text-sm text-gray-400">
            Annuler
          </button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-gradient-to-r from-casino-gold to-casino-gold-dark text-dark-500 font-bold rounded-lg text-sm">
            Charger
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// =============== Save coupon modal ===============
function SaveCouponModal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-200 rounded-2xl p-5 w-full max-w-sm border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white mb-3">Sauvegarder le coupon</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du coupon"
          className="w-full px-3 py-2 bg-dark-300 border border-gray-700 rounded-lg text-white text-sm focus:border-casino-gold focus:outline-none mb-3"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-dark-300 border border-gray-700 rounded-lg text-sm text-gray-400">
            Annuler
          </button>
          <button
            onClick={() => {
              onSave(name)
              setName('')
            }}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-casino-gold to-casino-gold-dark text-dark-500 font-bold rounded-lg text-sm"
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// =============== Coupon column ===============
function CouponColumn() {
  const {
    items,
    betAmount,
    saved,
    setBetAmount,
    removeItem,
    clear,
    submitCurrent,
    saveCurrent,
    loadCoupon,
    deleteSaved,
    generateShareCode,
    loadFromShareCode,
  } = useCouponStore()
  const [tab, setTab] = useState('current')
  const [saveOpen, setSaveOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareCode, setShareCode] = useState(null)
  const [loadOpen, setLoadOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const totalOdd = useMemo(() => items.reduce((a, c) => a * c.odd, 1), [items])
  const win = betAmount * totalOdd

  const handleSave = (name) => {
    const id = saveCurrent(name)
    if (!id) {
      toast.error('Coupon vide')
      return
    }
    setSaveOpen(false)
    toast.success('Coupon sauvegarde')
  }

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error('Coupon vide')
      return
    }
    const entry = submitCurrent()
    if (entry) toast.success(`Pari place ! Gain potentiel: ${Math.round(entry.gain)} FCFA`)
  }

  const handleLoad = (id) => {
    if (loadCoupon(id)) {
      setTab('current')
      toast.success('Coupon charge')
    }
  }

  const handleGenerateCode = () => {
    setMenuOpen(false)
    const code = generateShareCode()
    if (!code) {
      toast.error('Coupon vide')
      return
    }
    setShareCode(code)
  }

  const handleOpenLoadCode = () => {
    setMenuOpen(false)
    setLoadOpen(true)
  }

  const handleLoadFromCode = (code) => {
    if (loadFromShareCode(code)) {
      setTab('current')
      toast.success('Coupon charge depuis le code')
      return true
    }
    return false
  }

  return (
    <div className="bg-[#0f1923] rounded-xl border border-gray-800/50 overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-dark-200/60 border-b border-gray-800/50 flex items-center gap-2">
        <Ticket className="w-4 h-4 text-casino-gold" />
        <h2 className="text-sm font-bold text-white">Mes coupons</h2>
        <span className="ml-auto text-[10px] text-gray-500">{saved.length} sauvegardes</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Plus d'options"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-dark-200 border border-gray-700 rounded-lg shadow-2xl z-20 min-w-[220px] overflow-hidden">
              <button
                onClick={handleGenerateCode}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-casino-gold/10 transition-colors text-xs text-white"
              >
                <Share2 className="w-3.5 h-3.5 text-casino-gold" />
                <span>Enregistrer le coupon (code)</span>
              </button>
              <button
                onClick={handleOpenLoadCode}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-casino-gold/10 transition-colors text-xs text-white border-t border-gray-700/50"
              >
                <Download className="w-3.5 h-3.5 text-casino-gold" />
                <span>Charger un code de coupon</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex bg-dark-200/40 p-1 border-b border-gray-800/50">
        {[
          { key: 'current', label: 'Coupon courant', icon: Plus, count: items.length },
          { key: 'saved', label: 'Charges', icon: FolderOpen, count: saved.length },
        ].map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                active ? 'bg-casino-gold/15 text-casino-gold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  active ? 'bg-casino-gold/30 text-casino-gold' : 'bg-gray-700 text-gray-400'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'saved' ? (
        <div className="p-3 max-h-[60vh] overflow-y-auto">
          <SavedCouponsList saved={saved} onLoad={handleLoad} onDelete={deleteSaved} />
        </div>
      ) : items.length === 0 ? (
        <div className="px-3 py-4">
          <div className="text-center mb-4">
            <p className="text-sm font-bold text-white">Votre coupon de pari est vide</p>
            <p className="text-[11px] text-gray-500 mt-1 px-4">
              Ajoutez un evenement au coupon de pari ou selectionnez l'une des options
            </p>
          </div>

          <div className="space-y-1.5">
            <Link
              to="/wallet"
              className="flex items-center gap-3 px-3 py-2.5 bg-dark-300/50 border border-gray-800/40 rounded-lg hover:border-casino-green/40 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-casino-green/15 flex items-center justify-center flex-shrink-0">
                <PlusCircle className="w-4 h-4 text-casino-green" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Recharger le compte</div>
                <div className="text-[10px] text-gray-500">Votre solde : 0 F</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-casino-green" />
            </Link>

            <Link
              to="/sports"
              className="flex items-center gap-3 px-3 py-2.5 bg-dark-300/50 border border-gray-800/40 rounded-lg hover:border-casino-purple/40 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-casino-purple/15 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-casino-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Recherche d'evenement</div>
                <div className="text-[10px] text-gray-500">Uniquement pour vous</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-casino-purple" />
            </Link>

            <Link
              to="/sports"
              className="flex items-center gap-3 px-3 py-2.5 bg-dark-300/50 border border-gray-800/40 rounded-lg hover:border-casino-gold/40 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-casino-gold/15 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-casino-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Pari combine du jour</div>
                <div className="text-[10px] text-gray-500">Meilleures offres du jour</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-casino-gold" />
            </Link>

            <Link
              to="/sports"
              className="flex items-center gap-3 px-3 py-2.5 bg-dark-300/50 border border-gray-800/40 rounded-lg hover:border-casino-gold/40 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-casino-gold/15 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-4 h-4 text-casino-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Creer coupon de pari</div>
                <div className="text-[10px] text-gray-500">Generez votre coupon de pari</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-casino-gold" />
            </Link>

            <button
              type="button"
              onClick={handleOpenLoadCode}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-dark-300/50 border border-gray-800/40 rounded-lg hover:border-casino-purple/40 transition-all group text-left"
            >
              <div className="w-9 h-9 rounded-full bg-casino-purple/15 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-casino-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">Charger le coupon de pari</div>
                <div className="text-[10px] text-gray-500">Chargez votre coupon de pari</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-casino-purple" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-3 space-y-1.5 max-h-[40vh] overflow-y-auto">
            {items.map((it, i) => (
              <div key={`${it.matchId}-${it.choice}`} className="flex items-center gap-2 bg-dark-300/50 rounded-lg p-2 border border-gray-800/30">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 truncate">{it.league} - {it.matchLabel}</div>
                  <div className="text-xs font-semibold text-white">{it.label}</div>
                </div>
                <span className="text-sm font-bold text-casino-gold flex-shrink-0">{it.odd.toFixed(2)}</span>
                <button onClick={() => removeItem(i)} className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 bg-dark-200/40 border-t border-gray-800/50 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-10">Mise</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-dark-300 border border-gray-700 rounded-lg text-white text-sm font-bold text-center focus:border-casino-gold focus:outline-none"
                min={100}
                max={500000}
              />
              <span className="text-[10px] text-gray-500 w-10">FCFA</span>
            </div>
            <div className="flex gap-1">
              {[500, 1000, 2000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                    betAmount === amt ? 'bg-casino-gold/20 text-casino-gold border border-casino-gold/50' : 'bg-dark-300 text-gray-400 border border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  {amt >= 1000 ? `${amt / 1000}K` : amt}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-500">Cote totale: </span>
                <span className="font-bold text-casino-purple">{totalOdd.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Gain: </span>
                <span className="font-bold text-casino-gold">{Math.round(win)} FCFA</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={clear} className="flex items-center justify-center gap-1 px-2 py-2 bg-dark-300 border border-gray-700 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
                Vider
              </button>
              <button onClick={() => setSaveOpen(true)} className="flex items-center justify-center gap-1 px-2 py-2 bg-dark-300 border border-gray-700 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-casino-purple hover:border-casino-purple/30 transition-all">
                <Save className="w-3.5 h-3.5" />
                Enregistrer
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-gradient-to-r from-casino-gold to-casino-gold-dark text-dark-500 font-bold rounded-lg shadow-lg shadow-casino-gold/30 text-[11px]"
              >
                <Ticket className="w-3.5 h-3.5" />
                Parier
              </button>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {saveOpen && <SaveCouponModal open={saveOpen} onClose={() => setSaveOpen(false)} onSave={handleSave} />}
        {shareCode && <ShareCodeModal open={!!shareCode} code={shareCode} onClose={() => setShareCode(null)} />}
        {loadOpen && <LoadCodeModal open={loadOpen} onClose={() => setLoadOpen(false)} onLoad={handleLoadFromCode} />}
      </AnimatePresence>
    </div>
  )
}

// =============== Page ===============
export default function Paris() {
  const history = useCouponStore((s) => s.history)
  const items = useCouponStore((s) => s.items)
  const [section, setSection] = useState('coupon')

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2 px-1">
        <Ticket className="w-5 h-5 text-casino-gold" />
        <h1 className="text-xl font-bold text-white">Paris</h1>
        <Link
          to="/sports"
          className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-casino-purple/15 border border-casino-purple/40 rounded-lg text-[11px] font-semibold text-casino-purple hover:bg-casino-purple/25 transition"
        >
          <Trophy className="w-3.5 h-3.5" />
          Sport
        </Link>
      </div>

      {/* Onglets de section : Coupon / Historique */}
      <div className="flex bg-[#0f1923] rounded-xl p-1 border border-gray-800/50">
        {[
          {
            key: 'coupon',
            label: 'Coupon',
            icon: Ticket,
            count: items.length,
            activeCls: 'bg-casino-gold/20 text-casino-gold shadow-lg shadow-casino-gold/10',
            badgeCls: 'bg-casino-gold/30 text-casino-gold',
          },
          {
            key: 'history',
            label: 'Historique',
            icon: HistoryIcon,
            count: history.length,
            activeCls: 'bg-casino-purple/20 text-casino-purple shadow-lg shadow-casino-purple/10',
            badgeCls: 'bg-casino-purple/30 text-casino-purple',
          },
        ].map((t) => {
          const Icon = t.icon
          const active = section === t.key
          return (
            <button
              key={t.key}
              onClick={() => setSection(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                active ? t.activeCls : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  active ? t.badgeCls : 'bg-gray-700 text-gray-400'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {section === 'coupon' ? (
          <motion.div
            key="coupon"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.18 }}
          >
            <CouponColumn />
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
          >
            <HistoryColumn history={history} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-dark-200/40 border border-gray-800/40 rounded-lg px-3 py-2 text-[11px] text-gray-400">
        Astuce: <span className="text-casino-gold font-semibold">tape</span> sur une cote pour parier directement, ou <span className="text-casino-gold font-semibold">maintien</span> pour ajouter au coupon.
      </div>
    </div>
  )
}
