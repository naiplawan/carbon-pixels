/**
 * Centralized Notification Service
 * Manages all types of notifications: browser, toast, achievements, sounds
 */

export interface NotificationPreferences {
  enabled: boolean;
  browserNotifications: boolean;
  toastNotifications: boolean;
  soundEffects: boolean;
  achievementNotifications: boolean;
  dailyReminders: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  title: string;
  message: string;
  duration?: number;
  icon?: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface AchievementNotification {
  id: string;
  name: string;
  description: string;
  icon: string;
  credits?: number;
}

class NotificationService {
  private preferences: NotificationPreferences;
  private toastQueue: ToastNotification[] = [];
  private activeToasts: Set<string> = new Set();
  private soundCache: Map<string, HTMLAudioElement> = new Map();
  private permissionStatus: NotificationPermission = 'default';

  // Default preferences
  private defaultPreferences: NotificationPreferences = {
    enabled: true,
    browserNotifications: true,
    toastNotifications: true,
    soundEffects: true,
    achievementNotifications: true,
    dailyReminders: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
  };

  constructor() {
    this.preferences = this.loadPreferences();
    this.initializeBrowserNotifications();
    this.initializeSounds();
  }

  // Preferences Management
  private loadPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') return this.defaultPreferences;

    try {
      const stored = localStorage.getItem('notification-preferences');
      return stored ? { ...this.defaultPreferences, ...JSON.parse(stored) } : this.defaultPreferences;
    } catch {
      return this.defaultPreferences;
    }
  }

  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Browser Notifications
  private async initializeBrowserNotifications(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    this.permissionStatus = Notification.permission;
  }

  async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    if (this.permissionStatus === 'granted') return true;

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  private canSendBrowserNotification(): boolean {
    return (
      this.preferences.enabled &&
      this.preferences.browserNotifications &&
      this.permissionStatus === 'granted' &&
      !this.isQuietHours() &&
      typeof window !== 'undefined'
    );
  }

  private sendBrowserNotification(title: string, options: NotificationOptions = {}): void {
    if (!this.canSendBrowserNotification()) return;

    try {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    } catch (error) {
      console.warn('Failed to send browser notification:', error);
    }
  }

  // Toast Notifications
  showToast(toast: Omit<ToastNotification, 'id'>): string {
    if (!this.preferences.enabled || !this.preferences.toastNotifications) {
      return '';
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullToast: ToastNotification = {
      ...toast,
      id,
      duration: toast.duration ?? this.getDefaultDuration(toast.type),
    };

    this.toastQueue.push(fullToast);
    this.activeToasts.add(id);

    // Dispatch custom event for toast components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification-toast', {
        detail: fullToast
      }));
    }

    // Auto-remove after duration
    if (fullToast.duration && fullToast.duration > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, fullToast.duration);
    }

    return id;
  }

  dismissToast(id: string): void {
    this.activeToasts.delete(id);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification-toast-dismiss', {
        detail: { id }
      }));
    }
  }

  private getDefaultDuration(type: ToastNotification['type']): number {
    const durations = {
      success: 4000,
      error: 6000,
      warning: 5000,
      info: 4000,
      achievement: 6000,
    };
    return durations[type] || 4000;
  }

  // Achievement Notifications
  showAchievement(achievement: AchievementNotification): void {
    if (!this.preferences.enabled || !this.preferences.achievementNotifications) {
      return;
    }

    // Show as toast
    this.showToast({
      type: 'achievement',
      title: 'Achievement Unlocked! 🎉',
      message: `${achievement.name}: ${achievement.description}`,
      icon: achievement.icon,
      duration: 6000,
    });

    // Browser notification
    this.sendBrowserNotification('Achievement Unlocked! 🎉', {
      body: `${achievement.name}: ${achievement.description}`,
      tag: `achievement-${achievement.id}`,
    });

    // Achievement sound
    this.playSound('achievement');
  }

  // Quick notification methods
  showSuccess(message: string, title: string = 'Success'): string {
    this.playSound('success');
    return this.showToast({ type: 'success', title, message });
  }

  showError(message: string, title: string = 'Error'): string {
    this.playSound('error');
    return this.showToast({ type: 'error', title, message });
  }

  showWarning(message: string, title: string = 'Warning'): string {
    return this.showToast({ type: 'warning', title, message });
  }

  showInfo(message: string, title: string = 'Info'): string {
    return this.showToast({ type: 'info', title, message });
  }

  // Sound Effects
  private initializeSounds(): void {
    if (typeof window === 'undefined') return;

    const sounds = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      achievement: '/sounds/achievement.mp3',
      notification: '/sounds/notification.mp3',
    };

    Object.entries(sounds).forEach(([key, url]) => {
      try {
        const audio = new Audio(url);
        audio.preload = 'metadata';
        this.soundCache.set(key, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${key}`, error);
      }
    });
  }

  private playSound(type: string): void {
    if (!this.preferences.enabled || !this.preferences.soundEffects || this.isQuietHours()) {
      return;
    }

    const audio = this.soundCache.get(type);
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.volume = 0.3;
        audio.play().catch(error => {
          console.warn(`Failed to play sound: ${type}`, error);
        });
      } catch (error) {
        console.warn(`Failed to play sound: ${type}`, error);
      }
    }
  }

  // Utility Methods
  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  // Daily Reminders
  scheduleDailyReminder(): void {
    if (!this.preferences.enabled || !this.preferences.dailyReminders) {
      return;
    }

    // Schedule reminder for 6 PM if user hasn't logged waste today
    const now = new Date();
    const reminderTime = new Date(now);
    reminderTime.setHours(18, 0, 0, 0);

    if (reminderTime > now) {
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.sendBrowserNotification('Daily Waste Tracking Reminder', {
          body: 'Don\'t forget to log your waste today! 🌱',
          tag: 'daily-reminder',
        });
      }, timeUntilReminder);
    }
  }

  // Cleanup
  dispose(): void {
    this.soundCache.clear();
    this.toastQueue = [];
    this.activeToasts.clear();
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// React Hook
import { useState, useEffect } from 'react';

export function useNotifications() {
  const [preferences, setPreferences] = useState(notificationService.getPreferences());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const updatePreferences = (newPrefs: Partial<NotificationPreferences>) => {
    notificationService.updatePreferences(newPrefs);
    setPreferences(notificationService.getPreferences());
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestBrowserPermission();
    setPermissionStatus(Notification.permission);
    return granted;
  };

  return {
    preferences,
    updatePreferences,
    permissionStatus,
    requestPermission,
    showSuccess: notificationService.showSuccess.bind(notificationService),
    showError: notificationService.showError.bind(notificationService),
    showWarning: notificationService.showWarning.bind(notificationService),
    showInfo: notificationService.showInfo.bind(notificationService),
    showAchievement: notificationService.showAchievement.bind(notificationService),
    showToast: notificationService.showToast.bind(notificationService),
    dismissToast: notificationService.dismissToast.bind(notificationService),
  };
}