/**
 * Real-time performance monitoring for Core Web Vitals and custom metrics
 * Comprehensive tracking for Thailand Waste Diary app performance
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  connection?: string;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  timestamp: number;
  sessionId: string;
  userAgent: string;
  viewport: { width: number; height: number };
  errors: PerformanceError[];
}

interface PerformanceError {
  type: 'javascript' | 'resource' | 'network';
  message: string;
  timestamp: number;
  url?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private errors: PerformanceError[] = [];
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver();
      this.initializeErrorTracking();
      this.trackNavigationTiming();
    }
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeObserver(): void {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        // Core Web Vitals tracking
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordMetric('LCP', entry.startTime, 'Lower is better, target <2.5s');
        }
        
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          this.recordMetric('FID', fidEntry.processingStart - fidEntry.startTime, 'Lower is better, target <100ms');
        }
        
        if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as any; // Layout Shift API
          if (!clsEntry.hadRecentInput) {
            this.recordMetric('CLS', clsEntry.value, 'Lower is better, target <0.1');
          }
        }

        // First Contentful Paint
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime, 'Lower is better, target <1.8s');
        }

        // Resource timing for critical resources
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track critical CSS and JS files
          if (resourceEntry.name.includes('.css') || resourceEntry.name.includes('.js')) {
            const resourceName = resourceEntry.name.split('/').pop() || 'unknown';
            this.recordMetric(`resource_${resourceName}`, resourceEntry.duration, 'Resource load time');
          }
        }
      });
    });

    // Observe Core Web Vitals and additional metrics
    try {
      this.observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'resource'] 
      });
    } catch (error) {
      console.warn('Performance Observer setup failed:', error);
    }
  }

  private initializeErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.errors.push({
        type: 'javascript',
        message: event.message,
        timestamp: Date.now(),
        url: event.filename
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.errors.push({
        type: 'javascript',
        message: `Unhandled Promise: ${event.reason}`,
        timestamp: Date.now()
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window && event.target) {
        const target = event.target as any;
        this.errors.push({
          type: 'resource',
          message: `Failed to load: ${target.src || target.href}`,
          timestamp: Date.now(),
          url: target.src || target.href
        });
      }
    }, true);
  }

  private trackNavigationTiming(): void {
    // Wait for navigation timing to be available
    setTimeout(() => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        
        // Time to First Byte
        const ttfb = timing.responseStart - timing.requestStart;
        this.recordMetric('TTFB', ttfb, 'Time to First Byte, target <200ms');
        
        // DOM Content Loaded
        const domLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.recordMetric('DOM_LOADED', domLoaded, 'DOM Content Loaded');
        
        // Full page load
        const pageLoad = timing.loadEventEnd - timing.navigationStart;
        this.recordMetric('PAGE_LOAD', pageLoad, 'Full page load time');
      }
    }, 0);
  }

  private recordMetric(name: string, value: number, description?: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      deviceType: this.getDeviceType(),
      connection: this.getConnectionType()
    };

    this.metrics.push(metric);

    // Alert for poor performance
    this.checkPerformanceThresholds(metric);

    // Store in localStorage for analysis
    this.persistMetric(metric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}: ${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'}`, description || '');
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || 'unknown';
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      'LCP': 2500,  // 2.5s
      'FID': 100,   // 100ms
      'CLS': 0.1    // 0.1
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`⚠️ Poor ${metric.name}: ${metric.value.toFixed(2)} (threshold: ${threshold})`);
      
      // Send to analytics or monitoring service
      this.reportPoorPerformance(metric);
    }
  }

  private persistMetric(metric: PerformanceMetric): void {
    try {
      const stored = localStorage.getItem('performanceMetrics') || '[]';
      const metrics = JSON.parse(stored);
      
      // Keep only last 100 metrics to prevent storage bloat
      metrics.push(metric);
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      localStorage.setItem('performanceMetrics', JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to persist performance metric:', error);
    }
  }

  private reportPoorPerformance(metric: PerformanceMetric): void {
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Analytics service reporting
      // analytics.track('poor_performance', {
      //   metric: metric.name,
      //   value: metric.value,
      //   page: metric.url
      // });
    }
  }

  // Public API for manual performance tracking
  public startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration, 'Custom timing');
    };
  }

  // Get performance summary
  public getPerformanceSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    
    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = 0;
      }
      summary[metric.name] = Math.max(summary[metric.name], metric.value);
    });

    return summary;
  }

  // Memory usage tracking
  public trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryData = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };

      this.recordMetric('MEMORY_USED', memoryData.used, `Memory usage: ${memoryData.used}MB`);
      
      console.log('🧠 Memory Usage:', {
        used: `${memoryData.used}MB`,
        total: `${memoryData.total}MB`,
        limit: `${memoryData.limit}MB`
      });
    }
  }

  // Generate comprehensive performance report
  public generateReport(): PerformanceReport {
    return {
      metrics: [...this.metrics],
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      viewport: { 
        width: window.innerWidth, 
        height: window.innerHeight 
      },
      errors: [...this.errors]
    };
  }

  // Track waste diary specific actions
  public trackWasteEntry(action: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(`WASTE_${action.toUpperCase()}`, duration, `Waste tracking: ${action}`);
    };
  }

  public trackScannerAction(action: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(`SCANNER_${action.toUpperCase()}`, duration, `Scanner: ${action}`);
    };
  }

  // Get optimization recommendations
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const summary = this.getPerformanceSummary();

    if (summary.LCP && summary.LCP > 4000) {
      suggestions.push('🔴 LCP is very slow - optimize largest element loading');
    } else if (summary.LCP && summary.LCP > 2500) {
      suggestions.push('🟡 LCP could be improved - consider image optimization');
    }

    if (summary.FID && summary.FID > 300) {
      suggestions.push('🔴 FID is very high - reduce JavaScript blocking time');
    } else if (summary.FID && summary.FID > 100) {
      suggestions.push('🟡 FID could be improved - optimize JavaScript execution');
    }

    if (summary.CLS && summary.CLS > 0.25) {
      suggestions.push('🔴 CLS is very high - fix layout shifts');
    } else if (summary.CLS && summary.CLS > 0.1) {
      suggestions.push('🟡 CLS could be improved - reserve space for dynamic content');
    }

    if (summary.FCP && summary.FCP > 3000) {
      suggestions.push('🟡 FCP is slow - optimize critical rendering path');
    }

    if (summary.TTFB && summary.TTFB > 600) {
      suggestions.push('🟡 TTFB is slow - optimize server response time');
    }

    if (this.errors.length > 3) {
      suggestions.push(`🔴 Multiple errors detected (${this.errors.length}) - check console`);
    }

    return suggestions;
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance tracking
import { useEffect, useRef, useCallback } from 'react';

export function usePerformanceTracking(componentName: string) {
  const renderStart = useRef(performance.now());
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const renderTime = performance.now() - renderStart.current;
    
    // Track component mount time
    const endTiming = performanceMonitor.startTiming(`${componentName.toUpperCase()}_MOUNT`);
    endTiming();
    
    return () => {
      mounted.current = false;
    };
  }, [componentName]);

  // Custom timing utility
  const trackAction = useCallback((actionName: string) => {
    return performanceMonitor.startTiming(`${componentName}_${actionName}`);
  }, [componentName]);

  // Track waste diary specific actions
  const trackWasteAction = useCallback((action: string) => {
    return performanceMonitor.trackWasteEntry(action);
  }, []);

  const trackScanAction = useCallback((action: string) => {
    return performanceMonitor.trackScannerAction(action);
  }, []);

  // Get performance metrics for this component
  const getComponentMetrics = useCallback(() => {
    const allMetrics = performanceMonitor.getPerformanceSummary();
    const componentMetrics: Record<string, number> = {};
    
    Object.entries(allMetrics).forEach(([key, value]) => {
      if (key.toLowerCase().includes(componentName.toLowerCase())) {
        componentMetrics[key] = value;
      }
    });
    
    return componentMetrics;
  }, [componentName]);

  return { 
    trackAction, 
    trackWasteAction, 
    trackScanAction,
    getComponentMetrics 
  };
}

// Web Vitals scoring function
export function scoreWebVitals() {
  const summary = performanceMonitor.getPerformanceSummary();
  let score = 100;

  // LCP scoring
  if (summary.LCP) {
    if (summary.LCP > 4000) score -= 30;
    else if (summary.LCP > 2500) score -= 15;
  }

  // FID scoring  
  if (summary.FID) {
    if (summary.FID > 300) score -= 25;
    else if (summary.FID > 100) score -= 10;
  }

  // CLS scoring
  if (summary.CLS) {
    if (summary.CLS > 0.25) score -= 25;
    else if (summary.CLS > 0.1) score -= 10;
  }

  return Math.max(0, score);
}