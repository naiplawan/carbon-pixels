/**
 * Push notification system for Thailand Waste Diary
 * Daily reminders and achievement notifications in Thai/English
 */

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: NotificationAction[]
  tag?: string
  requireInteraction?: boolean
}

interface ThaiNotification {
  thai: string
  english: string
}

interface NotificationTemplate {
  title: ThaiNotification
  body: ThaiNotification
  icon: string
  tag: string
  data: any
}

class PushNotificationManager {
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  // Thai notification templates
  private templates: Record<string, NotificationTemplate> = {
    dailyReminder: {
      title: {
        thai: '🌱 เวลาบันทึกขยะประจำวัน!',
        english: '🌱 Time to log your daily waste!'
      },
      body: {
        thai: 'มาช่วยกันบรรลุเป้าหมายคาร์บอนนิวทรัลของไทยในปี 2050 กันเถอะ!',
        english: 'Let\'s help Thailand achieve carbon neutrality by 2050!'
      },
      icon: '/icons/notification-daily.png',
      tag: 'daily-reminder',
      data: { type: 'daily-reminder', action: 'open-diary' }
    },

    achievementUnlocked: {
      title: {
        thai: '🏆 ปลดล็อกความสำเร็จแล้ว!',
        english: '🏆 Achievement Unlocked!'
      },
      body: {
        thai: 'คุณได้รับรางวัลใหม่สำหรับการช่วยสิ่งแวดล้อม!',
        english: 'You\'ve earned a new reward for helping the environment!'
      },
      icon: '/icons/notification-achievement.png',
      tag: 'achievement',
      data: { type: 'achievement', action: 'view-achievements' }
    },

    weeklyReport: {
      title: {
        thai: '📊 รายงานสัปดาห์ของคุณพร้อมแล้ว',
        english: '📊 Your Weekly Report is Ready'
      },
      body: {
        thai: 'ดูว่าคุณช่วยลดคาร์บอนได้เท่าไหร่ในสัปดาห์ที่ผ่านมา',
        english: 'See how much carbon you\'ve saved this week'
      },
      icon: '/icons/notification-report.png',
      tag: 'weekly-report',
      data: { type: 'weekly-report', action: 'view-stats' }
    },

    streakReminder: {
      title: {
        thai: '🔥 รักษา Streak ของคุณ!',
        english: '🔥 Keep Your Streak Going!'
      },
      body: {
        thai: 'คุณบันทึกขยะมาแล้ว X วันติดต่อกัน อย่าให้ขาดนะ!',
        english: 'You\'ve logged waste for X days straight. Don\'t break it!'
      },
      icon: '/icons/notification-streak.png',
      tag: 'streak-reminder',
      data: { type: 'streak-reminder', action: 'open-diary' }
    },

    levelUp: {
      title: {
        thai: '⭐ เลเวลอัพแล้ว!',
        english: '⭐ Level Up!'
      },
      body: {
        thai: 'ขอแสดงความยินดี! คุณขึ้นเป็น Green Warrior แล้ว',
        english: 'Congratulations! You\'re now a Green Warrior'
      },
      icon: '/icons/notification-levelup.png',
      tag: 'level-up',
      data: { type: 'level-up', action: 'view-profile' }
    },

    treesSaved: {
      title: {
        thai: '🌳 คุณช่วยกอบกู้ต้นไม้แล้ว!',
        english: '🌳 You\'ve Saved Trees!'
      },
      body: {
        thai: 'การกระทำของคุณช่วยรักษาต้นไม้ X ต้นแล้วเลย!',
        english: 'Your actions have saved the equivalent of X trees!'
      },
      icon: '/icons/notification-trees.png',
      tag: 'trees-saved',
      data: { type: 'trees-saved', action: 'view-impact' }
    }
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[Notifications] Service workers not supported')
      return
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.ready
      console.log('[Notifications] Service worker ready')
    } catch (error) {
      console.error('[Notifications] Failed to get service worker:', error)
    }
  }

  /**
   * Request permission for notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[Notifications] Not supported in this browser')
      return 'denied'
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    console.log('[Notifications] Permission:', permission)
    return permission
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration || !this.vapidPublicKey) {
      console.error('[Notifications] Service worker or VAPID key not available')
      return null
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      this.subscription = subscription
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)
      
      console.log('[Notifications] Successfully subscribed to push notifications')
      return subscription
    } catch (error) {
      console.error('[Notifications] Failed to subscribe to push notifications:', error)
      return null
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.subscription) {
      const existingSubscription = await this.getExistingSubscription()
      if (!existingSubscription) {
        return true // Already unsubscribed
      }
      this.subscription = existingSubscription
    }

    try {
      await this.subscription.unsubscribe()
      
      // Remove from server
      await this.removeSubscriptionFromServer()
      
      this.subscription = null
      console.log('[Notifications] Successfully unsubscribed')
      return true
    } catch (error) {
      console.error('[Notifications] Failed to unsubscribe:', error)
      return false
    }
  }

  /**
   * Get existing push subscription
   */
  async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      await this.init()
      if (!this.serviceWorkerRegistration) return null
    }

    return await this.serviceWorkerRegistration.pushManager.getSubscription()
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    if (!('Notification' in window)) return false
    
    const permission = Notification.permission
    const subscription = await this.getExistingSubscription()
    
    return permission === 'granted' && subscription !== null
  }

  /**
   * Show local notification (for testing or immediate feedback)
   */
  async showLocalNotification(
    templateKey: string, 
    customData: Record<string, any> = {},
    preferThai = true
  ): Promise<void> {
    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.log('[Notifications] Permission not granted')
      return
    }

    const template = this.templates[templateKey]
    if (!template) {
      console.error(`[Notifications] Template ${templateKey} not found`)
      return
    }

    const title = preferThai ? template.title.thai : template.title.english
    let body = preferThai ? template.body.thai : template.body.english
    
    // Replace placeholders
    Object.entries(customData).forEach(([key, value]) => {
      body = body.replace(new RegExp(`X|{${key}}`, 'g'), String(value))
    })

    const notificationOptions: NotificationOptions = {
      body,
      icon: template.icon,
      badge: '/icons/badge-72x72.png',
      data: { ...template.data, ...customData },
      tag: template.tag,
      requireInteraction: templateKey === 'achievementUnlocked',
      actions: this.getNotificationActions(templateKey, preferThai)
    }

    try {
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(title, notificationOptions)
      } else {
        new Notification(title, notificationOptions)
      }
    } catch (error) {
      console.error('[Notifications] Failed to show notification:', error)
    }
  }

  /**
   * Schedule daily reminders
   */
  async scheduleDailyReminder(hour = 19, minute = 0): Promise<void> {
    // This would typically be handled by the server
    // For client-side, we can only suggest good times
    const reminderData = {
      type: 'schedule-daily-reminder',
      hour,
      minute,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    try {
      await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData)
      })

      console.log(`[Notifications] Daily reminder scheduled for ${hour}:${String(minute).padStart(2, '0')}`)
    } catch (error) {
      console.error('[Notifications] Failed to schedule daily reminder:', error)
    }
  }

  /**
   * Send achievement notification
   */
  async notifyAchievement(achievementName: string, preferThai = true): Promise<void> {
    await this.showLocalNotification('achievementUnlocked', { achievement: achievementName }, preferThai)
  }

  /**
   * Send level up notification
   */
  async notifyLevelUp(newLevel: string, preferThai = true): Promise<void> {
    await this.showLocalNotification('levelUp', { level: newLevel }, preferThai)
  }

  /**
   * Send trees saved notification
   */
  async notifyTreesSaved(count: number, preferThai = true): Promise<void> {
    await this.showLocalNotification('treesSaved', { count }, preferThai)
  }

  /**
   * Send streak reminder
   */
  async notifyStreak(days: number, preferThai = true): Promise<void> {
    await this.showLocalNotification('streakReminder', { days }, preferThai)
  }

  // Private helper methods
  private getNotificationActions(templateKey: string, preferThai: boolean): NotificationAction[] {
    const actions = {
      dailyReminder: [
        {
          action: 'open-diary',
          title: preferThai ? 'บันทึกขยะ' : 'Log Waste'
        },
        {
          action: 'quick-scan',
          title: preferThai ? 'สแกนเร็ว' : 'Quick Scan'
        }
      ],
      achievementUnlocked: [
        {
          action: 'view-achievements',
          title: preferThai ? 'ดูรางวัล' : 'View Rewards'
        },
        {
          action: 'share-achievement',
          title: preferThai ? 'แชร์' : 'Share'
        }
      ],
      weeklyReport: [
        {
          action: 'view-stats',
          title: preferThai ? 'ดูสถิติ' : 'View Stats'
        }
      ],
      default: [
        {
          action: 'open-app',
          title: preferThai ? 'เปิดแอป' : 'Open App'
        }
      ]
    }

    return actions[templateKey as keyof typeof actions] || actions.default
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        })
      })
    } catch (error) {
      console.error('[Notifications] Failed to send subscription to server:', error)
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: this.subscription?.endpoint
        })
      })
    } catch (error) {
      console.error('[Notifications] Failed to remove subscription from server:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }
}

// Singleton instance
export const pushNotifications = new PushNotificationManager()

// React hook for push notifications
import { useEffect, useState } from 'react'

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const initNotifications = async () => {
      await pushNotifications.init()
      
      if ('Notification' in window) {
        setPermission(Notification.permission)
        
        const subscription = await pushNotifications.getExistingSubscription()
        setIsSubscribed(subscription !== null)
      }
    }

    initNotifications()
  }, [])

  const enableNotifications = async () => {
    setIsLoading(true)
    
    try {
      const permission = await pushNotifications.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        const subscription = await pushNotifications.subscribeToPush()
        setIsSubscribed(subscription !== null)
        
        if (subscription) {
          // Schedule daily reminders
          await pushNotifications.scheduleDailyReminder()
        }
      }
    } catch (error) {
      console.error('[Notifications] Failed to enable:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const disableNotifications = async () => {
    setIsLoading(true)
    
    try {
      const success = await pushNotifications.unsubscribeFromPush()
      if (success) {
        setIsSubscribed(false)
      }
    } catch (error) {
      console.error('[Notifications] Failed to disable:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleReminder = async (hour: number, minute: number) => {
    if (isSubscribed) {
      await pushNotifications.scheduleDailyReminder(hour, minute)
    }
  }

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    enableNotifications,
    disableNotifications,
    scheduleReminder,
    notifyAchievement: pushNotifications.notifyAchievement.bind(pushNotifications),
    notifyLevelUp: pushNotifications.notifyLevelUp.bind(pushNotifications),
    notifyTreesSaved: pushNotifications.notifyTreesSaved.bind(pushNotifications),
    notifyStreak: pushNotifications.notifyStreak.bind(pushNotifications)
  }
}