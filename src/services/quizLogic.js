/**
 * Quiz Chance Game Logic
 * Gère la logique du jeu de quiz à choix multiples
 */

/**
 * Options de réponses disponibles
 */
export const QUIZ_ANSWERS = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
}

/**
 * Questions thématiques aléatoires (cosmétique uniquement)
 * La vraie question n'a pas d'importance car c'est un jeu de chance
 */
export const QUIZ_QUESTIONS = [
  "Quelle est la bonne réponse ?",
  "Faites le bon choix !",
  "Choisissez votre chance !",
  "Quelle option gagnera ?",
  "Testez votre intuition !",
  "Êtes-vous prêt à gagner ?",
  "Tentez votre chance !",
  "Laquelle est la gagnante ?",
  "Sélectionnez la réponse correcte !",
  "Quelle sera votre chance ?",
]

/**
 * Obtenir une question aléatoire
 */
export const getRandomQuestion = () => {
  return QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)]
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
 * Vérifier si une réponse est correcte
 */
export const isAnswerCorrect = (userAnswer, correctAnswer) => {
  return userAnswer.toUpperCase() === correctAnswer.toUpperCase()
}

/**
 * Obtenir la couleur associée à une réponse
 */
export const getAnswerColor = (answer) => {
  const colors = {
    A: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500',
      border: 'border-blue-500',
      text: 'text-blue-400',
    },
    B: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-500',
      border: 'border-green-500',
      text: 'text-green-400',
    },
    C: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-500',
      border: 'border-orange-500',
      text: 'text-orange-400',
    },
    D: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-500',
      border: 'border-purple-500',
      text: 'text-purple-400',
    },
  }

  return colors[answer.toUpperCase()] || colors.A
}

/**
 * Calculer le pourcentage de chance pour chaque réponse
 * (Cosmétique - utilisé uniquement pour l'affichage)
 */
export const getAnswerProbability = () => {
  // 4 réponses = 25% chacune
  return 25
}

/**
 * Générer des statistiques de quiz
 */
export const getQuizStats = (totalGames, wins, losses) => {
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0
  const lossRate = totalGames > 0 ? (losses / totalGames) * 100 : 0

  return {
    totalGames,
    wins,
    losses,
    winRate: winRate.toFixed(1),
    lossRate: lossRate.toFixed(1),
  }
}

export const quizLogic = {
  QUIZ_ANSWERS,
  QUIZ_QUESTIONS,
  getRandomQuestion,
  getBetRecommendations,
  isAnswerCorrect,
  getAnswerColor,
  getAnswerProbability,
  getQuizStats,
}
