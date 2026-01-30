import { Link, useNavigate } from 'react-router-dom'
import { Menu, Wallet, User, LogOut, Sparkles, Bell, Plus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useWalletStore } from '../../store/walletStore'
import { useState, useEffect } from 'react'
import { walletService } from '../../services/walletService'
import BottomSheet from '../ui/BottomSheet'
import DepositOptions from '../wallet/DepositOptions'
import Avatar from '../Avatar'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { wallet, setWallet } = useWalletStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showDepositSheet, setShowDepositSheet] = useState(false)

  useEffect(() => {
    if (user) {
      loadWallet()
    }
  }, [user])

  const loadWallet = async () => {
    try {
      const response = await walletService.getBalance()
      // L'API retourne { success: true, data: { main_balance, bonus_balance, ... } }
      setWallet(response.data)
    } catch (error) {
      console.error('Error loading wallet:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-dark-400/95 backdrop-blur-xl border-b border-gray-800/50 shadow-2xl">
        <div className="container mx-auto px-3 md:px-4 max-w-7xl">
          <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="WinPawa"
              className="h-8 md:h-10 w-auto object-contain group-hover:scale-110 transition-transform"
            />
            <div className="block">
              <h1 className="text-base md:text-xl font-gaming font-bold text-gold-glow">WINPAWA</h1>
              <p className="text-[9px] text-gray-400 -mt-0.5 hidden sm:block">Casino Gaming</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors font-medium">
              Accueil
            </Link>
            <Link to="/games" className="text-gray-300 hover:text-white transition-colors font-medium">
              Jeux
            </Link>
            <Link to="/virtual-match" className="text-gray-300 hover:text-white transition-colors font-medium">
              Match Virtuel
            </Link>
            {user && (
              <Link to="/affiliate" className="text-gray-300 hover:text-white transition-colors font-medium">
                Affiliation
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <>
                {/* Wallet Balance - Mobile & Desktop */}
                <Link
                  to="/wallet"
                  className="flex items-center gap-2 md:gap-3 px-2 md:px-5 py-1.5 md:py-2.5 bg-gradient-to-r from-dark-200 to-dark-300 rounded-xl md:rounded-2xl border border-gray-800/50 hover:border-casino-gold/50 transition-all group shadow-lg hover:shadow-casino-gold/20"
                >
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-casino-gold/10 flex items-center justify-center group-hover:bg-casino-gold/20 transition-colors">
                    <Wallet className="w-4 h-4 md:w-5 md:h-5 text-casino-gold" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Solde</p>
                    <p className="text-xs md:text-sm font-bold text-white group-hover:text-casino-gold transition-colors">
                      {formatAmount(wallet?.main_balance)} <span className="text-[10px] md:text-xs text-gray-400">FCFA</span>
                    </p>
                  </div>
                </Link>

                {/* Deposit Button - Mobile & Desktop */}
                <button
                  onClick={() => setShowDepositSheet(true)}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 bg-gradient-to-r from-casino-gold to-casino-gold-dark text-dark-500 font-bold rounded-xl shadow-lg hover:shadow-casino-gold/50 hover:scale-105 transition-all"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-xs md:text-sm">Dépôt</span>
                </button>

                {/* Notifications - Hidden on mobile */}
                <button className="hidden md:block relative p-2 text-gray-400 hover:text-white transition-colors">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-casino-red rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-dark-200 transition-colors"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="md"
                    />
                    <span className="hidden sm:block text-sm font-medium text-gray-300">
                      {user.name}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-200 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-dark-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-300">Mon Profil</span>
                      </Link>
                      <Link
                        to="/wallet"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-dark-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Wallet className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-300">Mon Wallet</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-dark-100 transition-colors w-full text-left border-t border-gray-700"
                      >
                        <LogOut className="w-5 h-5 text-casino-red" />
                        <span className="text-sm text-casino-red">Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 md:px-5 py-2 md:py-2.5 bg-dark-200 text-white font-semibold rounded-xl hover:bg-dark-100 transition-all border border-gray-700 text-xs md:text-sm"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="px-3 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-casino-gold to-casino-gold-dark text-dark-500 font-bold rounded-xl shadow-lg hover:shadow-casino-gold/50 hover:scale-105 transition-all text-xs md:text-sm"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      {/* Deposit Options BottomSheet */}
      <BottomSheet
        isOpen={showDepositSheet}
        onClose={() => setShowDepositSheet(false)}
        title="Choisir une méthode de dépôt"
      >
        <DepositOptions onClose={() => setShowDepositSheet(false)} />
      </BottomSheet>
    </>
  )
}
