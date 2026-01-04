import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Users, Calendar } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import 'react-phone-number-input/style.css'
import { authService } from '../../services/authService'
import { legalService } from '../../services/legalService'
import { useAuthStore } from '../../store/authStore'
import BottomSheet from '../../components/ui/BottomSheet'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { setLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsSheet, setShowTermsSheet] = useState(false)
  const [showPrivacySheet, setShowPrivacySheet] = useState(false)
  const [termsContent, setTermsContent] = useState('')
  const [privacyContent, setPrivacyContent] = useState('')
  const [loadingLegal, setLoadingLegal] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date_of_birth: '',
    password: '',
    password_confirmation: '',
    referral_code: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleOpenTerms = async (e) => {
    e.preventDefault()
    setLoadingLegal(true)
    try {
      const response = await legalService.getTerms()
      setTermsContent(response.data.content)
      setShowTermsSheet(true)
    } catch (error) {
      toast.error('Impossible de charger les conditions d\'utilisation')
    } finally {
      setLoadingLegal(false)
    }
  }

  const handleOpenPrivacy = async (e) => {
    e.preventDefault()
    setLoadingLegal(true)
    try {
      const response = await legalService.getPrivacyPolicy()
      setPrivacyContent(response.data.content)
      setShowPrivacySheet(true)
    } catch (error) {
      toast.error('Impossible de charger la politique de confidentialité')
    } finally {
      setLoadingLegal(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !phoneNumber || !formData.date_of_birth || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!termsAccepted) {
      toast.error('Veuillez accepter les conditions d\'utilisation')
      return
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    // Validate age (18+)
    const birthDate = new Date(formData.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) {
      toast.error('Vous devez avoir au moins 18 ans pour vous inscrire')
      return
    }

    try {
      setLoading(true)
      const data = await authService.register({
        ...formData,
        phone: phoneNumber,
      })

      // Store token in localStorage
      localStorage.setItem('winpawa_token', data.data.token)
      localStorage.setItem('winpawa_user', JSON.stringify(data.data.user))

      toast.success('Inscription réussie ! Veuillez vous connecter')
      // Redirect to login instead of auto-login
      navigate('/login', {
        state: { message: 'Inscription réussie ! Connectez-vous pour continuer' }
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-gaming font-bold text-white mb-2">
          Inscription
        </h2>
        <p className="text-gray-400">
          Créez votre compte et profitez du bonus de bienvenue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom complet
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input pl-11"
              placeholder="Jean Dupont"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input pl-11"
              placeholder="votre@email.com"
              required
            />
          </div>
        </div>

        {/* Phone with Country Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Téléphone
          </label>
          <PhoneInput
            flags={flags}
            international
            defaultCountry="CM"
            value={phoneNumber}
            onChange={setPhoneNumber}
            className="phone-input-custom"
            placeholder="+237 6XX XXX XXX"
            required
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date de naissance
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="input pl-11"
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Vous devez avoir au moins 18 ans</p>
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
              minLength={8}
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

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              className="input pl-11 pr-11"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Referral Code */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Code promo (optionnel)
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="referral_code"
              value={formData.referral_code}
              onChange={handleChange}
              className="input pl-11"
              placeholder="CODE123"
            />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            className="mt-1"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
          />
          <label htmlFor="terms" className="text-sm text-gray-400">
            J'accepte les{' '}
            <button
              onClick={handleOpenTerms}
              className="text-casino-purple hover:underline"
              disabled={loadingLegal}
            >
              conditions d'utilisation
            </button>{' '}
            et la{' '}
            <button
              onClick={handleOpenPrivacy}
              className="text-casino-purple hover:underline"
              disabled={loadingLegal}
            >
              politique de confidentialité
            </button>
          </label>
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn-primary w-full">
          S'inscrire
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

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-gray-400">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-casino-purple hover:text-casino-purple-dark font-semibold">
            Connectez-vous
          </Link>
        </p>
      </div>

      {/* Bottom Sheets for Legal Pages */}
      <BottomSheet
        isOpen={showTermsSheet}
        onClose={() => setShowTermsSheet(false)}
        title="Conditions d'utilisation"
      >
        <div
          className="prose prose-invert max-w-none text-gray-300"
          dangerouslySetInnerHTML={{ __html: termsContent }}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={showPrivacySheet}
        onClose={() => setShowPrivacySheet(false)}
        title="Politique de confidentialité"
      >
        <div
          className="prose prose-invert max-w-none text-gray-300"
          dangerouslySetInnerHTML={{ __html: privacyContent }}
        />
      </BottomSheet>
    </div>
  )
}
