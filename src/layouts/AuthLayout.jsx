import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-casino-purple/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-casino-gold/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-casino-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center mb-8 group">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="WinPawa"
              className="h-14 w-auto object-contain group-hover:scale-110 transition-transform"
            />
            <div>
              <h1 className="text-3xl font-gaming font-bold text-gold-glow">WINPAWA</h1>
              <p className="text-xs text-gray-400 font-semibold">Casino Gaming</p>
            </div>
          </div>
        </Link>

        {/* Auth content */}
        <div className="card backdrop-blur-sm bg-dark-200/80">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-400">
          <p>&copy; 2024 WinPawa. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  )
}
