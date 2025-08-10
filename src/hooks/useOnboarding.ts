'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OnboardingState {
  isFirstTime: boolean
  hasCompletedTutorial: boolean
  hasSkippedTutorial: boolean
  shouldShowTutorial: boolean
  tutorialCompletedDate: string | null
  tutorialSkippedDate: string | null
  featureHighlights: {
    scanner: boolean
    manualEntry: boolean
    gamification: boolean
    achievements: boolean
  }
}

export interface OnboardingActions {
  markTutorialCompleted: () => void
  markTutorialSkipped: () => void
  resetOnboarding: () => void
  markFeatureHighlightSeen: (feature: keyof OnboardingState['featureHighlights']) => void
  shouldShowFeatureHighlight: (feature: keyof OnboardingState['featureHighlights']) => boolean
}

const DEFAULT_STATE: OnboardingState = {
  isFirstTime: true,
  hasCompletedTutorial: false,
  hasSkippedTutorial: false,
  shouldShowTutorial: true,
  tutorialCompletedDate: null,
  tutorialSkippedDate: null,
  featureHighlights: {
    scanner: false,
    manualEntry: false,
    gamification: false,
    achievements: false
  }
}

// Storage keys
const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_COMPLETED_DATE: 'onboarding_completed_date',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ONBOARDING_SKIPPED_DATE: 'onboarding_skipped_date',
  FIRST_VISIT: 'first_visit',
  FIRST_VISIT_DATE: 'first_visit_date',
  FEATURE_HIGHLIGHTS: 'feature_highlights_seen'
} as const

export function useOnboarding(): OnboardingState & OnboardingActions {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load onboarding state from localStorage
  useEffect(() => {
    const loadOnboardingState = () => {
      try {
        // Check if this is the first visit
        const firstVisit = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT)
        const hasCompletedTutorial = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true'
        const hasSkippedTutorial = localStorage.getItem(STORAGE_KEYS.ONBOARDING_SKIPPED) === 'true'
        const tutorialCompletedDate = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED_DATE)
        const tutorialSkippedDate = localStorage.getItem(STORAGE_KEYS.ONBOARDING_SKIPPED_DATE)
        
        // Load feature highlights state
        const featureHighlightsJson = localStorage.getItem(STORAGE_KEYS.FEATURE_HIGHLIGHTS)
        let featureHighlights = DEFAULT_STATE.featureHighlights
        try {
          if (featureHighlightsJson) {
            featureHighlights = { ...DEFAULT_STATE.featureHighlights, ...JSON.parse(featureHighlightsJson) }
          }
        } catch (error) {
          console.warn('Error parsing feature highlights from localStorage:', error)
        }

        // If this is the first visit, mark it
        if (!firstVisit) {
          localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, 'true')
          localStorage.setItem(STORAGE_KEYS.FIRST_VISIT_DATE, new Date().toISOString())
        }

        const isFirstTime = !firstVisit
        const shouldShowTutorial = isFirstTime && !hasCompletedTutorial && !hasSkippedTutorial

        setState({
          isFirstTime,
          hasCompletedTutorial,
          hasSkippedTutorial,
          shouldShowTutorial,
          tutorialCompletedDate,
          tutorialSkippedDate,
          featureHighlights
        })

        setIsLoaded(true)
      } catch (error) {
        console.error('Error loading onboarding state:', error)
        setState(DEFAULT_STATE)
        setIsLoaded(true)
      }
    }

    loadOnboardingState()
  }, [])

  // Mark tutorial as completed
  const markTutorialCompleted = useCallback(() => {
    try {
      const completedDate = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true')
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED_DATE, completedDate)
      
      setState(prev => ({
        ...prev,
        hasCompletedTutorial: true,
        shouldShowTutorial: false,
        tutorialCompletedDate: completedDate
      }))
    } catch (error) {
      console.error('Error marking tutorial as completed:', error)
    }
  }, [])

  // Mark tutorial as skipped
  const markTutorialSkipped = useCallback(() => {
    try {
      const skippedDate = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SKIPPED, 'true')
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SKIPPED_DATE, skippedDate)
      
      setState(prev => ({
        ...prev,
        hasSkippedTutorial: true,
        shouldShowTutorial: false,
        tutorialSkippedDate: skippedDate
      }))
    } catch (error) {
      console.error('Error marking tutorial as skipped:', error)
    }
  }, [])

  // Reset onboarding state (for testing or user preference)
  const resetOnboarding = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      
      setState({
        ...DEFAULT_STATE,
        isFirstTime: true,
        shouldShowTutorial: true
      })
    } catch (error) {
      console.error('Error resetting onboarding state:', error)
    }
  }, [])

  // Mark a feature highlight as seen
  const markFeatureHighlightSeen = useCallback((feature: keyof OnboardingState['featureHighlights']) => {
    try {
      setState(prev => {
        const newFeatureHighlights = {
          ...prev.featureHighlights,
          [feature]: true
        }
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.FEATURE_HIGHLIGHTS, JSON.stringify(newFeatureHighlights))
        
        return {
          ...prev,
          featureHighlights: newFeatureHighlights
        }
      })
    } catch (error) {
      console.error('Error marking feature highlight as seen:', error)
    }
  }, [])

  // Check if a feature highlight should be shown
  const shouldShowFeatureHighlight = useCallback((feature: keyof OnboardingState['featureHighlights']) => {
    // Don't show feature highlights if:
    // 1. Tutorial hasn't been completed or skipped yet
    // 2. Feature highlight has already been seen
    // 3. State hasn't loaded yet
    if (!isLoaded || state.shouldShowTutorial || state.featureHighlights[feature]) {
      return false
    }
    
    return true
  }, [isLoaded, state.shouldShowTutorial, state.featureHighlights])

  return {
    ...state,
    markTutorialCompleted,
    markTutorialSkipped,
    resetOnboarding,
    markFeatureHighlightSeen,
    shouldShowFeatureHighlight
  }
}

// Utility hook for managing tutorial progress
export function useTutorialProgress() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  
  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1)
  }, [])
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }, [])
  
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])
  
  const complete = useCallback(() => {
    setIsCompleted(true)
  }, [])
  
  const reset = useCallback(() => {
    setCurrentStep(0)
    setIsCompleted(false)
  }, [])
  
  return {
    currentStep,
    isCompleted,
    nextStep,
    prevStep,
    goToStep,
    complete,
    reset
  }
}

// Utility functions for onboarding analytics (future enhancement)
export const onboardingAnalytics = {
  trackTutorialStarted: () => {
    try {
      const event = {
        type: 'tutorial_started',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
      console.log('Onboarding Analytics:', event)
      // Future: Send to analytics service
    } catch (error) {
      console.warn('Failed to track tutorial started:', error)
    }
  },
  
  trackTutorialCompleted: (duration: number) => {
    try {
      const event = {
        type: 'tutorial_completed',
        timestamp: new Date().toISOString(),
        duration,
        userAgent: navigator.userAgent
      }
      console.log('Onboarding Analytics:', event)
      // Future: Send to analytics service
    } catch (error) {
      console.warn('Failed to track tutorial completed:', error)
    }
  },
  
  trackTutorialSkipped: (step: number) => {
    try {
      const event = {
        type: 'tutorial_skipped',
        timestamp: new Date().toISOString(),
        step,
        userAgent: navigator.userAgent
      }
      console.log('Onboarding Analytics:', event)
      // Future: Send to analytics service
    } catch (error) {
      console.warn('Failed to track tutorial skipped:', error)
    }
  },
  
  trackFeatureHighlightShown: (feature: string) => {
    try {
      const event = {
        type: 'feature_highlight_shown',
        timestamp: new Date().toISOString(),
        feature,
        userAgent: navigator.userAgent
      }
      console.log('Onboarding Analytics:', event)
      // Future: Send to analytics service
    } catch (error) {
      console.warn('Failed to track feature highlight shown:', error)
    }
  }
}