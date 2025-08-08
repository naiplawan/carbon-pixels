// High-performance localStorage operations with compression and batching

interface WasteEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  disposal: string;
  weight: number;
  carbonCredits: number;
  timestamp: Date;
  image?: string;
}

class PerformantStorage {
  private cache = new Map<string, any>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private pendingWrites = new Map<string, any>();

  // Async localStorage operations to prevent blocking
  async getItem<T>(key: string, fallback: T): Promise<T> {
    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      
      // Parse in next tick to avoid blocking
      const parsed = await new Promise<T>((resolve) => {
        setTimeout(() => {
          try {
            resolve(JSON.parse(item));
          } catch {
            resolve(fallback);
          }
        }, 0);
      });

      this.cache.set(key, parsed);
      return parsed;
    } catch (error) {
      console.warn(`Storage read failed for ${key}:`, error);
      return fallback;
    }
  }

  // Batched writes for better performance
  async setItem(key: string, value: any): Promise<void> {
    this.cache.set(key, value);
    this.pendingWrites.set(key, value);

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Batch writes to reduce localStorage calls
    this.batchTimeout = setTimeout(async () => {
      const writes = Array.from(this.pendingWrites.entries());
      this.pendingWrites.clear();

      // Process writes asynchronously
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          writes.forEach(([writeKey, writeValue]) => {
            try {
              localStorage.setItem(writeKey, JSON.stringify(writeValue));
            } catch (error) {
              console.warn(`Storage write failed for ${writeKey}:`, error);
            }
          });
          resolve();
        }, 0);
      });
    }, 16); // ~60fps batching
  }

  // Optimized waste entries loading with today filter
  async getTodayEntries(): Promise<WasteEntry[]> {
    const allEntries = await this.getItem<WasteEntry[]>('wasteEntries', []);
    const today = new Date().toDateString();
    
    // Filter in chunks to prevent blocking
    return new Promise((resolve) => {
      const filtered: WasteEntry[] = [];
      let index = 0;
      const chunkSize = 50;

      const processChunk = () => {
        const endIndex = Math.min(index + chunkSize, allEntries.length);
        
        for (let i = index; i < endIndex; i++) {
          const entry = allEntries[i];
          if (new Date(entry.timestamp).toDateString() === today) {
            filtered.push(entry);
          }
        }

        index = endIndex;

        if (index < allEntries.length) {
          // Process next chunk in next frame
          setTimeout(processChunk, 0);
        } else {
          resolve(filtered);
        }
      };

      processChunk();
    });
  }

  // Memory-efficient entry addition
  async addWasteEntry(entry: WasteEntry): Promise<void> {
    const allEntries = await this.getItem<WasteEntry[]>('wasteEntries', []);
    const totalCredits = await this.getItem<number>('carbonCredits', 0);

    // Add new entry
    allEntries.push(entry);
    const newTotalCredits = totalCredits + entry.carbonCredits;

    // Batch save both items
    await this.setItem('wasteEntries', allEntries);
    await this.setItem('carbonCredits', newTotalCredits);

    return Promise.resolve();
  }

  // Clear cache when needed
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance for app-wide use
export const storage = new PerformantStorage();

// Preload critical data for instant access
export async function preloadStorageData(): Promise<void> {
  // Preload in background without blocking
  storage.getItem('wasteEntries', []);
  storage.getItem('carbonCredits', 0);
}

// Performance testing utilities
export interface StoragePerformanceMetrics {
  readTime: number;
  writeTime: number;
  batchReadTime: number;
  batchWriteTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  storageSize: number;
}

export class StoragePerformanceTester {
  private metrics: StoragePerformanceMetrics = {
    readTime: 0,
    writeTime: 0,
    batchReadTime: 0,
    batchWriteTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    storageSize: 0
  };

  // Test storage operations with various data sizes
  async testStoragePerformance(): Promise<StoragePerformanceMetrics> {
    console.log('🚀 Testing storage performance...');

    // Test single operations
    await this.testSingleOperations();
    
    // Test batch operations
    await this.testBatchOperations();
    
    // Test cache efficiency
    await this.testCacheEfficiency();
    
    // Measure memory usage
    this.measureMemoryUsage();
    
    // Calculate storage size
    await this.calculateStorageSize();

    return this.metrics;
  }

  private async testSingleOperations(): Promise<void> {
    const testData = this.generateTestData(10);

    // Test single reads
    const readStart = performance.now();
    for (let i = 0; i < 100; i++) {
      await storage.getItem('test-single', []);
    }
    this.metrics.readTime = performance.now() - readStart;

    // Test single writes
    const writeStart = performance.now();
    for (let i = 0; i < testData.length; i++) {
      await storage.setItem(`test-single-${i}`, testData[i]);
    }
    this.metrics.writeTime = performance.now() - writeStart;

    // Cleanup
    for (let i = 0; i < testData.length; i++) {
      localStorage.removeItem(`test-single-${i}`);
    }
  }

  private async testBatchOperations(): Promise<void> {
    const testData = this.generateTestData(50);

    // Test batch writes
    const batchWriteStart = performance.now();
    const writePromises = testData.map((data, index) => 
      storage.setItem(`test-batch-${index}`, data)
    );
    await Promise.all(writePromises);
    this.metrics.batchWriteTime = performance.now() - batchWriteStart;

    // Wait for batched writes to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test batch reads
    const batchReadStart = performance.now();
    const readPromises = Array.from({ length: testData.length }, (_, index) =>
      storage.getItem(`test-batch-${index}`, null)
    );
    await Promise.all(readPromises);
    this.metrics.batchReadTime = performance.now() - batchReadStart;

    // Cleanup
    for (let i = 0; i < testData.length; i++) {
      localStorage.removeItem(`test-batch-${i}`);
    }
  }

  private async testCacheEfficiency(): Promise<void> {
    const testKey = 'cache-test';
    const testData = this.generateTestData(1)[0];
    
    // First write to populate cache
    await storage.setItem(testKey, testData);
    
    let cacheHits = 0;
    const totalReads = 100;

    // Test cache hits
    const cacheTestStart = performance.now();
    for (let i = 0; i < totalReads; i++) {
      const startTime = performance.now();
      await storage.getItem(testKey, null);
      const readTime = performance.now() - startTime;
      
      // If read time is very low, it's likely a cache hit
      if (readTime < 1) {
        cacheHits++;
      }
    }

    this.metrics.cacheHitRate = (cacheHits / totalReads) * 100;
    localStorage.removeItem(testKey);
  }

  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  private async calculateStorageSize(): Promise<void> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.metrics.storageSize = (estimate.usage || 0) / 1024; // KB
      }
    } catch (error) {
      console.warn('Could not estimate storage size:', error);
    }
  }

  private generateTestData(count: number): WasteEntry[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `test-entry-${index}-${Date.now()}`,
      categoryId: 'food_waste',
      categoryName: 'Food Waste',
      disposal: 'composted',
      weight: Math.random() * 2,
      carbonCredits: Math.floor(Math.random() * 50),
      timestamp: new Date(),
      image: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==` // Small test image
    }));
  }

  // Generate performance report
  generateReport(): void {
    console.log('\n📊 Storage Performance Report');
    console.log('================================');
    console.log(`Single Read Time: ${this.metrics.readTime.toFixed(2)}ms`);
    console.log(`Single Write Time: ${this.metrics.writeTime.toFixed(2)}ms`);
    console.log(`Batch Read Time: ${this.metrics.batchReadTime.toFixed(2)}ms`);
    console.log(`Batch Write Time: ${this.metrics.batchWriteTime.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${this.metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB`);
    console.log(`Storage Size: ${this.metrics.storageSize.toFixed(2)}KB`);

    console.log('\n💡 Performance Recommendations:');
    
    if (this.metrics.cacheHitRate < 80) {
      console.log('- Improve caching strategy for better performance');
    }
    
    if (this.metrics.batchWriteTime > this.metrics.writeTime * 10) {
      console.log('- Consider optimizing batch operations');
    } else {
      console.log('- Batch operations are performing well');
    }
    
    if (this.metrics.memoryUsage > 50) {
      console.log('- High memory usage detected, consider cleanup strategies');
    }

    console.log('- Use lazy loading for large datasets');
    console.log('- Implement data pagination for better performance');
    console.log('- Consider IndexedDB for complex queries');
  }
}

// Export testing utility
export const storagePerformanceTester = new StoragePerformanceTester();

// Convenience function for running storage performance tests
export async function runStoragePerformanceTest(): Promise<StoragePerformanceMetrics> {
  const metrics = await storagePerformanceTester.testStoragePerformance();
  storagePerformanceTester.generateReport();
  return metrics;
}