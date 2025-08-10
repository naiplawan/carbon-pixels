export interface NotificationConfig {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requiresPermission?: boolean;
  data?: any;
}

export interface ScheduledNotification extends NotificationConfig {
  scheduledFor: Date;
  recurring?: 'daily' | 'weekly' | 'monthly';
  conditions?: {
    hasEntryToday?: boolean;
    streakCount?: number;
    creditThreshold?: number;
  };
}

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: ScheduledNotification[] = [];
  private permissionGranted = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private dailyNotificationCount = 0;
  private lastNotificationReset: string | null = null;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permissionGranted = permission === 'granted';
    return this.permissionGranted;
  }

  async showNotification(config: NotificationConfig): Promise<void> {
    if (!this.canSendNotification()) return;

    if (!this.permissionGranted && config.requiresPermission) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      // Play sound if specified
      if (config.data?.soundEffect) {
        this.playSound(config.data.soundEffect);
      }

      if (this.serviceWorkerRegistration) {
        // Use service worker for better notification handling
        await this.serviceWorkerRegistration.showNotification(config.title, {
          body: config.body,
          icon: config.icon || '/icons/icon-192x192.png',
          badge: config.badge || '/icons/badge-72x72.png',
          tag: config.tag,
          data: config.data,
          requireInteraction: config.data?.requireInteraction || false,
          vibrate: config.data?.vibrate || [200, 100, 200],
          actions: config.data?.actions || [
            {
              action: 'open',
              title: 'Open App',
              icon: '/icons/icon-72x72.png'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        } as NotificationOptions);
      } else {
        // Fallback to basic notifications
        new Notification(config.title, {
          body: config.body,
          icon: config.icon || '/icons/icon-192x192.png',
          tag: config.tag,
          data: config.data
        });
      }

      this.incrementDailyNotificationCount();
      console.log('[NotificationManager] Notification shown:', config.title);
    } catch (error) {
      console.error('[NotificationManager] Failed to show notification:', error);
    }
  }

  // Enhanced achievement notification
  async showAchievementNotification(achievement: {
    id: string;
    title: string;
    description: string;
    type?: 'milestone' | 'streak' | 'level' | 'tree' | 'general';
    credits?: number;
    level?: number;
    streak?: number;
  }): Promise<void> {
    const preferences = this.getStoredPreferences();
    
    if (!preferences.achievementNotifications) return;

    const config: NotificationConfig = {
      id: achievement.id,
      title: achievement.title,
      body: achievement.description,
      tag: 'achievement',
      requiresPermission: true,
      data: {
        type: 'achievement',
        achievement,
        url: '/diary',
        soundEffect: preferences.achievementSounds ? 'achievement' : undefined,
        requireInteraction: true,
        vibrate: [300, 200, 300, 200, 300],
        actions: [
          {
            action: 'celebrate',
            title: 'Celebrate! 🎉',
            icon: '/icons/celebrate.png'
          },
          {
            action: 'share',
            title: 'Share',
            icon: '/icons/share.png'
          },
          {
            action: 'continue',
            title: 'Continue',
            icon: '/icons/continue.png'
          }
        ]
      }
    };

    await this.showNotification(config);
  }

  // Enhanced streak notification
  async showStreakNotification(streak: number, customMessage?: string): Promise<void> {
    const preferences = this.getStoredPreferences();
    
    if (!preferences.streakReminders) return;

    // Use service worker for enhanced streak notification
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'SHOW_STREAK_NOTIFICATION',
        data: {
          streak,
          message: customMessage
        }
      });
    } else {
      // Fallback
      const config: NotificationConfig = {
        id: `streak-${streak}`,
        title: `${streak}-Day Streak! 🔥`,
        body: customMessage || `Amazing! You've tracked waste for ${streak} days in a row!`,
        tag: 'streak',
        requiresPermission: true,
        data: {
          soundEffect: preferences.achievementSounds ? 'streak' : undefined
        }
      };

      await this.showNotification(config);
    }
  }

  // Enhanced level up notification
  async showLevelUpNotification(level: number, levelName: string): Promise<void> {
    const preferences = this.getStoredPreferences();
    
    if (!preferences.levelUpNotifications) return;

    // Use service worker for enhanced level up notification
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'SHOW_LEVEL_UP_NOTIFICATION',
        data: {
          level,
          levelName
        }
      });
    } else {
      // Fallback
      const config: NotificationConfig = {
        id: `level-${level}`,
        title: 'Level Up! 🎊',
        body: `Congratulations! You've reached ${levelName} (Level ${level})!`,
        tag: 'level-up',
        requiresPermission: true,
        data: {
          soundEffect: preferences.achievementSounds ? 'level-up' : undefined
        }
      };

      await this.showNotification(config);
    }
  }

  // Weekly report notification
  async showWeeklyReportNotification(reportData: {
    weeklyCredits: number;
    treesSaved: number;
    co2Saved: number;
  }): Promise<void> {
    const preferences = this.getStoredPreferences();
    
    if (!preferences.weeklyReports) return;

    // Use service worker for enhanced weekly report
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'SHOW_WEEKLY_REPORT',
        data: reportData
      });
    } else {
      // Fallback
      const config: NotificationConfig = {
        id: 'weekly-report',
        title: 'Weekly Impact Report 📊',
        body: `This week: ${reportData.weeklyCredits} credits earned, ${reportData.treesSaved} trees saved! 🌳`,
        tag: 'weekly-report',
        requiresPermission: true,
        data: {
          soundEffect: preferences.achievementSounds ? 'achievement' : undefined
        }
      };

      await this.showNotification(config);
    }
  }

  // Update notification preferences
  updatePreferences(preferences: any): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    
    // Send to service worker
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'UPDATE_NOTIFICATION_PREFERENCES',
        data: preferences
      });
    }

    console.log('[NotificationManager] Preferences updated');
  }

  // Cancel all scheduled notifications
  cancelAllNotifications(): void {
    this.notifications = [];
    this.saveScheduledNotifications();
    
    // Cancel in service worker
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'CANCEL_ALL_NOTIFICATIONS'
      });
    }

    console.log('[NotificationManager] All notifications cancelled');
  }

  scheduleNotification(notification: ScheduledNotification): void {
    this.notifications.push(notification);
    this.saveScheduledNotifications();
    this.scheduleNextCheck();
  }

  private saveScheduledNotifications(): void {
    localStorage.setItem('scheduledNotifications', JSON.stringify(this.notifications));
  }

  private loadScheduledNotifications(): void {
    const saved = localStorage.getItem('scheduledNotifications');
    if (saved) {
      this.notifications = JSON.parse(saved).map((n: any) => ({
        ...n,
        scheduledFor: new Date(n.scheduledFor)
      }));
    }
  }

  private scheduleNextCheck(): void {
    const now = new Date();
    const nextNotification = this.notifications
      .filter(n => new Date(n.scheduledFor) > now)
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0];

    if (nextNotification) {
      const delay = new Date(nextNotification.scheduledFor).getTime() - now.getTime();
      setTimeout(() => this.checkAndSendNotifications(), delay);
    }
  }

  private async checkAndSendNotifications(): Promise<void> {
    const now = new Date();
    const dueNotifications = this.notifications.filter(n => new Date(n.scheduledFor) <= now);

    for (const notification of dueNotifications) {
      if (this.shouldSendNotification(notification)) {
        await this.showNotification(notification);
        
        if (notification.recurring) {
          this.rescheduleRecurringNotification(notification);
        }
      }
    }

    // Remove non-recurring notifications that have been sent
    this.notifications = this.notifications.filter(n => {
      const isDue = new Date(n.scheduledFor) <= now;
      return !isDue || n.recurring;
    });

    this.saveScheduledNotifications();
    this.scheduleNextCheck();
  }

  private shouldSendNotification(notification: ScheduledNotification): boolean {
    if (!notification.conditions) return true;

    const wasteEntries = JSON.parse(localStorage.getItem('wasteEntries') || '[]');
    const today = new Date().toDateString();
    
    if (notification.conditions.hasEntryToday !== undefined) {
      const hasEntryToday = wasteEntries.some((entry: any) => 
        new Date(entry.timestamp).toDateString() === today
      );
      if (notification.conditions.hasEntryToday !== hasEntryToday) return false;
    }

    if (notification.conditions.creditThreshold !== undefined) {
      const totalCredits = parseInt(localStorage.getItem('carbonCredits') || '0');
      if (totalCredits < notification.conditions.creditThreshold) return false;
    }

    return true;
  }

  private rescheduleRecurringNotification(notification: ScheduledNotification): void {
    const nextDate = new Date(notification.scheduledFor);
    
    switch (notification.recurring) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    notification.scheduledFor = nextDate;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize service worker registration
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        this.setupServiceWorkerMessageListener();
      }

      // Load existing data
      this.loadScheduledNotifications();
      this.resetDailyNotificationCountIfNeeded();
      
      // Check permission status
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
      }

      // Start notification checking
      await this.checkAndSendNotifications();
      this.setupDefaultNotifications();

      this.isInitialized = true;
      console.log('[NotificationManager] Initialized successfully');
    } catch (error) {
      console.error('[NotificationManager] Failed to initialize:', error);
    }
  }

  private setupServiceWorkerMessageListener(): void {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data || {};

      switch (type) {
        case 'REQUEST_NOTIFICATION_PREFERENCES':
          this.sendPreferencesToServiceWorker();
          break;
        case 'NOTIFICATION_CLICKED':
          this.handleNotificationClick(data);
          break;
        case 'TRIGGER_CELEBRATION':
          this.handleCelebrationTrigger(data);
          break;
        default:
          // Handle other message types
          break;
      }
    });
  }

  private sendPreferencesToServiceWorker(): void {
    const preferences = this.getStoredPreferences();
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.active?.postMessage({
        type: 'UPDATE_NOTIFICATION_PREFERENCES',
        data: preferences
      });
    }
  }

  private getStoredPreferences() {
    const defaultPreferences = {
      dailyReminders: true,
      achievementNotifications: true,
      streakReminders: true,
      levelUpNotifications: true,
      weeklyReports: true,
      challengeNotifications: true,
      soundEnabled: true,
      achievementSounds: true,
      reminderSounds: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      maxNotificationsPerDay: 5
    };

    const stored = localStorage.getItem('notificationPreferences');
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  }

  private handleNotificationClick(data: any): void {
    // Handle notification click events from service worker
    console.log('[NotificationManager] Notification clicked:', data);
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('notificationClick', { detail: data }));
  }

  private handleCelebrationTrigger(data: any): void {
    // Handle celebration triggers from service worker
    console.log('[NotificationManager] Celebration triggered:', data);
    if (data.soundEffect) {
      this.playSound(data.soundEffect);
    }
    // Emit custom event for celebration animations
    window.dispatchEvent(new CustomEvent('celebrationTrigger', { detail: data }));
  }

  private resetDailyNotificationCountIfNeeded(): void {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastNotificationReset');
    
    if (lastReset !== today) {
      this.dailyNotificationCount = 0;
      this.lastNotificationReset = today;
      localStorage.setItem('lastNotificationReset', today);
      localStorage.setItem('dailyNotificationCount', '0');
    } else {
      const savedCount = localStorage.getItem('dailyNotificationCount');
      this.dailyNotificationCount = savedCount ? parseInt(savedCount) : 0;
    }
  }

  private incrementDailyNotificationCount(): void {
    this.dailyNotificationCount += 1;
    localStorage.setItem('dailyNotificationCount', this.dailyNotificationCount.toString());
  }

  private canSendNotification(): boolean {
    const preferences = this.getStoredPreferences();
    
    // Check daily limit
    if (this.dailyNotificationCount >= preferences.maxNotificationsPerDay) {
      console.log('[NotificationManager] Daily notification limit reached');
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

      // Handle overnight quiet hours
      if (quietStart > quietEnd) {
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          console.log('[NotificationManager] Skipping notification due to quiet hours');
          return false;
        }
      } else {
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          console.log('[NotificationManager] Skipping notification due to quiet hours');
          return false;
        }
      }
    }

    return true;
  }

  private playSound(soundName: string): void {
    try {
      const audio = new Audio();
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
        audio.src = soundPath;
        audio.volume = 0.6;
        audio.play().catch(() => {
          // Silently fail - sound is optional
        });
      }
    } catch (error) {
      // Silently fail - sound is optional
    }
  }

  private setupDefaultNotifications(): void {
    const now = new Date();
    
    // Daily reminder at 9 AM if no entry today
    const morningReminder = new Date();
    morningReminder.setHours(9, 0, 0, 0);
    if (morningReminder <= now) {
      morningReminder.setDate(morningReminder.getDate() + 1);
    }

    // Evening reminder at 7 PM if no entry today
    const eveningReminder = new Date();
    eveningReminder.setHours(19, 0, 0, 0);
    if (eveningReminder <= now) {
      eveningReminder.setDate(eveningReminder.getDate() + 1);
    }

    const defaultNotifications: ScheduledNotification[] = [
      {
        id: 'morning-reminder',
        title: 'Good morning! 🌱',
        body: 'Ready to track your waste and earn carbon credits today?',
        scheduledFor: morningReminder,
        recurring: 'daily',
        requiresPermission: true,
        conditions: { hasEntryToday: false },
        tag: 'daily-reminder'
      },
      {
        id: 'evening-reminder',
        title: 'Evening check-in 🌙',
        body: "Don't forget to log today's waste for Thailand's 2050 goal!",
        scheduledFor: eveningReminder,
        recurring: 'daily',
        requiresPermission: true,
        conditions: { hasEntryToday: false },
        tag: 'daily-reminder'
      }
    ];

    // Only add if not already scheduled
    defaultNotifications.forEach(notification => {
      if (!this.notifications.some(n => n.id === notification.id)) {
        this.scheduleNotification(notification);
      }
    });
  }

  // Engagement notifications based on user behavior
  scheduleEngagementNotifications(): void {
    const totalCredits = parseInt(localStorage.getItem('carbonCredits') || '0');
    const wasteEntries = JSON.parse(localStorage.getItem('wasteEntries') || '[]');
    
    // Milestone celebrations
    if (totalCredits >= 500 && totalCredits < 600) {
      this.showNotification({
        id: 'first-tree',
        title: 'Congratulations! 🎉🌳',
        body: 'You\'ve saved your first tree equivalent! Keep going!',
        requiresPermission: true,
        tag: 'milestone'
      });
    }

    // Streak notifications
    const consecutiveDays = this.calculateStreak(wasteEntries);
    if (consecutiveDays === 3) {
      this.showNotification({
        id: 'three-day-streak',
        title: 'Amazing streak! 🔥',
        body: '3 days in a row! You\'re building a great habit!',
        requiresPermission: true,
        tag: 'streak'
      });
    }

    if (consecutiveDays === 7) {
      this.showNotification({
        id: 'week-streak',
        title: 'Week warrior! 💪',
        body: 'One full week of waste tracking! You\'re making a difference!',
        requiresPermission: true,
        tag: 'streak'
      });
    }
  }

  private calculateStreak(entries: any[]): number {
    if (entries.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasEntry = entries.some(entry => 
        new Date(entry.timestamp).toDateString() === dateString
      );
      
      if (hasEntry) {
        streak++;
      } else if (i === 0) {
        // If no entry today, check yesterday
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

export const notificationManager = NotificationManager.getInstance();