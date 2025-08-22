import { NotificationManager, type NotificationConfig, type ScheduledNotification } from '@/lib/notifications';

// Mock the global Notification API
const mockNotification = jest.fn();
global.Notification = mockNotification as any;
Object.defineProperty(global.Notification, 'permission', {
  value: 'default',
  writable: true,
  configurable: true
});
global.Notification.requestPermission = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({
      showNotification: jest.fn(),
      getNotifications: jest.fn().mockResolvedValue([]),
    }),
    register: jest.fn(),
  },
  writable: true,
});

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    notificationManager = NotificationManager.getInstance();
  });

  describe('Permission Management', () => {
    it('should request notification permission', async () => {
      global.Notification.requestPermission = jest.fn().mockResolvedValue('granted');
      
      const result = await notificationManager.requestPermission();
      
      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle denied permission', async () => {
      global.Notification.requestPermission = jest.fn().mockResolvedValue('denied');
      
      const result = await notificationManager.requestPermission();
      
      expect(result).toBe(false);
    });

    it('should return true if permission already granted', async () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true,
        configurable: true
      });
      
      const result = await notificationManager.requestPermission();
      
      expect(result).toBe(true);
      expect(global.Notification.requestPermission).not.toHaveBeenCalled();
    });
  });

  describe('Notification Display', () => {
    const mockConfig: NotificationConfig = {
      id: 'test-notification',
      title: 'Test Title',
      body: 'Test Body',
      requiresPermission: false,
    };

    it('should show notification using service worker when available', async () => {
      const mockShowNotification = jest.fn();
      (navigator.serviceWorker.ready as Promise<any>) = Promise.resolve({
        showNotification: mockShowNotification,
      });

      await notificationManager.showNotification(mockConfig);

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test Body',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        })
      );
    });

    it('should fall back to basic Notification API', async () => {
      // Mock service worker as unavailable
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
      });

      await notificationManager.showNotification(mockConfig);

      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/icons/icon-192x192.png',
        tag: undefined,
        data: undefined,
      });
    });

    it('should request permission when required', async () => {
      const configWithPermission: NotificationConfig = {
        ...mockConfig,
        requiresPermission: true,
      };
      
      Object.defineProperty(global.Notification, 'permission', {
        value: 'default',
        writable: true,
        configurable: true
      });
      global.Notification.requestPermission = jest.fn().mockResolvedValue('granted');

      await notificationManager.showNotification(configWithPermission);

      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('Scheduled Notifications', () => {
    it('should schedule a notification', () => {
      const scheduledNotification: ScheduledNotification = {
        id: 'scheduled-test',
        title: 'Scheduled Test',
        body: 'This is scheduled',
        scheduledFor: new Date(Date.now() + 60000), // 1 minute from now
        recurring: 'daily',
        requiresPermission: true,
      };

      notificationManager.scheduleNotification(scheduledNotification);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'scheduledNotifications',
        expect.stringContaining('scheduled-test')
      );
    });

    it('should load scheduled notifications from localStorage', () => {
      const savedNotifications = JSON.stringify([{
        id: 'saved-notification',
        title: 'Saved',
        body: 'From storage',
        scheduledFor: new Date().toISOString(),
      }]);
      
      mockLocalStorage.getItem.mockReturnValue(savedNotifications);

      notificationManager.init();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('scheduledNotifications');
    });
  });

  describe('Default Notifications Setup', () => {
    beforeEach(() => {
      // Mock Date.now to have predictable time
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01 08:00:00').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should setup morning and evening reminders', () => {
      notificationManager.init();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'scheduledNotifications',
        expect.stringContaining('morning-reminder')
      );
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'scheduledNotifications',
        expect.stringContaining('evening-reminder')
      );
    });
  });

  describe('Engagement Notifications', () => {
    beforeEach(() => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('2500') // totalCredits
        .mockReturnValueOnce(JSON.stringify([ // wasteEntries
          { timestamp: new Date().toISOString() },
          { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        ]));
    });

    it('should show milestone notification for first tree saved', async () => {
      const mockShowNotification = jest.spyOn(notificationManager, 'showNotification');
      
      mockLocalStorage.getItem
        .mockReturnValueOnce('520') // totalCredits - just over first tree
        .mockReturnValueOnce('[]'); // wasteEntries

      notificationManager.scheduleEngagementNotifications();

      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'first-tree',
          title: expect.stringContaining('tree'),
        })
      );
    });

    it('should show streak notification for 3-day streak', async () => {
      const mockShowNotification = jest.spyOn(notificationManager, 'showNotification');
      
      // Setup 3 consecutive days of entries
      const entries = [
        { timestamp: new Date().toISOString() },
        { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      ];
      
      mockLocalStorage.getItem
        .mockReturnValueOnce('300')
        .mockReturnValueOnce(JSON.stringify(entries));

      notificationManager.scheduleEngagementNotifications();

      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'three-day-streak',
          title: expect.stringContaining('streak'),
        })
      );
    });
  });

  describe('Streak Calculation', () => {
    it('should calculate streak correctly', () => {
      // Create entries for consecutive days
      const entries = [
        { timestamp: new Date().toISOString() }, // today
        { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }, // yesterday
        { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
        // Gap here
        { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }, // 4 days ago
      ];

      mockLocalStorage.getItem
        .mockReturnValueOnce('100')
        .mockReturnValueOnce(JSON.stringify(entries));

      // Access private method through the instance for testing
      const streak = (notificationManager as any).calculateStreak(entries);
      
      expect(streak).toBe(3); // Should count only consecutive days
    });

    it('should return 0 for empty entries', () => {
      const streak = (notificationManager as any).calculateStreak([]);
      expect(streak).toBe(0);
    });
  });
});