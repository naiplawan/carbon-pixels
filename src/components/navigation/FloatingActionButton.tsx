'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface FABAction {
  id: string;
  icon: string;
  label: string;
  labelThai: string;
  href?: string;
  action?: () => void;
  color: string;
  bgColor: string;
}

interface FloatingActionButtonProps {
  variant?: 'default' | 'mini';
  position?: 'bottom-right' | 'bottom-center' | 'center-right';
  offset?: { x: number; y: number };
  onAction?: (actionId: string) => void;
}

export default function FloatingActionButton({
  variant = 'default',
  position = 'bottom-right',
  offset = { x: 16, y: 100 },
  onAction
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFAB, setShowFAB] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  // Context-aware actions based on current page
  const getContextualActions = (): FABAction[] => {
    if (pathname.startsWith('/diary/manual') || pathname.startsWith('/diary/scan')) {
      return [
        {
          id: 'quick_scan',
          icon: '📷',
          label: 'Quick Scan',
          labelThai: 'สแกนเร็ว',
          href: '/diary/manual',
          color: '#ffffff',
          bgColor: '#3b82f6'
        },
        {
          id: 'manual_entry',
          icon: '✍️',
          label: 'Manual Entry',
          labelThai: 'บันทึกเอง',
          href: '/diary/manual',
          color: '#ffffff',
          bgColor: '#8b5cf6'
        },
        {
          id: 'view_history',
          icon: '📊',
          label: 'View History',
          labelThai: 'ดูประวัติ',
          href: '/diary/history',
          color: '#ffffff',
          bgColor: '#f59e0b'
        }
      ];
    }

    if (pathname.startsWith('/diary/history')) {
      return [
        {
          id: 'add_entry',
          icon: '➕',
          label: 'Add Entry',
          labelThai: 'เพิ่มรายการ',
          href: '/diary/manual',
          color: '#ffffff',
          bgColor: '#10b981'
        },
        {
          id: 'export_data',
          icon: '📤',
          label: 'Export',
          labelThai: 'ส่งออก',
          action: () => console.log('Export data'),
          color: '#ffffff',
          bgColor: '#6366f1'
        },
        {
          id: 'share_progress',
          icon: '📱',
          label: 'Share',
          labelThai: 'แชร์',
          action: () => handleShare(),
          color: '#ffffff',
          bgColor: '#ec4899'
        }
      ];
    }

    if (pathname.startsWith('/calculator')) {
      return [
        {
          id: 'quick_calc',
          icon: '⚡',
          label: 'Quick Calc',
          labelThai: 'คำนวณเร็ว',
          action: () => console.log('Quick calculation'),
          color: '#ffffff',
          bgColor: '#f59e0b'
        },
        {
          id: 'save_result',
          icon: '💾',
          label: 'Save Result',
          labelThai: 'บันทึกผล',
          action: () => console.log('Save calculation'),
          color: '#ffffff',
          bgColor: '#10b981'
        }
      ];
    }

    // Default diary page actions
    return [
      {
        id: 'add_waste',
        icon: '📷',
        label: 'Scan Waste',
        labelThai: 'สแกนขยะ',
        href: '/diary/manual',
        color: '#ffffff',
        bgColor: '#10b981'
      },
      {
        id: 'quick_log',
        icon: '⚡',
        label: 'Quick Log',
        labelThai: 'บันทึกเร็ว',
        href: '/diary/quick-start',
        color: '#ffffff',
        bgColor: '#3b82f6'
      },
      {
        id: 'view_stats',
        icon: '📊',
        label: 'View Stats',
        labelThai: 'ดูสถิติ',
        href: '/diary/history',
        color: '#ffffff',
        bgColor: '#8b5cf6'
      }
    ];
  };

  const actions = getContextualActions();
  const primaryAction = actions[0];

  // Handle scroll to show/hide FAB
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollThreshold = 10;

      if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
        setShowFAB(!scrollingDown || currentScrollY < 100);
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleAction = (action: FABAction) => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }

    setIsExpanded(false);

    if (action.href) {
      router.push(action.href);
    } else if (action.action) {
      action.action();
    }

    onAction?.(action.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Carbon Credits Progress',
          text: 'Check out my waste tracking progress on Thailand Waste Diary!',
          url: window.location.origin
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-center':
        return { bottom: offset.y, left: '50%', transform: 'translateX(-50%)' };
      case 'center-right':
        return { right: offset.x, top: '50%', transform: 'translateY(-50%)' };
      default:
        return { bottom: offset.y, right: offset.x };
    }
  };

  return (
    <div className="fixed z-40" style={getPositionStyles()}>
      {/* Expanded actions menu */}
      <AnimatePresence>
        {isExpanded && actions.length > 1 && (
          <motion.div
            className="absolute bottom-16 right-0 flex flex-col-reverse items-end space-y-reverse space-y-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, staggerChildren: 0.05 }}
          >
            {actions.slice(1).map((action, index) => (
              <motion.div
                key={action.id}
                className="flex items-center space-x-3"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25
                }}
              >
                {/* Action label */}
                <div className="bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                  <div className="text-sm font-medium" style={{ fontFamily: 'Kalam, cursive' }}>
                    {action.label}
                  </div>
                  <div className="text-xs opacity-75" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    {action.labelThai}
                  </div>
                </div>

                {/* Action button */}
                <motion.button
                  onClick={() => handleAction(action)}
                  className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: action.bgColor }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  aria-label={`${action.label} (${action.labelThai})`}
                >
                  <span className="text-lg">{action.icon}</span>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/20 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <AnimatePresence>
        {showFAB && primaryAction && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: 0 
            }}
            exit={{ 
              scale: 0, 
              rotate: 180,
              y: 100
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25,
              duration: 0.3
            }}
            className="relative"
          >
            <motion.button
              onClick={() => {
                if (actions.length > 1) {
                  setIsExpanded(!isExpanded);
                } else {
                  handleAction(primaryAction);
                }
              }}
              className={`
                w-14 h-14 rounded-full shadow-xl flex items-center justify-center
                relative overflow-hidden group
                ${variant === 'mini' ? 'w-12 h-12' : 'w-14 h-14'}
              `}
              style={{ 
                backgroundColor: primaryAction.bgColor,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              aria-label={`${primaryAction.label} (${primaryAction.labelThai})`}
              aria-expanded={isExpanded}
            >
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-100 transition-transform duration-200" />
              
              {/* Thai cultural gradient overlay */}
              <div 
                className="absolute inset-0 rounded-full opacity-20"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #dc2626 50%, #2563eb 100%)'
                }}
              />

              {/* Main icon */}
              <motion.span 
                className={`relative z-10 ${variant === 'mini' ? 'text-lg' : 'text-xl'}`}
                animate={{ 
                  rotate: isExpanded ? 45 : 0,
                  scale: isExpanded ? 0.9 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                {isExpanded && actions.length > 1 ? '✕' : primaryAction.icon}
              </motion.span>

              {/* Pulse animation for important actions */}
              {primaryAction.id === 'add_waste' && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
            </motion.button>

            {/* Context indicator dot */}
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: actions.length > 1 ? 1 : 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-white text-xs font-bold">
                {actions.length > 1 ? actions.length : ''}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for FAB state management
export function useFABState() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [context, setContext] = useState<string>('diary');

  useEffect(() => {
    if (pathname.startsWith('/diary/manual')) {
      setContext('manual');
    } else if (pathname.startsWith('/diary/history')) {
      setContext('history');
    } else if (pathname.startsWith('/calculator')) {
      setContext('calculator');
    } else {
      setContext('diary');
    }
  }, [pathname]);

  return {
    isVisible,
    context,
    pathname,
    setIsVisible
  };
}