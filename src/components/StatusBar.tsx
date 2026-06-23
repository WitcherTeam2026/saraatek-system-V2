/**
 * StatusBar — Fixed bottom bar showing application status info.
 *
 * Provides a subtle, always‑visible footer with:
 * - Left: Application name and purpose ("SaraaTEK Repair Management")
 * - Center: (Reserved for future use — repair count, connection status)
 * - Right: Live clock (updated every 30 seconds)
 *
 * Design principles:
 * - Minimal height (24px / h‑6) — present but not intrusive
 * - Muted colors — recedes visually so content takes priority
 * - Hairline top border — subtle separation from content area
 * - Monospace digits in clock — stable width prevents layout shift
 *
 * The StatusBar is part of the application shell and renders on every screen.
 * It does NOT re‑render on navigation (no Zustand dependency), only on the
 * 30‑second clock interval.
 */

import { useState, useEffect } from 'react'

/**
 * StatusBar component — renders the fixed bottom bar.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ SaraaTEK Repair Management                            14:30         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * The 30‑second update interval balances clock accuracy against unnecessary
 * re‑renders. For a shop desktop app, minute‑precision is sufficient, but
 * showing seconds would cause unnecessary updates and visual noise.
 */
export function StatusBar() {
  /**
   * Current time state — initialized at mount, updated every 30 seconds.
   * Using `new Date()` here means the clock starts at the actual current
   * time, not a hardcoded default.
   */
  const [time, setTime] = useState(new Date())

  /**
   * Set up the 30‑second clock interval on mount.
   * Cleanup on unmount prevents memory leaks.
   */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  /**
   * Format the current time as HH:MM in 24‑hour format.
   * Options:
   * - `hour: '2-digit'` — Always shows two digits (09, not 9)
   * - `minute: '2-digit'` — Always shows two digits (05, not 5)
   * - `hour12: false` — 24‑hour format (14:30, not 2:30 PM)
   * This gives a stable width display that won't shift when times change.
   */
  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
  })

  return (
    <div
      className="
        h-6 bg-bg-canvas border-t border-border-subtle
        flex items-center justify-between px-3 shrink-0
      "
    >
      {/**
       * Left section — application identity text.
       * Shows the app name and purpose for user orientation.
       * Font: 10px (text‑[10px]), muted color, no tracking.
       */}
      <span className="text-[10px] text-text-muted">
        SaraaTEK Repair Management
      </span>

      {/**
       * Right section — live clock.
       * Uses `tabular-nums` so digits have equal width — this prevents
       * the time display from shifting left/right as the digits change.
       * Font: 10px (text‑[10px]), muted color, monospace‑style numbers.
       */}
      <span className="text-[10px] text-text-muted tabular-nums">
        {formattedTime}
      </span>
    </div>
  )
}
