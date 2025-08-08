import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Create a custom render function that includes common providers
const customRender = (ui: React.ReactElement, options?: RenderOptions) => {
  // Add any providers here if needed in the future
  // For example: ThemeProvider, StateProvider, etc.
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock data generators for testing
export const generateMockWasteEntry = (overrides = {}) => ({
  id: `mock-entry-${Date.now()}`,
  categoryId: 'plastic_bottles',
  categoryName: 'Plastic Bottles',
  disposal: 'recycled',
  weight: 0.5,
  carbonCredits: 15,
  timestamp: new Date(),
  ...overrides,
});

export const generateMockWasteEntries = (count: number) => {
  const categories = [
    { id: 'plastic_bottles', name: 'Plastic Bottles', disposal: 'recycled', credits: 15 },
    { id: 'food_waste', name: 'Food Waste', disposal: 'composted', credits: 25 },
    { id: 'plastic_bags', name: 'Plastic Bags', disposal: 'disposed', credits: -67 },
    { id: 'paper_cardboard', name: 'Paper/Cardboard', disposal: 'recycled', credits: 30 },
    { id: 'glass_bottles', name: 'Glass Bottles', disposal: 'recycled', credits: 20 },
  ];

  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length];
    return generateMockWasteEntry({
      id: `mock-entry-${index}`,
      categoryId: category.id,
      categoryName: category.name,
      disposal: category.disposal,
      carbonCredits: category.credits,
      weight: Math.random() * 2 + 0.1, // Random weight between 0.1 and 2.1
      timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // Spread over days
    });
  });
};

// Mock localStorage for testing
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock notification API for testing
export const mockNotificationAPI = () => {
  const mockNotification = jest.fn();
  global.Notification = mockNotification as any;
  global.Notification.permission = 'default';
  global.Notification.requestPermission = jest.fn().mockResolvedValue('granted');
  
  return mockNotification;
};

// Mock service worker for testing
export const mockServiceWorker = () => {
  const mockServiceWorker = {
    ready: Promise.resolve({
      showNotification: jest.fn(),
      getNotifications: jest.fn().mockResolvedValue([]),
      sync: {
        register: jest.fn(),
      },
    }),
    register: jest.fn().mockResolvedValue({}),
  };
  
  Object.defineProperty(navigator, 'serviceWorker', {
    value: mockServiceWorker,
    writable: true,
  });
  
  return mockServiceWorker;
};

// Performance testing utilities
export const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now();
  
  const result = customRender(component);
  
  // Wait for any async operations
  await new Promise(resolve => setTimeout(resolve, 0));
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  return {
    renderTime,
    result,
  };
};

// Accessibility testing helpers
export const checkKeyboardNavigation = async (page: any) => {
  // Helper to test tab navigation through interactive elements
  const interactiveElements = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  
  return page.locator(interactiveElements.join(', '));
};

// Custom matchers for testing
export const expectToBeAccessible = (element: any) => {
  // Custom matcher for accessibility testing
  return {
    toHaveAriaLabel: () => expect(element).toHaveAttribute('aria-label'),
    toHaveRole: (role: string) => expect(element).toHaveAttribute('role', role),
    toBeKeyboardNavigable: () => expect(element).toHaveAttribute('tabindex'),
  };
};

// Export everything including the custom render
export * from '@testing-library/react';
export { customRender as render };

// Re-export common testing utilities
export { default as userEvent } from '@testing-library/user-event';
export { waitFor, screen, fireEvent } from '@testing-library/react';