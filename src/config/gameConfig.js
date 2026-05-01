/**
 * Game Configuration
 * Defines game types, rules, and UI configurations
 */

export const GAME_TYPES = {
  ROULETTE: 'roulette',
  SCRATCH_CARD: 'scratch_card',
  COIN_FLIP: 'coin_flip',
  DICE: 'dice',
  ROCK_PAPER_SCISSORS: 'rock_paper_scissors',
  TREASURE_BOX: 'treasure_box',
  LUCKY_NUMBER: 'lucky_number',
  JACKPOT: 'jackpot',
  PENALTY: 'penalty',
  LUDO: 'ludo',
  QUIZ: 'quiz',
  COLOR_ROULETTE: 'color_roulette',
}

/**
 * Game Type Metadata
 */
export const GAME_METADATA = {
  [GAME_TYPES.ROULETTE]: {
    name: 'Roulette',
    displayName: 'Apple of Fortune',
    icon: '🎰',
    color: '#FF6B6B',
    description: 'Faites tourner la roue et tentez votre chance !',
  },
  [GAME_TYPES.SCRATCH_CARD]: {
    name: 'Cartes à Gratter',
    icon: '🎫',
    color: '#4ECDC4',
    description: 'Grattez pour découvrir vos gains !',
  },
  [GAME_TYPES.COIN_FLIP]: {
    name: 'Pile ou Face',
    icon: '🪙',
    color: '#FFD93D',
    description: 'Choisissez pile ou face et doublez votre mise !',
  },
  [GAME_TYPES.DICE]: {
    name: 'Lancer de Dés',
    icon: '🎲',
    color: '#95E1D3',
    description: 'Lancez les dés et prédisez le résultat !',
  },
  [GAME_TYPES.ROCK_PAPER_SCISSORS]: {
    name: 'Pierre-Papier-Ciseaux',
    icon: '✊',
    color: '#F38181',
    description: 'Battez l\'ordinateur à ce jeu classique !',
  },
  [GAME_TYPES.TREASURE_BOX]: {
    name: 'Coffre au Trésor',
    icon: '📦',
    color: '#AA96DA',
    description: 'Choisissez le coffre gagnant !',
  },
  [GAME_TYPES.LUCKY_NUMBER]: {
    name: 'Nombre Chanceux',
    icon: '🔢',
    color: '#FCBAD3',
    description: 'Devinez le nombre mystère !',
  },
  [GAME_TYPES.JACKPOT]: {
    name: 'Jackpot',
    icon: '💰',
    color: '#FFA07A',
    description: 'Tentez de remporter le jackpot !',
  },
  [GAME_TYPES.PENALTY]: {
    name: 'Tir au But',
    icon: '⚽',
    color: '#90EE90',
    description: 'Marquez un penalty et gagnez !',
  },
  [GAME_TYPES.LUDO]: {
    name: 'Course de Pions',
    icon: '🎯',
    color: '#DDA15E',
    description: 'Faites avancer votre pion plus vite que les autres !',
  },
  [GAME_TYPES.QUIZ]: {
    name: 'Quiz Chance',
    icon: '❓',
    color: '#BC6C25',
    description: 'Répondez correctement et gagnez !',
  },
  [GAME_TYPES.COLOR_ROULETTE]: {
    name: 'Roulette de Couleurs',
    icon: '🎨',
    color: '#A0C4FF',
    description: 'Choisissez la bonne couleur !',
  },
}

/**
 * Roulette Configuration
 */
export const ROULETTE_CONFIG = {
  segments: 8,
  colors: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFA07A'],
  prizes: {
    1: { label: '2x', multiplier: 2, color: '#FF6B6B' },
    2: { label: '5x', multiplier: 5, color: '#4ECDC4' },
    3: { label: '2x', multiplier: 2, color: '#FFD93D' },
    4: { label: '10x', multiplier: 10, color: '#95E1D3' },
    5: { label: '2x', multiplier: 2, color: '#F38181' },
    6: { label: '5x', multiplier: 5, color: '#AA96DA' },
    7: { label: '2x', multiplier: 2, color: '#FCBAD3' },
    8: { label: '5x', multiplier: 5, color: '#FFA07A' },
  },
  spinDuration: 5000, // 5 seconds
  minSpins: 5, // Minimum full rotations
}

/**
 * Scratch Card Configuration
 */
export const SCRATCH_CARD_CONFIG = {
  cardsCount: 9,
  winningCards: 3,
  symbols: ['🍒', '🍋', '🍊', '🍇', '💎', '⭐', '🔔', '7️⃣'],
  scratchThreshold: 0.6, // 60% scratched to reveal
}

/**
 * Coin Flip Configuration
 */
export const COIN_FLIP_CONFIG = {
  options: [
    { value: 'heads', label: 'Pile', icon: '👑', color: '#FFD700' },
    { value: 'tails', label: 'Face', icon: '🦅', color: '#C0C0C0' },
  ],
  flipDuration: 2000, // 2 seconds
  flipsCount: 5, // Number of flips in animation
}

/**
 * Dice Configuration
 */
export const DICE_CONFIG = {
  sides: 6,
  options: [
    { value: 'odd', label: 'Impair', color: '#FF6B6B' },
    { value: 'even', label: 'Pair', color: '#4ECDC4' },
    { value: 'low', label: 'Bas (1-3)', color: '#FFD93D' },
    { value: 'high', label: 'Haut (4-6)', color: '#95E1D3' },
    { value: '1', label: 'Nombre 1', color: '#F38181' },
    { value: '2', label: 'Nombre 2', color: '#AA96DA' },
    { value: '3', label: 'Nombre 3', color: '#FCBAD3' },
    { value: '4', label: 'Nombre 4', color: '#FFA07A' },
    { value: '5', label: 'Nombre 5', color: '#90EE90' },
    { value: '6', label: 'Nombre 6', color: '#DDA15E' },
  ],
  rollDuration: 2000,
}

/**
 * Rock Paper Scissors Configuration
 */
export const RPS_CONFIG = {
  options: [
    { value: 'rock', label: 'Pierre', icon: '✊', color: '#95A99C' },
    { value: 'paper', label: 'Papier', icon: '✋', color: '#F4F4F4' },
    { value: 'scissors', label: 'Ciseaux', icon: '✌️', color: '#E8B4B8' },
  ],
  winConditions: {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  },
  animationDuration: 2000,
}

/**
 * Treasure Box Configuration
 */
export const TREASURE_BOX_CONFIG = {
  boxesCount: 3,
  boxes: [
    { id: 1, label: 'Coffre 1', color: '#FFD700', icon: '📦' },
    { id: 2, label: 'Coffre 2', color: '#C0C0C0', icon: '📦' },
    { id: 3, label: 'Coffre 3', color: '#CD7F32', icon: '📦' },
  ],
  revealDuration: 2000,
}

/**
 * Lucky Number Configuration
 */
export const LUCKY_NUMBER_CONFIG = {
  rangeMin: 1,
  rangeMax: 10,
  guessTime: 30000, // 30 seconds to guess
}

/**
 * Jackpot Configuration
 */
export const JACKPOT_CONFIG = {
  segments: 6,
  symbols: ['🍒', '🍋', '🍊', '💎', '⭐', '7️⃣'],
  spinDuration: 3000,
  reelCount: 3,
}

/**
 * Penalty Configuration
 */
export const PENALTY_CONFIG = {
  positions: [
    { id: 1, label: 'Gauche', x: 20, y: 40, color: '#FF6B6B' },
    { id: 2, label: 'Centre Gauche', x: 35, y: 30, color: '#4ECDC4' },
    { id: 3, label: 'Centre', x: 50, y: 20, color: '#FFD93D' },
    { id: 4, label: 'Centre Droit', x: 65, y: 30, color: '#95E1D3' },
    { id: 5, label: 'Droite', x: 80, y: 40, color: '#F38181' },
  ],
  shootDuration: 1500,
}

/**
 * Ludo Configuration
 */
export const LUDO_CONFIG = {
  players: [
    { id: 1, label: 'Rouge', color: '#FF6B6B' },
    { id: 2, label: 'Bleu', color: '#4ECDC4' },
    { id: 3, label: 'Vert', color: '#95E1D3' },
    { id: 4, label: 'Jaune', color: '#FFD93D' },
  ],
  diceRollDuration: 1500,
  moveDuration: 2000,
}

/**
 * Quiz Configuration
 */
export const QUIZ_CONFIG = {
  optionsCount: 4,
  options: ['A', 'B', 'C', 'D'],
  timeLimit: 15000, // 15 seconds
}

/**
 * Color Roulette Configuration
 */
export const COLOR_ROULETTE_CONFIG = {
  colors: [
    { value: 'red', label: 'Rouge', color: '#FF6B6B' },
    { value: 'blue', label: 'Bleu', color: '#4ECDC4' },
    { value: 'green', label: 'Vert', color: '#95E1D3' },
    { value: 'yellow', label: 'Jaune', color: '#FFD93D' },
  ],
  spinDuration: 4000,
}

/**
 * Get configuration for a specific game type
 */
export const getGameConfig = (gameType) => {
  const configs = {
    [GAME_TYPES.ROULETTE]: ROULETTE_CONFIG,
    [GAME_TYPES.SCRATCH_CARD]: SCRATCH_CARD_CONFIG,
    [GAME_TYPES.COIN_FLIP]: COIN_FLIP_CONFIG,
    [GAME_TYPES.DICE]: DICE_CONFIG,
    [GAME_TYPES.ROCK_PAPER_SCISSORS]: RPS_CONFIG,
    [GAME_TYPES.TREASURE_BOX]: TREASURE_BOX_CONFIG,
    [GAME_TYPES.LUCKY_NUMBER]: LUCKY_NUMBER_CONFIG,
    [GAME_TYPES.JACKPOT]: JACKPOT_CONFIG,
    [GAME_TYPES.PENALTY]: PENALTY_CONFIG,
    [GAME_TYPES.LUDO]: LUDO_CONFIG,
    [GAME_TYPES.QUIZ]: QUIZ_CONFIG,
    [GAME_TYPES.COLOR_ROULETTE]: COLOR_ROULETTE_CONFIG,
  }

  return configs[gameType] || null
}

/**
 * Get metadata for a specific game type
 */
export const getGameMetadata = (gameType) => {
  return GAME_METADATA[gameType] || null
}

/**
 * Currency formatter
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Validate bet amount
 */
export const validateBetAmount = (amount, minBet, maxBet, walletBalance) => {
  if (!amount || amount <= 0) {
    return { valid: false, message: 'Montant invalide' }
  }

  if (amount < minBet) {
    return { valid: false, message: `Mise minimum: ${formatCurrency(minBet)}` }
  }

  if (amount > maxBet) {
    return { valid: false, message: `Mise maximum: ${formatCurrency(maxBet)}` }
  }

  if (amount > walletBalance) {
    return { valid: false, message: 'Solde insuffisant' }
  }

  return { valid: true, message: '' }
}
