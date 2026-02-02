# Guide de Configuration PWA - WinPawa

Ce guide explique comment finaliser la configuration du PWA (Progressive Web App) pour WinPawa.

## Ce qui a été configuré

### 1. Métadonnées Open Graph et SEO
Les meta tags suivants ont été ajoutés dans `index.html`:
- Open Graph (Facebook, WhatsApp)
- Twitter Cards
- Meta description
- Keywords SEO

Ces tags permettent un affichage professionnel lorsque vous partagez le lien de WinPawa sur les réseaux sociaux.

### 2. Configuration PWA
Le fichier `vite.config.js` a été configuré avec:
- Manifest PWA complet
- Service Worker avec cache intelligent
- Support Android et iOS
- Icônes et screenshots

### 3. Composant d'invitation à installer
Un composant `InstallPWA.jsx` a été créé qui:
- Détecte automatiquement Android et iOS
- Affiche un prompt élégant pour inviter l'utilisateur à installer l'app
- Fournit des instructions spécifiques pour iOS
- Se rappelle si l'utilisateur a refusé (réaffiche après 7 jours)
- S'affiche automatiquement 3 secondes après le chargement de la page

## Ce qu'il reste à faire

### Étape 1: Créer les icônes PWA (OBLIGATOIRE)

Vous avez 3 options:

#### Option A: Générer automatiquement avec le script (Recommandé)

1. Installez sharp:
```bash
npm install sharp --save-dev
```

2. Placez votre logo source dans `/public/logo-source.png`
   - Format: PNG avec fond transparent
   - Taille minimum: 512x512 pixels

3. Exécutez le script:
```bash
node scripts/generate-pwa-icons.js
```

#### Option B: Utiliser un outil en ligne

1. Visitez https://www.pwabuilder.com/imageGenerator
2. Uploadez votre logo WinPawa
3. Téléchargez les icônes générées
4. Placez-les dans `/public/`

#### Option C: Les créer manuellement

Créez ces fichiers dans `/public/`:
- `pwa-64x64.png` (64x64px)
- `pwa-192x192.png` (192x192px)
- `pwa-512x512.png` (512x512px)
- `logo.png` (180x180px minimum)
- `og-image.png` (1200x630px) - Pour le partage de liens

Voir `/public/PWA_ICONS_INSTRUCTIONS.md` pour plus de détails.

### Étape 2: Créer l'image Open Graph (OBLIGATOIRE)

L'image `og-image.png` (1200x630px) doit contenir:
- Le logo WinPawa
- Un titre accrocheur
- Les avantages (MTN/Orange Money)

Cette image s'affichera quand vous partagerez votre lien sur:
- WhatsApp
- Facebook
- Twitter
- LinkedIn

### Étape 3: Mettre à jour les URLs de production

Dans `index.html`, remplacez `https://winpawa.cm` par votre URL réelle:
```html
<!-- Lignes 14 et 25 -->
<meta property="og:url" content="https://VOTRE-URL.com" />
<meta property="og:image" content="https://VOTRE-URL.com/og-image.png" />
<meta name="twitter:image" content="https://VOTRE-URL.com/og-image.png" />
```

### Étape 4: Créer un screenshot mobile (Optionnel)

Prenez une capture d'écran de votre application:
- Format: 390x844 pixels (format iPhone)
- Nom: `screenshot-mobile.png`
- Placez dans `/public/`

## Test de votre PWA

### 1. Build et test local

```bash
npm run build
npm run preview
```

Visitez l'URL affichée sur votre téléphone (Android ou iOS).

### 2. Test sur Android (Chrome)

1. Ouvrez le site sur Chrome mobile
2. Attendez 3 secondes
3. Le prompt d'installation devrait apparaître
4. Cliquez sur "Installer maintenant"
5. L'application apparaît sur votre écran d'accueil

### 3. Test sur iOS (Safari)

1. Ouvrez le site sur Safari mobile
2. Attendez 3 secondes
3. Un prompt avec instructions apparaît
4. Suivez les instructions:
   - Appuyez sur le bouton partage (en bas)
   - Sélectionnez "Sur l'écran d'accueil"
   - Appuyez sur "Ajouter"

### 4. Test du partage de lien

Méthode 1 - Outils en ligne:
- https://www.opengraph.xyz/
- https://cards-dev.twitter.com/validator
- https://developers.facebook.com/tools/debug/

Méthode 2 - Test réel:
- Partagez votre URL sur WhatsApp
- Vérifiez que l'image et la description s'affichent

## Fonctionnalités du PWA

### Pour les utilisateurs

1. **Installation facile**
   - Un seul clic pour installer
   - Pas besoin de passer par un store

2. **Accès rapide**
   - Icône sur l'écran d'accueil
   - Lancement instantané

3. **Expérience app native**
   - Plein écran (pas de barre d'adresse)
   - Splash screen au lancement
   - Icône personnalisée

4. **Performance**
   - Cache intelligent
   - Chargement rapide
   - Fonctionne hors ligne (partiellement)

### Gestion du cache

Le service worker cache automatiquement:
- Tous les fichiers statiques (JS, CSS, images)
- Les polices (woff2)
- Les réponses API (24h)

Cache strategy:
- **NetworkFirst** pour les API
- **CacheFirst** pour les assets statiques

## Dépannage

### Le prompt d'installation ne s'affiche pas

Vérifications:
1. L'application est servie en HTTPS (obligatoire)
2. Les icônes PWA existent dans `/public/`
3. Le manifest est valide (vérifier dans DevTools > Application > Manifest)
4. Sur iOS, vous devez suivre les instructions manuelles

### Les icônes ne s'affichent pas

1. Vérifiez que les fichiers existent dans `/public/`
2. Videz le cache: DevTools > Application > Clear storage
3. Rebuild: `npm run build`

### L'image Open Graph ne s'affiche pas

1. Vérifiez que `og-image.png` existe
2. Utilisez l'URL complète (pas de chemin relatif)
3. Testez avec https://www.opengraph.xyz/
4. Sur WhatsApp, le cache peut prendre du temps (24h)

### Service Worker ne se met pas à jour

```bash
# En développement
npm run dev

# En production, le service worker se met à jour automatiquement
# Ou forcez la mise à jour dans DevTools > Application > Service Workers > Update
```

## Personnalisation avancée

### Modifier les couleurs du PWA

Dans `vite.config.js`:
```javascript
theme_color: '#0f172a',     // Couleur de la barre d'état
background_color: '#0f172a', // Couleur du splash screen
```

### Modifier le comportement d'installation

Dans `src/components/InstallPWA.jsx`:
```javascript
// Ligne 43: Délai avant affichage du prompt
setTimeout(() => setShowInstallPrompt(true), 3000) // 3 secondes

// Ligne 37: Durée avant réaffichage
const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000 // 7 jours
```

### Ajouter des screenshots

Dans `vite.config.js`, ajoutez dans `screenshots`:
```javascript
{
  src: '/screenshot-desktop.png',
  sizes: '1920x1080',
  type: 'image/png',
  form_factor: 'wide'
}
```

## Ressources utiles

- [PWA Builder](https://www.pwabuilder.com/)
- [Documentation Vite PWA](https://vite-pwa-org.netlify.app/)
- [Open Graph Protocol](https://ogp.me/)
- [Can I Use - PWA](https://caniuse.com/web-app-manifest)

## Support

Si vous rencontrez des problèmes:
1. Consultez `/public/PWA_ICONS_INSTRUCTIONS.md`
2. Vérifiez les DevTools > Console pour les erreurs
3. Testez le manifest: DevTools > Application > Manifest

## Checklist finale

- [ ] Icônes PWA créées (64, 192, 512px)
- [ ] Image Open Graph créée (1200x630px)
- [ ] URLs de production mises à jour
- [ ] Build testé: `npm run build && npm run preview`
- [ ] Installation testée sur Android
- [ ] Installation testée sur iOS
- [ ] Partage de lien testé sur WhatsApp/Facebook
- [ ] Service worker fonctionne (DevTools > Application)
- [ ] Manifest valide (DevTools > Application > Manifest)

---

Une fois toutes ces étapes complétées, votre PWA WinPawa sera prêt pour la production !
