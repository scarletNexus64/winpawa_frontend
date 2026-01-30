import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Download, Edit2, Check, FileText, Image, Eye, EyeOff, Home } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import { useAuthStore } from '../../store/authStore';

export default function RegisterSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [saving, setSaving] = useState(false);
  const credentialsRef = useRef(null);

  const credentials = location.state?.credentials;
  const user = location.state?.user;
  const token = location.state?.token;

  useEffect(() => {
    // Redirect if no credentials
    if (!credentials || !user || !token) {
      toast.error('Accès non autorisé');
      navigate('/register', { replace: true });
      return;
    }

    // Store credentials in localStorage
    localStorage.setItem('winpawa_token', token);
    localStorage.setItem('winpawa_user', JSON.stringify(user));

    // Update auth store
    login(user, token);
  }, [credentials, user, token, navigate, login]);

  if (!credentials || !user) {
    return null;
  }

  const handleCopy = async () => {
    const text = `Identifiants WINPAWA\n\nNom d'utilisateur: ${credentials.username}\nMot de passe: ${credentials.password}\n\nConservez ces identifiants en sécurité !`;

    try {
      // Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      toast.success('Identifiants copiés !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast.error('Impossible de copier les identifiants');
    }
  };

  const handleDownloadText = () => {
    const text = `WINPAWA - Vos Identifiants
=========================

Nom d'utilisateur: ${credentials.username}
Mot de passe: ${credentials.password}

Date de création: ${new Date().toLocaleString('fr-FR')}

IMPORTANT:
- Conservez ces identifiants en lieu sûr
- Ne partagez jamais votre mot de passe
- Vous pouvez modifier votre mot de passe dans votre profil

Bon jeu sur WINPAWA !
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `winpawa-credentials-${credentials.username}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Fichier téléchargé !');
  };

  const handleDownloadImage = async () => {
    if (!credentialsRef.current) return;

    try {
      setSaving(true);

      const canvas = await html2canvas(credentialsRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `winpawa-credentials-${credentials.username}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Image téléchargée !');
        setSaving(false);
      });
    } catch (error) {
      console.error('Erreur lors de la génération de l\'image:', error);
      toast.error('Erreur lors de la génération de l\'image');
      setSaving(false);
    }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleEditPassword = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mb-3 sm:mb-4 animate-bounce">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-gaming font-bold text-white mb-2">
            Inscription réussie !
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Voici vos identifiants de connexion
          </p>
        </div>

        {/* Credentials Card */}
        <div className="card mb-4 sm:mb-6 p-4 sm:p-6">
          <div
            ref={credentialsRef}
            className="bg-gradient-to-br from-dark-400 to-dark-500 rounded-xl p-4 sm:p-6 md:p-8 border border-gray-700"
          >
            {/* User Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Avatar
                src={user?.avatar}
                name={credentials.username}
                size="2xl"
                className="sm:!w-20 sm:!h-20"
              />
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{user?.name}</h2>
                <p className="text-gray-400 text-sm sm:text-base">Membre WINPAWA</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Username */}
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2 uppercase tracking-wide font-semibold">
                  Nom d'utilisateur
                </label>
                <div className="bg-dark-200/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                  <p className="text-white font-mono font-bold text-base sm:text-lg md:text-xl break-all">
                    {credentials.username}
                  </p>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2 uppercase tracking-wide font-semibold">
                  Mot de passe
                </label>
                <div className="bg-dark-200/50 rounded-lg p-3 sm:p-4 border border-gray-700 flex items-center justify-between gap-2">
                  <p className="text-white font-mono font-bold text-base sm:text-lg md:text-xl break-all flex-1">
                    {showPassword ? credentials.password : '••••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-xs sm:text-sm text-center font-semibold">
                ⚠️ Conservez précieusement ces identifiants
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 sm:space-y-4">
          {/* Save Options */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-dark-300 hover:bg-dark-200 rounded-lg sm:rounded-xl transition-colors border border-gray-700"
            >
              {copied ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              )}
              <span className="text-xs sm:text-sm text-gray-300 font-medium">Copier</span>
            </button>

            <button
              onClick={handleDownloadText}
              className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-dark-300 hover:bg-dark-200 rounded-lg sm:rounded-xl transition-colors border border-gray-700"
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-300 font-medium">TXT</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={saving}
              className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-dark-300 hover:bg-dark-200 rounded-lg sm:rounded-xl transition-colors border border-gray-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Image className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              )}
              <span className="text-xs sm:text-sm text-gray-300 font-medium">PNG</span>
            </button>
          </div>

          {/* Edit Password */}
          <button
            onClick={handleEditPassword}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-dark-300 hover:bg-dark-200 text-white rounded-lg sm:rounded-xl transition-colors border border-gray-700"
          >
            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Modifier mon mot de passe</span>
          </button>

          {/* Go Home */}
          <button
            onClick={handleGoHome}
            className="w-full btn-primary py-3 sm:py-4 text-sm sm:text-base"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
            Commencer à jouer
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-400 text-center">
            💡 Retrouvez ces infos dans votre profil
          </p>
        </div>
      </div>
    </div>
  );
}
