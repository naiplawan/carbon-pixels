'use client';

import { useState, useEffect } from 'react';
import { notificationManager, type ScheduledNotification } from '@/lib/notifications';

export interface NotificationPreferences {
  dailyReminders: boolean;
  morningTime: string;
  eveningTime: string;
  achievementNotifications: boolean;
  streakReminders: boolean;
  weeklyReports: boolean;
  milestoneAlerts: boolean;
}

export default function NotificationManager() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyReminders: true,
    morningTime: '09:00',
    eveningTime: '19:00',
    achievementNotifications: true,
    streakReminders: true,
    weeklyReports: false,
    milestoneAlerts: true,
  });
  
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    // Check current permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | string) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
    
    // Update scheduled notifications based on new preferences
    updateNotificationSchedule(newPreferences);
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await notificationManager.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted) {
        // Schedule default notifications
        await setupNotifications(preferences);
        
        // Show test notification
        await notificationManager.showNotification({
          id: 'welcome',
          title: 'Notifications enabled! 🌱',
          body: 'You\'ll now receive helpful reminders to track your waste.',
          requiresPermission: false
        });
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupNotifications = async (prefs: NotificationPreferences) => {
    if (permissionStatus !== 'granted') return;

    // Clear existing notifications first
    await clearScheduledNotifications();

    if (prefs.dailyReminders) {
      // Schedule morning reminder
      const morningTime = prefs.morningTime.split(':');
      const morningDate = new Date();
      morningDate.setHours(parseInt(morningTime[0]), parseInt(morningTime[1]), 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (morningDate <= new Date()) {
        morningDate.setDate(morningDate.getDate() + 1);
      }

      notificationManager.scheduleNotification({
        id: 'morning-reminder',
        title: 'Good morning! 🌱',
        body: 'Ready to track your waste and earn carbon credits today?',
        scheduledFor: morningDate,
        recurring: 'daily',
        requiresPermission: true,
        conditions: { hasEntryToday: false },
        tag: 'daily-reminder'
      });

      // Schedule evening reminder
      const eveningTime = prefs.eveningTime.split(':');
      const eveningDate = new Date();
      eveningDate.setHours(parseInt(eveningTime[0]), parseInt(eveningTime[1]), 0, 0);
      
      if (eveningDate <= new Date()) {
        eveningDate.setDate(eveningDate.getDate() + 1);
      }

      notificationManager.scheduleNotification({
        id: 'evening-reminder',
        title: 'Evening check-in 🌙',
        body: 'Don\'t forget to log today\'s waste for Thailand\'s 2050 goal!',
        scheduledFor: eveningDate,
        recurring: 'daily',
        requiresPermission: true,
        conditions: { hasEntryToday: false },
        tag: 'daily-reminder'
      });
    }

    if (prefs.weeklyReports) {
      // Schedule weekly report every Sunday at 10 AM
      const weeklyDate = new Date();
      weeklyDate.setDate(weeklyDate.getDate() + (7 - weeklyDate.getDay())); // Next Sunday
      weeklyDate.setHours(10, 0, 0, 0);

      notificationManager.scheduleNotification({
        id: 'weekly-report',
        title: 'Weekly Impact Report 📊',
        body: 'Check out your environmental impact this week!',
        scheduledFor: weeklyDate,
        recurring: 'weekly',
        requiresPermission: true,
        tag: 'weekly-report'
      });
    }
  };

  const updateNotificationSchedule = async (prefs: NotificationPreferences) => {
    if (permissionStatus === 'granted') {
      await setupNotifications(prefs);
    }
  };

  const clearScheduledNotifications = async () => {
    // This would clear all scheduled notifications
    // For now, we'll just clear them from our local storage
    localStorage.removeItem('scheduledNotifications');
  };

  const testNotification = async () => {
    await notificationManager.showNotification({
      id: 'test',
      title: 'Test Notification 🧪',
      body: 'This is how your notifications will look!',
      requiresPermission: true
    });
  };

  if (permissionStatus === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <span className="text-red-500 text-xl mr-2">🚫</span>
          <h3 className="text-red-800 font-semibold">Notifications Blocked</h3>
        </div>
        <p className="text-red-700 text-sm mb-3">
          Notifications are currently blocked. To enable them, please update your browser settings.
        </p>
        <div className="text-xs text-red-600">
          <strong>Chrome/Edge:</strong> Click the 🔒 icon in your address bar → Site Settings → Notifications → Allow<br />
          <strong>Firefox:</strong> Click the 🛡️ icon → Permissions → Allow Notifications<br />
          <strong>Safari:</strong> Safari menu → Preferences → Websites → Notifications → Allow
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🔔</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Notification Settings</h3>
            <p className="text-sm text-gray-600">Stay motivated with helpful reminders</p>
          </div>
        </div>
        
        {permissionStatus === 'default' && (
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="bg-green-leaf text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Setting up...' : 'Enable Notifications'}
          </button>
        )}
        
        {permissionStatus === 'granted' && (
          <button
            onClick={testNotification}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Test
          </button>
        )}
      </div>

      {permissionStatus === 'granted' && (
        <div className="space-y-4">
          {/* Daily Reminders */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-800">Daily Reminders</label>
              <p className="text-sm text-gray-600">Get reminded to track your waste</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.dailyReminders}
                onChange={(e) => handlePreferenceChange('dailyReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-leaf"></div>
            </label>
          </div>

          {preferences.dailyReminders && (
            <div className="ml-4 space-y-3">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Morning reminder</label>
                  <input
                    type="time"
                    value={preferences.morningTime}
                    onChange={(e) => handlePreferenceChange('morningTime', e.target.value)}
                    className="block mt-1 border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-green-leaf focus:border-green-leaf"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Evening reminder</label>
                  <input
                    type="time"
                    value={preferences.eveningTime}
                    onChange={(e) => handlePreferenceChange('eveningTime', e.target.value)}
                    className="block mt-1 border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-green-leaf focus:border-green-leaf"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Achievement Notifications */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-800">Achievement Alerts</label>
              <p className="text-sm text-gray-600">Celebrate your milestones</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.achievementNotifications}
                onChange={(e) => handlePreferenceChange('achievementNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-leaf"></div>
            </label>
          </div>

          {/* Streak Reminders */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-800">Streak Reminders</label>
              <p className="text-sm text-gray-600">Keep your tracking streak alive</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.streakReminders}
                onChange={(e) => handlePreferenceChange('streakReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-leaf"></div>
            </label>
          </div>

          {/* Weekly Reports */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-800">Weekly Reports</label>
              <p className="text-sm text-gray-600">Sunday summary of your impact</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.weeklyReports}
                onChange={(e) => handlePreferenceChange('weeklyReports', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-leaf"></div>
            </label>
          </div>

          {/* Milestone Alerts */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-800">Milestone Alerts</label>
              <p className="text-sm text-gray-600">Trees saved, credit milestones</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.milestoneAlerts}
                onChange={(e) => handlePreferenceChange('milestoneAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-leaf"></div>
            </label>
          </div>
        </div>
      )}

      {permissionStatus === 'granted' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <span className="text-sm text-green-800">
              Notifications are enabled! We'll help you stay on track with your environmental goals.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}