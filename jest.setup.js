import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: jest.fn(),
}

// Mock Service Worker
global.navigator.serviceWorker = {
  ready: Promise.resolve({
    showNotification: jest.fn(),
    sync: {
      register: jest.fn(),
    },
  }),
  register: jest.fn(),
}