// Main navigation layout
import MobileNavigationLayout, { NavigationStyles, useNavigationLayout } from './MobileNavigationLayout';
export { MobileNavigationLayout, NavigationStyles, useNavigationLayout };

// Navigation provider and context
import NavigationProvider, { 
  useNavigation, 
  useNavigationState, 
  useNavigationUI,
  useNavigationPreferences,
  useNavigationGestures 
} from './NavigationProvider';

export { 
  NavigationProvider,
  useNavigation, 
  useNavigationState, 
  useNavigationUI,
  useNavigationPreferences,
  useNavigationGestures 
};

// Individual navigation components
import BottomTabNavigation, { useNavigationState as useTabNavigation } from './BottomTabNavigation';
import FloatingActionButton, { useFABState } from './FloatingActionButton';
import MobileHamburgerMenu, { useMenuState } from './MobileHamburgerMenu';
import MobileBreadcrumbs, { useBreadcrumbs } from './MobileBreadcrumbs';
import GestureNavigation, { useGestureNavigation } from './GestureNavigation';

export { 
  BottomTabNavigation, 
  useTabNavigation,
  FloatingActionButton, 
  useFABState,
  MobileHamburgerMenu, 
  useMenuState,
  MobileBreadcrumbs, 
  useBreadcrumbs,
  GestureNavigation, 
  useGestureNavigation 
};

// Animation utilities
import {
  PageTransition,
  StaggerContainer,
  FloatingAnimation,
  PulseAnimation,
  ThaiDecorativeAnimation,
  HapticFeedback,
  useNavigationAnimations,
  navigationVariants,
  springConfigs
} from './NavigationAnimations';

export {
  PageTransition,
  StaggerContainer,
  FloatingAnimation,
  PulseAnimation,
  ThaiDecorativeAnimation,
  HapticFeedback,
  useNavigationAnimations,
  navigationVariants,
  springConfigs
};

// Type definitions
export interface NavigationConfig {
  enableSwipeNavigation?: boolean;
  enableHapticFeedback?: boolean;
  showThaiLabels?: boolean;
  compactMode?: boolean;
  autoHideNavigation?: boolean;
  swipeThreshold?: number;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
}

export interface ThaiNavigationOptions {
  culturalAnimations?: boolean;
  thaiTypography?: boolean;
  traditionalColors?: boolean;
  buddhist?: boolean;
  royal?: boolean;
}

// Utility functions
export const navigationUtils = {
  // Check if device supports haptic feedback
  supportsHaptics: (): boolean => {
    return typeof window !== 'undefined' && 'vibrate' in navigator;
  },

  // Get safe area insets
  getSafeAreaInsets: () => {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
    
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
    };
  },

  // Check if device is mobile
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  },

  // Check if device is iOS
  isIOS: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // Check if device is Android
  isAndroid: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
  },

  // Get device orientation
  getOrientation: (): 'portrait' | 'landscape' => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  },

  // Thai cultural color palette
  thaiColors: {
    gold: '#fbbf24',      // Thai gold
    red: '#dc2626',       // Thai red
    blue: '#2563eb',      // Thai blue
    saffron: '#f59e0b',   // Buddhist saffron
    emerald: '#10b981',   // Thai emerald
    royal: '#7c3aed',     // Royal purple
    lotus: '#ec4899',     // Lotus pink
    bamboo: '#22c55e'     // Bamboo green
  },

  // Thai typography helpers
  thaiFont: {
    display: 'Kalam, cursive',
    handwritten: 'Patrick Hand, cursive',
    body: 'system-ui, sans-serif'
  },

  // Thai animation patterns
  thaiAnimations: {
    wai: 'gentle bow with pause',
    lotus: 'organic blooming motion',
    wave: 'flowing water movement',
    temple: 'stable and reverent',
    dragon: 'serpentine and powerful'
  }
};

// Navigation constants
export const NAVIGATION_CONSTANTS = {
  TAB_HEIGHT: 64,
  FAB_SIZE: 56,
  BREADCRUMB_HEIGHT: 48,
  SWIPE_THRESHOLD: 50,
  HAPTIC_DELAY: 10,
  ANIMATION_DURATION: 300,
  STAGGER_DELAY: 50,
  SAFE_AREA_BOTTOM: 34, // iPhone X+ bottom safe area
  
  // Thai cultural constants
  GOLDEN_RATIO: 1.618, // Used in Thai architecture
  THAI_GRADIENT: 'linear-gradient(135deg, #fbbf24 0%, #dc2626 50%, #2563eb 100%)',
  LOTUS_STAGES: 5, // Traditional lotus bloom stages
  WAI_DURATION: 1500, // Traditional wai gesture duration in ms
};

// Export everything as a single navigation system
export const ThailandWasteNavigationSystem = {
  Layout: MobileNavigationLayout,
  Provider: NavigationProvider,
  Components: {
    BottomTabs: BottomTabNavigation,
    FAB: FloatingActionButton,
    Menu: MobileHamburgerMenu,
    Breadcrumbs: MobileBreadcrumbs,
    Gestures: GestureNavigation
  },
  Animations: {
    PageTransition,
    StaggerContainer,
    FloatingAnimation,
    PulseAnimation,
    ThaiDecorativeAnimation
  },
  Utils: navigationUtils,
  Constants: NAVIGATION_CONSTANTS,
  Haptics: HapticFeedback
};