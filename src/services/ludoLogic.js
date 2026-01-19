/**
 * Course de Pions (Ludo) Game Logic
 * Gère la logique du jeu de course de pions
 */

/**
 * Couleurs disponibles pour les pions
 */
export const PION_COLORS = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
}

/**
 * Obtenir les recommandations de mise rapide
 */
export const getBetRecommendations = (minBet, maxBet, balance) => {
  const recommendations = []

  // Mise minimum
  if (minBet <= balance) {
    recommendations.push(minBet)
  }

  // 5x la mise minimum
  const medium = minBet * 5
  if (medium <= maxBet && medium <= balance) {
    recommendations.push(medium)
  }

  // 10x la mise minimum
  const high = minBet * 10
  if (high <= maxBet && high <= balance) {
    recommendations.push(high)
  }

  // 50x la mise minimum ou max bet
  const veryHigh = Math.min(minBet * 50, maxBet)
  if (veryHigh <= balance && veryHigh > high) {
    recommendations.push(veryHigh)
  }

  // Si pas assez de recommandations, ajouter des valeurs intermédiaires
  if (recommendations.length < 4) {
    const additional = [100, 500, 1000, 5000].filter(
      amount => amount >= minBet && amount <= maxBet && amount <= balance
    )
    recommendations.push(...additional)
  }

  // Retourner les 4 premières recommandations uniques
  return [...new Set(recommendations)].slice(0, 4)
}

/**
 * Calculer la vitesse de course pour chaque pion
 * Le gagnant aura toujours une vitesse légèrement plus élevée
 */
export const calculateRaceSpeeds = (winnerColor) => {
  const speeds = {}
  const colors = Object.values(PION_COLORS)

  colors.forEach(color => {
    if (color === winnerColor) {
      // Le gagnant a une vitesse de 1.0
      speeds[color] = 1.0
    } else {
      // Les autres ont une vitesse aléatoire entre 0.7 et 0.95
      speeds[color] = 0.7 + Math.random() * 0.25
    }
  })

  return speeds
}

/**
 * Simuler une course et retourner les positions finales
 */
export const simulateRace = (winnerColor, duration = 3000) => {
  return new Promise((resolve) => {
    const speeds = calculateRaceSpeeds(winnerColor)
    const finishLine = 100

    const positions = {}
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing pour un effet plus naturel
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Calculer les positions
      Object.keys(speeds).forEach(color => {
        const baseProgress = easeOut * speeds[color]
        positions[color] = Math.min(baseProgress * finishLine, finishLine)
      })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // S'assurer que le gagnant est à la ligne d'arrivée
        positions[winnerColor] = finishLine
        resolve(positions)
      }
    }

    requestAnimationFrame(animate)
  })
}

/**
 * Obtenir le classement des pions
 */
export const getRanking = (positions) => {
  return Object.entries(positions)
    .sort(([, a], [, b]) => b - a)
    .map(([color], index) => ({
      color,
      rank: index + 1,
      position: positions[color],
    }))
}

/**
 * Vérifier si un pion a gagné
 */
export const isPionWinner = (pionColor, winnerColor) => {
  return pionColor.toLowerCase() === winnerColor.toLowerCase()
}

/**
 * Obtenir les statistiques de la course
 */
export const getRaceStats = (positions, winnerColor) => {
  const ranking = getRanking(positions)
  const winner = ranking[0]
  const gap = positions[winnerColor] - positions[ranking[1].color]

  return {
    winner: winner.color,
    ranking,
    gap,
    totalDistance: 100,
  }
}

export const ludoLogic = {
  PION_COLORS,
  getBetRecommendations,
  calculateRaceSpeeds,
  simulateRace,
  getRanking,
  isPionWinner,
  getRaceStats,
}
