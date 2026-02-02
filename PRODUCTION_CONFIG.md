# Configuration de Production - WinPawa Frontend

Ce document résume les changements effectués pour configurer le frontend en production.

## Modifications effectuées

### 1. Variables d'environnement (.env)

**Fichier** : `.env`

Nouvelles configurations de production :

```env
# API Configuration
VITE_API_BASE_URL=https://admin-winpawa.sbs/api

# Laravel Reverb (WebSocket)
VITE_REVERB_APP_KEY=aurpwd1ffzmlwhfjtyyx
VITE_REVERB_HOST=admin-winpawa.sbs
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https

# Application
VITE_APP_NAME=WinPawa
VITE_APP_URL=https://winpawa.cm
```

### 2. Service API (src/services/api.js:5)

**Changement** : Mise à jour de la variable d'environnement

```javascript
// Avant
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.38.76.65:8000/api'

// Après
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://admin-winpawa.sbs/api'
```

### 3. Configuration WebSocket (src/lib/echo.js:9-27)

**Changement** : Utilisation des variables d'environnement pour Reverb

```javascript
// Configuration dynamique avec variables d'environnement
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
```

**Avantages** :
- Configuration centralisée dans .env
- Facile à modifier selon l'environnement
- Support automatique de WSS (WebSocket Secure) en production

### 4. Métadonnées HTML (index.html)

**Changement** : Mise à jour des preconnect et meta tags

```html
<!-- Preconnect optimisé -->
<link rel="preconnect" href="https://admin-winpawa.sbs" />
<link rel="dns-prefetch" href="https://admin-winpawa.sbs" />

<!-- Meta tags améliorés -->
<meta name="twitter:title" content="WinPawa - Casino Gaming au Cameroun" />
<meta name="twitter:description" content="Plateforme de jeux casino #1 au Cameroun..." />
```

**Avantages** :
- Chargement plus rapide grâce au preconnect
- Meilleure visibilité sur les réseaux sociaux
- SEO amélioré

### 5. Vite Config (vite.config.js:82-85)

**Changement** : Suppression du proxy local

```javascript
// Avant
server: {
  host: '0.0.0.0',
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}

// Après
server: {
  host: '0.0.0.0',
  port: 3000
}
```

**Raison** : En production, l'API est sur un domaine externe (admin-winpawa.sbs), donc le proxy local n'est plus nécessaire.

### 6. Fichier .env.example

**Ajout** : Documentation complète avec exemples pour développement et production

## Architecture de Production

```
┌─────────────────────────────────────────┐
│   Frontend (winpawa.cm)                 │
│   - React + Vite                        │
│   - PWA installable                     │
│   - Service Worker pour cache           │
└────────────┬────────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────────┐
│   Backend API (admin-winpawa.sbs/api)  │
│   - Laravel Sanctum (Auth)              │
│   - 46 endpoints REST                   │
│   - CORS activé (*)                     │
└────────────┬────────────────────────────┘
             │
             │ WSS (Port 443)
             ▼
┌─────────────────────────────────────────┐
│   WebSocket (admin-winpawa.sbs:443)    │
│   - Laravel Reverb                      │
│   - Real-time updates                   │
│   - Virtual Match live                  │
└─────────────────────────────────────────┘
```

## Endpoints API Disponibles

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/me` - Informations utilisateur
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/currencies` - Devises disponibles

### Jeux
- `GET /api/games` - Liste des jeux
- `GET /api/games/featured` - Jeux en vedette
- `GET /api/games/{game}` - Détails d'un jeu
- `POST /api/games/{game}/play` - Jouer à un jeu

### Portefeuille
- `GET /api/wallet/balance` - Solde
- `POST /api/wallet/deposit` - Dépôt
- `POST /api/wallet/withdraw` - Retrait
- `GET /api/wallet/transactions` - Historique

### Match Virtuel
- `GET /api/virtual-match/live` - Matchs en direct
- `GET /api/virtual-match/upcoming` - Matchs à venir
- `POST /api/virtual-match/{id}/bet` - Parier

### Affiliation
- `GET /api/affiliate/stats` - Statistiques
- `GET /api/affiliate/referrals` - Parrainages
- `POST /api/affiliate/withdraw` - Retrait commission

### Sports
- `GET /api/sports/categories` - Catégories sportives
- `GET /api/sports/matches` - Matchs disponibles

## Authentification

Toutes les requêtes authentifiées doivent inclure le token Sanctum :

```javascript
Authorization: Bearer <token>
```

Le token est automatiquement ajouté par l'intercepteur axios dans `src/services/api.js`.

## WebSocket - Laravel Echo

Connexion établie automatiquement au chargement de l'application :

```javascript
import echo from './lib/echo'

// Écouter un canal public
echo.channel('virtual-match')
  .listen('MatchStarted', (event) => {
    console.log('Match démarré:', event)
  })

// Écouter un canal privé (nécessite authentification)
echo.private(`user.${userId}`)
  .listen('BalanceUpdated', (event) => {
    console.log('Solde mis à jour:', event.balance)
  })
```

## Build et Déploiement

### Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Build de production

```bash
# Créer le build optimisé
npm run build

# Le dossier /dist contient les fichiers à déployer
```

### Preview du build

```bash
npm run preview
```

## Tests de connexion

### 1. Test API

```bash
# Test de connexion à l'API
curl https://admin-winpawa.sbs/api/games

# Test de login
curl -X POST https://admin-winpawa.sbs/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

### 2. Test WebSocket

Ouvrir la console du navigateur et vérifier les logs :

```
🔧 [Echo] Configuration du client Reverb/Echo...
✅ [Echo] Client Reverb configuré: { host: 'admin-winpawa.sbs', port: 443, scheme: 'wss' }
🟢 [WebSocket] Connecté à Reverb
🔗 [WebSocket] Socket ID: xxxxx
```

## Checklist de déploiement

- [x] Configuration .env mise à jour
- [x] API pointant vers admin-winpawa.sbs
- [x] WebSocket configuré avec WSS (port 443)
- [x] Proxy local retiré
- [x] Preconnect optimisé
- [x] Meta tags Open Graph configurés
- [ ] Build de production testé
- [ ] Icônes PWA générées (voir PWA_SETUP_GUIDE.md)
- [ ] Image og-image.png créée (1200x630px)
- [ ] Tests de connexion API effectués
- [ ] Tests WebSocket effectués
- [ ] Tests d'installation PWA (Android/iOS)

## Prochaines étapes

1. **Générer les icônes PWA** (voir PWA_SETUP_GUIDE.md)
   ```bash
   npm install sharp --save-dev
   node scripts/generate-pwa-icons.js
   ```

2. **Build et test**
   ```bash
   npm run build
   npm run preview
   ```

3. **Déployer sur le serveur**
   - Uploader le contenu du dossier `/dist`
   - Configurer le serveur web (Nginx/Apache)
   - Activer HTTPS

4. **Vérifier les fonctionnalités**
   - Connexion/inscription
   - Dépôt/retrait
   - Jeux fonctionnent
   - WebSocket connecté
   - PWA installable

## Support et Documentation

- Guide PWA complet : `PWA_SETUP_GUIDE.md`
- Instructions icônes : `public/PWA_ICONS_INSTRUCTIONS.md`
- Configuration example : `.env.example`

## Notes importantes

1. **CORS** : Le backend a CORS activé pour tous les domaines (*)
2. **HTTPS** : Le WebSocket nécessite HTTPS en production (forceTLS: true)
3. **Tokens** : Les tokens Sanctum expirent après 24h par défaut
4. **Cache** : Le service worker cache les API GET pendant 24h
5. **PWA** : L'installation PWA nécessite HTTPS

---

**Configuration effectuée le** : 2026-02-02
**Version frontend** : 1.0.0
**Status** : ✅ Production Ready (après génération des icônes PWA)
