import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-gaming font-bold text-gold-glow mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-4">Page non trouvée</h1>
        <p className="text-gray-400 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn-primary">
            <Home className="w-5 h-5 mr-2 inline" />
            Retour à l'accueil
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft className="w-5 h-5 mr-2 inline" />
            Retour
          </button>
        </div>
      </div>
    </div>
  )
}
