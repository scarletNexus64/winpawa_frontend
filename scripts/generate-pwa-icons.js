/**
 * Script pour générer les icônes PWA à partir d'une image source
 *
 * Prérequis: npm install sharp --save-dev
 *
 * Usage:
 * 1. Placez votre logo source (PNG ou SVG) dans le dossier public/
 * 2. Renommez-le en "logo-source.png" (ou modifiez INPUT_IMAGE ci-dessous)
 * 3. Exécutez: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Configuration
const INPUT_IMAGE = path.join(__dirname, '../public/logo-source.png')
const OUTPUT_DIR = path.join(__dirname, '../public')

// Tailles d'icônes à générer
const ICON_SIZES = [
  { size: 64, name: 'pwa-64x64.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'logo.png' } // Pour Apple
]

// Taille pour l'image Open Graph
const OG_IMAGE = {
  width: 1200,
  height: 630,
  name: 'og-image.png'
}

async function generateIcons() {
  console.log('🚀 Génération des icônes PWA...\n')

  // Vérifier que l'image source existe
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error('❌ Erreur: Image source introuvable!')
    console.error(`   Veuillez placer votre logo dans: ${INPUT_IMAGE}`)
    console.error('   Le logo doit être un PNG avec fond transparent, minimum 512x512px\n')
    process.exit(1)
  }

  try {
    // Générer les icônes PWA
    for (const icon of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, icon.name)

      await sharp(INPUT_IMAGE)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
        })
        .png()
        .toFile(outputPath)

      console.log(`✅ ${icon.name} créé (${icon.size}x${icon.size}px)`)
    }

    // Générer l'image Open Graph
    const ogOutputPath = path.join(OUTPUT_DIR, OG_IMAGE.name)

    await sharp(INPUT_IMAGE)
      .resize(Math.min(512, OG_IMAGE.height - 100), Math.min(512, OG_IMAGE.height - 100), {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: (OG_IMAGE.height - 512) / 2,
        bottom: (OG_IMAGE.height - 512) / 2,
        left: (OG_IMAGE.width - 512) / 2,
        right: (OG_IMAGE.width - 512) / 2,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      })
      .png()
      .toFile(ogOutputPath)

    console.log(`✅ ${OG_IMAGE.name} créé (${OG_IMAGE.width}x${OG_IMAGE.height}px)`)

    console.log('\n✨ Toutes les icônes ont été générées avec succès!')
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Vérifiez les icônes générées dans /public')
    console.log('   2. Modifiez og-image.png avec un éditeur pour ajouter du texte')
    console.log('   3. Testez votre PWA avec: npm run build && npm run preview')
    console.log('   4. Visitez https://www.opengraph.xyz/ pour tester les meta tags\n')

  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error.message)
    console.error('\n💡 Assurez-vous que sharp est installé:')
    console.error('   npm install sharp --save-dev\n')
    process.exit(1)
  }
}

// Exécuter le script
generateIcons()
