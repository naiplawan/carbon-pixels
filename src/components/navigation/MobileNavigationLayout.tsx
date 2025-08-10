'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomTabNavigation from './BottomTabNavigation';
import FloatingActionButton from './FloatingActionButton';
import MobileHamburgerMenu from './MobileHamburgerMenu';
import MobileBreadcrumbs from './MobileBreadcrumbs';
import GestureNavigation from './GestureNavigation';
import NavigationProvider, { useNavigation, useNavigationUI } from './NavigationProvider';
import { PageTransition, HapticFeedback } from './NavigationAnimations';

interface MobileNavigationLayoutProps {
  children: React.ReactNode;
}

// Internal component that uses the navigation context
function NavigationLayoutInner({ children }: MobileNavigationLayoutProps) {
  const {
    currentPath,
    isTransitioning,
    transitionDirection,
    hapticFeedbackEnabled,
    swipeNavigationEnabled,
    triggerHapticFeedback,
    resetNavigation
  } = useNavigation();

  const {
    isBottomNavVisible,
    isFABVisible,
    isBreadcrumbsVisible,
    isMenuOpen
  } = useNavigationUI();

  // Configure haptic feedback
  useEffect(() => {
    HapticFeedback.setEnabled(hapticFeedbackEnabled);
  }, [hapticFeedbackEnabled]);

  // Handle route changes
  useEffect(() => {
    if (hapticFeedbackEnabled) {
      triggerHapticFeedback('light');
    }
  }, [currentPath, hapticFeedbackEnabled, triggerHapticFeedback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only reset navigation if component is actually unmounting
      // Don't call state setters during cleanup to avoid infinite loops
      document.body.style.overflow = '';
    };
  }, []);

  // Handle pull to refresh
  const handlePullRefresh = async () => {
    triggerHapticFeedback('medium');
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Trigger success haptic feedback
    triggerHapticFeedback('light');
  };

  // Handle swipe navigation
  const handleSwipeNavigation = (
    direction: 'left' | 'right',
    fromPath: string,
    toPath: string
  ) => {
    if (hapticFeedbackEnabled) {
      HapticFeedback.triggerThai('wai');
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Hamburger Menu */}
      <MobileHamburgerMenu />

      {/* Breadcrumb Navigation */}
      <AnimatePresence>
        {isBreadcrumbsVisible && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MobileBreadcrumbs />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area with Gesture Navigation */}
      <main className="relative">
        {swipeNavigationEnabled ? (
          <GestureNavigation
            enableSwipeNavigation={true}
            enablePullToRefresh={true}
            onSwipeNavigation={handleSwipeNavigation}
            onPullRefresh={handlePullRefresh}
          >
            <div className="min-h-screen sm:pb-0 pb-20">
              <AnimatePresence mode="wait">
                <PageTransition
                  key={currentPath}
                  direction={transitionDirection || 'fade'}
                  className="w-full"
                >
                  {children}
                </PageTransition>
              </AnimatePresence>
            </div>
          </GestureNavigation>
        ) : (
          <div className="min-h-screen sm:pb-0 pb-20">
            <AnimatePresence mode="wait">
              <PageTransition
                key={currentPath}
                direction="fade"
                className="w-full"
              >
                {children}
              </PageTransition>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <AnimatePresence>
        {isFABVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
          >
            <FloatingActionButton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Tab Navigation - Mobile Only */}
      <AnimatePresence>
        {isBottomNavVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25 
            }}
            className="sm:hidden" // Hide on tablet (sm) and desktop (md+) sizes
          >
            <BottomTabNavigation />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Loading Overlay for Transitions */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div>
                <p 
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'Kalam, cursive' }}
                >
                  Navigating...
                </p>
                <p 
                  className="text-xs text-gray-500"
                  style={{ fontFamily: 'Patrick Hand, cursive' }}
                >
                  กำลังนำทาง...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thai Cultural Background Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Cpath d='M50 30c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20zm0 35c-8.284 0-15-6.716-15-15s6.716-15 15-15 15 6.716 15 15-6.716 15-15 15z'/%3E%3Cpath d='M50 35c-8.284 0-15 6.716-15 15s6.716 15 15 15 15-6.716 15-15-6.716-15-15-15zm0 25c-5.523 0-10-4.477-10-10s4.477-10 10-10 10 4.477 10 10-4.477 10-10 10z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />
    </div>
  );
}

// Main layout component with provider
export default function MobileNavigationLayout({ children }: MobileNavigationLayoutProps) {
  return (
    <NavigationProvider>
      <NavigationLayoutInner>
        {children}
      </NavigationLayoutInner>
    </NavigationProvider>
  );
}

// Additional CSS classes for safe areas and custom scrolling
export const navigationStyles = `
  /* Safe area support for iOS devices */
  .safe-area-inset-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .h-safe-bottom {
    height: env(safe-area-inset-bottom);
  }

  /* Custom scrollbar hiding */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Smooth touch scrolling */
  .touch-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Thai-inspired gradients */
  .thai-gradient {
    background: linear-gradient(135deg, #fbbf24 0%, #dc2626 50%, #2563eb 100%);
  }

  .thai-gradient-subtle {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(220, 38, 38, 0.1) 50%, rgba(37, 99, 235, 0.1) 100%);
  }

  /* Mobile-optimized touch targets */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }

  /* Haptic feedback class for visual indication */
  .haptic-active {
    transform: scale(0.98);
    transition: transform 0.1s ease-out;
  }

  /* Thai cultural border patterns */
  .thai-border {
    border-image: linear-gradient(90deg, #fbbf24, #dc2626, #2563eb) 1;
  }

  /* Mobile-specific font rendering */
  .mobile-text {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeSpeed;
  }

  /* Gesture navigation hints */
  .swipe-hint {
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
  }

  /* Performance optimizations */
  .navigation-element {
    transform: translateZ(0);
    will-change: transform, opacity;
  }

  /* Thai typography support */
  .thai-text {
    font-feature-settings: 'liga', 'kern';
    text-rendering: optimizeLegibility;
  }
`;

// Hook for layout state
export function useNavigationLayout() {
  const navigation = useNavigation();
  
  return {
    ...navigation,
    styles: navigationStyles
  };
}

// Component for injecting navigation styles
export function NavigationStyles() {
  useEffect(() => {
    // Inject styles into document head
    const styleElement = document.createElement('style');
    styleElement.textContent = navigationStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return null;
}