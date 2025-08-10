'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptic-feedback';

interface TabItem {
  id: string;
  href: string;
  icon: string;
  label: string;
  labelThai: string;
  badge?: number;
  color?: string;
}

const tabItems: TabItem[] = [
  {
    id: 'diary',
    href: '/diary',
    icon: '📔',
    label: 'Diary',
    labelThai: 'ไดอารี่',
    color: '#10b981'
  },
  {
    id: 'scan',
    href: '/diary/manual',
    icon: '📷',
    label: 'Scan',
    labelThai: 'สแกน',
    color: '#3b82f6'
  },
  {
    id: 'calculator',
    href: '/calculator',
    icon: '🧮',
    label: 'Calculator',
    labelThai: 'คำนวณ',
    color: '#f59e0b'
  },
  {
    id: 'history',
    href: '/diary/history',
    icon: '📊',
    label: 'History',
    labelThai: 'ประวัติ',
    color: '#8b5cf6'
  },
  {
    id: 'profile',
    href: '/profile',
    icon: '👤',
    label: 'Profile',
    labelThai: 'โปรไฟล์',
    color: '#ef4444'
  }
];

interface BottomTabNavigationProps {
  showLabels?: boolean;
  variant?: 'default' | 'compact';
  onTabChange?: (tabId: string) => void;
}

export default function BottomTabNavigation({ 
  showLabels = true, 
  variant = 'default',
  onTabChange 
}: BottomTabNavigationProps) {
  const pathname = usePathname();

  const getIsActive = (href: string): boolean => {
    if (href === '/diary' && pathname === '/diary') return true;
    if (href === '/diary/manual' && pathname.startsWith('/diary/manual')) return true;
    if (href === '/calculator' && pathname.startsWith('/calculator')) return true;
    if (href === '/diary/history' && pathname.startsWith('/diary/history')) return true;
    if (href === '/profile' && pathname.startsWith('/profile')) return true;
    return false;
  };

  const handleTabPress = (tabId: string) => {
    // Use centralized haptic feedback
    triggerHaptic('light');
    onTabChange?.(tabId);
  };

  const activeTab = tabItems.find(tab => getIsActive(tab.href));

  return (
    <>
      {/* Safe area spacing for iOS devices */}
      <div className="h-safe-bottom" />
      
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
        style={{
          background: 'linear-gradient(to top, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
        }}
        role="tablist"
        aria-label="Main navigation tabs"
        aria-orientation="horizontal"
      >
        {/* Active tab indicator background */}
        <AnimatePresence>
          {activeTab && (
            <motion.div
              className="absolute top-0 left-0 h-1 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                left: `${(tabItems.findIndex(tab => tab.id === activeTab.id) * 100) / tabItems.length}%`,
                width: `${100 / tabItems.length}%`
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 25,
                duration: 0.3 
              }}
              style={{
                backgroundColor: activeTab.color || '#10b981'
              }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {tabItems.map((tab, index) => {
            const isActive = getIsActive(tab.href);
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="flex flex-col items-center justify-center flex-1 relative group min-h-[44px] min-w-[44px]"
                onClick={() => handleTabPress(tab.id)}
                aria-label={`${tab.label} (${tab.labelThai})`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                role="tab"
                tabIndex={isActive ? 0 : -1}
              >
                <motion.div
                  className={`
                    relative flex flex-col items-center justify-center p-2 rounded-2xl
                    min-h-[56px] w-full max-w-[64px] mx-auto
                    transition-all duration-200 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-br from-green-50 to-green-100 shadow-sm' 
                      : 'hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {/* Tab icon */}
                  <motion.div
                    className={`
                      text-2xl mb-1 transition-all duration-200
                      ${isActive ? 'scale-110 filter drop-shadow-sm' : 'scale-100'}
                    `}
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      rotate: isActive ? [0, -5, 5, 0] : 0
                    }}
                    transition={{ 
                      scale: { duration: 0.2 },
                      rotate: { duration: 0.6, repeat: isActive ? 1 : 0 }
                    }}
                  >
                    {tab.icon}
                  </motion.div>

                  {/* Tab labels */}
                  {showLabels && variant === 'default' && (
                    <div className="flex flex-col items-center">
                      <motion.span
                        className={`
                          text-xs font-medium transition-all duration-200
                          ${isActive 
                            ? 'text-green-700 font-semibold' 
                            : 'text-gray-600 group-hover:text-gray-800'
                          }
                        `}
                        style={{ fontFamily: 'Kalam, cursive' }}
                        animate={{ 
                          y: isActive ? -1 : 0,
                          fontWeight: isActive ? 600 : 400
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {tab.label}
                      </motion.span>
                      
                      <motion.span
                        className={`
                          text-xs transition-all duration-200
                          ${isActive 
                            ? 'text-green-600 opacity-90' 
                            : 'text-gray-500 opacity-70'
                          }
                        `}
                        style={{ 
                          fontFamily: 'Patrick Hand, cursive',
                          fontSize: '10px',
                          marginTop: '-2px'
                        }}
                        animate={{ 
                          opacity: isActive ? 0.9 : 0.7
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {tab.labelThai}
                      </motion.span>
                    </div>
                  )}

                  {/* Badge for notifications */}
                  {tab.badge && tab.badge > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </motion.div>
                  )}

                  {/* Ripple effect */}
                  <motion.div
                    className={`
                      absolute inset-0 rounded-2xl opacity-0
                      ${isActive ? 'bg-green-200' : 'bg-gray-200'}
                    `}
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 1, opacity: 0.3 }}
                    transition={{ duration: 0.1 }}
                  />
                </motion.div>

                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: tab.color || '#10b981' }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>

        {/* Thai cultural decorative element */}
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-blue-600 rounded-full opacity-30"
          style={{
            background: 'linear-gradient(90deg, #fbbf24 0%, #dc2626 50%, #2563eb 100%)'
          }}
        />
      </nav>

      {/* Bottom safe area for devices with home indicators */}
      <div className="h-safe-bottom bg-white" />
    </>
  );
}

// Helper hook for navigation state
export function useNavigationState() {
  const pathname = usePathname();
  
  const getCurrentTab = () => {
    const activeTab = tabItems.find(tab => {
      if (tab.href === '/diary' && pathname === '/diary') return true;
      if (tab.href === '/diary/manual' && pathname.startsWith('/diary/manual')) return true;
      if (tab.href === '/calculator' && pathname.startsWith('/calculator')) return true;
      if (tab.href === '/diary/history' && pathname.startsWith('/diary/history')) return true;
      if (tab.href === '/profile' && pathname.startsWith('/profile')) return true;
      return false;
    });
    
    return activeTab?.id || 'diary';
  };

  return {
    currentTab: getCurrentTab(),
    pathname,
    tabItems
  };
}