import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, setLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '', // Email, phone or username
    password: '',
  })

  // Show message from registration redirect
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message)
      // Clear the state
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.identifier || !formData.password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    try {
      setLoading(true)
      const response = await authService.login(formData)

      // Store token in localStorage
      localStorage.setItem('winpawa_token', response.data.token)
      localStorage.setItem('winpawa_user', JSON.stringify(response.data.user))

      // Update auth store
      login(response.data.user, response.data.token)

      toast.success('Connexion réussie !')

      // Redirect to home
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-gaming font-bold text-white mb-2">
          Connexion
        </h2>
        <p className="text-gray-400">
          Connectez-vous pour commencer à jouer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email, téléphone ou nom d'utilisateur
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              className="input pl-11"
              placeholder="email@example.com ou +237xxx ou Panda35"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input pl-11 pr-11"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-casino-purple hover:text-casino-purple-dark">
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn-primary w-full">
          Se connecter
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-dark-200 text-gray-400">ou</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-gray-400">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-casino-purple hover:text-casino-purple-dark font-semibold">
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  )
}
