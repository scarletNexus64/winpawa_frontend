import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Share } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://')
    setIsStandalone(standalone)

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)

    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time')

    // Show again after 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    const shouldShowAgain = !dismissedTime || (Date.now() - parseInt(dismissedTime)) > sevenDaysInMs

    // For Android and Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!dismissed || shouldShowAgain) {
        // Show prompt after 3 seconds
        setTimeout(() => setShowInstallPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS - show prompt if not installed and not dismissed recently
    if (iOS && !standalone && (!dismissed || shouldShowAgain)) {
      setTimeout(() => setShowInstallPrompt(true), 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString())
  }

  const handleRemindLater = () => {
    setShowInstallPrompt(false)
    // Don't set dismissed flag, so it can show again in next session
  }

  // Don't show if already installed
  if (isStandalone) return null

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 z-[200] backdrop-blur-sm"
            onClick={handleRemindLater}
          />

          {/* Install Prompt Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[201]"
          >
            <div className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 hover:bg-dark-300 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Header with logo */}
              <div className="relative h-32 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="relative"
                >
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <img src="/logo.svg" alt="WinPawa" className="w-16 h-16" />
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Installez WinPawa
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Accédez rapidement à vos jeux préférés depuis votre écran d'accueil
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 bg-dark-300/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Download className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Installation rapide</p>
                      <p className="text-gray-500 text-xs">Aucun téléchargement depuis le store</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Smartphone className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Expérience optimale</p>
                      <p className="text-gray-500 text-xs">Accès hors ligne et notifications</p>
                    </div>
                  </div>
                </div>

                {/* iOS specific instructions */}
                {isIOS ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Share className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium text-sm mb-1">
                          Instructions pour iOS :
                        </p>
                        <ol className="text-gray-300 text-xs space-y-2 list-decimal list-inside">
                          <li>Appuyez sur le bouton de partage <Share className="w-3 h-3 inline" /> en bas de Safari</li>
                          <li>Faites défiler et sélectionnez "Sur l'écran d'accueil"</li>
                          <li>Appuyez sur "Ajouter"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Android install button */
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" />
                      <span>Installer maintenant</span>
                    </div>
                  </button>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleRemindLater}
                    className="flex-1 bg-dark-300 hover:bg-dark-400 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
                  >
                    Plus tard
                  </button>
                  {!isIOS && (
                    <button
                      onClick={handleDismiss}
                      className="flex-1 bg-dark-300 hover:bg-dark-400 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
                    >
                      Ne plus afficher
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
