// Comprehensive performance testing utilities for the Thailand Waste Diary App

export interface PerformanceTestResult {
  testName: string;
  duration: number;
  memoryUsage?: number;
  status: 'pass' | 'fail' | 'warning';
  metrics: Record<string, number>;
  recommendations: string[];
}

export class PerformanceTestSuite {
  private results: PerformanceTestResult[] = [];

  // Test localStorage operations performance
  async testLocalStoragePerformance(): Promise<PerformanceTestResult> {
    const testName = 'localStorage Operations';
    const start = performance.now();
    const iterations = 1000;
    
    // Test write performance
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      localStorage.setItem(`test_${i}`, JSON.stringify({ id: i, data: 'test' }));
    }
    const writeTime = performance.now() - writeStart;

    // Test read performance
    const readStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const item = localStorage.getItem(`test_${i}`);
      if (item) JSON.parse(item);
    }
    const readTime = performance.now() - readStart;

    // Cleanup
    for (let i = 0; i < iterations; i++) {
      localStorage.removeItem(`test_${i}`);
    }

    const totalDuration = performance.now() - start;
    const avgWriteTime = writeTime / iterations;
    const avgReadTime = readTime / iterations;

    const result: PerformanceTestResult = {
      testName,
      duration: totalDuration,
      status: avgWriteTime < 1 && avgReadTime < 0.5 ? 'pass' : 'warning',
      metrics: {
        avgWriteTime,
        avgReadTime,
        totalOperations: iterations * 2
      },
      recommendations: [
        avgWriteTime > 1 ? 'Consider batching localStorage writes' : '',
        avgReadTime > 0.5 ? 'Implement localStorage caching layer' : '',
        'Use async storage operations for large datasets'
      ].filter(Boolean)
    };

    this.results.push(result);
    return result;
  }

  // Test component rendering performance
  async testRenderingPerformance(): Promise<PerformanceTestResult> {
    const testName = 'Component Rendering';
    
    // Simulate heavy DOM operations
    const start = performance.now();
    const container = document.createElement('div');
    
    // Create 100 diary entries simulation
    for (let i = 0; i < 100; i++) {
      const entry = document.createElement('div');
      entry.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
      entry.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="text-2xl">🍎</div>
          <div>
            <div class="font-sketch text-ink">Food Waste ${i}</div>
            <div class="text-sm text-gray-600">0.5kg • composted</div>
          </div>
        </div>
      `;
      container.appendChild(entry);
    }

    document.body.appendChild(container);
    
    // Measure layout thrashing
    const layoutStart = performance.now();
    container.style.display = 'none';
    container.offsetHeight; // Force reflow
    container.style.display = 'block';
    container.offsetHeight; // Force reflow
    const layoutTime = performance.now() - layoutStart;

    document.body.removeChild(container);
    const totalDuration = performance.now() - start;

    const result: PerformanceTestResult = {
      testName,
      duration: totalDuration,
      status: totalDuration < 50 ? 'pass' : 'warning',
      metrics: {
        renderTime: totalDuration,
        layoutThrashTime: layoutTime,
        elementsCreated: 100
      },
      recommendations: [
        totalDuration > 50 ? 'Use virtual scrolling for large lists' : '',
        layoutTime > 10 ? 'Minimize DOM manipulations' : '',
        'Implement lazy loading for below-fold content'
      ].filter(Boolean)
    };

    this.results.push(result);
    return result;
  }

  // Test font loading performance
  async testFontLoadingPerformance(): Promise<PerformanceTestResult> {
    const testName = 'Font Loading';
    const start = performance.now();

    const fonts = [
      'Patrick Hand',
      'Kalam'
    ];

    const fontPromises = fonts.map(async (fontFamily) => {
      const fontStart = performance.now();
      
      try {
        // Check if font is already loaded
        if (document.fonts.check(`16px "${fontFamily}"`)) {
          return { fontFamily, loadTime: 0, status: 'cached' };
        }

        // Wait for font to load
        await document.fonts.load(`16px "${fontFamily}"`);
        const loadTime = performance.now() - fontStart;
        
        return { fontFamily, loadTime, status: 'loaded' };
      } catch (error) {
        return { fontFamily, loadTime: performance.now() - fontStart, status: 'failed' };
      }
    });

    const fontResults = await Promise.all(fontPromises);
    const totalDuration = performance.now() - start;
    const maxLoadTime = Math.max(...fontResults.map(r => r.loadTime));

    const result: PerformanceTestResult = {
      testName,
      duration: totalDuration,
      status: maxLoadTime < 1000 ? 'pass' : maxLoadTime < 3000 ? 'warning' : 'fail',
      metrics: {
        totalFonts: fonts.length,
        maxLoadTime,
        avgLoadTime: fontResults.reduce((sum, r) => sum + r.loadTime, 0) / fonts.length
      },
      recommendations: [
        maxLoadTime > 3000 ? 'Use font-display: swap for better CLS' : '',
        fontResults.some(r => r.status === 'failed') ? 'Add fallback fonts' : '',
        'Preload critical font files'
      ].filter(Boolean)
    };

    this.results.push(result);
    return result;
  }

  // Test memory usage during typical usage
  async testMemoryUsage(): Promise<PerformanceTestResult> {
    const testName = 'Memory Usage';
    
    if (!('memory' in performance)) {
      return {
        testName,
        duration: 0,
        status: 'warning',
        metrics: {},
        recommendations: ['Memory API not available in this browser']
      };
    }

    const memory = (performance as any).memory;
    const initialMemory = memory.usedJSHeapSize;

    // Simulate creating and managing 1000 waste entries
    const entries = [];
    for (let i = 0; i < 1000; i++) {
      entries.push({
        id: `entry_${i}`,
        categoryId: 'food_waste',
        categoryName: 'Food Waste',
        disposal: 'composted',
        weight: Math.random() * 2,
        carbonCredits: Math.floor(Math.random() * 50),
        timestamp: new Date()
      });
    }

    // Simulate processing entries
    entries.forEach(entry => {
      JSON.stringify(entry);
      JSON.parse(JSON.stringify(entry));
    });

    const finalMemory = memory.usedJSHeapSize;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

    const result: PerformanceTestResult = {
      testName,
      duration: 0,
      memoryUsage: memoryIncrease,
      status: memoryIncrease < 5 ? 'pass' : memoryIncrease < 10 ? 'warning' : 'fail',
      metrics: {
        memoryIncrease,
        totalEntries: entries.length,
        memoryPerEntry: memoryIncrease / entries.length
      },
      recommendations: [
        memoryIncrease > 10 ? 'Implement object pooling for entries' : '',
        'Use WeakMap for temporary data references',
        'Consider data pagination for large datasets'
      ].filter(Boolean)
    };

    this.results.push(result);
    return result;
  }

  // Run all performance tests
  async runAllTests(): Promise<PerformanceTestResult[]> {
    console.log('🚀 Running Thailand Waste Diary Performance Test Suite...');
    
    const tests = [
      this.testLocalStoragePerformance(),
      this.testRenderingPerformance(),
      this.testFontLoadingPerformance(),
      this.testMemoryUsage()
    ];

    const results = await Promise.all(tests);
    
    // Generate summary report
    this.generateReport();
    
    return results;
  }

  // Generate performance report
  private generateReport(): void {
    console.log('\n📊 Thailand Waste Diary Performance Report:');
    console.log('=' .repeat(50));

    let totalScore = 0;
    const totalTests = this.results.length;

    this.results.forEach((result, index) => {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      const score = result.status === 'pass' ? 100 : result.status === 'warning' ? 70 : 40;
      totalScore += score;

      console.log(`\n${index + 1}. ${statusIcon} ${result.testName}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      
      if (result.memoryUsage) {
        console.log(`   Memory: ${result.memoryUsage.toFixed(2)}MB`);
      }

      console.log(`   Score: ${score}/100`);

      // Show key metrics
      Object.entries(result.metrics).forEach(([key, value]) => {
        console.log(`   ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
      });

      // Show recommendations
      if (result.recommendations.length > 0) {
        console.log('   Recommendations:');
        result.recommendations.forEach(rec => {
          console.log(`   - ${rec}`);
        });
      }
    });

    const avgScore = totalScore / totalTests;
    console.log(`\n🏆 Overall Score: ${avgScore.toFixed(0)}/100`);
    
    if (avgScore >= 90) {
      console.log('🎉 Excellent performance! App is optimized for daily usage.');
    } else if (avgScore >= 70) {
      console.log('👍 Good performance with room for improvement.');
    } else {
      console.log('⚠️ Performance needs attention for optimal user experience.');
    }

    // Mobile-specific recommendations
    console.log('\n📱 Mobile Performance Recommendations:');
    console.log('- Use CSS contain property for better rendering');
    console.log('- Implement touch gesture debouncing');
    console.log('- Reduce JavaScript bundle size with code splitting');
    console.log('- Use service worker for offline functionality');
    console.log('- Optimize images with WebP format');

    console.log('\n🌍 Thailand-specific Optimizations:');
    console.log('- Cache waste categories data locally');
    console.log('- Use CDN for better connectivity across Thailand');
    console.log('- Implement progressive loading for rural areas');
    console.log('- Add offline mode for unreliable connections');
  }

  // Get test results
  getResults(): PerformanceTestResult[] {
    return this.results;
  }

  // Clear test results
  clearResults(): void {
    this.results = [];
  }
}

// Export singleton instance
export const performanceTestSuite = new PerformanceTestSuite();

// Convenience function to run tests
export async function runPerformanceTests(): Promise<PerformanceTestResult[]> {
  return performanceTestSuite.runAllTests();
}