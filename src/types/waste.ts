// Central type definitions for the Thailand Waste Diary application

export type DisposalMethod = 'disposed' | 'recycled' | 'composted' | 'avoided' | 'reused';

export interface CarbonCredits {
  disposed: number;
  recycled: number;
  composted?: number;
  avoided: number;
  reused?: number;
}

export interface WasteCategory {
  id: string;
  name: string;
  nameLocal: string;
  icon: string;
  color?: string;
  description: string;
  examples: string[];
  carbonCredits: CarbonCredits;
  tips: string[];
}

export interface WasteEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  disposal: DisposalMethod;
  weight: number;
  carbonCredits: number;
  timestamp: Date | string;
  image?: string;
  notes?: string;
}

export interface WasteCategoriesData {
  wasteCategories: WasteCategory[];
  gamification: {
    levels: GamificationLevel[];
    dailyChallenges: DailyChallenge[];
    treeEquivalency: number; // Credits per tree
    achievementThresholds: AchievementThreshold[];
  };
}

export interface GamificationLevel {
  name: string;
  icon: string;
  minCredits: number;
  maxCredits?: number;
  benefits?: string[];
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  type: 'scan' | 'recycle' | 'avoid' | 'weight';
}

export interface AchievementThreshold {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'credits' | 'entries' | 'streak' | 'category';
}

export interface UserStats {
  totalCredits: number;
  totalEntries: number;
  treesEquivalent: number;
  currentLevel: GamificationLevel;
  dailyStreak: number;
  todayCredits: number;
  todayWeight: number;
  rankingPercentile?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type ValidationRule<T> = (value: T) => string | null;

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
}

// Utility types for component props
export interface WasteScannerProps {
  onClose: () => void;
  onSave: (entry: Omit<WasteEntry, 'id' | 'timestamp'>) => void;
  isOpen: boolean;
}

export interface GameificationPanelProps {
  userStats: UserStats;
  todayEntries: WasteEntry[];
  showDetailed?: boolean;
}

export interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: 'green' | 'blue' | 'purple' | 'orange';
  onClick?: () => void;
  ariaLabel?: string;
}

// Storage and performance types
export interface StorageItem<T> {
  data: T;
  timestamp: number;
  expires?: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  slowRender: boolean;
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

// Search and filter types
export interface SearchFilters {
  timeframe?: 'today' | 'week' | 'month' | 'all';
  credits?: 'positive' | 'negative' | 'all';
  category?: string;
  disposal?: DisposalMethod;
  minWeight?: number;
  maxWeight?: number;
}

export interface SearchResult {
  entries: WasteEntry[];
  totalCount: number;
  filters: SearchFilters;
}

// Constants as types
export const WASTE_CONSTANTS = {
  CREDITS_PER_TREE: 500,
  MAX_WEIGHT_KG: 100,
  MIN_WEIGHT_KG: 0.1,
  CACHE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  BATCH_TIMEOUT_MS: 16, // ~60fps
  CO2_GRAMS_PER_CREDIT: 1,
  DEFAULT_WEIGHT_SUGGESTIONS: [0.1, 0.2, 0.5, 1.0, 2.0] as const
} as const;

export const LEVEL_THRESHOLDS = {
  ECO_BEGINNER: 0,
  GREEN_WARRIOR: 100,
  ECO_CHAMPION: 500,
  CLIMATE_HERO: 1000,
  PLANET_PROTECTOR: 2500
} as const;

export const STORAGE_KEYS = {
  WASTE_ENTRIES: 'waste_entries_v2',
  CARBON_CREDITS: 'carbon_credits_v2',
  USER_PREFERENCES: 'user_prefs_v2',
  PERFORMANCE_METRICS: 'performance_metrics_v1'
} as const;

// Type guards
export function isValidDisposalMethod(method: string): method is DisposalMethod {
  return ['disposed', 'recycled', 'composted', 'avoided', 'reused'].includes(method);
}

export function isValidWasteEntry(entry: any): entry is WasteEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof entry.id === 'string' &&
    typeof entry.categoryId === 'string' &&
    typeof entry.categoryName === 'string' &&
    isValidDisposalMethod(entry.disposal) &&
    typeof entry.weight === 'number' &&
    entry.weight > 0 &&
    typeof entry.carbonCredits === 'number' &&
    (typeof entry.timestamp === 'string' || entry.timestamp instanceof Date)
  );
}

// Helper function types
export type GetCategoryData = (categoryId: string) => WasteCategory | undefined;
export type CalculateCredits = (category: WasteCategory, disposal: DisposalMethod, weight: number) => number;
export type FormatCredits = (credits: number) => { value: string; sign: '+' | '-' | ''; color: string };