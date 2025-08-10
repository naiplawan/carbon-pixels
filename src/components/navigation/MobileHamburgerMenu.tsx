'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  id: string;
  href: string;
  icon: string;
  label: string;
  labelThai: string;
  description?: string;
  descriptionThai?: string;
  badge?: number;
  submenu?: MenuItem[];
  color?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'diary',
    href: '/diary',
    icon: '📔',
    label: 'Waste Diary',
    labelThai: 'ไดอารี่ขยะ',
    description: 'Track daily waste and earn credits',
    descriptionThai: 'ติดตามขยะประจำวันและรับเครดิต',
    color: '#10b981',
    submenu: [
      {
        id: 'diary-today',
        href: '/diary',
        icon: '📅',
        label: 'Today\'s Log',
        labelThai: 'บันทึกวันนี้'
      },
      {
        id: 'diary-manual',
        href: '/diary/manual',
        icon: '✍️',
        label: 'Manual Entry',
        labelThai: 'บันทึกเอง'
      },
      {
        id: 'diary-scan',
        href: '/diary/manual',
        icon: '📷',
        label: 'Scan Waste',
        labelThai: 'สแกนขยะ'
      },
      {
        id: 'diary-quick',
        href: '/diary/quick-start',
        icon: '⚡',
        label: 'Quick Start',
        labelThai: 'เริ่มด่วน'
      }
    ]
  },
  {
    id: 'calculator',
    href: '/calculator',
    icon: '🧮',
    label: 'Carbon Calculator',
    labelThai: 'คำนวณคาร์บอน',
    description: 'Calculate your carbon footprint',
    descriptionThai: 'คำนวณรอยเท้าคาร์บอนของคุณ',
    color: '#f59e0b'
  },
  {
    id: 'history',
    href: '/diary/history',
    icon: '📊',
    label: 'History & Stats',
    labelThai: 'ประวัติและสถิติ',
    description: 'View your progress and analytics',
    descriptionThai: 'ดูความก้าวหน้าและการวิเคราะห์',
    color: '#8b5cf6'
  },
  {
    id: 'achievements',
    href: '/achievements',
    icon: '🏆',
    label: 'Achievements',
    labelThai: 'ความสำเร็จ',
    description: 'View badges and milestones',
    descriptionThai: 'ดูเหรียญและเป้าหมาย',
    badge: 3,
    color: '#f59e0b'
  },
  {
    id: 'community',
    href: '/community',
    icon: '🌍',
    label: 'Community',
    labelThai: 'ชุมชน',
    description: 'Connect with eco warriors',
    descriptionThai: 'เชื่อมต่อกับนักรบสิ่งแวดล้อม',
    color: '#3b82f6'
  },
  {
    id: 'settings',
    href: '/settings',
    icon: '⚙️',
    label: 'Settings',
    labelThai: 'การตั้งค่า',
    description: 'App preferences and profile',
    descriptionThai: 'ความต้องการแอพและโปรไฟล์',
    color: '#6b7280'
  }
];

interface MobileHamburgerMenuProps {
  onMenuToggle?: (isOpen: boolean) => void;
  variant?: 'overlay' | 'push';
  showThaiLabels?: boolean;
}

export default function MobileHamburgerMenu({ 
  onMenuToggle, 
  variant = 'overlay',
  showThaiLabels = true 
}: MobileHamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const pathname = usePathname();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const openMenu = () => {
    setIsOpen(true);
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    onMenuToggle?.(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setExpandedSubmenu(null);
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onMenuToggle?.(false);
  };

  const handleSubmenuToggle = (menuId: string) => {
    setExpandedSubmenu(expandedSubmenu === menuId ? null : menuId);
    // Light haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  // Touch gesture handling for menu close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    // Close menu if swipe left > 50px
    if (diff > 50) {
      closeMenu();
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const isActiveRoute = (href: string) => {
    if (href === '/diary' && pathname === '/diary') return true;
    if (href !== '/diary' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={openMenu}
        className="fixed top-4 left-4 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)'
        }}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-6 h-6 flex flex-col justify-center items-center space-y-1"
        >
          <motion.span
            animate={{
              rotate: isOpen ? 45 : 0,
              y: isOpen ? 6 : 0
            }}
            className="w-5 h-0.5 bg-gray-700 rounded-full origin-center"
          />
          <motion.span
            animate={{ opacity: isOpen ? 0 : 1 }}
            className="w-5 h-0.5 bg-gray-700 rounded-full"
          />
          <motion.span
            animate={{
              rotate: isOpen ? -45 : 0,
              y: isOpen ? -6 : 0
            }}
            className="w-5 h-0.5 bg-gray-700 rounded-full origin-center"
          />
        </motion.div>
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              duration: 0.4
            }}
            className="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="navigation"
            aria-label="Main navigation menu"
          >
            {/* Header */}
            <div 
              className="relative p-6 pt-8"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
              }}
            >
              {/* Thai cultural pattern overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M10 10L5 5v10h10L10 10z'/%3E%3C/g%3E%3C/svg%3E")`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 
                    className="text-white text-lg font-bold"
                    style={{ fontFamily: 'Kalam, cursive' }}
                  >
                    Thailand Waste Diary
                  </h2>
                  <button
                    onClick={closeMenu}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <span className="text-white text-lg">×</span>
                  </button>
                </div>

                <p 
                  className="text-green-100 text-sm"
                  style={{ fontFamily: 'Patrick Hand, cursive' }}
                >
                  Track waste • Earn credits • Save Thailand
                </p>
                <p 
                  className="text-green-200 text-xs mt-1"
                  style={{ fontFamily: 'Patrick Hand, cursive' }}
                >
                  ติดตามขยะ • รับเครดิต • ช่วยประเทศไทย
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4 space-y-2">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={`
                        relative rounded-xl overflow-hidden
                        ${isActiveRoute(item.href) ? 'bg-green-50 ring-2 ring-green-200' : ''}
                      `}
                    >
                      {/* Main menu item */}
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (!item.submenu) {
                            closeMenu();
                          } else {
                            handleSubmenuToggle(item.id);
                          }
                        }}
                        className="flex items-center p-4 hover:bg-gray-50 transition-colors duration-200 group"
                        aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                      >
                        {/* Icon */}
                        <motion.div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 relative"
                          style={{ backgroundColor: item.color + '20' }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          
                          {/* Badge */}
                          {item.badge && (
                            <motion.div
                              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              {item.badge}
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Labels and description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 
                              className={`
                                font-semibold truncate
                                ${isActiveRoute(item.href) ? 'text-green-700' : 'text-gray-900'}
                              `}
                              style={{ fontFamily: 'Kalam, cursive' }}
                            >
                              {item.label}
                            </h3>
                            {item.submenu && (
                              <motion.span
                                animate={{ rotate: expandedSubmenu === item.id ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-400 ml-2"
                              >
                                ›
                              </motion.span>
                            )}
                          </div>
                          
                          {showThaiLabels && (
                            <p 
                              className={`
                                text-sm truncate
                                ${isActiveRoute(item.href) ? 'text-green-600' : 'text-gray-500'}
                              `}
                              style={{ fontFamily: 'Patrick Hand, cursive' }}
                            >
                              {item.labelThai}
                            </p>
                          )}
                          
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Submenu */}
                      <AnimatePresence>
                        {item.submenu && expandedSubmenu === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-gray-50 border-t border-gray-100"
                          >
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.id}
                                href={subItem.href}
                                onClick={closeMenu}
                                className={`
                                  flex items-center py-3 px-8 hover:bg-white transition-colors duration-200
                                  ${isActiveRoute(subItem.href) ? 'bg-white text-green-700' : 'text-gray-700'}
                                `}
                              >
                                <span className="text-lg mr-3">{subItem.icon}</span>
                                <div>
                                  <div className="font-medium text-sm">{subItem.label}</div>
                                  {showThaiLabels && (
                                    <div 
                                      className="text-xs text-gray-500"
                                      style={{ fontFamily: 'Patrick Hand, cursive' }}
                                    >
                                      {subItem.labelThai}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="text-center">
                <p 
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Kalam, cursive' }}
                >
                  Carbon Neutral Thailand 2050
                </p>
                <p 
                  className="text-xs text-gray-500 mt-1"
                  style={{ fontFamily: 'Patrick Hand, cursive' }}
                >
                  ประเทศไทยคาร์บอนนิวทรัล 2050
                </p>
              </div>
              
              {/* Swipe hint */}
              <motion.div
                className="flex items-center justify-center mt-3 text-xs text-gray-400"
                animate={{ x: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span>← Swipe left to close</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook for menu state
export function useMenuState() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = (state?: boolean) => {
    setIsOpen(state !== undefined ? state : !isOpen);
  };

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return {
    isOpen,
    toggleMenu,
    pathname
  };
}