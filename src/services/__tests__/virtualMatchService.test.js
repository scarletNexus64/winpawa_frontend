// Test file pour virtualMatchService
// Ce fichier peut être utilisé pour tester manuellement les appels API

import { virtualMatchService } from '../virtualMatchService'

// Fonction de test à exécuter dans la console du navigateur
export const testVirtualMatchService = async () => {
  console.log('🧪 Test du service Virtual Match...\n')

  try {
    // Test 1: Récupérer les matchs à venir
    console.log('1️⃣ Test getUpcoming()...')
    const upcoming = await virtualMatchService.getUpcoming()
    console.log('✅ Matchs à venir:', upcoming)
    console.log(`   → ${upcoming.data.length} matchs trouvés\n`)

    // Test 2: Récupérer les matchs en live
    console.log('2️⃣ Test getLive()...')
    const live = await virtualMatchService.getLive()
    console.log('✅ Matchs en live:', live)
    console.log(`   → ${live.data.length} matchs en cours\n`)

    // Test 3: Récupérer les résultats
    console.log('3️⃣ Test getResults()...')
    const results = await virtualMatchService.getResults()
    console.log('✅ Résultats:', results)
    console.log(`   → ${results.data.length} matchs terminés\n`)

    console.log('🎉 Tous les tests sont passés avec succès!')
    return { upcoming, live, results }
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    throw error
  }
}

// Export pour utilisation directe
export default testVirtualMatchService
