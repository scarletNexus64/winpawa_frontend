import { useRef, useCallback } from 'react'

/**
 * Distinguishes a short tap from a long press.
 * - tap   -> onTap()    (release before HOLD_MS)
 * - hold  -> onHold()   (auto-fires once HOLD_MS reached, even if still pressed)
 */
export function useTapHold(onTap, onHold, holdMs = 450) {
  const timer = useRef(null)
  const triggered = useRef(false)
  const startedAt = useRef(0)

  const start = useCallback(
    (e) => {
      if (e?.button === 2) return // ignore right click
      triggered.current = false
      startedAt.current = Date.now()
      timer.current = setTimeout(() => {
        triggered.current = true
        if (navigator.vibrate) navigator.vibrate(30)
        onHold?.(e)
      }, holdMs)
    },
    [onHold, holdMs],
  )

  const end = useCallback(
    (e) => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      if (!triggered.current) {
        const dt = Date.now() - startedAt.current
        if (dt < holdMs) onTap?.(e)
      }
    },
    [onTap, holdMs],
  )

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    triggered.current = false
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: cancel,
    onContextMenu: (e) => e.preventDefault(),
  }
}
