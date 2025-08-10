'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface SwipeRoute {
  path: string;
  title: string;
  titleThai: string;
  icon: string;
  color: string;
}

// Define swipe navigation routes in logical order
const swipeRoutes: SwipeRoute[] = [
  {
    path: '/calculator',
    title: 'Calculator',
    titleThai: 'คำนวณ',
    icon: '🧮',
    color: '#f59e0b'
  },
  {
    path: '/diary',
    title: 'Diary',
    titleThai: 'ไดอารี่',
    icon: '📔',
    color: '#10b981'
  },
  {
    path: '/diary/manual',
    title: 'Add Entry',
    titleThai: 'เพิ่มรายการ',
    icon: '✍️',
    color: '#3b82f6'
  },
  {
    path: '/diary/history',
    title: 'History',
    titleThai: 'ประวัติ',
    icon: '📊',
    color: '#8b5cf6'
  }
];

interface GestureNavigationProps {
  children: React.ReactNode;
  enableSwipeNavigation?: boolean;
  enablePullToRefresh?: boolean;
  swipeThreshold?: number;
  onSwipeNavigation?: (direction: 'left' | 'right', fromPath: string, toPath: string) => void;
  onPullRefresh?: () => Promise<void>;
}

export default function GestureNavigation({
  children,
  enableSwipeNavigation = true,
  enablePullToRefresh = true,
  swipeThreshold = 50,
  onSwipeNavigation,
  onPullRefresh
}: GestureNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [swipeHint, setSwipeHint] = useState<{
    direction: 'left' | 'right';
    route: SwipeRoute;
    show: boolean;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);

  // Get current route index
  const getCurrentRouteIndex = () => {
    return swipeRoutes.findIndex(route => {
      if (route.path === '/diary' && pathname === '/diary') return true;
      if (route.path !== '/diary' && pathname.startsWith(route.path)) return true;
      return false;
    });
  };

  // Get adjacent routes
  const getAdjacentRoutes = () => {
    const currentIndex = getCurrentRouteIndex();
    return {
      previous: currentIndex > 0 ? swipeRoutes[currentIndex - 1] : null,
      next: currentIndex < swipeRoutes.length - 1 ? swipeRoutes[currentIndex + 1] : null,
      current: currentIndex >= 0 ? swipeRoutes[currentIndex] : null
    };
  };

  const { previous, next, current } = getAdjacentRoutes();

  // Handle horizontal swipe navigation
  const handlePanStart = (event: MouseEvent | TouchEvent, info: PanInfo) => {
    const deltaX = info.delta.x;
    const deltaY = info.delta.y;
    
    // Determine if this is a horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe - show navigation hint
      if (deltaX > 10 && previous) {
        setSwipeHint({ direction: 'right', route: previous, show: true });
      } else if (deltaX < -10 && next) {
        setSwipeHint({ direction: 'left', route: next, show: true });
      }
    }
  };

  const handlePan = (event: MouseEvent | TouchEvent, info: PanInfo) => {
    const deltaX = info.delta.x;
    const deltaY = info.delta.y;
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;

    // Handle horizontal swipe navigation
    if (Math.abs(deltaX) > Math.abs(deltaY) && enableSwipeNavigation) {
      const progress = Math.min(Math.abs(offsetX) / 200, 1);
      setSwipeProgress(progress);

      // Update hint visibility
      if (Math.abs(offsetX) > swipeThreshold) {
        if (offsetX > 0 && previous) {
          setSwipeHint({ direction: 'right', route: previous, show: true });
        } else if (offsetX < 0 && next) {
          setSwipeHint({ direction: 'left', route: next, show: true });
        }
      } else {
        setSwipeHint(null);
      }
    }

    // Handle pull to refresh
    if (offsetY > 0 && Math.abs(offsetY) > Math.abs(offsetX) && enablePullToRefresh) {
      const progress = Math.min(offsetY / 100, 1);
      setSwipeProgress(progress);
    }
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent, info: PanInfo) => {
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;
    const velocityX = info.velocity.x;

    // Handle horizontal navigation
    if (Math.abs(offsetX) > Math.abs(offsetY) && enableSwipeNavigation) {
      const shouldNavigate = Math.abs(offsetX) > swipeThreshold || Math.abs(velocityX) > 500;

      if (shouldNavigate) {
        if (offsetX > 0 && previous) {
          // Swipe right - go to previous page
          navigateWithAnimation(previous.path, 'right');
          onSwipeNavigation?.('right', pathname, previous.path);
        } else if (offsetX < 0 && next) {
          // Swipe left - go to next page
          navigateWithAnimation(next.path, 'left');
          onSwipeNavigation?.('left', pathname, next.path);
        }
      }
    }

    // Handle pull to refresh
    if (offsetY > swipeThreshold && Math.abs(offsetY) > Math.abs(offsetX) && enablePullToRefresh) {
      performPullRefresh();
    }

    // Reset states
    setSwipeHint(null);
    setSwipeProgress(0);
    controls.start({ x: 0, y: 0 });
  };

  const navigateWithAnimation = async (path: string, direction: 'left' | 'right') => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }

    // Animate page transition
    const slideAmount = direction === 'left' ? -50 : 50;
    
    await controls.start({
      x: slideAmount,
      opacity: 0.8,
      scale: 0.95,
      transition: { duration: 0.2, ease: 'easeOut' }
    });

    // Navigate
    router.push(path);

    // Reset animation
    await controls.start({
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    });
  };

  const performPullRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }

    try {
      await onPullRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || e.ctrlKey) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (previous) {
            e.preventDefault();
            router.push(previous.path);
          }
          break;
        case 'ArrowRight':
          if (next) {
            e.preventDefault();
            router.push(next.path);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previous, next, router]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Swipe hint indicators */}
      {swipeHint?.show && (
        <motion.div
          className={`
            fixed top-1/2 z-30 transform -translate-y-1/2
            ${swipeHint.direction === 'left' ? 'right-4' : 'left-4'}
          `}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-4 flex items-center space-x-3 max-w-xs"
            animate={{
              x: swipeHint.direction === 'left' ? [-10, 0] : [10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ borderLeft: `4px solid ${swipeHint.route.color}` }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: swipeHint.route.color + '20' }}
            >
              <span className="text-2xl">{swipeHint.route.icon}</span>
            </div>
            <div>
              <div 
                className="font-semibold text-gray-900 text-sm"
                style={{ fontFamily: 'Kalam, cursive' }}
              >
                {swipeHint.route.title}
              </div>
              <div 
                className="text-gray-500 text-xs"
                style={{ fontFamily: 'Patrick Hand, cursive' }}
              >
                {swipeHint.route.titleThai}
              </div>
            </div>
            <motion.div
              className="text-gray-400"
              animate={{ x: swipeHint.direction === 'left' ? [-5, 0] : [5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              {swipeHint.direction === 'left' ? '◀' : '▶'}
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Pull to refresh indicator */}
      {enablePullToRefresh && (isRefreshing || swipeProgress > 0) && (
        <motion.div
          className="fixed top-0 left-1/2 transform -translate-x-1/2 z-30 bg-white rounded-b-2xl shadow-lg px-6 py-3"
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: isRefreshing ? 0 : Math.max(-100 + (swipeProgress * 100), -100),
            opacity: isRefreshing ? 1 : swipeProgress
          }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-6 h-6"
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ 
                duration: isRefreshing ? 1 : 0.5, 
                repeat: isRefreshing ? Infinity : 0,
                ease: 'linear' 
              }}
            >
              🔄
            </motion.div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
              </div>
              <div className="text-xs text-gray-500">
                {isRefreshing ? 'กำลังรีเฟรช...' : 'ดึงลงเพื่อรีเฟรช'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation breadcrumb hints */}
      {enableSwipeNavigation && (previous || next) && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <motion.div
            className="bg-black/80 text-white px-4 py-2 rounded-full flex items-center space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 1 }}
          >
            {previous && (
              <div className="flex items-center space-x-2">
                <span className="text-xs">◀</span>
                <span className="text-xs">{previous.title}</span>
              </div>
            )}
            
            {current && (
              <div className="text-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            )}
            
            {next && (
              <div className="flex items-center space-x-2">
                <span className="text-xs">{next.title}</span>
                <span className="text-xs">▶</span>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Main content with gesture handling */}
      <motion.div
        ref={containerRef}
        className="h-full w-full"
        animate={controls}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ touchAction: 'pan-y' }} // Allow vertical scrolling but handle horizontal
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook for gesture navigation state
export function useGestureNavigation() {
  const pathname = usePathname();
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const getCurrentRoute = () => {
    return swipeRoutes.find(route => {
      if (route.path === '/diary' && pathname === '/diary') return true;
      if (route.path !== '/diary' && pathname.startsWith(route.path)) return true;
      return false;
    });
  };

  const getNavigationOptions = () => {
    const currentIndex = swipeRoutes.findIndex(route => {
      if (route.path === '/diary' && pathname === '/diary') return true;
      if (route.path !== '/diary' && pathname.startsWith(route.path)) return true;
      return false;
    });

    return {
      canGoBack: currentIndex > 0,
      canGoForward: currentIndex < swipeRoutes.length - 1,
      previousRoute: currentIndex > 0 ? swipeRoutes[currentIndex - 1] : null,
      nextRoute: currentIndex < swipeRoutes.length - 1 ? swipeRoutes[currentIndex + 1] : null,
      currentRoute: getCurrentRoute()
    };
  };

  return {
    gestureEnabled,
    setGestureEnabled,
    swipeDirection,
    setSwipeDirection,
    navigationOptions: getNavigationOptions(),
    pathname
  };
}