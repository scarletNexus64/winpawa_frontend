# Instructions pour créer les icônes PWA et images Open Graph

## Images requises pour le PWA

Vous devez créer les icônes suivantes et les placer dans le dossier `/public` :

### 1. Icônes PWA (obligatoires)

- **pwa-64x64.png** - Icône 64x64 pixels
- **pwa-192x192.png** - Icône 192x192 pixels
- **pwa-512x512.png** - Icône 512x512 pixels
- **logo.png** - Icône pour Apple (minimum 180x180 pixels)

### 2. Image Open Graph (pour le partage de liens)

- **og-image.png** - Image 1200x630 pixels
  - Cette image apparaîtra lorsque vous partagerez le lien sur WhatsApp, Facebook, Twitter, etc.
  - Doit contenir le logo WinPawa et un message accrocheur
  - Exemple de texte : "WinPawa - Jouez et Gagnez avec MTN et Orange Money"

### 3. Capture d'écran (optionnel mais recommandé)

- **screenshot-mobile.png** - Capture d'écran 390x844 pixels
  - Capture d'écran de l'application sur mobile
  - Affichée dans les stores web et lors de l'installation

## Comment créer ces icônes ?

### Option 1 : Utiliser un outil en ligne (Recommandé)

1. **PWA Asset Generator** : https://www.pwabuilder.com/imageGenerator
   - Uploadez votre logo WinPawa (minimum 512x512px avec fond transparent)
   - Téléchargez toutes les icônes générées
   - Placez-les dans le dossier `/public`

2. **RealFaviconGenerator** : https://realfavicongenerator.net/
   - Uploadez votre logo
   - Configurez pour PWA/Android/iOS
   - Téléchargez le package

### Option 2 : Créer manuellement avec Photoshop/Figma/Canva

#### Pour les icônes PWA (64, 192, 512) :

1. Créez un carré avec les dimensions requises
2. Fond : Utilisez la couleur principale de WinPawa (exemple : #0f172a ou gradient)
3. Logo : Centrez le logo WinPawa
4. Exportez en PNG avec transparence si possible
5. Nommez selon la convention : `pwa-{taille}x{taille}.png`

#### Pour l'image Open Graph (1200x630) :

```
Structure recommandée :
┌─────────────────────────────────┐
│     [LOGO WINPAWA - Centré]     │
│                                 │
│    WinPawa - Casino Gaming      │
│   Jouez et Gagnez au Cameroun   │
│  MTN Mobile Money • Orange Money │
│                                 │
└─────────────────────────────────┘
```

**Spécifications :**
- Dimensions : 1200x630 pixels (format landscape)
- Format : PNG ou JPG
- Poids : Maximum 1 MB
- Fond : Dégradé ou couleur unie selon votre charte
- Police : Lisible et professionnelle
- Texte : Court et accrocheur

### Option 3 : Utiliser le logo existant temporairement

Si vous n'avez pas encore les icônes professionnelles, vous pouvez :

1. Renommer votre `logo.svg` actuel
2. Le convertir en PNG aux différentes tailles
3. Utiliser un outil CLI comme ImageMagick :

```bash
# Si vous avez ImageMagick installé
convert logo.svg -resize 64x64 pwa-64x64.png
convert logo.svg -resize 192x192 pwa-192x192.png
convert logo.svg -resize 512x512 pwa-512x512.png
convert logo.svg -resize 1200x630 og-image.png
```

Ou avec un script Node.js (sharp) :

```bash
npm install sharp
node scripts/generate-icons.js
```

## Checklist finale

- [ ] pwa-64x64.png créé et placé dans /public
- [ ] pwa-192x192.png créé et placé dans /public
- [ ] pwa-512x512.png créé et placé dans /public
- [ ] logo.png créé et placé dans /public (pour iOS)
- [ ] og-image.png créé et placé dans /public (pour partage de liens)
- [ ] screenshot-mobile.png créé et placé dans /public (optionnel)
- [ ] Vérifier que toutes les images sont optimisées (< 500 KB chacune)
- [ ] Tester le PWA sur Android et iOS
- [ ] Tester le partage de lien sur WhatsApp/Facebook

## URLs importantes dans le code

Après avoir créé les icônes, vérifiez que ces URLs sont correctes :

1. **index.html** (ligne 14) :
   - `<link rel="apple-touch-icon" href="/logo.png" />`

2. **index.html** (lignes 14, 25) :
   - `<meta property="og:image" content="https://winpawa.cm/og-image.png" />`
   - `<meta name="twitter:image" content="https://winpawa.cm/og-image.png" />`

3. **vite.config.js** (lignes 25-46) :
   - Icônes PWA dans le manifest

**Note** : Remplacez `https://winpawa.cm` par votre URL de production réelle.

## Test et validation

### Tester le PWA :

1. **Sur Android (Chrome)** :
   - Ouvrez votre site
   - Attendez le prompt d'installation
   - Installez l'application
   - Vérifiez l'icône sur l'écran d'accueil

2. **Sur iOS (Safari)** :
   - Ouvrez votre site dans Safari
   - Appuyez sur le bouton de partage
   - Sélectionnez "Sur l'écran d'accueil"
   - Vérifiez l'icône

### Tester Open Graph :

1. **Outils en ligne** :
   - https://www.opengraph.xyz/
   - https://cards-dev.twitter.com/validator
   - https://developers.facebook.com/tools/debug/

2. **Test réel** :
   - Partagez votre URL sur WhatsApp
   - Vérifiez que l'image et la description s'affichent correctement

## Ressources utiles

- Documentation PWA : https://web.dev/progressive-web-apps/
- Open Graph Protocol : https://ogp.me/
- PWA Builder : https://www.pwabuilder.com/
- Générateur d'icônes : https://icon.kitchen/
