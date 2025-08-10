/**
 * Unified haptic feedback utility for consistent vibration patterns across the app
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

interface HapticPattern {
  pattern: number | number[]
  intensity?: number
}

const HAPTIC_PATTERNS: Record<HapticType, HapticPattern> = {
  light: { pattern: 10 },
  medium: { pattern: 25 },
  heavy: { pattern: 50 },
  success: { pattern: [10, 50, 10] },
  warning: { pattern: [20, 10, 20] },
  error: { pattern: [50, 100, 50] }
}

/**
 * Check if the device supports haptic feedback
 */
export const supportsHaptics = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator
}

/**
 * Trigger haptic feedback with a specific pattern
 */
export const triggerHaptic = (type: HapticType = 'light'): void => {
  if (!supportsHaptics()) return
  
  try {
    const { pattern } = HAPTIC_PATTERNS[type]
    navigator.vibrate(pattern)
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

/**
 * Stop any ongoing vibration
 */
export const stopHaptic = (): void => {
  if (!supportsHaptics()) return
  navigator.vibrate(0)
}

/**
 * Custom haptic pattern
 */
export const customHaptic = (pattern: number | number[]): void => {
  if (!supportsHaptics()) return
  
  try {
    navigator.vibrate(pattern)
  } catch (error) {
    console.warn('Custom haptic feedback failed:', error)
  }
}

/**
 * React hook for haptic feedback
 */
export const useHaptic = () => {
  return {
    trigger: triggerHaptic,
    stop: stopHaptic,
    custom: customHaptic,
    isSupported: supportsHaptics()
  }
}