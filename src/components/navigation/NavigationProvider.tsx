'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface NavigationState {
  // Current navigation state
  currentTab: string;
  currentPath: string;
  previousPath: string | null;
  navigationHistory: string[];

  // UI state
  isBottomNavVisible: boolean;
  isFABVisible: boolean;
  isMenuOpen: boolean;
  isBreadcrumbsVisible: boolean;

  // Navigation preferences
  swipeNavigationEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  showThaiLabels: boolean;
  compactMode: boolean;

  // Animation state
  isTransitioning: boolean;
  transitionDirection: 'left' | 'right' | 'up' | 'down' | null;

  // Gesture state
  gestureInProgress: boolean;
  swipeProgress: number;
}

interface NavigationActions {
  // Navigation actions
  navigateTo: (path: string, direction?: 'left' | 'right' | 'up' | 'down') => void;
  goBack: () => void;
  goForward: () => void;

  // UI control actions
  setBottomNavVisible: (visible: boolean) => void;
  setFABVisible: (visible: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setBreadcrumbsVisible: (visible: boolean) => void;

  // Preference actions
  setSwipeNavigationEnabled: (enabled: boolean) => void;
  setHapticFeedbackEnabled: (enabled: boolean) => void;
  setShowThaiLabels: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;

  // Animation control
  startTransition: (direction: 'left' | 'right' | 'up' | 'down') => void;
  endTransition: () => void;

  // Gesture control
  setGestureInProgress: (inProgress: boolean) => void;
  setSwipeProgress: (progress: number) => void;

  // Utility actions
  triggerHapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
  resetNavigation: () => void;
}

interface NavigationContextType extends NavigationState, NavigationActions {}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  initialTab?: string;
  preferences?: Partial<NavigationState>;
}

const DEFAULT_PREFERENCES: Partial<NavigationState> = {
  swipeNavigationEnabled: true,
  hapticFeedbackEnabled: true,
  showThaiLabels: true,
  compactMode: false,
  isBottomNavVisible: true,
  isFABVisible: true,
  isBreadcrumbsVisible: true
};

export default function NavigationProvider({ 
  children, 
  initialTab = 'diary',
  preferences = {}
}: NavigationProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Load preferences from localStorage
  const loadPreferences = (): Partial<NavigationState> => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    
    try {
      const saved = localStorage.getItem('carbon-pixels-nav-preferences');
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch (error) {
      console.warn('Failed to load navigation preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  };

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<NavigationState>) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('carbon-pixels-nav-preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Failed to save navigation preferences:', error);
    }
  }, []);

  const [state, setState] = useState<NavigationState>(() => {
    const savedPreferences = loadPreferences();
    return {
      // Navigation state
      currentTab: initialTab,
      currentPath: pathname,
      previousPath: null,
      navigationHistory: [pathname],

      // UI state
      isBottomNavVisible: savedPreferences.isBottomNavVisible ?? true,
      isFABVisible: savedPreferences.isFABVisible ?? true,
      isMenuOpen: false,
      isBreadcrumbsVisible: savedPreferences.isBreadcrumbsVisible ?? true,

      // Preferences
      swipeNavigationEnabled: savedPreferences.swipeNavigationEnabled ?? true,
      hapticFeedbackEnabled: savedPreferences.hapticFeedbackEnabled ?? true,
      showThaiLabels: savedPreferences.showThaiLabels ?? true,
      compactMode: savedPreferences.compactMode ?? false,

      // Animation state
      isTransitioning: false,
      transitionDirection: null,

      // Gesture state
      gestureInProgress: false,
      swipeProgress: 0,

      ...preferences
    };
  });

  // Update current tab based on pathname
  useEffect(() => {
    const getTabFromPath = (path: string): string => {
      if (path === '/diary' || path.startsWith('/diary')) return 'diary';
      if (path.startsWith('/calculator')) return 'calculator';
      if (path.startsWith('/profile')) return 'profile';
      if (path.startsWith('/settings')) return 'settings';
      return 'diary';
    };

    setState(prev => ({
      ...prev,
      previousPath: prev.currentPath !== pathname ? prev.currentPath : prev.previousPath,
      currentPath: pathname,
      currentTab: getTabFromPath(pathname),
      navigationHistory: prev.currentPath !== pathname 
        ? [...prev.navigationHistory.slice(-9), pathname] // Keep last 10 entries
        : prev.navigationHistory
    }));
  }, [pathname]);

  // Auto-hide navigation on scroll (mobile optimization)
  // Temporarily disabled to prevent infinite loops
  // useEffect(() => {
  //   let lastScrollY = window.scrollY;
  //   let timeoutId: NodeJS.Timeout;

  //   const handleScroll = () => {
  //     const currentScrollY = window.scrollY;
  //     const scrollingDown = currentScrollY > lastScrollY;
  //     const scrollThreshold = 10;

  //     if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
  //       const shouldHideNav = scrollingDown && currentScrollY > 100;
        
  //       setState(prev => ({
  //         ...prev,
  //         isBottomNavVisible: !shouldHideNav,
  //         isFABVisible: !shouldHideNav
  //       }));

  //       lastScrollY = currentScrollY;
  //     }

  //     // Show navigation after scroll stops
  //     clearTimeout(timeoutId);
  //     timeoutId = setTimeout(() => {
  //       setState(prev => ({
  //         ...prev,
  //         isBottomNavVisible: true,
  //         isFABVisible: true
  //       }));
  //     }, 1000);
  //   };

  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   return () => {
  //     window.removeEventListener('scroll', handleScroll);
  //     clearTimeout(timeoutId);
  //   };
  // }, []);

  // Individual action callbacks using useCallback to prevent recreations
  const startTransition = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    setState(prev => ({
      ...prev,
      isTransitioning: true,
      transitionDirection: direction
    }));
  }, []);

  const endTransition = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTransitioning: false,
      transitionDirection: null
    }));
  }, []);

  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!state.hapticFeedbackEnabled) return;
    
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 50
      };
      navigator.vibrate(patterns[type]);
    }
  }, [state.hapticFeedbackEnabled]);

  const navigateTo = useCallback((path: string, direction?: 'left' | 'right' | 'up' | 'down') => {
    if (direction) {
      startTransition(direction);
    }
    
    router.push(path);
    
    // End transition after navigation
    setTimeout(() => {
      endTransition();
    }, 300);
  }, [router, startTransition, endTransition]);

  const resetNavigation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMenuOpen: false,
      isTransitioning: false,
      transitionDirection: null,
      gestureInProgress: false,
      swipeProgress: 0
    }));
    
    document.body.style.overflow = '';
  }, []);

  // Individual memoized action callbacks to prevent unnecessary re-renders
  const goBack = useCallback(() => {
    if (state.previousPath) {
      navigateTo(state.previousPath, 'right');
    } else {
      router.back();
    }
  }, [state.previousPath, navigateTo, router]);

  const goForward = useCallback(() => {
    router.forward();
  }, [router]);

  const setBottomNavVisible = useCallback((visible: boolean) => {
    setState(prev => ({ ...prev, isBottomNavVisible: visible }));
  }, []);

  const setFABVisible = useCallback((visible: boolean) => {
    setState(prev => ({ ...prev, isFABVisible: visible }));
  }, []);

  const setMenuOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isMenuOpen: open }));
    // Prevent body scroll when menu is open
    document.body.style.overflow = open ? 'hidden' : '';
  }, []);

  const setBreadcrumbsVisible = useCallback((visible: boolean) => {
    setState(prev => ({ ...prev, isBreadcrumbsVisible: visible }));
  }, []);

  const setSwipeNavigationEnabled = useCallback((enabled: boolean) => {
    setState(prev => {
      const newState = { ...prev, swipeNavigationEnabled: enabled };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const setHapticFeedbackEnabled = useCallback((enabled: boolean) => {
    setState(prev => {
      const newState = { ...prev, hapticFeedbackEnabled: enabled };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const setShowThaiLabels = useCallback((show: boolean) => {
    setState(prev => {
      const newState = { ...prev, showThaiLabels: show };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const setCompactMode = useCallback((compact: boolean) => {
    setState(prev => {
      const newState = { ...prev, compactMode: compact };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const setGestureInProgress = useCallback((inProgress: boolean) => {
    setState(prev => ({ ...prev, gestureInProgress: inProgress }));
  }, []);

  const setSwipeProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, swipeProgress: progress }));
  }, []);

  // Actions object with stable references
  const actions: NavigationActions = useMemo(() => ({
    // Navigation actions
    navigateTo,
    goBack,
    goForward,

    // UI control actions
    setBottomNavVisible,
    setFABVisible,
    setMenuOpen,
    setBreadcrumbsVisible,

    // Preference actions
    setSwipeNavigationEnabled,
    setHapticFeedbackEnabled,
    setShowThaiLabels,
    setCompactMode,

    // Animation control
    startTransition,
    endTransition,

    // Gesture control
    setGestureInProgress,
    setSwipeProgress,

    // Utility actions
    triggerHapticFeedback,
    resetNavigation
  }), [navigateTo, startTransition, endTransition, triggerHapticFeedback, resetNavigation, state.previousPath, router]);

  const contextValue: NavigationContextType = {
    ...state,
    ...actions
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook to use navigation context
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Additional utility hooks
export function useNavigationState() {
  const { 
    currentTab, 
    currentPath, 
    previousPath, 
    navigationHistory,
    isTransitioning,
    transitionDirection 
  } = useNavigation();

  return {
    currentTab,
    currentPath,
    previousPath,
    navigationHistory,
    isTransitioning,
    transitionDirection
  };
}

export function useNavigationUI() {
  const {
    isBottomNavVisible,
    isFABVisible,
    isMenuOpen,
    isBreadcrumbsVisible,
    setBottomNavVisible,
    setFABVisible,
    setMenuOpen,
    setBreadcrumbsVisible
  } = useNavigation();

  return {
    isBottomNavVisible,
    isFABVisible,
    isMenuOpen,
    isBreadcrumbsVisible,
    setBottomNavVisible,
    setFABVisible,
    setMenuOpen,
    setBreadcrumbsVisible
  };
}

export function useNavigationPreferences() {
  const {
    swipeNavigationEnabled,
    hapticFeedbackEnabled,
    showThaiLabels,
    compactMode,
    setSwipeNavigationEnabled,
    setHapticFeedbackEnabled,
    setShowThaiLabels,
    setCompactMode
  } = useNavigation();

  return {
    swipeNavigationEnabled,
    hapticFeedbackEnabled,
    showThaiLabels,
    compactMode,
    setSwipeNavigationEnabled,
    setHapticFeedbackEnabled,
    setShowThaiLabels,
    setCompactMode
  };
}

export function useNavigationGestures() {
  const {
    gestureInProgress,
    swipeProgress,
    setGestureInProgress,
    setSwipeProgress,
    triggerHapticFeedback
  } = useNavigation();

  return {
    gestureInProgress,
    swipeProgress,
    setGestureInProgress,
    setSwipeProgress,
    triggerHapticFeedback
  };
}