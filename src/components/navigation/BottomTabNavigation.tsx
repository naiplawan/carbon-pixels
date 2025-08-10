'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Camera, Calculator, BarChart3, User, Menu, X, Plus } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptic-feedback';

interface TabItem {
  id: string;
  href: string;
  icon: React.ElementType;
  emoji: string;
  label: string;
  labelThai: string;
  badge?: number;
  color?: string;
  description?: string;
}

const tabItems: TabItem[] = [
  {
    id: 'diary',
    href: '/diary',
    icon: Home,
    emoji: '📔',
    label: 'Diary',
    labelThai: 'ไดอารี่',
    color: '#10b981',
    description: 'Daily waste tracking dashboard'
  },
  {
    id: 'scan',
    href: '/diary/manual',
    icon: Camera,
    emoji: '📷',
    label: 'Scan',
    labelThai: 'สแกน',
    color: '#3b82f6',
    description: 'AI-powered waste recognition'
  },
  {
    id: 'calculator',
    href: '/calculator',
    icon: Calculator,
    emoji: '🧮',
    label: 'Calculator',
    labelThai: 'คำนวณ',
    color: '#f59e0b',
    description: 'Carbon footprint calculator'
  },
  {
    id: 'history',
    href: '/diary/history',
    icon: BarChart3,
    emoji: '📊',
    label: 'History',
    labelThai: 'ประวัติ',
    color: '#8b5cf6',
    description: 'Track your environmental impact'
  },
  {
    id: 'profile',
    href: '/profile',
    icon: User,
    emoji: '👤',
    label: 'Profile',
    labelThai: 'โปรไฟล์',
    color: '#ef4444',
    description: 'Settings and achievements'
  }
];

interface ResponsiveNavigationProps {
  showLabels?: boolean;
  variant?: 'default' | 'compact' | 'desktop';
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export default function ResponsiveNavigation({ 
  showLabels = true, 
  variant = 'default',
  onTabChange,
  className = ''
}: ResponsiveNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect for desktop navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Desktop Navigation - Dark Modern Design */}
      <nav className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gray-900/98 backdrop-blur-lg border-b border-gray-800 shadow-2xl' 
          : 'bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg'
      } ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Modern Minimalist Logo */}
            <Link href="/diary" className="flex items-center space-x-3 group">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center group-hover:from-gray-600 group-hover:to-gray-700 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-gray-300 font-bold text-lg">W</span>
              </motion.div>
              <div>
                <h1 className="text-base font-medium text-gray-100 group-hover:text-white transition-colors">
                  Waste Tracker
                </h1>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                  Sustainable Future
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="flex items-center space-x-1">
              {tabItems.map((tab) => {
                const isActive = getIsActive(tab.href);
                const IconComponent = tab.icon;
                
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`
                      group relative flex items-center space-x-2 px-3 py-2 rounded-lg
                      transition-all duration-200 ease-out
                      ${isActive 
                        ? 'bg-gray-800 text-white' 
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                      }
                    `}
                    onClick={() => handleTabPress(tab.id)}
                  >
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent 
                        className={`w-4 h-4 transition-all duration-200 ${
                          isActive ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200'
                        }`} 
                      />
                      
                      {/* Badge for notifications */}
                      {tab.badge && tab.badge > 0 && (
                        <motion.div
                          className="absolute -top-1 -right-1 bg-gray-600 text-gray-100 text-xs rounded-full h-3 w-3 flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <span className="w-1 h-1 bg-gray-100 rounded-full"></span>
                        </motion.div>
                      )}
                    </motion.div>
                    
                    <span className={`text-sm font-medium transition-all duration-200 hidden xl:block ${
                      isActive ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200'
                    }`}>
                      {tab.label}
                    </span>
                    
                  </Link>
                );
              })}
            </div>

            {/* Minimalist User Actions */}
            <div className="flex items-center space-x-3">
              <motion.button
                className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerHaptic('light')}
              >
                <User className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile and Tablet Navigation - Dark Modern Design */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Minimalist Logo */}
          <Link href="/diary" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-gray-300 font-bold text-sm">W</span>
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-100">
                Waste Tracker
              </h1>
            </div>
          </Link>

          {/* Hamburger Menu Button */}
          <motion.button
            onClick={() => {
              triggerHaptic('medium');
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 90 }}
                  exit={{ rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 0 }}
                  exit={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Dropdown Menu - Full screen on mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-14 left-0 right-0 bg-gray-900/98 backdrop-blur-lg border-t border-gray-800 shadow-xl min-h-screen sm:min-h-fit"
            >
              <div className="px-4 py-6 space-y-3 max-w-2xl mx-auto">
                {tabItems.map((tab) => {
                  const isActive = getIsActive(tab.href);
                  const IconComponent = tab.icon;

                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => {
                        handleTabPress(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-4 px-4 py-4 rounded-lg transition-all duration-200 min-h-[64px] ${
                        isActive
                          ? 'bg-gray-800 text-gray-100 border-l-2 border-gray-600'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-gray-700' : 'bg-gray-800'}`}>
                        <IconComponent className={`w-5 h-5 ${isActive ? 'text-gray-100' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className={`font-medium text-sm ${isActive ? 'text-gray-100' : 'text-gray-300'}`}>
                          {tab.label}
                        </span>
                        {tab.description && (
                          <span className={`text-xs mt-1 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>
                            {tab.description}
                          </span>
                        )}
                      </div>
                      {tab.badge && tab.badge > 0 && (
                        <div className="ml-auto w-2 h-2 bg-gray-500 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>


    </>
  );
}

// Export the component with a better name
export { ResponsiveNavigation as BottomTabNavigation };

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