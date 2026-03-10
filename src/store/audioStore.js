import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Audio settings store
 * Manages mute state and volume settings
 */
export const useAudioStore = create(
  persist(
    (set) => ({
      isMuted: false,
      volume: 0.5,

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setMute: (muted) => set({ isMuted: muted }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: 'audio-settings',
    }
  )
)
