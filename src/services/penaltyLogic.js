/**
 * Penalty Game Logic Service
 * Gère toute la logique métier du jeu de Tir au But (Penalty)
 */

import { PENALTY_CONFIG } from '../config/gameConfig'

/**
 * Classe de gestion de la logique du jeu de Penalty
 */
export class PenaltyLogic {
  constructor(gameConfig) {
    this.config = gameConfig || PENALTY_CONFIG
    this.positions = this.config.positions
  }

  /**
   * Obtenir toutes les positions de tir disponibles
   */
  getAvailablePositions() {
    return this.positions.map(pos => ({
      id: pos.id,
      label: pos.label,
      color: pos.color,
      x: pos.x,
      y: pos.y
    }))
  }

  /**
   * Valider la position choisie par le joueur
   */
  validatePosition(positionId) {
    const position = this.positions.find(p => p.id === parseInt(positionId))

    if (!position) {
      return {
        valid: false,
        error: 'Position invalide'
      }
    }

    return {
      valid: true,
      position
    }
  }

  /**
   * Déterminer la position du gardien pour l'animation
   * Le backend devrait idéalement retourner goalkeeper_position dans le résultat
   *
   * Logique actuelle (temporaire jusqu'à ce que le backend l'implémente) :
   * - Si gagné : le gardien plonge vers une position adjacente ou opposée
   * - Si perdu : le gardien plonge vers la même position (arrêt)
   */
  getGoalkeeperPosition(playerChoice, isWinner, positions) {
    const playerPos = parseInt(playerChoice)

    if (isWinner) {
      // Le gardien a plongé vers une mauvaise position
      // Stratégie : choisir une position éloignée pour rendre l'animation réaliste

      const positionMap = {
        1: [3, 4, 5], // Si joueur tire Gauche Bas, gardien peut aller Centre, Droite Haut, Droite Bas
        2: [3, 4, 5], // Si joueur tire Gauche Haut, gardien peut aller Centre, Droite Haut, Droite Bas
        3: [1, 2, 4, 5], // Si joueur tire Centre, gardien peut aller n'importe où sauf centre
        4: [1, 2, 3], // Si joueur tire Droite Haut, gardien peut aller Gauche Bas, Gauche Haut, Centre
        5: [1, 2, 3], // Si joueur tire Droite Bas, gardien peut aller Gauche Bas, Gauche Haut, Centre
      }

      const availablePositionIds = positionMap[playerPos] || [1, 2, 3, 4, 5].filter(id => id !== playerPos)
      const randomId = availablePositionIds[Math.floor(Math.random() * availablePositionIds.length)]

      return positions.find(p => p.id === randomId)
    } else {
      // Le gardien a bien lu le jeu et plongé au bon endroit (arrêt)
      return positions.find(p => p.id === playerPos)
    }
  }

  /**
   * Calculer la trajectoire du ballon
   */
  calculateBallTrajectory(startX, startY, targetX, targetY) {
    // Points de contrôle pour la courbe de Bézier (trajectoire réaliste)
    const controlPoint1X = startX + (targetX - startX) * 0.3
    const controlPoint1Y = startY - 50 // Le ballon monte

    const controlPoint2X = startX + (targetX - startX) * 0.7
    const controlPoint2Y = targetY - 30 // Puis redescend

    return {
      start: { x: startX, y: startY },
      control1: { x: controlPoint1X, y: controlPoint1Y },
      control2: { x: controlPoint2X, y: controlPoint2Y },
      end: { x: targetX, y: targetY }
    }
  }

  /**
   * Obtenir les statistiques de difficulté pour chaque position
   * Basé sur la configuration du jeu
   */
  getPositionDifficulty() {
    return {
      1: { difficulty: 'Moyenne', successRate: 60 }, // Gauche
      2: { difficulty: 'Difficile', successRate: 45 }, // Centre Gauche
      3: { difficulty: 'Très difficile', successRate: 30 }, // Centre
      4: { difficulty: 'Difficile', successRate: 45 }, // Centre Droit
      5: { difficulty: 'Moyenne', successRate: 60 }, // Droite
    }
  }

  /**
   * Générer un message de résultat personnalisé
   */
  getResultMessage(isWinner, multiplier = null) {
    if (isWinner) {
      const messages = [
        '⚽ BUT MAGNIFIQUE !',
        '🎯 FRAPPE PARFAITE !',
        '⚡ GOAL EXCEPTIONNEL !',
        '🔥 TIR IMPARABLE !',
        '💪 PENALTY TRANSFORMÉ !'
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    } else {
      const messages = [
        '🧤 ARRÊT DU GARDIEN !',
        '❌ PENALTY MANQUÉ !',
        '😢 LE GARDIEN A PLONGÉ DU BON CÔTÉ !',
        '🚫 TIR ARRÊTÉ !',
        '💔 SI PROCHE !'
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    }
  }

  /**
   * Obtenir la durée de l'animation de tir
   */
  getShootDuration() {
    return this.config.shootDuration || 1500
  }

  /**
   * Calculer les coordonnées pour l'animation du gardien
   */
  getGoalkeeperDiveAnimation(targetPosition) {
    const position = this.positions.find(p => p.id === targetPosition.id)

    if (!position) {
      return { x: 50, y: 60 } // Position centrale par défaut
    }

    return {
      x: position.x,
      y: position.y + 20 // Un peu plus bas que la position de tir
    }
  }

  /**
   * Générer des statistiques de jeu
   */
  generateGameStats(history = []) {
    const total = history.length
    const wins = history.filter(h => h.is_winner).length
    const losses = total - wins

    const positionStats = {}
    this.positions.forEach(pos => {
      const positionPlays = history.filter(h => h.choice === pos.id.toString())
      positionStats[pos.id] = {
        label: pos.label,
        plays: positionPlays.length,
        wins: positionPlays.filter(h => h.is_winner).length,
        winRate: positionPlays.length > 0
          ? Math.round((positionPlays.filter(h => h.is_winner).length / positionPlays.length) * 100)
          : 0
      }
    })

    return {
      total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      positionStats
    }
  }

  /**
   * Obtenir des conseils stratégiques
   */
  getStrategicTips() {
    return [
      "Les coins du but sont généralement plus difficiles à arrêter",
      "Le centre est risqué mais offre un meilleur multiplicateur",
      "Variez vos positions pour déjouer le gardien",
      "Les tirs en hauteur sont plus difficiles à arrêter",
      "Observez les patterns de vos précédents tirs"
    ]
  }

  /**
   * Formater le résultat pour l'affichage
   */
  formatGameResult(result) {
    const { is_winner, payout, bet_amount, multiplier, choice } = result
    const position = this.positions.find(p => p.id === parseInt(choice))

    return {
      isWinner: is_winner,
      message: this.getResultMessage(is_winner, multiplier),
      position: position?.label || 'Inconnue',
      positionColor: position?.color || '#999',
      payout: payout || 0,
      betAmount: bet_amount,
      multiplier: multiplier || 0,
      netGain: is_winner ? (payout - bet_amount) : -bet_amount
    }
  }

  /**
   * Valider le montant de la mise
   */
  validateBet(amount, minBet, maxBet, balance) {
    if (!amount || amount <= 0) {
      return { valid: false, message: 'Montant invalide' }
    }

    if (amount < minBet) {
      return { valid: false, message: `Mise minimum: ${minBet} XAF` }
    }

    if (amount > maxBet) {
      return { valid: false, message: `Mise maximum: ${maxBet} XAF` }
    }

    if (amount > balance) {
      return { valid: false, message: 'Solde insuffisant' }
    }

    return { valid: true }
  }

  /**
   * Générer des recommendations de mise
   */
  getBetRecommendations(minBet, maxBet, balance) {
    const recommendations = []

    // Mise minimum
    recommendations.push(minBet)

    // 25% du max si possible
    const quarterMax = Math.floor(maxBet * 0.25)
    if (quarterMax > minBet && quarterMax <= balance) {
      recommendations.push(quarterMax)
    }

    // 50% du max si possible
    const halfMax = Math.floor(maxBet * 0.5)
    if (halfMax > minBet && halfMax <= balance && !recommendations.includes(halfMax)) {
      recommendations.push(halfMax)
    }

    // Mise maximum si le solde le permet
    if (maxBet <= balance && !recommendations.includes(maxBet)) {
      recommendations.push(maxBet)
    }

    return recommendations.slice(0, 4) // Maximum 4 recommandations
  }
}

// Export une instance par défaut
export const penaltyLogic = new PenaltyLogic()

// Export aussi la classe pour permettre la création d'instances personnalisées
export default PenaltyLogic
