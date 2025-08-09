'use client';

import { useState, useEffect, useCallback } from 'react';

// Type-safe localStorage utility with error handling
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    serializer?: {
      serialize: (value: T) => string;
      deserialize: (value: string) => T;
    };
    syncAcrossTabs?: boolean;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
    syncAcrossTabs = true,
  } = options;

  // Get stored value or default
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? serializer.deserialize(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Set value in localStorage and state
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serializer.serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, storedValue]
  );

  // Remove value from localStorage and reset to default
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(serializer.deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, serializer, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common data types
export function useLocalStorageState<T>(key: string, defaultValue: T) {
  return useLocalStorage(key, defaultValue, { syncAcrossTabs: true });
}

// For JSON objects with type safety
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string, 
  defaultValue: T
) {
  return useLocalStorage(key, defaultValue, {
    serializer: {
      serialize: (value: T) => JSON.stringify(value, null, 2),
      deserialize: (value: string) => JSON.parse(value),
    },
    syncAcrossTabs: true,
  });
}

// For arrays with type safety
export function useLocalStorageArray<T>(key: string, defaultValue: T[] = []) {
  return useLocalStorage(key, defaultValue, { syncAcrossTabs: true });
}

// For primitive values
export function useLocalStorageNumber(key: string, defaultValue: number = 0) {
  return useLocalStorage(key, defaultValue, {
    serializer: {
      serialize: String,
      deserialize: Number,
    },
    syncAcrossTabs: true,
  });
}

export function useLocalStorageBoolean(key: string, defaultValue: boolean = false) {
  return useLocalStorage(key, defaultValue, {
    serializer: {
      serialize: String,
      deserialize: (value: string) => value === 'true',
    },
    syncAcrossTabs: true,
  });
}

// Batch operations for related localStorage keys
export function useLocalStorageBatch() {
  const setMultiple = useCallback((items: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    try {
      Object.entries(items).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
      });
    } catch (error) {
      console.warn('Error setting multiple localStorage items:', error);
    }
  }, []);

  const getMultiple = useCallback((keys: string[]) => {
    if (typeof window === 'undefined') return {};

    try {
      return keys.reduce((acc, key) => {
        const value = window.localStorage.getItem(key);
        acc[key] = value ? JSON.parse(value) : null;
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.warn('Error getting multiple localStorage items:', error);
      return {};
    }
  }, []);

  const removeMultiple = useCallback((keys: string[]) => {
    if (typeof window === 'undefined') return;

    try {
      keys.forEach(key => window.localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error removing multiple localStorage items:', error);
    }
  }, []);

  return { setMultiple, getMultiple, removeMultiple };
}