'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  ArrowLeft, 
  Share2, 
  Settings,
  Bell,
  Bookmark,
  Search,
  HelpCircle
} from 'lucide-react';

interface MobileFriendlyLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  titleTh?: string;
  rightActions?: React.ReactNode;
  className?: string;
}

export function MobileFriendlyLayout({
  children,
  showBackButton = false,
  title,
  titleTh,
  rightActions,
  className = ''
}: MobileFriendlyLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close menu when route changes
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const headerOpacity = Math.max(0, 1 - scrollY / 100);
  const headerTranslateY = Math.min(0, -scrollY * 0.5);

  const menuItems = [
    { id: 'diary', label: 'Waste Diary', labelTh: 'ไดอารี่ขยะ', href: '/diary', icon: '📔' },
    { id: 'calculator', label: 'Calculator', labelTh: 'คำนวณคาร์บอน', href: '/calculator', icon: '🧮' },
    { id: 'history', label: 'History', labelTh: 'ประวัติ', href: '/diary/history', icon: '📊' },
    { id: 'settings', label: 'Settings', labelTh: 'ตั้งค่า', href: '/settings', icon: '⚙️' },
    { id: 'help', label: 'Help', labelTh: 'ช่วยเหลือ', href: '/help', icon: '❓' }
  ];

  return (
    <>
      {/* Mobile Header */}
      <motion.header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 md:relative md:bg-transparent md:border-none"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          opacity: headerOpacity,
          transform: `translateY(${headerTranslateY}px)`
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left section */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={() => window.history.back()}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
            ) : (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            )}
            
            {/* Title */}
            {(title || titleTh) && (
              <div className="flex flex-col">
                {title && (
                  <h1 className="text-sm font-semibold text-gray-900 leading-tight">
                    {title}
                  </h1>
                )}
                {titleTh && (
                  <p className="text-xs text-gray-600 leading-tight">
                    {titleTh}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            
            {rightActions}
          </div>
        </div>

        {/* Thai design accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-yellow-500 to-green-500 opacity-60" />
      </motion.header>

      {/* Main Content */}
      <main 
        className={`min-h-screen pb-20 md:pb-0 ${className}`}
        style={{
          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        {children}
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl md:hidden"
              style={{
                paddingTop: 'env(safe-area-inset-top, 0px)'
              }}
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-yellow-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🌱</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Thailand Waste Diary</h2>
                    <p className="text-xs text-gray-600">ไดอารี่ขยะประเทศไทย</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {menuItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors touch-manipulation group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.labelTh}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Bottom section */}
                <div className="border-t border-gray-200 p-4 space-y-2">
                  <button className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-gray-50 transition-colors touch-manipulation">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">Notifications</div>
                      <div className="text-sm text-gray-500">การแจ้งเตือน</div>
                    </div>
                  </button>
                  
                  <button className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-gray-50 transition-colors touch-manipulation">
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">Share App</div>
                      <div className="text-sm text-gray-500">แชร์แอป</div>
                    </div>
                  </button>
                </div>

                {/* App info */}
                <div className="border-t border-gray-200 p-4">
                  <div className="text-center text-sm text-gray-500">
                    <p>🇹🇭 Supporting Thailand&apos;s 2050</p>
                    <p>Carbon Neutrality Goal</p>
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg md:hidden"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="flex items-center gap-3 p-4">
              <input
                type="search"
                placeholder="Search waste entries... / ค้นหารายการขยะ..."
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
                autoFocus
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-4 py-3 text-green-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Page wrapper with mobile optimizations
export function MobilePageWrapper({
  children,
  className = '',
  title,
  titleTh,
  showBackButton = false,
  maxWidth = 'max-w-4xl'
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleTh?: string;
  showBackButton?: boolean;
  maxWidth?: string;
}) {
  return (
    <MobileFriendlyLayout
      title={title}
      titleTh={titleTh}
      showBackButton={showBackButton}
    >
      <div className={`${maxWidth} mx-auto px-4 py-6 ${className}`}>
        {children}
      </div>
    </MobileFriendlyLayout>
  );
}

// Mobile-optimized card component
export function MobileCard({
  children,
  className = '',
  onClick,
  gradient = false,
  padding = 'p-4'
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  gradient?: boolean;
  padding?: string;
}) {
  const baseClasses = `bg-white rounded-2xl shadow-sm border border-gray-100 ${padding} ${className}`;
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow touch-manipulation' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-white to-gray-50' : '';

  if (onClick) {
    return (
      <motion.div
        className={`${baseClasses} ${interactiveClasses} ${gradientClasses}`}
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${gradientClasses}`}>
      {children}
    </div>
  );
}

// Mobile-optimized button component
export function MobileButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const baseClasses = 'font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border-2 border-green-500 text-green-600 hover:bg-green-50 focus:ring-green-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    small: 'px-4 py-2 text-sm min-h-[40px]',
    medium: 'px-6 py-3 text-base min-h-[48px]',
    large: 'px-8 py-4 text-lg min-h-[56px]'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}