# WinPawa Frontend

Frontend moderne pour la plateforme de casino gaming WinPawa, développé avec React, Vite, et Tailwind CSS.

## Technologies

- **React 18** - Bibliothèque UI
- **Vite** - Build tool et dev server ultra-rapide
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **React Hot Toast** - Notifications
- **Lucide React** - Icônes
- **Date-fns** - Manipulation des dates
- **PWA** - Progressive Web App avec vite-plugin-pwa

## Caractéristiques

✨ **Dark Theme Gaming** - Interface sombre optimisée pour le gaming
📱 **Mobile Responsive** - Navigation bottom bar pour mobile
🎮 **12 Jeux de Casino** - Interface pour tous les jeux
💰 **Wallet Multi-Balance** - Gestion des soldes principal, bonus et affiliation
🎯 **Match Virtuel** - Paris sur des matchs de football virtuels
👥 **Système d'Affiliation** - Programme de parrainage avec commissions
🎁 **Bonus** - Système de bonus de bienvenue
📊 **Historique** - Suivi complet des paris et transactions
🔐 **Authentification** - Login/Register sécurisé
🌐 **PWA Ready** - Installation comme app native

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer l'URL de l'API dans .env
VITE_API_URL=http://localhost:8000/api
```

## Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:3000
```

## Build

```bash
# Build de production
npm run build

# Preview du build
npm run preview
```

## Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── games/          # Composants liés aux jeux
│   └── layout/         # Composants de layout
├── layouts/            # Layouts principaux
│   ├── MainLayout.jsx  # Layout principal avec header/nav
│   └── AuthLayout.jsx  # Layout pour auth pages
├── pages/              # Pages de l'application
│   ├── auth/          # Pages d'authentification
│   ├── Home.jsx       # Page d'accueil
│   ├── Games.jsx      # Liste des jeux
│   ├── GamePlay.jsx   # Interface de jeu
│   ├── Wallet.jsx     # Gestion du wallet
│   ├── Profile.jsx    # Profil utilisateur
│   ├── Affiliate.jsx  # Programme d'affiliation
│   ├── History.jsx    # Historique des paris
│   └── VirtualMatch.jsx # Matchs virtuels
├── services/          # Services API
│   ├── api.js        # Client Axios configuré
│   ├── authService.js
│   ├── gameService.js
│   ├── walletService.js
│   ├── affiliateService.js
│   └── virtualMatchService.js
├── store/            # State management (Zustand)
│   ├── authStore.js
│   ├── walletStore.js
│   └── gameStore.js
├── App.jsx          # Composant racine
├── main.jsx         # Point d'entrée
└── index.css        # Styles globaux

```

## API Backend

Le frontend communique avec le backend Laravel situé à:
`/Users/macbookpro/Desktop/Developments/Personnals/winpawa/winpawa_backend`

Assurez-vous que le backend est démarré avant d'utiliser le frontend:
```bash
cd ../winpawa/winpawa_backend
php artisan serve
```

## Fonctionnalités Principales

### Authentification
- Inscription avec Code promo optionnel
- Connexion sécurisée
- Gestion du profil
- Changement de mot de passe

### Jeux
- 12 jeux de casino (Roulette, Scratch Card, Coin Flip, etc.)
- Interface de jeu interactive
- Mise min/max configurables
- RTP et taux de gain affichés
- Historique des paris

### Wallet
- 3 types de solde (Principal, Bonus, Affiliation)
- Dépôt via MTN Mobile Money / Orange Money
- Retrait sécurisé
- Historique des transactions

### Affiliation
- Code promo unique
- Commission 5% sur dépôts
- Commission 25% sur pertes
- Tableau de bord avec statistiques
- Liste des filleuls et commissions

### Match Virtuel
- Matchs de football générés automatiquement
- Paris en direct
- Différentes cotes (1, X, 2)
- Résultats en temps réel

## Thème et Design

Le design utilise un dark theme gaming avec:
- Palette de couleurs: Purple, Gold, Blue, Green, Red
- Animations Framer Motion
- Effets de glow et neon
- Gradients dynamiques
- Responsive mobile-first
- Bottom navigation pour mobile

## PWA

L'application est configurée comme PWA:
- Installation sur écran d'accueil
- Fonctionne hors-ligne (cache API)
- Icônes optimisées
- Manifest.json configuré

## Scripts Disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Preview du build
- `npm run lint` - Linter ESLint

## Variables d'Environnement

```env
VITE_API_URL=http://localhost:8000/api
```

## Support Navigateurs

- Chrome/Edge (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Licence

Propriétaire - WinPawa © 2024

## Contact

Pour toute question ou support, contactez l'équipe de développement WinPawa.
