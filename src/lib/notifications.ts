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
    if (!this.permissionGranted && config.requiresPermission) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Use service worker for better notification handling
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(config.title, {
        body: config.body,
        icon: config.icon || '/icons/icon-192x192.png',
        badge: config.badge || '/icons/icon-72x72.png',
        tag: config.tag,
        data: config.data,
        actions: [
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

  init(): void {
    this.loadScheduledNotifications();
    this.checkAndSendNotifications();
    this.setupDefaultNotifications();
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