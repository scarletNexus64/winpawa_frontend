/**
 * Color Roulette Game Logic
 * Gère la logique du jeu de roulette de couleurs
 */

/**
 * Couleurs disponibles
 */
export const ROULETTE_COLORS = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
}

/**
 * Configuration des couleurs avec leurs propriétés
 */
export const COLOR_CONFIG = {
  red: {
    value: 'red',
    label: 'Rouge',
    hex: '#EF4444',
    gradient: 'from-red-500 to-red-600',
  },
  blue: {
    value: 'blue',
    label: 'Bleu',
    hex: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600',
  },
  green: {
    value: 'green',
    label: 'Vert',
    hex: '#10B981',
    gradient: 'from-green-500 to-green-600',
  },
  yellow: {
    value: 'yellow',
    label: 'Jaune',
    hex: '#F59E0B',
    gradient: 'from-yellow-500 to-yellow-600',
  },
}

/**
 * Obtenir l'angle pour une couleur donnée (position sur la roue)
 */
export const getAngleForColor = (colorValue) => {
  const colorOrder = ['red', 'blue', 'green', 'yellow']
  const colorIndex = colorOrder.indexOf(colorValue)

  if (colorIndex === -1) return 0

  // Chaque couleur occupe 90 degrés (360/4)
  return colorIndex * 90
}

/**
 * Obtenir la couleur à un angle donné
 */
export const getColorAtAngle = (angle) => {
  const normalizedAngle = ((angle % 360) + 360) % 360
  const colorOrder = ['red', 'blue', 'green', 'yellow']
  const index = Math.floor(normalizedAngle / 90) % 4

  return colorOrder[index]
}

/**
 * Calculer la rotation totale pour atteindre une couleur
 */
export const calculateTotalRotation = (currentRotation, targetColor, fullRotations = 5) => {
  const targetAngle = getAngleForColor(targetColor)
  const totalRotation = (fullRotations * 360) + targetAngle

  return {
    totalRotation,
    finalAngle: targetAngle,
    fullRotations,
  }
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
 * Vérifier si une couleur est gagnante
 */
export const isColorWinner = (selectedColor, winningColor) => {
  return selectedColor.toLowerCase() === winningColor.toLowerCase()
}

/**
 * Obtenir les statistiques de la roulette
 */
export const getRouletteStats = (spins) => {
  const colorCounts = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
  }

  spins.forEach(spin => {
    if (colorCounts[spin.result] !== undefined) {
      colorCounts[spin.result]++
    }
  })

  const totalSpins = spins.length

  return {
    totalSpins,
    colorCounts,
    percentages: {
      red: totalSpins > 0 ? (colorCounts.red / totalSpins * 100).toFixed(1) : 0,
      blue: totalSpins > 0 ? (colorCounts.blue / totalSpins * 100).toFixed(1) : 0,
      green: totalSpins > 0 ? (colorCounts.green / totalSpins * 100).toFixed(1) : 0,
      yellow: totalSpins > 0 ? (colorCounts.yellow / totalSpins * 100).toFixed(1) : 0,
    },
  }
}

/**
 * Générer une séquence d'animation pour la rotation
 */
export const generateSpinAnimation = (startRotation, targetColor, duration = 4000) => {
  const { totalRotation } = calculateTotalRotation(startRotation, targetColor)

  return {
    startRotation,
    endRotation: startRotation + totalRotation,
    duration,
    easing: 'cubic-out', // Pour ralentir progressivement
  }
}

export const colorRouletteLogic = {
  ROULETTE_COLORS,
  COLOR_CONFIG,
  getAngleForColor,
  getColorAtAngle,
  calculateTotalRotation,
  getBetRecommendations,
  isColorWinner,
  getRouletteStats,
  generateSpinAnimation,
}
