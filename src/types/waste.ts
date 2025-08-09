// Type definitions for waste tracking system

export interface WasteCategory {
  id: string;
  name: string;
  nameLocal?: string;
  icon: string;
  carbonCredits: {
    disposed?: number;
    recycled?: number;
    composted?: number;
    avoided?: number;
    donated?: number;
    [key: string]: number | undefined;
  };
  examples?: string[];
  tips?: string[];
  disposalMethods?: string[];
}

export interface GamificationLevel {
  id?: string;
  level?: number;
  name: string;
  minCredits: number;
  maxCredits?: number;
  icon: string;
  color?: string;
}

export interface GamificationData {
  levels: GamificationLevel[];
  treeEquivalent: number | { creditsPerTree: number; description: string; };
  dailyGoal?: number;
  dailyGoals?: {
    id: string;
    name: string;
    description: string;
    target: number;
    credits: number;
  }[];
  achievements?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: number;
  }[];
}

export interface WasteDataSet {
  wasteCategories: WasteCategory[];
  gamification: GamificationData;
  tips?: Record<string, string[]>;
}

export interface WasteEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  disposal: string;
  weight: number;
  carbonCredits: number;
  timestamp: string;
  notes?: string;
  image?: string;
}

export interface WasteDataCache {
  wasteCategories?: WasteCategory[];
  gamification?: GamificationData;
  timestamp?: number;
}

// Waste tracking constants
export const WASTE_CONSTANTS = {
  MIN_WEIGHT_KG: 0.1,
  MAX_WEIGHT_KG: 50,
  DEFAULT_WEIGHT_OPTIONS: [0.1, 0.2, 0.5, 1.0, 2.0, 5.0],
  CREDITS_PER_TREE: 500,
  CARBON_CREDITS_PER_GRAM: 1, // 1 credit ≈ 1g CO₂
  MAX_DAILY_ENTRIES: 50,
  CACHE_EXPIRY_HOURS: 24
} as const;

// Additional types referenced in waste-utils.ts
export type DisposalMethod = 'disposed' | 'recycled' | 'composted' | 'avoided' | 'donated' | 'reused';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UserStats {
  totalCredits: number;
  totalEntries: number;
  treesEquivalent: number;
  currentLevel: GamificationLevel;
  dailyStreak: number;
  todayCredits: number;
  todayWeight: number;
  rankingPercentile: number;
}

export type WasteCategoriesData = WasteDataSet;

export const LEVEL_THRESHOLDS = [
  { name: 'Eco Beginner', icon: '🌱', minCredits: 0, maxCredits: 99 },
  { name: 'Green Warrior', icon: '💚', minCredits: 100, maxCredits: 499 },
  { name: 'Eco Champion', icon: '🌍', minCredits: 500, maxCredits: 999 },
  { name: 'Climate Hero', icon: '🦸', minCredits: 1000, maxCredits: 2499 },
  { name: 'Planet Protector', icon: '🛡️', minCredits: 2500 }
] as const;

export const STORAGE_KEYS = {
  WASTE_ENTRIES: 'wasteEntries',
  CARBON_CREDITS: 'carbonCredits',
  USER_LEVEL: 'userLevel',
  DAILY_STREAK: 'dailyStreak',
  PREFERENCES: 'preferences',
  ONBOARDING_COMPLETED: 'onboardingCompleted'
} as const;