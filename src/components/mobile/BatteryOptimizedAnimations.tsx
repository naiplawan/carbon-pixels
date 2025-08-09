'use client'

import React, { useMemo } from 'react'
import { useBatteryAwareOptimizations } from '@/hooks/useNetworkConnection'

interface AnimationProps {
  children: React.ReactNode
  type?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'scale' | 'rotate'
  duration?: 'fast' | 'normal' | 'slow'
  disabled?: boolean
  className?: string
}

export function BatteryOptimizedAnimation({
  children,
  type = 'fade',
  duration = 'normal',
  disabled = false,
  className = ''
}: AnimationProps) {
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()

  // Disable animations based on battery status
  const shouldDisableAnimations = disabled || 
                                  batteryOpts.reduceAnimations || 
                                  batteryOpts.useMinimalUI

  const animationClasses = useMemo(() => {
    if (shouldDisableAnimations) return ''

    const baseClasses = 'transition-all ease-in-out'
    
    // Duration based on battery status
    let durationClass = 'duration-300' // normal
    if (batteryOpts.reduceCPUUsage) {
      durationClass = 'duration-150' // fast for battery saving
    } else {
      switch (duration) {
        case 'fast':
          durationClass = 'duration-150'
          break
        case 'slow':
          durationClass = 'duration-500'
          break
        default:
          durationClass = 'duration-300'
      }
    }

    // Animation type classes
    const typeClasses = {
      fade: 'animate-in fade-in',
      slide: 'animate-in slide-in-from-bottom-4',
      bounce: batteryOpts.reduceCPUUsage ? 'animate-in fade-in' : 'animate-bounce',
      pulse: batteryOpts.reduceCPUUsage ? '' : 'animate-pulse',
      scale: 'animate-in zoom-in-95',
      rotate: batteryOpts.reduceCPUUsage ? '' : 'animate-spin'
    }

    return `${baseClasses} ${durationClass} ${typeClasses[type] || ''}`
  }, [type, duration, shouldDisableAnimations, batteryOpts])

  return (
    <div className={`${animationClasses} ${className}`}>
      {children}
    </div>
  )
}

// Optimized loading spinner
export function OptimizedLoadingSpinner({ 
  size = 'medium',
  color = 'green' 
}: { 
  size?: 'small' | 'medium' | 'large'
  color?: 'green' | 'blue' | 'gray'
}) {
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
  }

  const colorClasses = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    gray: 'text-gray-400'
  }

  // Use static spinner on low battery
  if (batteryOpts.reduceCPUUsage) {
    return (
      <div className={`${sizeClasses[size]} ${colorClasses[color]} flex items-center justify-center`}>
        <div className="w-full h-full border-2 border-current border-t-transparent rounded-full opacity-60" />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <div className="w-full h-full border-2 border-current border-t-transparent rounded-full" />
    </div>
  )
}

// Optimized progress bar
export function OptimizedProgressBar({
  progress,
  color = 'green',
  showAnimation = true,
  className = ''
}: {
  progress: number
  color?: 'green' | 'blue' | 'orange' | 'red'
  showAnimation?: boolean
  className?: string
}) {
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  }

  const animationClass = showAnimation && !batteryOpts.reduceAnimations
    ? 'transition-all duration-300 ease-out'
    : ''

  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden ${className}`}>
      <div 
        className={`h-full ${colorClasses[color]} ${animationClass}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}

// Optimized card hover effects
export function OptimizedCard({
  children,
  hover = true,
  className = '',
  onClick
}: {
  children: React.ReactNode
  hover?: boolean
  className?: string
  onClick?: () => void
}) {
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()

  // Disable hover effects on low battery
  const hoverClass = hover && !batteryOpts.reduceCPUUsage
    ? 'hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200'
    : 'hover:shadow-md transition-shadow duration-200'

  const baseClass = 'bg-white rounded-lg shadow-sm cursor-pointer'
  
  return (
    <div 
      className={`${baseClass} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Frame rate aware animation controller
export function useFrameRateOptimizedAnimation() {
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()

  const getAnimationConfig = useMemo(() => {
    if (batteryOpts.lowerFrameRate) {
      return {
        frameRate: 30, // Reduce from 60fps to 30fps
        reduceComplexity: true,
        disableParallax: true,
        simplifyEffects: true
      }
    }

    if (batteryOpts.reduceCPUUsage) {
      return {
        frameRate: 15, // Very low frame rate
        reduceComplexity: true,
        disableParallax: true,
        simplifyEffects: true,
        disableTransitions: true
      }
    }

    return {
      frameRate: 60, // Full frame rate
      reduceComplexity: false,
      disableParallax: false,
      simplifyEffects: false,
      disableTransitions: false
    }
  }, [batteryOpts])

  return getAnimationConfig
}

// CPU-optimized counter animation
export function OptimizedCounter({
  value,
  duration = 1000,
  className = ''
}: {
  value: number
  duration?: number
  className?: string
}) {
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    // Skip animation on low battery
    if (batteryOpts.reduceCPUUsage) {
      setDisplayValue(value)
      return
    }

    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use eased progress for smoother animation
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (value - startValue) * eased)
      
      setDisplayValue(current)

      if (progress < 1) {
        // Use battery-aware frame rate
        const delay = batteryOpts.lowerFrameRate ? 33 : 16 // 30fps vs 60fps
        setTimeout(animate, delay)
      }
    }

    animate()
  }, [value, duration, batteryOpts])

  return (
    <span className={className}>
      {displayValue}
    </span>
  )
}

// Gesture-optimized interaction wrapper
export function OptimizedInteraction({
  children,
  onTap,
  onLongPress,
  disabled = false,
  hapticFeedback = true,
  className = ''
}: {
  children: React.ReactNode
  onTap?: () => void
  onLongPress?: () => void
  disabled?: boolean
  hapticFeedback?: boolean
  className?: string
}) {
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()
  
  const [isPressed, setIsPressed] = React.useState(false)
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = React.useCallback(() => {
    if (disabled) return

    setIsPressed(true)
    
    // Haptic feedback (if supported and battery allows)
    if (hapticFeedback && !batteryOpts.reduceCPUUsage && 'vibrate' in navigator) {
      navigator.vibrate(10) // Very short vibration
    }

    // Setup long press detection
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress()
        setIsPressed(false)
      }, 500)
    }
  }, [disabled, hapticFeedback, batteryOpts.reduceCPUUsage, onLongPress])

  const handleTouchEnd = React.useCallback(() => {
    setIsPressed(false)
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }

    if (onTap && !disabled) {
      onTap()
    }
  }, [onTap, disabled])

  const handleTouchCancel = React.useCallback(() => {
    setIsPressed(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }, [])

  const activeClass = isPressed && !batteryOpts.reduceCPUUsage
    ? 'transform scale-95 opacity-70'
    : ''

  const transitionClass = !batteryOpts.reduceAnimations
    ? 'transition-all duration-150 ease-out'
    : ''

  return (
    <div
      className={`${transitionClass} ${activeClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
    >
      {children}
    </div>
  )
}