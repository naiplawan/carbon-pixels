/**
 * Unified touch feedback utilities for consistent interaction feedback
 */

import { CSSProperties } from 'react'

export interface TouchFeedbackOptions {
  scale?: number
  duration?: number
  haptic?: boolean
  hapticType?: 'light' | 'medium' | 'heavy'
}

/**
 * CSS styles for touch feedback
 */
export const getTouchFeedbackStyles = (
  isPressed: boolean,
  options: TouchFeedbackOptions = {}
): CSSProperties => {
  const { scale = 0.98, duration = 100 } = options

  return {
    transform: isPressed ? `scale(${scale})` : 'scale(1)',
    transition: `transform ${duration}ms ease-out`,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation'
  }
}

/**
 * Apply visual touch feedback to an element
 */
export const applyTouchFeedback = (
  element: HTMLElement,
  options: TouchFeedbackOptions = {}
): void => {
  const { scale = 0.98, duration = 100 } = options

  element.style.transition = `all ${duration}ms ease-out`
  element.style.transform = `scale(${scale})`
  
  setTimeout(() => {
    element.style.transform = 'scale(1)'
  }, duration)
}

/**
 * React hook for touch feedback
 */
import { useState, useCallback, useRef } from 'react'
import { triggerHaptic } from './haptic-feedback'

export const useTouchFeedback = (options: TouchFeedbackOptions = {}) => {
  const [isPressed, setIsPressed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handlePressStart = useCallback(() => {
    setIsPressed(true)
    
    if (options.haptic) {
      triggerHaptic(options.hapticType || 'light')
    }
  }, [options.haptic, options.hapticType])

  const handlePressEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsPressed(false)
    }, options.duration || 100) as unknown as NodeJS.Timeout
  }, [options.duration])

  const touchHandlers = {
    onTouchStart: handlePressStart,
    onTouchEnd: handlePressEnd,
    onMouseDown: handlePressStart,
    onMouseUp: handlePressEnd,
    onMouseLeave: handlePressEnd
  }

  const styles = getTouchFeedbackStyles(isPressed, options)

  return {
    isPressed,
    touchHandlers,
    styles
  }
}

/**
 * Touch ripple effect configuration
 */
export interface RippleConfig {
  color?: string
  duration?: number
  size?: number
}

/**
 * Create a ripple effect on touch
 */
export const createRippleEffect = (
  event: React.MouseEvent | React.TouchEvent,
  container: HTMLElement,
  config: RippleConfig = {}
): void => {
  const { color = 'rgba(0, 0, 0, 0.1)', duration = 600, size = 100 } = config

  const rect = container.getBoundingClientRect()
  const ripple = document.createElement('span')
  
  let x: number, y: number
  
  if ('touches' in event) {
    x = event.touches[0].clientX - rect.left
    y = event.touches[0].clientY - rect.top
  } else {
    x = event.clientX - rect.left
    y = event.clientY - rect.top
  }

  ripple.style.position = 'absolute'
  ripple.style.borderRadius = '50%'
  ripple.style.backgroundColor = color
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${x - size / 2}px`
  ripple.style.top = `${y - size / 2}px`
  ripple.style.opacity = '1'
  ripple.style.transform = 'scale(0)'
  ripple.style.animation = `ripple ${duration}ms ease-out`
  ripple.style.pointerEvents = 'none'

  container.style.position = 'relative'
  container.style.overflow = 'hidden'
  container.appendChild(ripple)

  setTimeout(() => {
    ripple.remove()
  }, duration)
}

/**
 * CSS keyframe animation for ripple effect
 */
export const rippleKeyframes = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`

/**
 * Hook for managing touch gestures
 */
export const useTouchGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }
    }

    touchStartRef.current = null
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}