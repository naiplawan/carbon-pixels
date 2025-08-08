import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WasteDiaryPage from '@/app/diary/page';

// Mock the dynamic imports
jest.mock('@/components/WasteScanner', () => {
  return function MockWasteScanner({ onSave, onClose }: any) {
    const handleSave = () => {
      onSave({
        id: 'test-entry-1',
        categoryId: 'plastic_bottles',
        categoryName: 'Plastic Bottles',
        disposal: 'recycled',
        weight: 0.5,
        carbonCredits: 15,
        timestamp: new Date(),
      });
      onClose();
    };

    return (
      <div data-testid="waste-scanner-modal">
        <button onClick={handleSave}>Save Waste Entry</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('@/components/GameificationPanel', () => {
  return function MockGameificationPanel({ totalCredits, todayCredits }: any) {
    return (
      <div data-testid="gamification-panel">
        <div>Total Credits: {totalCredits}</div>
        <div>Today Credits: {todayCredits}</div>
      </div>
    );
  };
});

jest.mock('@/components/NotificationManager', () => {
  return function MockNotificationManager() {
    return <div data-testid="notification-manager">Notification Settings</div>;
  };
});

jest.mock('@/components/SocialShareManager', () => {
  return function MockSocialShareManager({ totalCredits, onClose }: any) {
    return (
      <div data-testid="social-share-manager">
        <div>Share your {totalCredits} credits!</div>
        <button onClick={onClose}>Close Share</button>
      </div>
    );
  };
});

jest.mock('@/components/CommunityPanelEnhanced', () => {
  return function MockCommunityPanel({ totalCredits, onClose }: any) {
    return (
      <div data-testid="community-panel">
        <div>Community - You have {totalCredits} credits</div>
        <button onClick={onClose}>Close Community</button>
      </div>
    );
  };
});

// Mock storage operations
jest.mock('@/lib/storage-performance', () => ({
  storage: {
    getTodayEntries: jest.fn().mockResolvedValue([]),
    getItem: jest.fn().mockImplementation((key: string, defaultValue: any) => {
      if (key === 'carbonCredits') return Promise.resolve(0);
      if (key === 'wasteEntries') return Promise.resolve([]);
      return Promise.resolve(defaultValue);
    }),
    addWasteEntry: jest.fn().mockResolvedValue(undefined),
  },
  preloadStorageData: jest.fn(),
}));

// Mock PWA components
jest.mock('@/components/PWAManager', () => ({
  PWAManager: () => <div data-testid="pwa-manager">PWA Manager</div>,
  OfflineIndicator: () => <div data-testid="offline-indicator">Offline Indicator</div>,
  usePWA: () => ({
    showAchievement: jest.fn(),
  }),
}));

// Mock notifications
jest.mock('@/lib/notifications', () => ({
  notificationManager: {
    init: jest.fn(),
    scheduleEngagementNotifications: jest.fn(),
    showNotification: jest.fn(),
  },
}));

describe('Waste Tracking Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full waste tracking flow', async () => {
    const user = userEvent.setup();
    render(<WasteDiaryPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Thailand Waste Diary 🗂️')).toBeInTheDocument();
    });

    // Initially should show 0 credits
    expect(screen.getByText("0")).toBeInTheDocument(); // Today's Credits

    // Open waste scanner
    const scannerButton = screen.getByText('📷 AI Scanner (Demo)');
    await user.click(scannerButton);

    // Wait for scanner modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('waste-scanner-modal')).toBeInTheDocument();
    });

    // Save a waste entry
    const saveButton = screen.getByText('Save Waste Entry');
    await user.click(saveButton);

    // Verify modal closes and credits are updated
    await waitFor(() => {
      expect(screen.queryByTestId('waste-scanner-modal')).not.toBeInTheDocument();
    });

    // Check that the today's entries section is updated
    await waitFor(() => {
      expect(screen.getByText('Plastic Bottles')).toBeInTheDocument();
      expect(screen.getByText('0.5kg • recycled')).toBeInTheDocument();
      expect(screen.getByText('+15 CC')).toBeInTheDocument();
    });
  });

  it('should open and close notification settings', async () => {
    const user = userEvent.setup();
    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('🔔 Notifications')).toBeInTheDocument();
    });

    // Open notifications
    const notificationButton = screen.getByText('🔔 Notifications');
    await user.click(notificationButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-manager')).toBeInTheDocument();
    });

    // Close by clicking again
    await user.click(notificationButton);

    await waitFor(() => {
      expect(screen.queryByTestId('notification-manager')).not.toBeInTheDocument();
    });
  });

  it('should open and close social share manager', async () => {
    const user = userEvent.setup();
    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('🚀 Share Impact')).toBeInTheDocument();
    });

    // Open social share
    const shareButton = screen.getByText('🚀 Share Impact');
    await user.click(shareButton);

    await waitFor(() => {
      expect(screen.getByTestId('social-share-manager')).toBeInTheDocument();
      expect(screen.getByText('Share your 0 credits!')).toBeInTheDocument();
    });

    // Close using the close button in the modal
    const closeButton = screen.getByText('Close Share');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('social-share-manager')).not.toBeInTheDocument();
    });
  });

  it('should open and close community panel', async () => {
    const user = userEvent.setup();
    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('🌍 Community')).toBeInTheDocument();
    });

    // Open community panel
    const communityButton = screen.getByText('🌍 Community');
    await user.click(communityButton);

    await waitFor(() => {
      expect(screen.getByTestId('community-panel')).toBeInTheDocument();
      expect(screen.getByText('Community - You have 0 credits')).toBeInTheDocument();
    });

    // Close using the close button in the modal
    const closeButton = screen.getByText('Close Community');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('community-panel')).not.toBeInTheDocument();
    });
  });

  it('should navigate to manual entry page', async () => {
    const user = userEvent.setup();
    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('✏️ Manual Entry')).toBeInTheDocument();
    });

    const manualEntryLink = screen.getByText('✏️ Manual Entry');
    expect(manualEntryLink.closest('a')).toHaveAttribute('href', '/diary/manual');
  });

  it('should navigate to history page', async () => {
    const user = userEvent.setup();
    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('📚 View History')).toBeInTheDocument();
    });

    const historyLink = screen.getByText('📚 View History');
    expect(historyLink.closest('a')).toHaveAttribute('href', '/diary/history');
  });

  it('should show daily goal progress when entries exist', async () => {
    // Mock today's entries with credits
    const { storage } = require('@/lib/storage-performance');
    storage.getTodayEntries.mockResolvedValueOnce([
      {
        id: 'existing-1',
        categoryId: 'plastic_bottles',
        categoryName: 'Plastic Bottles',
        disposal: 'recycled',
        weight: 0.5,
        carbonCredits: 50,
        timestamp: new Date(),
      }
    ]);
    storage.getItem.mockImplementation((key: string) => {
      if (key === 'carbonCredits') return Promise.resolve(50);
      return Promise.resolve([]);
    });

    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Goal Progress')).toBeInTheDocument();
      expect(screen.getByText('50 / 100 Credits')).toBeInTheDocument();
    });

    // Check that progress bar is displayed
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();
  });

  it('should show goal achievement message', async () => {
    // Mock today's entries with enough credits to meet goal
    const { storage } = require('@/lib/storage-performance');
    storage.getTodayEntries.mockResolvedValueOnce([
      {
        id: 'high-credit',
        categoryId: 'plastic_bottles',
        categoryName: 'Plastic Bottles',
        disposal: 'recycled',
        weight: 2.0,
        carbonCredits: 150,
        timestamp: new Date(),
      }
    ]);

    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Goal Achieved!')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
  });

  it('should display environmental impact insights', async () => {
    render(<WasteDiaryPage />);

    await waitFor(() => {
      expect(screen.getByText('📊 Environmental Impact Insights')).toBeInTheDocument();
    });

    // Expand insights section
    const insightsToggle = screen.getByText('📊 Environmental Impact Insights');
    fireEvent.click(insightsToggle);

    await waitFor(() => {
      expect(screen.getByText('CO₂ Impact Today')).toBeInTheDocument();
      expect(screen.getByText('Thailand Ranking')).toBeInTheDocument();
      expect(screen.getByText('Energy Equivalent')).toBeInTheDocument();
    });
  });
});