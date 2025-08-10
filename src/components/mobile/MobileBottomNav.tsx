'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Camera, 
  Calculator, 
  History, 
  User,
  Plus,
  Zap,
  Trophy
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  labelTh: string;
  icon: React.ElementType;
  href: string;
  color: string;
  gradient: string;
}

const navItems: NavItem[] = [
  {
    id: 'diary',
    label: 'Diary',
    labelTh: 'ไดอารี่',
    icon: BookOpen,
    href: '/diary',
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'scan',
    label: 'Scan',
    labelTh: 'สแกน',
    icon: Camera,
    href: '/diary/scan',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'quick',
    label: 'Quick',
    labelTh: 'เร็ว',
    icon: Zap,
    href: '/diary/quick',
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'history',
    label: 'History',
    labelTh: 'ประวัติ',
    icon: History,
    href: '/diary/history',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'profile',
    label: 'Profile',
    labelTh: 'โปรไฟล์',
    icon: User,
    href: '/profile',
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-gray-600'
  }
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeItem, setActiveItem] = useState<string>('diary');

  useEffect(() => {
    // Update active item based on pathname
    const currentItem = navItems.find(item => {
      if (item.href === '/diary') {
        return pathname === '/diary' || pathname === '/';
      }
      return pathname.startsWith(item.href);
    });
    
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item.id);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    router.push(item.href);
  };

  return (
    <>
      {/* Safe area spacer */}
      <div className="h-20 sm:hidden" />
      
      {/* Bottom navigation */}
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
          >
            {/* Background with blur effect */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md border-t border-gray-200" />
            
            {/* Navigation items */}
            <div className="relative flex items-center justify-around px-4 py-2">
              {navItems.map((item) => {
                const isActive = activeItem === item.id;
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className="relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg"
                    whileTap={{ scale: 0.95 }}
                    style={{
                      minHeight: '56px' // Ensure proper touch target
                    }}
                  >
                    {/* Active indicator background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.gradient} opacity-10`}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    {/* Icon container */}
                    <div className="relative mb-1">
                      <Icon 
                        className={`w-6 h-6 transition-colors duration-200 ${
                          isActive ? item.color : 'text-gray-400'
                        }`}
                      />
                      
                      {/* Active indicator dot */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r ${item.gradient}`}
                        />
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="flex flex-col items-center">
                      <span className={`text-xs font-medium transition-colors duration-200 ${
                        isActive ? item.color : 'text-gray-500'
                      }`}>
                        {item.label}
                      </span>
                      <span className={`text-xs transition-colors duration-200 ${
                        isActive ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {item.labelTh}
                      </span>
                    </div>
                    
                    {/* Ripple effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      whileTap={{
                        background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)`
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  </motion.button>
                );
              })}
            </div>
            
            {/* Thai design accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-yellow-500 to-green-500" />
          </motion.nav>
        )}
      </AnimatePresence>
      
      {/* Floating action button for quick add */}
      <motion.button
        onClick={() => router.push('/diary/manual')}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:hidden"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        initial={{ scale: 0 }}
        animate={{ scale: isVisible ? 1 : 0.8, opacity: isVisible ? 1 : 0.6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          bottom: `calc(80px + env(safe-area-inset-bottom, 0px))`
        }}
      >
        <Plus className="w-6 h-6" />
        
        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500 opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.button>
    </>
  );
}

// Hook for navigation state
export function useMobileNavigation() {
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState<string>('diary');

  useEffect(() => {
    const currentItem = navItems.find(item => {
      if (item.href === '/diary') {
        return pathname === '/diary' || pathname === '/';
      }
      return pathname.startsWith(item.href);
    });
    
    if (currentItem) {
      setCurrentTab(currentItem.id);
    }
  }, [pathname]);

  return {
    currentTab,
    navItems,
    isActiveTab: (itemId: string) => currentTab === itemId
  };
}