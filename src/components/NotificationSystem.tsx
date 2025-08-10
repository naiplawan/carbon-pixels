'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationManager, type ScheduledNotification, type NotificationConfig } from '@/lib/notifications';

export interface NotificationPreferences {
  // Daily reminders
  dailyReminders: boolean;
  morningTime: string;
  eveningTime: string;
  customTimes: string[];
  
  // Achievement notifications
  achievementNotifications: boolean;
  milestoneAlerts: boolean;
  streakReminders: boolean;
  levelUpNotifications: boolean;
  
  // Weekly summaries
  weeklyReports: boolean;
  weeklyReportDay: string; // 'sunday', 'monday', etc.
  weeklyReportTime: string;
  
  // Challenge notifications
  challengeNotifications: boolean;
  challengeReminders: boolean;
  
  // Sound preferences
  soundEnabled: boolean;
  achievementSounds: boolean;
  reminderSounds: boolean;
  
  // Do not disturb
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // Notification frequency
  reminderFrequency: 'once' | 'twice' | 'custom';
  maxNotificationsPerDay: number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'achievement';
  title: string;
  message: string;
  duration?: number;
  soundEffect?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

interface NotificationSystemProps {
  onToast?: (notification: ToastNotification) => void;
  children?: React.ReactNode;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyReminders: true,
  morningTime: '09:00',
  eveningTime: '19:00',
  customTimes: [],
  achievementNotifications: true,
  milestoneAlerts: true,
  streakReminders: true,
  levelUpNotifications: true,
  weeklyReports: true,
  weeklyReportDay: 'sunday',
  weeklyReportTime: '10:00',
  challengeNotifications: true,
  challengeReminders: true,
  soundEnabled: true,
  achievementSounds: true,
  reminderSounds: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  reminderFrequency: 'twice',
  maxNotificationsPerDay: 5
};

export default function NotificationSystem({ onToast, children }: NotificationSystemProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [toastQueue, setToastQueue] = useState<ToastNotification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationCountRef = useRef(0);

  // Initialize the notification system
  useEffect(() => {
    initializeNotificationSystem();
  }, []);

  const initializeNotificationSystem = async () => {
    try {
      // Load preferences from localStorage
      const savedPrefs = localStorage.getItem('notificationPreferences');
      if (savedPrefs) {
        const parsedPrefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(savedPrefs) };
        setPreferences(parsedPrefs);
      }

      // Check permission status
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission as 'default' | 'granted' | 'denied');
      }

      // Initialize notification manager
      await notificationManager.init();

      // Load scheduled notifications
      const scheduled = localStorage.getItem('scheduledNotifications');
      if (scheduled) {
        setScheduledNotifications(JSON.parse(scheduled));
      }

      // Setup daily notification count reset
      resetDailyNotificationCount();

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize notification system:', error);
    }
  };

  // Update preferences and save to localStorage
  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem('notificationPreferences', JSON.stringify(updated));
    
    // Re-schedule notifications with new preferences
    if (permissionStatus === 'granted') {
      scheduleNotificationsBasedOnPreferences(updated);
    }
  }, [preferences, permissionStatus]);

  // Request notification permission
  const requestPermission = async () => {
    try {
      const granted = await notificationManager.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted) {
        await scheduleNotificationsBasedOnPreferences(preferences);
        
        // Show welcome notification
        await showToastNotification({
          id: 'permission-granted',
          type: 'success',
          title: 'Notifications Enabled! 🎉',
          message: 'You\'ll now receive helpful reminders to track your waste and celebrate achievements.',
          soundEffect: preferences.soundEnabled ? 'success' : undefined,
          duration: 5000
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  };

  // Schedule notifications based on user preferences
  const scheduleNotificationsBasedOnPreferences = async (prefs: NotificationPreferences) => {
    if (permissionStatus !== 'granted') return;

    // Clear existing scheduled notifications
    await clearAllScheduledNotifications();

    const newScheduled: ScheduledNotification[] = [];

    // Daily reminders
    if (prefs.dailyReminders) {
      newScheduled.push(...createDailyReminderNotifications(prefs));
    }

    // Weekly reports
    if (prefs.weeklyReports) {
      newScheduled.push(createWeeklyReportNotification(prefs));
    }

    // Challenge reminders
    if (prefs.challengeReminders) {
      newScheduled.push(...createChallengeNotifications(prefs));
    }

    // Schedule all notifications
    for (const notification of newScheduled) {
      await notificationManager.scheduleNotification(notification);
    }

    setScheduledNotifications(newScheduled);
    localStorage.setItem('scheduledNotifications', JSON.stringify(newScheduled));
  };

  // Create daily reminder notifications
  const createDailyReminderNotifications = (prefs: NotificationPreferences): ScheduledNotification[] => {
    const notifications: ScheduledNotification[] = [];
    const now = new Date();
    
    const reminderTimes = prefs.reminderFrequency === 'custom' 
      ? prefs.customTimes 
      : prefs.reminderFrequency === 'twice'
        ? [prefs.morningTime, prefs.eveningTime]
        : [prefs.morningTime];

    reminderTimes.forEach((timeStr, index) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (scheduledDate <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      const reminderMessages = [
        {
          title: 'Good morning! 🌱',
          body: 'Ready to track your waste and earn carbon credits today?'
        },
        {
          title: 'Evening check-in 🌙',
          body: 'Don\'t forget to log today\'s waste for Thailand\'s 2050 goal!'
        },
        {
          title: 'Waste tracking reminder 📝',
          body: 'Take a moment to record your environmental impact!'
        }
      ];

      const message = reminderMessages[Math.min(index, reminderMessages.length - 1)];

      notifications.push({
        id: `daily-reminder-${index}`,
        ...message,
        scheduledFor: scheduledDate,
        recurring: 'daily',
        requiresPermission: true,
        conditions: { hasEntryToday: false },
        tag: 'daily-reminder',
        data: {
          soundEffect: prefs.reminderSounds ? 'gentle-chime' : undefined,
          url: '/diary/quick-start'
        }
      });
    });

    return notifications;
  };

  // Create weekly report notification
  const createWeeklyReportNotification = (prefs: NotificationPreferences): ScheduledNotification => {
    const dayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const targetDay = dayMap[prefs.weeklyReportDay as keyof typeof dayMap];
    const [hours, minutes] = prefs.weeklyReportTime.split(':').map(Number);
    
    const now = new Date();
    const scheduledDate = new Date();
    const currentDay = scheduledDate.getDay();
    
    // Calculate days until target day
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    if (daysUntilTarget === 0 && scheduledDate.getHours() * 60 + scheduledDate.getMinutes() >= hours * 60 + minutes) {
      scheduledDate.setDate(scheduledDate.getDate() + 7); // Next week
    } else {
      scheduledDate.setDate(scheduledDate.getDate() + daysUntilTarget);
    }
    
    scheduledDate.setHours(hours, minutes, 0, 0);

    return {
      id: 'weekly-report',
      title: 'Weekly Impact Report 📊',
      body: 'Check out your environmental impact this week! See how many trees you\'ve saved.',
      scheduledFor: scheduledDate,
      recurring: 'weekly',
      requiresPermission: true,
      tag: 'weekly-report',
      data: {
        soundEffect: prefs.achievementSounds ? 'achievement' : undefined,
        url: '/diary/history'
      }
    };
  };

  // Create challenge notifications
  const createChallengeNotifications = (prefs: NotificationPreferences): ScheduledNotification[] => {
    const challenges = [
      {
        id: 'morning-challenge',
        title: 'Daily Challenge 🎯',
        body: 'Can you track 5 waste items today? Let\'s make a difference!',
        hour: 10
      },
      {
        id: 'recycle-challenge',
        title: 'Recycling Challenge 🔄',
        body: 'Try to recycle something today instead of throwing it away!',
        hour: 14
      },
      {
        id: 'plastic-challenge',
        title: 'Plastic-Free Hour 🚫',
        body: 'Challenge: Avoid single-use plastics for the next hour!',
        hour: 16
      }
    ];

    return challenges.map(challenge => {
      const scheduledDate = new Date();
      scheduledDate.setHours(challenge.hour, 0, 0, 0);
      
      if (scheduledDate <= new Date()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      return {
        id: challenge.id,
        title: challenge.title,
        body: challenge.body,
        scheduledFor: scheduledDate,
        recurring: 'daily',
        requiresPermission: true,
        tag: 'challenge',
        conditions: { hasEntryToday: false },
        data: {
          soundEffect: prefs.challengeNotifications && prefs.soundEnabled ? 'challenge' : undefined,
          url: '/diary'
        }
      };
    });
  };

  // Show achievement notification
  const showAchievementNotification = useCallback(async (achievement: any) => {
    if (!preferences.achievementNotifications || !canSendNotification()) return;

    // Browser notification
    if (permissionStatus === 'granted') {
      await notificationManager.showNotification({
        id: `achievement-${achievement.id}`,
        title: achievement.title,
        body: achievement.description,
        requiresPermission: true,
        tag: 'achievement',
        data: {
          soundEffect: preferences.achievementSounds ? 'achievement' : undefined,
          url: '/diary'
        }
      });
    }

    // In-app toast notification
    await showToastNotification({
      id: `toast-achievement-${achievement.id}`,
      type: 'achievement',
      title: achievement.title,
      message: achievement.description,
      soundEffect: preferences.achievementSounds ? 'achievement' : undefined,
      duration: 8000,
      actions: [
        {
          label: 'Celebrate! 🎉',
          action: () => playSound('celebrate'),
          style: 'primary'
        },
        {
          label: 'Share',
          action: () => {
            // Implement share functionality
            console.log('Share achievement:', achievement);
          },
          style: 'secondary'
        }
      ]
    });

    incrementNotificationCount();
  }, [preferences, permissionStatus]);

  // Show streak notification
  const showStreakNotification = useCallback(async (streak: number) => {
    if (!preferences.streakReminders || !canSendNotification()) return;

    const messages = {
      3: { title: 'Amazing streak! 🔥', body: '3 days in a row! You\'re building a great habit!' },
      7: { title: 'Week warrior! 💪', body: 'One full week of waste tracking! You\'re making a difference!' },
      14: { title: 'Two weeks strong! 🌟', body: 'Your dedication is paying off for the environment!' },
      30: { title: 'Monthly master! 🏆', body: '30 days of consistent tracking! You\'re a sustainability champion!' },
      100: { title: 'Legendary tracker! 👑', body: '100 days! You\'re leading Thailand towards carbon neutrality!' }
    };

    const message = messages[streak as keyof typeof messages];
    if (!message) return;

    await showToastNotification({
      id: `streak-${streak}`,
      type: 'achievement',
      title: message.title,
      message: message.body,
      soundEffect: preferences.achievementSounds ? 'streak' : undefined,
      duration: 6000
    });

    incrementNotificationCount();
  }, [preferences]);

  // Show level up notification
  const showLevelUpNotification = useCallback(async (newLevel: number, levelName: string) => {
    if (!preferences.levelUpNotifications || !canSendNotification()) return;

    await showToastNotification({
      id: `level-up-${newLevel}`,
      type: 'achievement',
      title: `Level Up! 🎊`,
      message: `Congratulations! You've reached ${levelName} (Level ${newLevel})!`,
      soundEffect: preferences.achievementSounds ? 'level-up' : undefined,
      duration: 8000,
      actions: [
        {
          label: 'View Progress',
          action: () => {
            // Scroll to gamification panel or navigate
            window.location.hash = '#gamification';
          },
          style: 'primary'
        }
      ]
    });

    incrementNotificationCount();
  }, [preferences]);

  // Show toast notification
  const showToastNotification = useCallback(async (notification: ToastNotification) => {
    if (onToast) {
      onToast(notification);
    } else {
      setToastQueue(prev => [...prev, notification]);
    }

    // Play sound effect if enabled
    if (notification.soundEffect && preferences.soundEnabled) {
      await playSound(notification.soundEffect);
    }
  }, [onToast, preferences.soundEnabled]);

  // Play sound effect
  const playSound = useCallback(async (soundName: string) => {
    if (!preferences.soundEnabled) return;

    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      // Map sound names to file paths
      const soundMap = {
        'success': '/sounds/success.mp3',
        'achievement': '/sounds/achievement.mp3',
        'level-up': '/sounds/level-up.mp3',
        'streak': '/sounds/streak.mp3',
        'celebrate': '/sounds/celebrate.mp3',
        'challenge': '/sounds/challenge.mp3',
        'gentle-chime': '/sounds/gentle-chime.mp3'
      };

      const soundPath = soundMap[soundName as keyof typeof soundMap];
      if (soundPath) {
        audioRef.current.src = soundPath;
        audioRef.current.volume = 0.6; // Moderate volume
        await audioRef.current.play();
      }
    } catch (error) {
      console.log('Could not play sound:', error);
      // Silently fail - sounds are optional
    }
  }, [preferences.soundEnabled]);

  // Check if we can send more notifications today
  const canSendNotification = useCallback((): boolean => {
    if (notificationCountRef.current >= preferences.maxNotificationsPerDay) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHoursEnabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
      const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
      
      const quietStart = startHour * 60 + startMin;
      const quietEnd = endHour * 60 + endMin;

      // Handle overnight quiet hours (e.g., 22:00 - 08:00)
      if (quietStart > quietEnd) {
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return false;
        }
      } else {
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return false;
        }
      }
    }

    return true;
  }, [preferences]);

  // Increment daily notification count
  const incrementNotificationCount = () => {
    notificationCountRef.current += 1;
  };

  // Reset daily notification count
  const resetDailyNotificationCount = () => {
    const lastReset = localStorage.getItem('lastNotificationReset');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      notificationCountRef.current = 0;
      localStorage.setItem('lastNotificationReset', today);
    } else {
      const savedCount = localStorage.getItem('dailyNotificationCount');
      notificationCountRef.current = savedCount ? parseInt(savedCount) : 0;
    }

    // Save count periodically
    const saveCount = () => {
      localStorage.setItem('dailyNotificationCount', notificationCountRef.current.toString());
    };

    setInterval(saveCount, 60000); // Save every minute
  };

  // Clear all scheduled notifications
  const clearAllScheduledNotifications = async () => {
    setScheduledNotifications([]);
    localStorage.removeItem('scheduledNotifications');
    
    // Also clear from notification manager
    // Note: This is a simplified version - a full implementation would track and cancel specific timeouts
  };

  // Test notification functionality
  const testNotification = async () => {
    await showToastNotification({
      id: 'test-notification',
      type: 'info',
      title: 'Test Notification 🧪',
      message: 'This is how your notifications will look and sound!',
      soundEffect: preferences.soundEnabled ? 'gentle-chime' : undefined,
      duration: 4000,
      actions: [
        {
          label: 'Sounds Great!',
          action: () => playSound('success'),
          style: 'primary'
        }
      ]
    });
  };

  // Export functions for use by parent components
  const notificationFunctions = {
    showAchievementNotification,
    showStreakNotification,
    showLevelUpNotification,
    showToastNotification,
    testNotification,
    requestPermission,
    updatePreferences,
    playSound
  };

  // Return the notification system context and UI
  return (
    <div className="notification-system">
      {children && 
        typeof children === 'function' 
          ? children(notificationFunctions)
          : children
      }
      
      {/* Toast notifications display (if not handled by parent) */}
      {!onToast && toastQueue.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toastQueue.map(toast => (
            <ToastNotificationComponent 
              key={toast.id}
              notification={toast}
              onClose={(id) => setToastQueue(prev => prev.filter(t => t.id !== id))}
            />
          ))}
        </div>
      )}
      
      {/* Hidden audio element for sound effects */}
      <audio ref={audioRef} preload="none" />
    </div>
  );
}

// Toast notification component
interface ToastNotificationComponentProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

function ToastNotificationComponent({ notification, onClose }: ToastNotificationComponentProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = notification.duration || 5000;
    
    // Progress bar animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    // Auto close timer
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300); // Wait for animation
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(closeTimer);
    };
  }, [notification.duration, notification.id, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    achievement: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800'
  };

  const typeIcons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    achievement: '🏆'
  };

  return (
    <div className={`
      transform transition-all duration-300 ease-out max-w-sm w-full
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        relative rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm
        ${typeStyles[notification.type]}
      `}>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-current opacity-30 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {typeIcons[notification.type]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-handwritten text-lg font-semibold mb-1">
              {notification.title}
            </div>
            <div className="font-sketch text-sm opacity-90 leading-relaxed">
              {notification.message}
            </div>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`
                      px-3 py-1 rounded text-sm font-sketch transition-colors
                      ${action.style === 'primary' 
                        ? 'bg-current text-white opacity-90 hover:opacity-100' 
                        : 'bg-white/50 hover:bg-white/70'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(notification.id), 300);
            }}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// Export notification functions hook
export function useNotificationSystem() {
  // This would be implemented with React Context in a full implementation
  // For now, return the notification manager functions
  return {
    showAchievementNotification: async (achievement: any) => {
      // Implementation would be provided by NotificationSystem context
    },
    showStreakNotification: async (streak: number) => {
      // Implementation would be provided by NotificationSystem context  
    },
    showLevelUpNotification: async (level: number, name: string) => {
      // Implementation would be provided by NotificationSystem context
    },
    testNotification: async () => {
      // Implementation would be provided by NotificationSystem context
    }
  };
}