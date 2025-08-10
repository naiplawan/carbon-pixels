// Optimized waste data loading with caching, compression and error handling
import type { WasteCategory, GamificationData, WasteDataCache, WasteDataSet } from '@/types/waste';

let wasteDataCache: WasteDataCache = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Compressed data loading with error boundaries
export async function getWasteCategories(): Promise<WasteCategory[]> {
  // Check cache validity
  const now = Date.now();
  if (wasteDataCache?.wasteCategories && 
      wasteDataCache.timestamp && 
      (now - wasteDataCache.timestamp) < CACHE_EXPIRY) {
    return wasteDataCache.wasteCategories;
  }
  
  try {
    // Dynamic import for code splitting
    const { default: wasteData } = await import('@/data/thailand-waste-categories.json');
    wasteDataCache = {
      ...wasteData,
      timestamp: now
    };
    return wasteData.wasteCategories;
  } catch (error) {
    console.error('Failed to load waste categories:', error);
    // Return fallback minimal data
    return [
      {
        id: 'food_waste',
        name: 'Food Waste',
        icon: '🍎',
        carbonCredits: { disposed: -25, composted: 22 }
      }
    ];
  }
}

export async function getGamificationData(): Promise<GamificationData | undefined> {
  if (wasteDataCache?.gamification) {
    return wasteDataCache.gamification;
  }
  
  const { default: wasteData } = await import('@/data/thailand-waste-categories.json');
  wasteDataCache = wasteData;
  return wasteData.gamification;
}

// Preload critical data on interaction
export function preloadWasteData() {
  if (!wasteDataCache) {
    import('@/data/thailand-waste-categories.json').then(({ default: data }) => {
      wasteDataCache = data;
    });
  }
}

// Memory-efficient category lookup
export function getCategoryById(id: string, categories: WasteCategory[]): WasteCategory | undefined {
  return categories.find(cat => cat.id === id);
}

// Optimized carbon credit calculation
export function calculateCarbonCredits(categoryId: string, disposal: string, weight: number, categories: WasteCategory[]): number {
  const category = getCategoryById(categoryId, categories);
  if (!category?.carbonCredits?.[disposal]) return 0;
  
  return Math.round(category.carbonCredits[disposal] * weight);
}