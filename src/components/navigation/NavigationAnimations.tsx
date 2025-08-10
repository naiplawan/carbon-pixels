'use client'

import { ReactNode } from 'react'

// Temporary stub to fix build issues - animations disabled
export interface AnimationPattern {
  type?: 'wai' | 'lotus' | 'temple' | 'river'
  className?: string
  children: ReactNode
}

export default function NavigationAnimations({ 
  children, 
  className = '' 
}: AnimationPattern) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  )
}

// Stub components to maintain compatibility
export const PageTransition = ({ children, ...props }: { children: ReactNode; [key: string]: any }) => (
  <div {...props}>{children}</div>
)

export const StaggerContainer = ({ children }: { children: ReactNode }) => (
  <div>{children}</div>
)

export const FloatingAnimation = ({ children }: { children: ReactNode }) => (
  <div>{children}</div>
)

export const PulseAnimation = ({ children }: { children: ReactNode }) => (
  <div>{children}</div>
)

export const ThaiDecorativeAnimation = ({ children }: { children: ReactNode }) => (
  <div>{children}</div>
)

export const HapticFeedback = Object.assign(
  ({ children }: { children: ReactNode }) => <div>{children}</div>,
  {
    setEnabled: (enabled: boolean) => {},
    triggerThai: (type?: string) => {},
    trigger: (type?: string) => {}
  }
)

// Stub hook
export const useNavigationAnimations = () => ({
  isAnimating: false,
  startAnimation: () => {},
  stopAnimation: () => {}
})

// Export stubs for other animation components
export const pageTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const navigationVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const springConfigs = {
  gentle: { type: 'spring', stiffness: 120, damping: 20 },
  smooth: { type: 'tween', duration: 0.3 },
  bouncy: { type: 'spring', stiffness: 400, damping: 25 }
}