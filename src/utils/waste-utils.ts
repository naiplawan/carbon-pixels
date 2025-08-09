// Utility functions for waste tracking with proper type safety

import { 
  WasteCategory, 
  WasteEntry, 
  DisposalMethod, 
  ValidationResult,
  UserStats,
  GamificationLevel,
  WasteCategoriesData,
  WASTE_CONSTANTS,
  LEVEL_THRESHOLDS
} from '@/types/waste';

/**
 * Safely get category data by ID with proper error handling
 */
export function getCategoryData(
  categories: WasteCategoriesData, 
  categoryId: string
): WasteCategory | undefined {
  if (!categories?.wasteCategories || !Array.isArray(categories.wasteCategories)) {
    console.warn('Invalid categories data structure');
    return undefined;
  }

  return categories.wasteCategories.find((category: WasteCategory) => category.id === categoryId);
}

/**
 * Calculate carbon credits with type safety and validation
 */
export function calculateCredits(
  category: WasteCategory | undefined,
  disposal: DisposalMethod,
  weight: number
): number {
  if (!category) {
    console.error('Category not found for credit calculation');
    return 0;
  }

  if (weight <= 0 || weight > WASTE_CONSTANTS.MAX_WEIGHT_KG) {
    console.warn(`Invalid weight: ${weight}kg. Must be between ${WASTE_CONSTANTS.MIN_WEIGHT_KG} and ${WASTE_CONSTANTS.MAX_WEIGHT_KG}`);
    return 0;
  }

  const baseCredits = category.carbonCredits[disposal];
  if (typeof baseCredits !== 'number') {
    console.error(`No carbon credits defined for disposal method: ${disposal}`);
    return 0;
  }

  return Math.round(baseCredits * weight);
}

/**
 * Validate waste entry data before saving
 */
export function validateWasteEntry(
  entry: Partial<WasteEntry>
): ValidationResult {
  const errors: string[] = [];

  // Required fields validation
  if (!entry.categoryId?.trim()) {
    errors.push('Category is required');
  }

  if (!entry.categoryName?.trim()) {
    errors.push('Category name is required');
  }

  if (!entry.disposal) {
    errors.push('Disposal method is required');
  }

  // Weight validation
  if (!entry.weight || typeof entry.weight !== 'number') {
    errors.push('Weight is required and must be a number');
  } else if (entry.weight <= 0) {
    errors.push(`Weight must be greater than ${WASTE_CONSTANTS.MIN_WEIGHT_KG}kg`);
  } else if (entry.weight > WASTE_CONSTANTS.MAX_WEIGHT_KG) {
    errors.push(`Weight seems unrealistic (maximum ${WASTE_CONSTANTS.MAX_WEIGHT_KG}kg)`);
  }

  // Carbon credits validation
  if (entry.carbonCredits !== undefined && typeof entry.carbonCredits !== 'number') {
    errors.push('Carbon credits must be a number');
  }

  // Optional fields validation
  if (entry.notes && entry.notes.length > 500) {
    errors.push('Notes must be less than 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input to prevent XSS and ensure data integrity
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Create a complete, validated waste entry
 */
export function createWasteEntry(
  entry: Omit<WasteEntry, 'id' | 'timestamp'> & Partial<Pick<WasteEntry, 'id' | 'timestamp'>>
): WasteEntry {
  const sanitizedEntry: WasteEntry = {
    id: entry.id || crypto.randomUUID(),
    categoryId: entry.categoryId,
    categoryName: sanitizeInput(entry.categoryName),
    disposal: entry.disposal,
    weight: Math.max(
      WASTE_CONSTANTS.MIN_WEIGHT_KG, 
      Math.min(WASTE_CONSTANTS.MAX_WEIGHT_KG, entry.weight)
    ),
    carbonCredits: entry.carbonCredits,
    timestamp: entry.timestamp || new Date().toISOString(),
    notes: entry.notes ? sanitizeInput(entry.notes) : undefined,
    image: entry.image // Image URLs should be validated separately
  };

  return sanitizedEntry;
}

/**
 * Calculate user statistics from waste entries
 */
export function calculateUserStats(
  entries: WasteEntry[],
  levels: GamificationLevel[]
): UserStats {
  const validEntries = entries.filter(entry => 
    entry && typeof entry.carbonCredits === 'number'
  );

  const totalCredits = validEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
  const treesEquivalent = totalCredits / WASTE_CONSTANTS.CREDITS_PER_TREE;

  // Calculate today's stats
  const today = new Date().toDateString();
  const todayEntries = validEntries.filter(entry => {
    const entryDate = new Date(entry.timestamp).toDateString();
    return entryDate === today;
  });

  const todayCredits = todayEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
  const todayWeight = todayEntries.reduce((sum, entry) => sum + entry.weight, 0);

  // Determine current level
  const currentLevel = getCurrentLevel(totalCredits, levels);

  // Calculate daily streak (simplified - would need more sophisticated logic)
  const dailyStreak = calculateDailyStreak(validEntries);

  return {
    totalCredits,
    totalEntries: validEntries.length,
    treesEquivalent: Math.max(0, treesEquivalent),
    currentLevel,
    dailyStreak,
    todayCredits,
    todayWeight,
    rankingPercentile: calculateRankingPercentile(totalCredits) // Simulated for now
  };
}

/**
 * Determine user's current gamification level
 */
export function getCurrentLevel(
  totalCredits: number,
  levels: GamificationLevel[]
): GamificationLevel {
  // Default levels if not provided
  const defaultLevels: GamificationLevel[] = [
    { name: 'Eco Beginner', icon: '🌱', minCredits: 0, maxCredits: 99 },
    { name: 'Green Warrior', icon: '💚', minCredits: 100, maxCredits: 499 },
    { name: 'Eco Champion', icon: '🌍', minCredits: 500, maxCredits: 999 },
    { name: 'Climate Hero', icon: '🦸', minCredits: 1000, maxCredits: 2499 },
    { name: 'Planet Protector', icon: '🛡️', minCredits: 2500 }
  ];

  const levelsToUse = levels.length > 0 ? levels : defaultLevels;

  // Find the appropriate level based on total credits
  for (let i = levelsToUse.length - 1; i >= 0; i--) {
    const level = levelsToUse[i];
    if (totalCredits >= level.minCredits) {
      return level;
    }
  }

  return levelsToUse[0]; // Return first level as fallback
}

/**
 * Calculate daily streak (simplified implementation)
 */
export function calculateDailyStreak(entries: WasteEntry[]): number {
  if (entries.length === 0) return 0;

  // Sort entries by date (most recent first)
  const sortedEntries = entries
    .map(entry => ({
      ...entry,
      date: new Date(entry.timestamp).toDateString()
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Get unique dates
  const uniqueDates = [...new Set(sortedEntries.map(entry => entry.date))];

  let streak = 0;
  const today = new Date().toDateString();
  
  // Check if user has entry today or yesterday to start counting
  if (uniqueDates.length > 0 && 
      (uniqueDates[0] === today || 
       uniqueDates[0] === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString())) {
    
    let currentDate = new Date();
    for (const dateStr of uniqueDates) {
      const entryDate = new Date(dateStr);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff <= streak) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
  }

  return streak;
}

/**
 * Simulate ranking percentile (would connect to real data in production)
 */
export function calculateRankingPercentile(totalCredits: number): number {
  // Simulated percentile based on total credits
  // This would be calculated against real user database in production
  if (totalCredits >= 2500) return Math.min(95 + Math.random() * 5, 99);
  if (totalCredits >= 1000) return 80 + Math.random() * 15;
  if (totalCredits >= 500) return 60 + Math.random() * 20;
  if (totalCredits >= 100) return 30 + Math.random() * 30;
  return Math.random() * 30;
}

/**
 * Format credits for display with proper styling indicators
 */
export function formatCredits(credits: number): {
  value: string;
  sign: '+' | '-' | '';
  color: string;
  description: string;
} {
  const absCredits = Math.abs(credits);
  
  if (credits > 0) {
    return {
      value: absCredits.toString(),
      sign: '+',
      color: 'text-emerald-600',
      description: 'Positive environmental impact'
    };
  } else if (credits < 0) {
    return {
      value: absCredits.toString(),
      sign: '-',
      color: 'text-amber-600',
      description: 'Environmental cost - consider recycling'
    };
  } else {
    return {
      value: '0',
      sign: '',
      color: 'text-gray-500',
      description: 'Neutral impact'
    };
  }
}

/**
 * Get weight comparison for user-friendly display
 */
export function getWeightComparison(weightKg: number): string {
  const comparisons = [
    { max: 0.1, comparison: '2 plastic bags' },
    { max: 0.2, comparison: '1 small apple' },
    { max: 0.5, comparison: '1 plastic bottle' },
    { max: 1.0, comparison: '1 can of soda' },
    { max: 2.0, comparison: '1 newspaper' },
    { max: 5.0, comparison: '1 small bag of rice' },
    { max: 10.0, comparison: '1 bag of groceries' },
    { max: Infinity, comparison: 'several bags of groceries' }
  ];

  const comparison = comparisons.find(comp => weightKg <= comp.max);
  return comparison?.comparison || 'very heavy item';
}

/**
 * Generate smart suggestions based on user history
 */
export function getSmartSuggestions(entries: WasteEntry[]): Array<{
  id: string;
  label: string;
  icon: string;
  categoryId: string;
  disposal: DisposalMethod;
}> {
  if (entries.length === 0) {
    return [
      { id: 'plastic-bottle', label: 'Plastic Bottle', icon: '🍾', categoryId: 'plastic_bottles', disposal: 'recycled' },
      { id: 'food-waste', label: 'Food Scraps', icon: '🍎', categoryId: 'food_waste', disposal: 'composted' }
    ];
  }

  // Get most common categories from recent entries
  const recentEntries = entries.slice(-20); // Last 20 entries
  const categoryCount = recentEntries.reduce((acc, entry) => {
    acc[entry.categoryId] = (acc[entry.categoryId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return topCategories.map(([categoryId], index) => {
    const recentEntry = recentEntries.find(e => e.categoryId === categoryId);
    return {
      id: `suggestion-${index}`,
      label: recentEntry?.categoryName || 'Recent Item',
      icon: '🔄',
      categoryId,
      disposal: (recentEntry?.disposal || 'disposed') as DisposalMethod
    };
  });
}

/**
 * Safe localStorage operations with error handling
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    
    const parsed = JSON.parse(item);
    
    // Basic type validation
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (typeof fallback === 'object' && typeof parsed !== 'object') return fallback;
    if (typeof fallback !== typeof parsed) return fallback;
    
    return parsed;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
}