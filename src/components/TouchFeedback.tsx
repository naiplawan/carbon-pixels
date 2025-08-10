'use client';

import { useState, useEffect, useRef } from 'react';

// Touch feedback utilities
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100,
      success: [10, 50, 10],
      warning: [50, 100, 50],
      error: [100, 50, 100]
    };
    navigator.vibrate(patterns[type]);
  }
};

export const addTouchFeedback = (element: HTMLElement, intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
  const scaleValues = {
    light: '0.99',
    medium: '0.98',
    heavy: '0.96'
  };
  
  element.style.transition = 'all 0.1s ease-out';
  element.style.transform = `scale(${scaleValues[intensity]})`;
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
};

// Visual feedback component for touch interactions
interface TouchRippleProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  rippleColor?: 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'gray';
  onClick?: () => void;
  as?: 'button' | 'div';
}

export function TouchRipple({
  children,
  className = '',
  disabled = false,
  hapticType = 'medium',
  rippleColor = 'green',
  onClick,
  as: Component = 'button'
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleId = useRef(0);
  const elementRef = useRef<HTMLElement>(null);

  const createRipple = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newRipple = {
      x,
      y,
      id: rippleId.current++
    };

    setRipples(prev => [...prev, newRipple]);

    // Haptic feedback
    hapticFeedback(hapticType);
    
    // Visual feedback
    addTouchFeedback(element);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    // Execute click handler
    if (onClick) {
      onClick();
    }
  };

  const rippleColorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500'
  };

  const commonProps = {
    ref: elementRef as any,
    className: `relative overflow-hidden ${className}`,
    onMouseDown: createRipple,
    onTouchStart: createRipple,
    disabled: disabled,
    style: { touchAction: 'manipulation' }
  };

  return (
    <Component {...commonProps}>
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className={`absolute rounded-full ${rippleColorClasses[rippleColor]} opacity-30 animate-ping pointer-events-none`}
          style={{
            left: ripple.x - 12,
            top: ripple.y - 12,
            width: 24,
            height: 24,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </Component>
  );
}

// Enhanced button component with built-in touch feedback
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  ariaLabel?: string;
}

export function TouchButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  hapticType = 'medium',
  ariaLabel
}: TouchButtonProps) {
  const baseClasses = 'font-sketch rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:shadow-none focus:outline-none focus:ring-4 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 text-white focus:ring-green-400',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:from-gray-300 active:to-gray-400 text-gray-700 focus:ring-gray-400',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 text-white focus:ring-emerald-400',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-white focus:ring-amber-400',
    error: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 text-white focus:ring-red-400'
  };

  const sizeClasses = {
    sm: 'min-h-[40px] px-4 py-2 text-sm',
    md: 'min-h-[48px] px-6 py-3 text-base',
    lg: 'min-h-[56px] px-8 py-4 text-lg'
  };

  const disabledClasses = 'disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none';

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabledClasses}
    ${className}
  `.trim();

  return (
    <TouchRipple
      as="button"
      className={classes}
      disabled={disabled}
      hapticType={variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : variant === 'error' ? 'error' : hapticType}
      rippleColor={variant === 'primary' ? 'green' : variant === 'success' ? 'green' : variant === 'warning' ? 'yellow' : variant === 'error' ? 'red' : 'gray'}
      onClick={onClick}
    >
      {ariaLabel && <span className="sr-only">{ariaLabel}</span>}
      {children}
    </TouchRipple>
  );
}

// Loading state component with touch feedback
interface TouchLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function TouchLoading({
  loading,
  children,
  loadingText = 'Loading...',
  className = ''
}: TouchLoadingProps) {
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-sketch text-gray-700">{loadingText}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// Toast notification with touch dismiss
interface TouchToastProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function TouchToast({
  message,
  type,
  visible,
  onDismiss,
  duration = 3000
}: TouchToastProps) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: '✅',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-300',
      textColor: 'text-green-800'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-800'
    },
    error: {
      icon: '❌',
      bgColor: 'from-red-50 to-red-100',
      borderColor: 'border-red-300',
      textColor: 'text-red-800'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-800'
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <TouchRipple
        className={`max-w-sm w-full bg-gradient-to-r ${config.bgColor} border-2 ${config.borderColor} ${config.textColor} p-4 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300`}
        hapticType={type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'light'}
        onClick={onDismiss}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.icon}</span>
          <span className="flex-1 font-sketch text-sm">{message}</span>
          <button
            onClick={onDismiss}
            className="ml-2 text-lg hover:scale-110 transition-transform"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      </TouchRipple>
    </div>
  );
}

// Swipe gesture handler component
interface SwipeHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = ''
}: SwipeHandlerProps) {
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      setIsSwiping(false);
      return;
    }

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        hapticFeedback('light');
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        hapticFeedback('light');
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        hapticFeedback('light');
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        hapticFeedback('light');
        onSwipeUp();
      }
    }

    setIsSwiping(false);
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  pullThreshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshing,
  pullThreshold = 100,
  className = ''
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, pullThreshold * 1.5));
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;

    setIsPulling(false);
    
    if (pullDistance >= pullThreshold && !refreshing) {
      hapticFeedback('success');
      onRefresh();
    }
    
    setPullDistance(0);
  };

  const pullProgress = Math.min(pullDistance / pullThreshold, 1);

  return (
    <div
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-green-100 to-transparent flex items-center justify-center transition-all duration-200 z-10"
          style={{
            height: Math.max(pullDistance * 0.5, refreshing ? 60 : 0),
            transform: `translateY(${pullDistance > 0 && !refreshing ? -30 : refreshing ? 0 : -60}px)`
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {refreshing ? (
              <>
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-sketch text-green-700">Refreshing...</span>
              </>
            ) : (
              <>
                <div 
                  className="text-2xl transition-transform duration-200"
                  style={{
                    transform: `rotate(${pullProgress * 180}deg)`,
                    opacity: pullProgress
                  }}
                >
                  ↓
                </div>
                <span className="text-sm font-sketch text-green-700">
                  {pullProgress >= 1 ? 'Release to refresh' : 'Pull down to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      <div style={{ transform: `translateY(${pullDistance * 0.3}px)` }}>
        {children}
      </div>
    </div>
  );
}