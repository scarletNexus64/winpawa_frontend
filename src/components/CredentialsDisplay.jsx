import { useState, useRef } from 'react';
import { Copy, Download, Edit2, Check, FileText, Image, Eye, EyeOff } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import Avatar from './Avatar';

export default function CredentialsDisplay({ credentials, user, onEdit, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [saving, setSaving] = useState(false);
  const credentialsRef = useRef(null);

  console.log('🎨 CredentialsDisplay mounted with:', { credentials, user });

  const handleCopy = () => {
    const text = `Identifiants WINPAWA\n\nNom d'utilisateur: ${credentials.username}\nMot de passe: ${credentials.password}\n\nConservez ces identifiants en sécurité !`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Identifiants copiés !');
    setTimeout(() => setCopied(false), 2000);
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

      // Créer le canvas à partir du div
      const canvas = await html2canvas(credentialsRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
      });

      // Convertir en blob et télécharger
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-dark-300 rounded-2xl max-w-lg w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Inscription réussie !</h2>
              <p className="text-gray-400 text-sm">Voici vos identifiants</p>
            </div>
          </div>
        </div>

        {/* Credentials Card */}
        <div className="p-6">
          <div
            ref={credentialsRef}
            className="bg-gradient-to-br from-dark-400 to-dark-500 rounded-xl p-6 border border-gray-700 mb-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <Avatar src={user?.avatar} name={credentials.username} size="xl" />
              <div>
                <h3 className="text-lg font-bold text-white">{user?.name || 'Utilisateur'}</h3>
                <p className="text-sm text-gray-400">WINPAWA Casino</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                  Nom d'utilisateur
                </label>
                <div className="bg-dark-200/50 rounded-lg p-3 border border-gray-700">
                  <p className="text-white font-mono font-semibold text-lg">
                    {credentials.username}
                  </p>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                  Mot de passe
                </label>
                <div className="bg-dark-200/50 rounded-lg p-3 border border-gray-700 flex items-center justify-between">
                  <p className="text-white font-mono font-semibold text-lg">
                    {showPassword ? credentials.password : '••••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-xs text-center">
                ⚠️ Conservez ces identifiants en sécurité. Vous en aurez besoin pour vous connecter.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Save Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-2 p-3 bg-dark-200 hover:bg-dark-100 rounded-lg transition-colors border border-gray-700"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-xs text-gray-400">Copier</span>
              </button>

              <button
                onClick={handleDownloadText}
                className="flex flex-col items-center gap-2 p-3 bg-dark-200 hover:bg-dark-100 rounded-lg transition-colors border border-gray-700"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400">Fichier</span>
              </button>

              <button
                onClick={handleDownloadImage}
                disabled={saving}
                className="flex flex-col items-center gap-2 p-3 bg-dark-200 hover:bg-dark-100 rounded-lg transition-colors border border-gray-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Image className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-xs text-gray-400">Image</span>
              </button>
            </div>

            {/* Edit Password */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dark-200 hover:bg-dark-100 text-white rounded-lg transition-colors border border-gray-700"
              >
                <Edit2 className="w-5 h-5" />
                <span>Modifier mon mot de passe</span>
              </button>
            )}

            {/* Continue */}
            <button
              onClick={onClose}
              className="w-full btn-primary"
            >
              Commencer à jouer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
