'use client';

import { ReactNode, useEffect, useState } from 'react';

// Safe area utilities
const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0')
  };
};

// Main safe area layout wrapper
interface SafeAreaLayoutProps {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  className?: string;
  fullHeight?: boolean;
}

export function SafeAreaLayout({
  children,
  edges = ['top', 'bottom'],
  className = '',
  fullHeight = true
}: SafeAreaLayoutProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Set CSS custom properties for safe area insets
    const updateSafeAreaInsets = () => {
      if (CSS.supports('padding-top', 'env(safe-area-inset-top)')) {
        document.documentElement.style.setProperty(
          '--safe-area-top',
          'env(safe-area-inset-top, 0px)'
        );
        document.documentElement.style.setProperty(
          '--safe-area-bottom',
          'env(safe-area-inset-bottom, 0px)'
        );
        document.documentElement.style.setProperty(
          '--safe-area-left',
          'env(safe-area-inset-left, 0px)'
        );
        document.documentElement.style.setProperty(
          '--safe-area-right',
          'env(safe-area-inset-right, 0px)'
        );
      }
    };
    
    updateSafeAreaInsets();
    window.addEventListener('orientationchange', updateSafeAreaInsets);
    
    return () => {
      window.removeEventListener('orientationchange', updateSafeAreaInsets);
    };
  }, []);

  if (!mounted) {
    return <div className={`${fullHeight ? 'min-h-screen' : ''} ${className}`}>{children}</div>;
  }

  const safeAreaStyles = {
    paddingTop: edges.includes('top') ? 'var(--safe-area-top, 0px)' : undefined,
    paddingBottom: edges.includes('bottom') ? 'var(--safe-area-bottom, 0px)' : undefined,
    paddingLeft: edges.includes('left') ? 'var(--safe-area-left, 0px)' : undefined,
    paddingRight: edges.includes('right') ? 'var(--safe-area-right, 0px)' : undefined,
  };

  return (
    <div
      className={`${fullHeight ? 'min-h-screen' : ''} ${className}`}
      style={safeAreaStyles}
    >
      {children}
    </div>
  );
}

// Header component with safe area support
interface SafeAreaHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function SafeAreaHeader({
  title,
  subtitle,
  onBack,
  actions,
  className = '',
  sticky = false
}: SafeAreaHeaderProps) {
  return (
    <header
      className={`
        bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm z-40
        ${sticky ? 'sticky top-0' : ''}
        ${className}
      `}
      style={{
        paddingTop: 'max(1rem, var(--safe-area-top, 0px))',
        paddingLeft: 'var(--safe-area-left, 0px)',
        paddingRight: 'var(--safe-area-right, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-4 pb-4">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 shadow-sm"
            style={{ touchAction: 'manipulation' }}
            aria-label="Go back"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Title and subtitle */}
        <div className="flex-1 text-center mx-4">
          <h1 className="text-xl sm:text-2xl font-handwritten text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-pencil font-sketch mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
    </header>
  );
}

// Bottom navigation with safe area support
interface SafeAreaBottomNavProps {
  items: Array<{
    id: string;
    label: string;
    icon: ReactNode;
    active?: boolean;
    badge?: number;
    onClick: () => void;
  }>;
  className?: string;
}

export function SafeAreaBottomNav({
  items,
  className = ''
}: SafeAreaBottomNavProps) {
  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-50
        ${className}
      `}
      style={{
        paddingBottom: 'max(0.5rem, var(--safe-area-bottom, 0px))',
        paddingLeft: 'var(--safe-area-left, 0px)',
        paddingRight: 'var(--safe-area-right, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`
              flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-200
              min-h-[60px] relative
              ${item.active
                ? 'text-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
            style={{ touchAction: 'manipulation' }}
            aria-label={item.label}
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-sketch font-medium">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// Floating action button with safe area support
interface SafeAreaFABProps {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  extended?: boolean;
  label?: string;
}

export function SafeAreaFAB({
  icon,
  onClick,
  className = '',
  position = 'bottom-right',
  extended = false,
  label
}: SafeAreaFABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed z-50 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
        active:from-green-700 active:to-green-800 text-white shadow-xl hover:shadow-2xl
        active:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400
        ${extended ? 'rounded-full px-6 py-4 flex items-center gap-3' : 'w-14 h-14 rounded-full flex items-center justify-center'}
        ${positionClasses[position]}
        ${className}
      `}
      style={{
        marginBottom: 'var(--safe-area-bottom, 0px)',
        marginLeft: position.includes('left') ? 'var(--safe-area-left, 0px)' : undefined,
        marginRight: position.includes('right') ? 'var(--safe-area-right, 0px)' : undefined,
        touchAction: 'manipulation'
      }}
      aria-label={label || 'Floating action button'}
    >
      {icon}
      {extended && label && (
        <span className="font-sketch font-medium">{label}</span>
      )}
    </button>
  );
}

// Modal with safe area support
interface SafeAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function SafeAreaModal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className = ''
}: SafeAreaModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'w-full h-full max-w-none'
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      style={{
        paddingTop: 'max(1rem, var(--safe-area-top, 0px))',
        paddingBottom: 'max(1rem, var(--safe-area-bottom, 0px))',
        paddingLeft: 'max(1rem, var(--safe-area-left, 0px))',
        paddingRight: 'max(1rem, var(--safe-area-right, 0px))',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          bg-white rounded-2xl shadow-2xl max-h-full overflow-hidden
          ${sizeClasses[size]}
          ${size === 'full' ? 'rounded-none' : ''}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <header className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 id="modal-title" className="text-lg font-handwritten text-ink">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
              style={{ touchAction: 'manipulation' }}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
        )}
        
        <div className={`overflow-y-auto ${size === 'full' ? 'flex-1' : 'max-h-[80vh]'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Page container with safe area support
interface SafeAreaPageProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export function SafeAreaPage({
  children,
  header,
  footer,
  className = '',
  fullHeight = true
}: SafeAreaPageProps) {
  return (
    <SafeAreaLayout
      edges={['top', 'bottom', 'left', 'right']}
      fullHeight={fullHeight}
      className={`flex flex-col ${className}`}
    >
      {header}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {footer}
    </SafeAreaLayout>
  );
}

// Drawer component with safe area support
interface SafeAreaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export function SafeAreaDrawer({
  isOpen,
  onClose,
  children,
  side = 'left',
  className = ''
}: SafeAreaDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <aside
        className={`
          fixed top-0 ${side === 'left' ? 'left-0' : 'right-0'} h-full w-80 max-w-[85vw]
          bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out
          ${isOpen 
            ? 'translate-x-0' 
            : side === 'left' 
              ? '-translate-x-full' 
              : 'translate-x-full'
          }
          ${className}
        `}
        style={{
          paddingTop: 'var(--safe-area-top, 0px)',
          paddingBottom: 'var(--safe-area-bottom, 0px)',
          paddingLeft: side === 'left' ? 'var(--safe-area-left, 0px)' : undefined,
          paddingRight: side === 'right' ? 'var(--safe-area-right, 0px)' : undefined,
        }}
      >
        {children}
      </aside>
    </>
  );
}