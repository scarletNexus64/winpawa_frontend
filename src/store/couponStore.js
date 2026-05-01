import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 8-char alphanumeric code: digits + uppercase letters, ambiguous chars removed
// (no 0/O/1/I) so it stays readable when shared verbally or on a ticket.
const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const newCouponId = () => {
  let code = ''
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(8)
    crypto.getRandomValues(buf)
    for (let i = 0; i < 8; i++) {
      code += COUPON_ALPHABET[buf[i] % COUPON_ALPHABET.length]
    }
  } else {
    for (let i = 0; i < 8; i++) {
      code += COUPON_ALPHABET[Math.floor(Math.random() * COUPON_ALPHABET.length)]
    }
  }
  return code
}

// Encode/decode safely for sharing (UTF-8 + url-safe base64)
const encodeShare = (obj) => {
  const json = JSON.stringify(obj)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const decodeShare = (code) => {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    return JSON.parse(decodeURIComponent(escape(atob(padded))))
  } catch {
    return null
  }
}

// Pure: turn a list of selections into a sharable code (independent of store).
const shareCodeFor = (items, betAmount = 1000) => {
  if (!items?.length) return null
  const compact = items.map((i) => ({
    m: i.matchId,
    ml: i.matchLabel,
    l: i.league,
    s: i.sport,
    t: i.type,
    c: i.choice,
    lb: i.label,
    o: i.odd,
  }))
  return encodeShare({ v: 1, b: betAmount, i: compact })
}

export const useCouponStore = create(
  persist(
    (set, get) => ({
      currentId: null,
      items: [],
      betAmount: 1000,
      saved: [],
      history: [],

      // ============== Actions sur le coupon courant ==============

      // 1 seule selection par match (toutes positions confondues).
      // Re-cliquer sur la meme cote la deselectionne; cliquer sur une autre
      // cote du meme match remplace l'ancienne (changement d'avis).
      toggleOdd: (sel) =>
        set((state) => {
          const exact = state.items.find(
            (c) => c.matchId === sel.matchId && c.type === sel.type && c.choice === sel.choice,
          )
          if (exact) {
            return { items: state.items.filter((c) => c !== exact) }
          }
          const others = state.items.filter((c) => c.matchId !== sel.matchId)
          return { items: [...others, sel] }
        }),

      removeItem: (index) =>
        set((state) => ({ items: state.items.filter((_, i) => i !== index) })),

      clear: () => set({ items: [], currentId: null }),

      setBetAmount: (n) =>
        set({ betAmount: Math.max(100, Math.min(500000, parseInt(n) || 100)) }),

      // ============== Sauvegarde locale ==============

      saveCurrent: (name) => {
        const { items, betAmount, currentId, saved } = get()
        if (items.length === 0) return null
        const id = currentId || newCouponId()
        const finalName = name?.trim() || `Coupon ${saved.length + 1}`
        const code = shareCodeFor(items, betAmount)
        const entry = { id, name: finalName, items, betAmount, code, createdAt: Date.now() }
        const idx = saved.findIndex((s) => s.id === id)
        const next = idx >= 0 ? saved.map((s, i) => (i === idx ? entry : s)) : [...saved, entry]
        set({ saved: next, currentId: id })
        return { id, code }
      },

      loadCoupon: (id) => {
        const found = get().saved.find((s) => s.id === id)
        if (!found) return false
        set({ items: found.items, betAmount: found.betAmount, currentId: id })
        return true
      },

      deleteSaved: (id) =>
        set((state) => ({
          saved: state.saved.filter((s) => s.id !== id),
          currentId: state.currentId === id ? null : state.currentId,
        })),

      // ============== Code partageable ==============

      generateShareCode: () => {
        const { items, betAmount } = get()
        return shareCodeFor(items, betAmount)
      },

      // For previewing the code of any saved coupon (different items/amount).
      shareCodeFor: (items, betAmount) => shareCodeFor(items, betAmount),

      loadFromShareCode: (code) => {
        const data = decodeShare(code?.trim() || '')
        if (!data || !Array.isArray(data.i)) return false
        const items = data.i.map((x) => ({
          matchId: x.m,
          matchLabel: x.ml,
          league: x.l,
          sport: x.s,
          type: x.t,
          choice: x.c,
          label: x.lb,
          odd: x.o,
        }))
        set({ items, betAmount: data.b || 1000, currentId: null })
        return true
      },

      // ============== Pari direct ==============

      placeSingle: (sel) => {
        const totalOdd = sel.odd
        const amount = get().betAmount || 1000
        const entry = {
          id: newCouponId(),
          items: [sel],
          betAmount: amount,
          totalOdd,
          gain: amount * totalOdd,
          status: 'pending',
          code: shareCodeFor([sel], amount),
          placedAt: Date.now(),
        }
        set((state) => ({ history: [entry, ...state.history] }))
        return entry
      },

      submitCurrent: () => {
        const { items, betAmount } = get()
        if (items.length === 0) return null
        const totalOdd = items.reduce((a, c) => a * c.odd, 1)
        const entry = {
          id: newCouponId(),
          items,
          betAmount,
          totalOdd,
          gain: betAmount * totalOdd,
          status: 'pending',
          code: shareCodeFor(items, betAmount),
          placedAt: Date.now(),
        }
        set((state) => ({
          history: [entry, ...state.history],
          items: [],
          currentId: null,
          betAmount: 1000,
        }))
        return entry
      },

      // Mark a pending bet as won/lost (called after polling the match status).
      settleHistoryEntry: (id, status) =>
        set((state) => ({
          history: state.history.map((h) => (h.id === id ? { ...h, status, settledAt: Date.now() } : h)),
        })),

      removeHistoryEntry: (id) =>
        set((state) => ({ history: state.history.filter((h) => h.id !== id) })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'winpawa-coupon',
      partialize: (state) => ({
        items: state.items,
        currentId: state.currentId,
        betAmount: state.betAmount,
        saved: state.saved,
        history: state.history,
      }),
    },
  ),
)
