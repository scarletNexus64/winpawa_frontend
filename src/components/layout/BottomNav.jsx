import { Link, useLocation } from 'react-router-dom'
import { Home, Gamepad2, Wallet, User, Ticket } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useCouponStore } from '../../store/couponStore'

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuthStore()
  const couponCount = useCouponStore((s) => s.items.length)

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/games', icon: Gamepad2, label: 'Jeux' },
    { path: '/paris', icon: Ticket, label: 'Paris', isCenter: true, badge: couponCount },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: user ? '/profile' : '/login', icon: User, label: 'Profile' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-400/95 backdrop-blur-xl border-t border-gray-800/50 z-50 safe-area-bottom shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                <div className="relative -mt-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-casino-gold to-casino-gold-dark flex items-center justify-center shadow-2xl shadow-casino-gold/50 border-4 border-dark-400 transform transition-all hover:scale-110 active:scale-95">
                    <Icon className="w-8 h-8 text-dark-500" />
                  </div>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-casino-red text-white text-[11px] font-bold rounded-full border-2 border-dark-400 flex items-center justify-center shadow-lg animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {active && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-casino-gold animate-pulse"></div>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-semibold transition-colors ${
                  active ? 'text-casino-gold' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative group"
            >
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-casino-gold to-transparent rounded-full"></div>
              )}

              <div className={`flex flex-col items-center justify-center transition-all ${active ? 'scale-110' : 'scale-100'}`}>
                <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  active ? 'bg-casino-gold/10 shadow-lg shadow-casino-gold/20' : 'bg-transparent'
                }`}>
                  <Icon className={`w-6 h-6 transition-colors ${active ? 'text-casino-gold' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[10px] mt-0.5 font-semibold transition-colors ${active ? 'text-casino-gold' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
