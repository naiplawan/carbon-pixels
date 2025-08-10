'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Trophy } from 'lucide-react';
import type { ToastNotification } from '@/services/NotificationService';

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({ 
  children, 
  maxToasts = 5, 
  position = 'top-right' 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastNotification>) => {
      const toast = event.detail;
      setToasts(prev => [...prev.slice(-(maxToasts - 1)), toast]);
    };

    const handleDismiss = (event: CustomEvent<{ id: string }>) => {
      setToasts(prev => prev.filter(toast => toast.id !== event.detail.id));
    };

    window.addEventListener('notification-toast', handleToast as EventListener);
    window.addEventListener('notification-toast-dismiss', handleDismiss as EventListener);

    return () => {
      window.removeEventListener('notification-toast', handleToast as EventListener);
      window.removeEventListener('notification-toast-dismiss', handleDismiss as EventListener);
    };
  }, [maxToasts]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {children}
      <ToastContainer position={position}>
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </ToastContainer>
    </>
  );
}

interface ToastContainerProps {
  children: React.ReactNode;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

function ToastContainer({ children, position = 'top-right' }: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div
      className={`fixed z-50 pointer-events-none ${positionClasses[position]} space-y-2`}
    >
      {children}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const getIcon = () => {
    const iconProps = { className: "w-5 h-5 flex-shrink-0" };
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info {...iconProps} className="w-5 h-5 text-blue-500" />;
      case 'achievement':
        return <Trophy {...iconProps} className="w-5 h-5 text-purple-500" />;
      default:
        return <Info {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'achievement':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        pointer-events-auto
        max-w-sm w-full
        border-2 rounded-xl shadow-lg
        ${getColorClasses()}
      `}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon()}
          
          <div className="flex-1 min-w-0">
            <h4 className="font-handwritten text-sm font-semibold">
              {toast.title}
            </h4>
            <p className="text-sm mt-1 break-words">
              {toast.message}
            </p>
            
            {toast.actions && toast.actions.length > 0 && (
              <div className="flex space-x-2 mt-3">
                {toast.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action();
                      onDismiss();
                    }}
                    className="text-xs px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="h-1 bg-current bg-opacity-20 rounded-b-xl"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}