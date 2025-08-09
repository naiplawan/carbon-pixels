'use client';

import { useLocalStorageArray, useLocalStorageNumber, useLocalStorageObject } from './useLocalStorage';
import React, { useMemo } from 'react';

// Types
export interface WasteEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  disposal: string;
  weight: number;
  carbonCredits: number;
  timestamp: string;
}

export interface UserStats {
  totalCredits: number;
  level: number;
  treesEquivalent: number;
  totalWasteWeight: number;
  achievementsUnlocked: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'th';
  notifications: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
}

// Storage keys - centralized configuration
export const STORAGE_KEYS = {
  WASTE_ENTRIES: 'carbon-pixels-waste-entries',
  USER_STATS: 'carbon-pixels-user-stats',
  USER_PREFERENCES: 'carbon-pixels-preferences',
  ACHIEVEMENTS: 'carbon-pixels-achievements',
  DAILY_STREAK: 'carbon-pixels-daily-streak',
  LAST_VISIT: 'carbon-pixels-last-visit',
} as const;

// Default values
const DEFAULT_USER_STATS: UserStats = {
  totalCredits: 0,
  level: 1,
  treesEquivalent: 0,
  totalWasteWeight: 0,
  achievementsUnlocked: [],
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en',
  notifications: true,
  hapticFeedback: true,
  soundEffects: true,
  fontSize: 'medium',
  reduceMotion: false,
};

// Waste entries management hook
export function useWasteEntries() {
  const [entries, setEntries] = useLocalStorageArray<WasteEntry>(
    STORAGE_KEYS.WASTE_ENTRIES, 
    []
  );

  // Computed values
  const todaysEntries = useMemo(() => {
    const today = new Date().toDateString();
    return entries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );
  }, [entries]);

  const totalCredits = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
  }, [entries]);

  const todaysCredits = useMemo(() => {
    return todaysEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
  }, [todaysEntries]);

  const totalWeight = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.weight, 0);
  }, [entries]);

  // Actions
  const addEntry = (entry: Omit<WasteEntry, 'id' | 'timestamp'>) => {
    const newEntry: WasteEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const updateEntry = (id: string, updates: Partial<WasteEntry>) => {
    setEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const clearAllEntries = () => {
    setEntries([]);
  };

  // Get entries by date range
  const getEntriesInRange = (startDate: Date, endDate: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  return {
    entries,
    todaysEntries,
    totalCredits,
    todaysCredits,
    totalWeight,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAllEntries,
    getEntriesInRange,
  };
}

// User statistics management hook
export function useUserStats() {
  const [stats, setStats] = useLocalStorageObject<UserStats>(
    STORAGE_KEYS.USER_STATS,
    DEFAULT_USER_STATS
  );

  // Level calculation based on credits
  const calculateLevel = (credits: number): number => {
    if (credits < 100) return 1;
    if (credits < 500) return 2;
    if (credits < 1500) return 3;
    if (credits < 3000) return 4;
    return 5;
  };

  // Trees equivalent (500 credits = 1 tree)
  const calculateTrees = (credits: number): number => {
    return Math.floor(Math.max(0, credits) / 500);
  };

  // Update stats based on waste entries
  const updateStats = (totalCredits: number, totalWeight: number) => {
    const level = calculateLevel(totalCredits);
    const treesEquivalent = calculateTrees(totalCredits);

    setStats({
      totalCredits,
      level,
      treesEquivalent,
      totalWasteWeight: totalWeight,
      achievementsUnlocked: stats.achievementsUnlocked,
    });
  };

  // Add achievement
  const unlockAchievement = (achievementId: string) => {
    if (!stats.achievementsUnlocked.includes(achievementId)) {
      setStats(prev => ({
        ...prev,
        achievementsUnlocked: [...prev.achievementsUnlocked, achievementId],
      }));
    }
  };

  return {
    stats,
    updateStats,
    unlockAchievement,
    calculateLevel,
    calculateTrees,
  };
}

// User preferences management hook
export function useUserPreferences() {
  const [preferences, setPreferences] = useLocalStorageObject<UserPreferences>(
    STORAGE_KEYS.USER_PREFERENCES,
    DEFAULT_PREFERENCES
  );

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}

// Daily streak management
export function useDailyStreak() {
  const [streak, setStreak] = useLocalStorageNumber(STORAGE_KEYS.DAILY_STREAK, 0);
  const [lastVisit, setLastVisit] = useLocalStorageObject<string | null>(
    STORAGE_KEYS.LAST_VISIT,
    null
  );

  const updateStreak = () => {
    const today = new Date().toDateString();
    
    if (lastVisit === null) {
      // First visit
      setStreak(1);
      setLastVisit(today);
      return 1;
    }

    const lastVisitDate = new Date(lastVisit);
    const todayDate = new Date();
    const daysDifference = Math.floor(
      (todayDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference === 1) {
      // Consecutive day
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLastVisit(today);
      return newStreak;
    } else if (daysDifference === 0) {
      // Same day, no change
      return streak;
    } else {
      // Streak broken
      setStreak(1);
      setLastVisit(today);
      return 1;
    }
  };

  const resetStreak = () => {
    setStreak(0);
    setLastVisit(null);
  };

  return {
    streak,
    lastVisit,
    updateStreak,
    resetStreak,
  };
}

// Combined hook for all waste diary data
export function useWasteDiary() {
  const wasteData = useWasteEntries();
  const userStats = useUserStats();
  const preferences = useUserPreferences();
  const streakData = useDailyStreak();

  // Auto-update stats when entries change
  React.useEffect(() => {
    userStats.updateStats(wasteData.totalCredits, wasteData.totalWeight);
  }, [wasteData.totalCredits, wasteData.totalWeight]);

  return {
    ...wasteData,
    ...userStats,
    ...preferences,
    ...streakData,
  };
}