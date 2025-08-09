/**
 * Pure utility functions for waste diary calculations
 * Extracted from components to ensure consistency and testability
 */

import wasteCategories from '@/data/thailand-waste-categories.json';

// Types
export type DisposalMethod = 'disposed' | 'recycled' | 'avoided';

export interface WasteCategory {
  id: string;
  name: string;
  nameLocal: string;
  icon: string;
  carbonCredits: Record<DisposalMethod, number>;
  examples: string[];
  tips: string[];
}

export interface CalculationResult {
  credits: number;
  co2Impact: number; // in grams
  energySaved: number; // in kWh
  moneyValue: number; // in THB
}

// Constants
export const WASTE_CONSTANTS = {
  MIN_WEIGHT_KG: 0.1,
  MAX_WEIGHT_KG: 50,
  DEFAULT_WEIGHT_OPTIONS: [0.1, 0.2, 0.5, 1.0, 2.0, 5.0] as const,
  CREDITS_PER_TREE: 500,
  CARBON_CREDITS_PER_GRAM: 1, // 1 credit ≈ 1g CO₂
  MAX_DAILY_ENTRIES: 50,
  CACHE_EXPIRY_HOURS: 24,
  
  // Level thresholds
  LEVEL_THRESHOLDS: [0, 100, 500, 1500, 3000, 5000] as const,
  
  // Economic values
  THB_PER_CREDIT: 0.05, // Rough economic value
  KWH_PER_CREDIT: 0.001, // Energy equivalent
} as const;

/**
 * Calculate carbon credits for waste disposal
 */
export function calculateCredits(
  categoryId: string,
  disposal: DisposalMethod,
  weight: number
): number {
  const category = getWasteCategory(categoryId);
  if (!category) return 0;

  const baseCredits = category.carbonCredits[disposal] || 0;
  return Math.round(baseCredits * weight * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate comprehensive impact metrics
 */
export function calculateImpactMetrics(
  categoryId: string,
  disposal: DisposalMethod,
  weight: number
): CalculationResult {
  const credits = calculateCredits(categoryId, disposal, weight);
  
  return {
    credits,
    co2Impact: Math.abs(credits) * WASTE_CONSTANTS.CARBON_CREDITS_PER_GRAM,
    energySaved: credits > 0 ? credits * WASTE_CONSTANTS.KWH_PER_CREDIT : 0,
    moneyValue: credits > 0 ? credits * WASTE_CONSTANTS.THB_PER_CREDIT : 0,
  };
}

/**
 * Get waste category by ID
 */
export function getWasteCategory(categoryId: string): WasteCategory | null {
  return wasteCategories.wasteCategories.find(cat => cat.id === categoryId) || null;
}

/**
 * Get all waste categories
 */
export function getAllWasteCategories(): WasteCategory[] {
  return wasteCategories.wasteCategories;
}

/**
 * Calculate user level based on total credits
 */
export function calculateUserLevel(totalCredits: number): {
  level: number;
  currentLevelMin: number;
  nextLevelMin: number;
  progressToNext: number;
} {
  const thresholds = WASTE_CONSTANTS.LEVEL_THRESHOLDS;
  
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalCredits >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }

  const currentLevelMin = thresholds[level - 1] || 0;
  const nextLevelMin = thresholds[level] || thresholds[thresholds.length - 1];
  const progressToNext = nextLevelMin > currentLevelMin 
    ? (totalCredits - currentLevelMin) / (nextLevelMin - currentLevelMin)
    : 1;

  return {
    level,
    currentLevelMin,
    nextLevelMin,
    progressToNext: Math.min(1, Math.max(0, progressToNext)),
  };
}

/**
 * Calculate trees equivalent based on credits
 */
export function calculateTreesEquivalent(credits: number): {
  trees: number;
  progressToNextTree: number;
} {
  const trees = Math.floor(Math.max(0, credits) / WASTE_CONSTANTS.CREDITS_PER_TREE);
  const progressToNextTree = Math.max(0, credits % WASTE_CONSTANTS.CREDITS_PER_TREE) / WASTE_CONSTANTS.CREDITS_PER_TREE;

  return {
    trees,
    progressToNextTree,
  };
}

/**
 * Get disposal method alternatives with better credits
 */
export function getDisposalAlternatives(
  categoryId: string,
  currentDisposal: DisposalMethod,
  weight: number
): Array<{
  method: DisposalMethod;
  credits: number;
  improvement: number;
  description: string;
}> {
  const category = getWasteCategory(categoryId);
  if (!category) return [];

  const currentCredits = calculateCredits(categoryId, currentDisposal, weight);
  
  const alternatives = (Object.entries(category.carbonCredits) as Array<[DisposalMethod, number]>)
    .filter(([method]) => method !== currentDisposal)
    .map(([method, baseCredits]) => ({
      method,
      credits: baseCredits * weight,
      improvement: (baseCredits * weight) - currentCredits,
      description: getDisposalDescription(method),
    }))
    .filter(alt => alt.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement);

  return alternatives;
}

/**
 * Get user-friendly disposal method description
 */
function getDisposalDescription(method: DisposalMethod): string {
  const descriptions = {
    disposed: 'Send to landfill',
    recycled: 'Recycle properly',
    avoided: 'Avoid generating this waste',
  };
  return descriptions[method] || method;
}

/**
 * Validate waste entry data
 */
export function validateWasteEntry(
  categoryId: string,
  disposal: DisposalMethod,
  weight: number
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!categoryId || !getWasteCategory(categoryId)) {
    errors.push('Please select a valid waste category');
  }

  if (!disposal || !['disposed', 'recycled', 'avoided'].includes(disposal)) {
    errors.push('Please select a disposal method');
  }

  if (!weight || weight < WASTE_CONSTANTS.MIN_WEIGHT_KG) {
    errors.push(`Weight must be at least ${WASTE_CONSTANTS.MIN_WEIGHT_KG} kg`);
  }

  if (weight > WASTE_CONSTANTS.MAX_WEIGHT_KG) {
    errors.push(`Weight cannot exceed ${WASTE_CONSTANTS.MAX_WEIGHT_KG} kg`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
  const absCredits = Math.abs(credits);
  const sign = credits >= 0 ? '+' : '';
  
  if (absCredits >= 1000) {
    return `${sign}${(credits / 1000).toFixed(1)}k`;
  }
  
  return `${sign}${credits.toFixed(1)}`;
}

/**
 * Get achievement criteria and check if unlocked
 */
export function checkAchievements(
  totalCredits: number,
  totalEntries: number,
  dailyStreak: number,
  unlockedAchievements: string[]
): string[] {
  const achievements = [
    { id: 'first_entry', condition: totalEntries >= 1, name: 'First Step' },
    { id: 'hundred_credits', condition: totalCredits >= 100, name: 'Hundred Hero' },
    { id: 'first_tree', condition: totalCredits >= 500, name: 'Tree Saver' },
    { id: 'streak_7', condition: dailyStreak >= 7, name: 'Week Warrior' },
    { id: 'streak_30', condition: dailyStreak >= 30, name: 'Monthly Master' },
    { id: 'thousand_credits', condition: totalCredits >= 1000, name: 'Eco Champion' },
    { id: 'fifty_entries', condition: totalEntries >= 50, name: 'Dedicated Tracker' },
    { id: 'ten_trees', condition: totalCredits >= 5000, name: 'Forest Guardian' },
  ];

  return achievements
    .filter(achievement => 
      achievement.condition && !unlockedAchievements.includes(achievement.id)
    )
    .map(achievement => achievement.id);
}

/**
 * Calculate daily goals progress
 */
export function calculateDailyGoals(todaysEntries: any[], todaysCredits: number): {
  goals: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    completed: boolean;
  }>;
  completedCount: number;
} {
  const goals = [
    {
      id: 'daily_entries',
      name: 'Track 3 waste items',
      target: 3,
      current: todaysEntries.length,
      completed: todaysEntries.length >= 3,
    },
    {
      id: 'positive_credits',
      name: 'Earn 50 positive credits',
      target: 50,
      current: Math.max(0, todaysCredits),
      completed: todaysCredits >= 50,
    },
    {
      id: 'avoid_waste',
      name: 'Avoid waste once today',
      target: 1,
      current: todaysEntries.filter(entry => entry.disposal === 'avoided').length,
      completed: todaysEntries.some(entry => entry.disposal === 'avoided'),
    },
  ];

  return {
    goals,
    completedCount: goals.filter(goal => goal.completed).length,
  };
}