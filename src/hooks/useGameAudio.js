import { useRef, useEffect } from 'react'
import { useAudioStore } from '../store/audioStore'

/**
 * Custom hook for game audio management
 * Handles background music, sound effects, and volume control
 */
export const useGameAudio = () => {
  const audioContextRef = useRef(null)
  const soundsRef = useRef({})
  const { isMuted, volume } = useAudioStore()

  useEffect(() => {
    // Initialize AudioContext
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    return () => {
      // Cleanup
      Object.values(soundsRef.current).forEach(audio => {
        if (audio && audio.pause) {
          audio.pause()
          audio.currentTime = 0
        }
      })
    }
  }, [])

  /**
   * Create oscillator-based sound effect
   */
  const createTone = (frequency, duration, type = 'sine') => {
    if (!audioContextRef.current || isMuted) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    const baseVolume = 0.3 * volume
    gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  /**
   * Play spinning sound (continuous loop)
   */
  const playSpinSound = () => {
    if (!audioContextRef.current || isMuted) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sawtooth'
    oscillator.frequency.value = 100

    filter.type = 'lowpass'
    filter.frequency.value = 1000
    filter.Q.value = 10

    const baseVolume = 0.15 * volume
    gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime)

    // Create acceleration effect
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1)
    oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 4)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 5)

    return oscillator
  }

  /**
   * Play win sound
   */
  const playWinSound = () => {
    if (!audioContextRef.current || isMuted) return

    const ctx = audioContextRef.current

    // Victory fanfare - multiple tones
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.frequency.value = freq
        oscillator.type = 'triangle'

        const baseVolume = 0.3 * volume
        gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
      }, index * 150)
    })
  }

  /**
   * Play lose sound
   */
  const playLoseSound = () => {
    if (!audioContextRef.current || isMuted) return

    const ctx = audioContextRef.current

    // Sad descending tone
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8)

    const baseVolume = 0.2 * volume
    gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.8)
  }

  /**
   * Play click sound
   */
  const playClickSound = () => {
    createTone(800, 0.05, 'square')
  }

  /**
   * Play tick sound (for wheel ticking)
   */
  const playTickSound = () => {
    createTone(600, 0.02, 'square')
  }

  /**
   * Create tick sequence during spin
   */
  const playTickSequence = (duration = 5000) => {
    const tickCount = 40
    const interval = duration / tickCount
    let currentTick = 0

    const tickInterval = setInterval(() => {
      if (currentTick >= tickCount) {
        clearInterval(tickInterval)
        return
      }
      playTickSound()
      currentTick++
    }, interval)

    return () => clearInterval(tickInterval)
  }

  return {
    playSpinSound,
    playWinSound,
    playLoseSound,
    playClickSound,
    playTickSound,
    playTickSequence,
  }
}
