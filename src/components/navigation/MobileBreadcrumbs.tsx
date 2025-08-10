'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  labelThai: string;
  href: string;
  icon?: string;
  color?: string;
  isCurrentPage?: boolean;
}

interface MobileBreadcrumbsProps {
  variant?: 'default' | 'compact' | 'pills';
  showIcons?: boolean;
  showThaiLabels?: boolean;
  maxItems?: number;
  collapsible?: boolean;
  onBreadcrumbClick?: (item: BreadcrumbItem) => void;
}

export default function MobileBreadcrumbs({
  variant = 'default',
  showIcons = true,
  showThaiLabels = true,
  maxItems = 4,
  collapsible = true,
  onBreadcrumbClick
}: MobileBreadcrumbsProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Home',
        labelThai: 'หน้าหลัก',
        href: '/',
        icon: '🏠',
        color: '#10b981'
      }
    ];

    let currentPath = '';
    
    for (let i = 0; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`;
      const segment = pathSegments[i];
      const isLast = i === pathSegments.length - 1;

      let item: BreadcrumbItem;

      // Define breadcrumb mappings
      switch (segment) {
        case 'diary':
          item = {
            label: 'Waste Diary',
            labelThai: 'ไดอารี่ขยะ',
            href: '/diary',
            icon: '📔',
            color: '#10b981',
            isCurrentPage: isLast
          };
          break;
        case 'manual':
          item = {
            label: 'Manual Entry',
            labelThai: 'บันทึกเอง',
            href: '/diary/manual',
            icon: '✍️',
            color: '#3b82f6',
            isCurrentPage: isLast
          };
          break;
        case 'history':
          item = {
            label: 'History',
            labelThai: 'ประวัติ',
            href: '/diary/history',
            icon: '📊',
            color: '#8b5cf6',
            isCurrentPage: isLast
          };
          break;
        case 'quick-start':
          item = {
            label: 'Quick Start',
            labelThai: 'เริ่มด่วน',
            href: '/diary/quick-start',
            icon: '⚡',
            color: '#f59e0b',
            isCurrentPage: isLast
          };
          break;
        case 'calculator':
          item = {
            label: 'Carbon Calculator',
            labelThai: 'คำนวณคาร์บอน',
            href: '/calculator',
            icon: '🧮',
            color: '#f59e0b',
            isCurrentPage: isLast
          };
          break;
        case 'results':
          item = {
            label: 'Results',
            labelThai: 'ผลลัพธ์',
            href: '/results',
            icon: '📈',
            color: '#059669',
            isCurrentPage: isLast
          };
          break;
        case 'profile':
          item = {
            label: 'Profile',
            labelThai: 'โปรไฟล์',
            href: '/profile',
            icon: '👤',
            color: '#ef4444',
            isCurrentPage: isLast
          };
          break;
        case 'settings':
          item = {
            label: 'Settings',
            labelThai: 'การตั้งค่า',
            href: '/settings',
            icon: '⚙️',
            color: '#6b7280',
            isCurrentPage: isLast
          };
          break;
        default:
          // Handle dynamic segments
          item = {
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            labelThai: segment,
            href: currentPath,
            icon: '📄',
            color: '#6b7280',
            isCurrentPage: isLast
          };
      }

      breadcrumbs.push(item);
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  // Handle breadcrumb overflow
  const getVisibleBreadcrumbs = () => {
    if (!collapsible || breadcrumbs.length <= maxItems) {
      return breadcrumbs;
    }

    if (isExpanded) {
      return breadcrumbs;
    }

    // Show first item, ellipsis, and last few items
    const visibleItems: (BreadcrumbItem | { isEllipsis: true })[] = [];
    
    if (breadcrumbs.length > maxItems) {
      visibleItems.push(breadcrumbs[0]); // First item (Home)
      
      if (breadcrumbs.length > maxItems + 1) {
        visibleItems.push({ isEllipsis: true });
      }
      
      // Add last maxItems-2 items
      const startIndex = Math.max(1, breadcrumbs.length - (maxItems - 2));
      for (let i = startIndex; i < breadcrumbs.length; i++) {
        visibleItems.push(breadcrumbs[i]);
      }
    }

    return visibleItems;
  };

  const visibleBreadcrumbs = getVisibleBreadcrumbs();

  // Check scroll state
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  };

  useEffect(() => {
    checkScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollState);
      return () => container.removeEventListener('scroll', checkScrollState);
    }
  }, [breadcrumbs]);

  const scrollBreadcrumbs = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });

    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onBreadcrumbClick?.(item);
  };

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <motion.nav
      className={`
        w-full bg-white border-b border-gray-100 sticky top-0 z-30
        ${variant === 'compact' ? 'py-2' : 'py-3'}
      `}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <div className="px-4 flex items-center justify-between">
        {/* Scroll left button */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollBreadcrumbs('left')}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 hover:bg-gray-200 transition-colors"
              aria-label="Scroll breadcrumbs left"
            >
              <span className="text-gray-600 text-sm">‹</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Breadcrumb container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-center space-x-1 min-w-max">
            {visibleBreadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {/* Breadcrumb item or ellipsis */}
                {'isEllipsis' in item ? (
                  <motion.button
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    whileTap={{ scale: 0.95 }}
                    aria-label="Show all breadcrumbs"
                  >
                    <span className="text-gray-400 text-sm">•••</span>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center"
                  >
                    {item.isCurrentPage ? (
                      <div
                        className={`
                          px-3 py-1.5 rounded-lg flex items-center space-x-2
                          ${variant === 'pills' 
                            ? 'bg-green-100 border border-green-200' 
                            : 'bg-gray-50'
                          }
                          ${variant === 'compact' ? 'px-2 py-1' : 'px-3 py-1.5'}
                        `}
                      >
                        {showIcons && item.icon && (
                          <span className="text-sm">{item.icon}</span>
                        )}
                        <div>
                          <div 
                            className={`
                              font-semibold
                              ${item.isCurrentPage ? 'text-green-700' : 'text-gray-900'}
                              ${variant === 'compact' ? 'text-sm' : 'text-sm'}
                            `}
                            style={{ fontFamily: 'Kalam, cursive' }}
                          >
                            {item.label}
                          </div>
                          {showThaiLabels && (
                            <div 
                              className={`
                                ${item.isCurrentPage ? 'text-green-600' : 'text-gray-500'}
                                ${variant === 'compact' ? 'text-xs' : 'text-xs'}
                              `}
                              style={{ fontFamily: 'Patrick Hand, cursive' }}
                            >
                              {item.labelThai}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => handleBreadcrumbClick(item)}
                        className={`
                          px-3 py-1.5 rounded-lg flex items-center space-x-2
                          hover:bg-gray-50 transition-colors duration-200
                          ${variant === 'compact' ? 'px-2 py-1' : 'px-3 py-1.5'}
                        `}
                        aria-current={item.isCurrentPage ? 'page' : undefined}
                      >
                        {showIcons && item.icon && (
                          <motion.span 
                            className="text-sm"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.1 }}
                          >
                            {item.icon}
                          </motion.span>
                        )}
                        <div>
                          <div 
                            className={`
                              ${variant === 'compact' ? 'text-sm' : 'text-sm'}
                              text-gray-700 hover:text-gray-900 font-medium
                            `}
                            style={{ fontFamily: 'Kalam, cursive' }}
                          >
                            {item.label}
                          </div>
                          {showThaiLabels && (
                            <div 
                              className={`
                                text-gray-500 hover:text-gray-600
                                ${variant === 'compact' ? 'text-xs' : 'text-xs'}
                              `}
                              style={{ fontFamily: 'Patrick Hand, cursive' }}
                            >
                              {item.labelThai}
                            </div>
                          )}
                        </div>
                      </Link>
                    )}
                  </motion.div>
                )}

                {/* Separator */}
                {index < visibleBreadcrumbs.length - 1 && (
                  <motion.span 
                    className="text-gray-300 text-sm mx-1 flex-shrink-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                  >
                    ›
                  </motion.span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scroll right button */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollBreadcrumbs('right')}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ml-2 hover:bg-gray-200 transition-colors"
              aria-label="Scroll breadcrumbs right"
            >
              <span className="text-gray-600 text-sm">›</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Breadcrumb expansion overlay */}
      <AnimatePresence>
        {isExpanded && breadcrumbs.length > maxItems && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {breadcrumbs.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => {
                      setIsExpanded(false);
                      handleBreadcrumbClick(item);
                    }}
                    className={`
                      px-3 py-1.5 rounded-full text-xs flex items-center space-x-2
                      border transition-colors duration-200
                      ${item.isCurrentPage 
                        ? 'bg-green-100 border-green-200 text-green-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                      }
                    `}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Collapse</span>
                <span>↑</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thai cultural accent line */}
      <div 
        className="h-0.5 bg-gradient-to-r from-yellow-400 via-red-500 to-blue-600 opacity-20"
        style={{
          background: 'linear-gradient(90deg, #fbbf24 0%, #dc2626 50%, #2563eb 100%)'
        }}
      />
    </motion.nav>
  );
}

// Hook for breadcrumb state
export function useBreadcrumbs() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [variant, setVariant] = useState<'default' | 'compact' | 'pills'>('default');

  // Auto-adjust variant based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 640) {
        setVariant('compact');
      } else {
        setVariant('default');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return {
    isVisible,
    variant,
    pathname,
    toggleVisibility,
    setVariant
  };
}