'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'achievement' | 'streak';
  title: string;
  message: string;
  duration?: number;
  soundEffect?: string;
  autoClose?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

interface ToastNotificationProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  enableSounds?: boolean;
}

export default function ToastNotification({ 
  notification, 
  onClose, 
  position = 'top-right',
  enableSounds = true 
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isAnimating, setIsAnimating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation and auto-close logic
  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const duration = notification.duration || 5000;
    const autoClose = notification.autoClose !== false;

    if (autoClose && duration > 0) {
      // Progress bar animation
      const progressInterval = 100; // Update every 100ms
      const progressDecrement = 100 / (duration / progressInterval);

      progressTimerRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - progressDecrement;
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, progressInterval);

      // Auto close timer
      closeTimerRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [notification.duration, notification.autoClose]);

  // Play sound effect when notification appears
  useEffect(() => {
    if (notification.soundEffect && enableSounds) {
      playSound(notification.soundEffect);
    }
  }, [notification.soundEffect, enableSounds]);

  const playSound = useCallback(async (soundName: string) => {
    if (!enableSounds) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const soundMap = {
        'success': '/sounds/success.mp3',
        'achievement': '/sounds/achievement.mp3',
        'level-up': '/sounds/level-up.mp3',
        'streak': '/sounds/streak.mp3',
        'celebrate': '/sounds/celebrate.mp3',
        'challenge': '/sounds/challenge.mp3',
        'gentle-chime': '/sounds/gentle-chime.mp3',
        'error': '/sounds/error.mp3',
        'warning': '/sounds/warning.mp3',
        'info': '/sounds/info.mp3'
      };

      const soundPath = soundMap[soundName as keyof typeof soundMap];
      if (soundPath) {
        audioRef.current.src = soundPath;
        audioRef.current.volume = 0.5;
        await audioRef.current.play();
      }
    } catch (error) {
      console.debug('Could not play sound:', error);
    }
  }, [enableSounds]);

  const handleClose = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsVisible(false);
    
    // Clean up timers
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    
    // Wait for exit animation to complete
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  }, [notification.id, onClose, isAnimating]);

  const handleActionClick = useCallback((action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error('Toast action failed:', error);
    }
  }, []);

  // Style configurations
  const typeStyles = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800 shadow-green-100',
      progress: 'bg-green-400',
      icon: '✅'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100',
      progress: 'bg-blue-400',
      icon: 'ℹ️'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800 shadow-yellow-100',
      progress: 'bg-yellow-400',
      icon: '⚠️'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800 shadow-red-100',
      progress: 'bg-red-400',
      icon: '❌'
    },
    achievement: {
      container: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800 shadow-purple-100',
      progress: 'bg-gradient-to-r from-purple-400 to-pink-400',
      icon: '🏆'
    },
    streak: {
      container: 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-800 shadow-orange-100',
      progress: 'bg-gradient-to-r from-orange-400 to-red-400',
      icon: '🔥'
    }
  };

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  const animationStyles = {
    'top-right': isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
    'top-left': isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0',
    'bottom-right': isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
    'bottom-left': isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0',
    'top-center': isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
  };

  const style = typeStyles[notification.type];

  return (
    <>
      <div className={`
        fixed z-[9999] max-w-sm w-full pointer-events-auto
        ${positionStyles[position]}
        transform transition-all duration-300 ease-out
        ${animationStyles[position]}
      `}>
        <div className={`
          relative rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm
          ${style.container}
          font-sketch
        `}>
          {/* Progress bar for auto-close notifications */}
          {notification.autoClose !== false && notification.duration && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ease-linear ${style.progress}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex items-start gap-3">
            {/* Icon with subtle animation */}
            <div className="text-2xl flex-shrink-0 animate-pulse">
              {style.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="font-handwritten text-lg font-semibold mb-1 leading-tight">
                {notification.title}
              </div>
              
              {/* Message */}
              <div className="font-sketch text-sm opacity-90 leading-relaxed break-words">
                {notification.message}
              </div>
              
              {/* Action buttons */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionClick(action.action)}
                      className={`
                        px-3 py-1 rounded text-sm font-sketch transition-all duration-200
                        transform hover:scale-105 active:scale-95
                        ${action.style === 'primary' 
                          ? 'bg-current text-white opacity-90 hover:opacity-100 shadow-sm' 
                          : 'bg-white/50 hover:bg-white/70 backdrop-blur-sm border border-current/20'
                        }
                      `}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="text-current opacity-50 hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-white/20"
              aria-label="Close notification"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="current-color">
                <path d="M13 1L1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />
    </>
  );
}

// Toast Container Component for managing multiple toasts
interface ToastContainerProps {
  notifications: ToastNotification[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxVisible?: number;
  enableSounds?: boolean;
}

export function ToastContainer({ 
  notifications, 
  onClose, 
  position = 'top-right',
  maxVisible = 5,
  enableSounds = true 
}: ToastContainerProps) {
  const visibleNotifications = notifications.slice(-maxVisible);

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      <div className="space-y-2">
        {visibleNotifications.map((notification, index) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={onClose}
            position={position}
            enableSounds={enableSounds && index === visibleNotifications.length - 1} // Only play sound for latest
          />
        ))}
      </div>
    </div>
  );
}

// Hook for using toast notifications
export function useToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const showToast = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      autoClose: notification.autoClose ?? true
    };

    setNotifications(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenient methods for different types
  const showSuccess = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return showToast({ type: 'success', title, message, ...options });
  }, [showToast]);

  const showError = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return showToast({ type: 'error', title, message, ...options });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return showToast({ type: 'info', title, message, ...options });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return showToast({ type: 'warning', title, message, ...options });
  }, [showToast]);

  const showAchievement = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return showToast({ 
      type: 'achievement', 
      title, 
      message, 
      duration: 8000,
      soundEffect: 'achievement',
      ...options 
    });
  }, [showToast]);

  const showStreak = useCallback((title: string, message: string, options?: Partial<ToastNotification>) => {
    return showToast({ 
      type: 'streak', 
      title, 
      message, 
      duration: 6000,
      soundEffect: 'streak',
      ...options 
    });
  }, [showToast]);

  return {
    notifications,
    showToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showAchievement,
    showStreak
  };
}