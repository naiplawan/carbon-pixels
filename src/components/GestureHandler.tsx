'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Share2, Edit, Archive, RefreshCw } from 'lucide-react';

interface SwipeAction {
  id: string;
  label: string;
  labelTh: string;
  icon: React.ElementType;
  color: string;
  backgroundColor: string;
  action: () => void;
  threshold: number;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeComplete?: (actionId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SwipeableItem({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeComplete,
  disabled = false,
  className = ''
}: SwipeableItemProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.8, 1, 1, 1, 0.8]);
  const scale = useTransform(x, [-200, -100, 0, 100, 200], [0.95, 1, 1, 1, 0.95]);

  // Handle drag end
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    // Determine if swipe was significant enough
    const isSignificantSwipe = Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold;
    
    if (!isSignificantSwipe) {
      // Snap back to center
      x.set(0);
      setIsRevealed(false);
      setActiveAction(null);
      return;
    }

    // Determine swipe direction and find matching action
    const isLeftSwipe = offset.x < 0;
    const actions = isLeftSwipe ? rightActions : leftActions;
    
    if (actions.length === 0) {
      x.set(0);
      return;
    }

    // Find action based on swipe distance
    const swipeDistance = Math.abs(offset.x);
    const selectedAction = actions.find(action => swipeDistance >= action.threshold) || actions[0];
    
    if (selectedAction) {
      setActiveAction(selectedAction);
      setIsRevealed(true);
      
      // Animate to action position
      const targetX = isLeftSwipe ? -150 : 150;
      x.set(targetX);
      
      // Execute action after a brief delay
      setTimeout(() => {
        selectedAction.action();
        onSwipeComplete?.(selectedAction.id);
        
        // Reset position
        x.set(0);
        setIsRevealed(false);
        setActiveAction(null);
      }, 200);
    }
  }, [x, leftActions, rightActions, onSwipeComplete]);

  // Handle drag progress for visual feedback
  const handleDrag = useCallback((event: any, info: PanInfo) => {
    const { offset } = info;
    const isLeftSwipe = offset.x < 0;
    const actions = isLeftSwipe ? rightActions : leftActions;
    
    if (actions.length === 0) return;

    const swipeDistance = Math.abs(offset.x);
    const potentialAction = actions.find(action => swipeDistance >= action.threshold);
    
    setActiveAction(potentialAction || null);
  }, [leftActions, rightActions]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={constraintsRef} className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center">
          {leftActions.map((action) => (
            <motion.div
              key={action.id}
              className={`flex items-center justify-center w-20 h-full ${action.backgroundColor}`}
              style={{
                opacity: activeAction?.id === action.id ? 1 : 0.7,
                scale: activeAction?.id === action.id ? 1.1 : 1
              }}
            >
              <div className="text-center">
                <action.icon className={`w-6 h-6 mx-auto mb-1 ${action.color}`} />
                <span className={`text-xs ${action.color} font-medium`}>
                  {action.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          {rightActions.map((action) => (
            <motion.div
              key={action.id}
              className={`flex items-center justify-center w-20 h-full ${action.backgroundColor}`}
              style={{
                opacity: activeAction?.id === action.id ? 1 : 0.7,
                scale: activeAction?.id === action.id ? 1.1 : 1
              }}
            >
              <div className="text-center">
                <action.icon className={`w-6 h-6 mx-auto mb-1 ${action.color}`} />
                <span className={`text-xs ${action.color} font-medium`}>
                  {action.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ 
          x,
          opacity,
          scale
        }}
        className="relative z-10 bg-white touch-pan-y"
      >
        {children}
      </motion.div>

      {/* Haptic Feedback */}
      {activeAction && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"
          />
        </div>
      )}
    </div>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  refreshingText = "กำลังโหลด... / Refreshing...",
  pullText = "ดึงลงเพื่อรีเฟรช / Pull to refresh",
  releaseText = "ปล่อยเพื่อรีเฟรช / Release to refresh",
  disabled = false
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const y = useMotionValue(0);
  const refreshThreshold = 80;

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (disabled || info.offset.y < refreshThreshold) {
      y.set(0);
      setPullDistance(0);
      return;
    }

    setIsRefreshing(true);
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      y.set(0);
      setPullDistance(0);
    }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled) return;
    
    const distance = Math.max(0, info.offset.y);
    setPullDistance(distance);
    
    // Add haptic feedback when threshold is reached
    if (distance >= refreshThreshold && pullDistance < refreshThreshold) {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);
  const shouldTriggerRefresh = pullDistance >= refreshThreshold;

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        style={{ y: Math.min(pullDistance * 0.5, 40) }}
        className="absolute top-0 left-0 right-0 z-10"
      >
        <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-b from-green-50 to-transparent">
          {isRefreshing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-6 h-6 text-green-600" />
              </motion.div>
              <span className="text-sm text-green-600 mt-2">{refreshingText}</span>
            </>
          ) : (
            <>
              <motion.div
                style={{
                  rotate: refreshProgress * 180,
                  scale: 0.8 + refreshProgress * 0.4
                }}
              >
                <RefreshCw className="w-6 h-6 text-green-500" />
              </motion.div>
              <span className="text-sm text-green-600 mt-2">
                {shouldTriggerRefresh ? releaseText : pullText}
              </span>
              <div className="w-8 h-1 bg-gray-200 rounded-full mt-2">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${refreshProgress * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Long press gesture handler
interface LongPressProps {
  onLongPress: () => void;
  onPress?: () => void;
  children: React.ReactNode;
  delay?: number;
  disabled?: boolean;
}

export function LongPressHandler({
  onLongPress,
  onPress,
  children,
  delay = 500,
  disabled = false
}: LongPressProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const startPress = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    timerRef.current = setTimeout(() => {
      onLongPress();
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]); // Triple vibration for long press
      }
    }, delay);
  }, [onLongPress, delay, disabled]);

  const endPress = useCallback(() => {
    setIsPressed(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (onPress && !disabled) {
      onPress();
    }
  }, [onPress, disabled]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onClick={handleClick}
      animate={{
        scale: isPressed ? 0.95 : 1,
        opacity: disabled ? 0.6 : 1
      }}
      transition={{ duration: 0.1 }}
      className="select-none cursor-pointer"
    >
      {children}
    </motion.div>
  );
}

// Waste entry specific swipe actions
export function createWasteEntryActions(
  entry: any,
  onEdit: () => void,
  onDelete: () => void,
  onShare: () => void,
  onArchive: () => void
): { leftActions: SwipeAction[]; rightActions: SwipeAction[] } {
  return {
    leftActions: [
      {
        id: 'share',
        label: 'Share',
        labelTh: 'แชร์',
        icon: Share2,
        color: 'text-blue-700',
        backgroundColor: 'bg-blue-100',
        threshold: 80,
        action: onShare
      },
      {
        id: 'edit',
        label: 'Edit',
        labelTh: 'แก้ไข',
        icon: Edit,
        color: 'text-green-700',
        backgroundColor: 'bg-green-100',
        threshold: 120,
        action: onEdit
      }
    ],
    rightActions: [
      {
        id: 'archive',
        label: 'Archive',
        labelTh: 'เก็บถาวร',
        icon: Archive,
        color: 'text-gray-700',
        backgroundColor: 'bg-gray-100',
        threshold: 80,
        action: onArchive
      },
      {
        id: 'delete',
        label: 'Delete',
        labelTh: 'ลบ',
        icon: Trash2,
        color: 'text-red-700',
        backgroundColor: 'bg-red-100',
        threshold: 120,
        action: onDelete
      }
    ]
  };
}

// Hook for gesture preferences
export function useGesturePreferences() {
  const [preferences, setPreferences] = useState({
    swipeEnabled: true,
    pullToRefreshEnabled: true,
    longPressEnabled: true,
    hapticFeedback: true,
    gestureThreshold: 80
  });

  useEffect(() => {
    const stored = localStorage.getItem('gesturePreferences');
    if (stored) {
      setPreferences(prev => ({ ...prev, ...JSON.parse(stored) }));
    }
  }, []);

  const updatePreference = (key: string, value: any) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('gesturePreferences', JSON.stringify(newPrefs));
  };

  return { preferences, updatePreference };
}