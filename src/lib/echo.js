import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

console.log('🔧 [Echo] Configuration du client Reverb/Echo...')

// Configuration Reverb depuis les variables d'environnement
const config = {
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'aurpwd1ffzmlwhfjtyyx',
  wsHost: import.meta.env.VITE_REVERB_HOST || 'admin-winpawa.sbs',
  wsPort: import.meta.env.VITE_REVERB_PORT || 443,
  wssPort: import.meta.env.VITE_REVERB_PORT || 443,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
}

const echo = new Echo(config);

console.log('✅ [Echo] Client Reverb configuré:', {
  host: config.wsHost,
  port: config.wsPort,
  scheme: config.forceTLS ? 'wss' : 'ws',
  key: config.key
})

// Logger les événements de connexion
if (echo.connector && echo.connector.pusher) {
  echo.connector.pusher.connection.bind('connected', () => {
    console.log('🟢 [WebSocket] Connecté à Reverb')
    console.log('🔗 [WebSocket] Socket ID:', echo.connector.pusher.connection.socket_id)
  })

  echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('🔴 [WebSocket] Déconnecté de Reverb')
  })

  echo.connector.pusher.connection.bind('error', (error) => {
    console.error('❌ [WebSocket] Erreur de connexion:', error)
  })

  echo.connector.pusher.connection.bind('state_change', (states) => {
    console.log('🔄 [WebSocket] Changement d\'état:', states.previous, '→', states.current)
  })

  echo.connector.pusher.connection.bind('unavailable', () => {
    console.error('❌ [WebSocket] Reverb non disponible - Vérifiez que le serveur tourne sur :8080')
  })
}

export default echo;
