import { useState } from 'react'
import { User, Mail, Phone, Lock, Copy, Check } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const handleCopyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code)
      setCopied(true)
      toast.success('Code copié !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const data = await authService.updateProfile(formData)
      updateUser(data.user)
      toast.success('Profil mis à jour avec succès')
      setIsEditing(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    try {
      await authService.changePassword(passwordData)
      toast.success('Mot de passe modifié avec succès')
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-gaming font-bold text-white">Mon Profil</h1>

      {/* Profile Header with Avatar */}
      <div className="card">
        <div className="flex items-center gap-6 mb-6">
          <Avatar
            src={user?.avatar}
            name={user?.name}
            size="3xl"
          />
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <p className="text-gray-400">{user?.email || user?.phone}</p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Informations personnelles</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary text-sm"
          >
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input pl-11"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input pl-11"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input pl-11"
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <button type="submit" className="btn-primary w-full">
              Enregistrer les modifications
            </button>
          )}
        </form>
      </div>

      {/* Referral Code */}
      <div className="card bg-gradient-to-br from-casino-purple/10 to-casino-gold/10 border-casino-purple/30">
        <h2 className="text-xl font-bold text-white mb-4">Code promo</h2>
        <p className="text-gray-400 mb-4">
          Partagez votre code avec vos amis et gagnez des commissions sur leurs dépôts et pertes.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 p-4 bg-dark-300 rounded-xl border border-gray-700">
            <p className="text-2xl font-gaming font-bold text-gold-glow text-center">
              {user?.referral_code}
            </p>
          </div>
          <button
            onClick={handleCopyReferralCode}
            className="btn-gold"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Changer le mot de passe</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe actuel
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="input pl-11"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                className="input pl-11"
                placeholder="••••••••"
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={passwordData.password_confirmation}
                onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                className="input pl-11"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Changer le mot de passe
          </button>
        </form>
      </div>
    </div>
  )
}
