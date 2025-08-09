/**
 * Data Export Service
 * Handles CSV, JSON, and report generation for waste diary data
 */

export interface WasteEntryExport {
  id: string;
  categoryId: string;
  categoryName: string;
  disposal: string;
  weight: number;
  carbonCredits: number;
  timestamp: string;
}

export interface ExportSummary {
  totalEntries: number;
  totalWeight: number;
  totalCredits: number;
  treesSaved: number;
  topCategory: string;
  favoriteDisposal: string;
  dailyAverage: number;
  weeklyData: Array<{ week: string; entries: number; credits: number }>;
  monthlyData: Array<{ month: string; entries: number; credits: number }>;
  categoryBreakdown: Array<{ category: string; count: number; weight: number; credits: number }>;
  co2Impact: number;
  energySaved: number;
  plasticAvoided: number;
  level: string;
}

export type DateRange = 'all' | 'month' | 'week' | 'today';
export type ExportFormat = 'csv' | 'json';

class DataExportService {
  // Filter entries by date range
  filterEntriesByDateRange(entries: WasteEntryExport[], range: DateRange): WasteEntryExport[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return entries.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= today;
        });
      
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entries.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= weekAgo;
        });
      
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return entries.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= monthAgo;
        });
      
      case 'all':
      default:
        return entries;
    }
  }

  // Generate comprehensive summary data
  generateSummary(entries: WasteEntryExport[], totalCredits: number): ExportSummary {
    if (entries.length === 0) {
      return this.getEmptySummary();
    }

    // Basic metrics
    const totalEntries = entries.length;
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    const treesSaved = Math.floor(Math.max(0, totalCredits) / 500);
    
    // Category analysis
    const categoryStats = new Map<string, { count: number; weight: number; credits: number }>();
    const disposalStats = new Map<string, number>();
    
    entries.forEach(entry => {
      // Category stats
      const categoryKey = entry.categoryName;
      const existing = categoryStats.get(categoryKey) || { count: 0, weight: 0, credits: 0 };
      categoryStats.set(categoryKey, {
        count: existing.count + 1,
        weight: existing.weight + entry.weight,
        credits: existing.credits + entry.carbonCredits,
      });
      
      // Disposal stats
      disposalStats.set(entry.disposal, (disposalStats.get(entry.disposal) || 0) + 1);
    });

    // Top category and disposal method
    const topCategory = Array.from(categoryStats.entries())
      .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'Unknown';
    
    const favoriteDisposal = Array.from(disposalStats.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'disposed';

    // Time-based analysis
    const dailyAverage = this.calculateDailyAverage(entries);
    const weeklyData = this.generateWeeklyData(entries);
    const monthlyData = this.generateMonthlyData(entries);

    // Environmental impact
    const co2Impact = Math.abs(totalCredits) * 1; // 1 credit ≈ 1g CO₂
    const energySaved = totalCredits > 0 ? totalCredits * 0.001 : 0; // kWh
    const plasticAvoided = this.calculatePlasticAvoided(entries);

    // User level
    const level = this.calculateLevel(totalCredits);

    return {
      totalEntries,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      treesSaved,
      topCategory,
      favoriteDisposal,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      weeklyData,
      monthlyData,
      categoryBreakdown: Array.from(categoryStats.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        weight: Math.round(stats.weight * 100) / 100,
        credits: Math.round(stats.credits * 100) / 100,
      })),
      co2Impact: Math.round(co2Impact),
      energySaved: Math.round(energySaved * 1000) / 1000,
      plasticAvoided: Math.round(plasticAvoided * 100) / 100,
      level,
    };
  }

  // Export to CSV format
  exportToCSV(entries: WasteEntryExport[], filename?: string): void {
    const csvContent = this.generateCSVContent(entries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename || `waste-diary-${this.formatDate(new Date())}.csv`);
  }

  // Export to JSON format
  exportToJSON(entries: WasteEntryExport[], summary: ExportSummary, filename?: string): void {
    const jsonData = {
      exportDate: new Date().toISOString(),
      summary,
      entries: entries.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp).toISOString(),
      })),
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.downloadFile(blob, filename || `waste-diary-${this.formatDate(new Date())}.json`);
  }

  // Generate CSV content
  private generateCSVContent(entries: WasteEntryExport[]): string {
    const headers = [
      'Date',
      'Time',
      'Category',
      'Disposal Method',
      'Weight (kg)',
      'Carbon Credits',
      'CO₂ Impact (g)',
      'Entry ID',
    ];

    const csvRows = [headers.join(',')];

    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const row = [
        date.toLocaleDateString('en-CA'), // YYYY-MM-DD format
        date.toLocaleTimeString('en-US', { hour12: false }),
        `"${entry.categoryName}"`,
        entry.disposal,
        entry.weight.toString(),
        entry.carbonCredits.toString(),
        Math.abs(entry.carbonCredits).toString(),
        entry.id,
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Helper methods
  private getEmptySummary(): ExportSummary {
    return {
      totalEntries: 0,
      totalWeight: 0,
      totalCredits: 0,
      treesSaved: 0,
      topCategory: 'None',
      favoriteDisposal: 'None',
      dailyAverage: 0,
      weeklyData: [],
      monthlyData: [],
      categoryBreakdown: [],
      co2Impact: 0,
      energySaved: 0,
      plasticAvoided: 0,
      level: 'Eco Beginner 🌱',
    };
  }

  private calculateDailyAverage(entries: WasteEntryExport[]): number {
    if (entries.length === 0) return 0;

    const dates = new Set(
      entries.map(entry => new Date(entry.timestamp).toDateString())
    );
    
    return entries.length / dates.size;
  }

  private generateWeeklyData(entries: WasteEntryExport[]): Array<{ week: string; entries: number; credits: number }> {
    const weeklyMap = new Map<string, { entries: number; credits: number }>();

    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weeklyMap.get(weekKey) || { entries: 0, credits: 0 };
      weeklyMap.set(weekKey, {
        entries: existing.entries + 1,
        credits: existing.credits + entry.carbonCredits,
      });
    });

    return Array.from(weeklyMap.entries())
      .map(([week, data]) => ({
        week,
        entries: data.entries,
        credits: Math.round(data.credits * 100) / 100,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12); // Last 12 weeks
  }

  private generateMonthlyData(entries: WasteEntryExport[]): Array<{ month: string; entries: number; credits: number }> {
    const monthlyMap = new Map<string, { entries: number; credits: number }>();

    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthlyMap.get(monthKey) || { entries: 0, credits: 0 };
      monthlyMap.set(monthKey, {
        entries: existing.entries + 1,
        credits: existing.credits + entry.carbonCredits,
      });
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        entries: data.entries,
        credits: Math.round(data.credits * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  private calculatePlasticAvoided(entries: WasteEntryExport[]): number {
    return entries
      .filter(entry => 
        (entry.categoryId.includes('plastic') || entry.categoryName.toLowerCase().includes('plastic')) &&
        entry.disposal === 'avoided'
      )
      .reduce((sum, entry) => sum + entry.weight, 0);
  }

  private calculateLevel(totalCredits: number): string {
    const levels = [
      { min: 0, name: 'Eco Beginner 🌱' },
      { min: 100, name: 'Green Explorer 🌿' },
      { min: 500, name: 'Eco Warrior 💚' },
      { min: 1500, name: 'Climate Champion 🌍' },
      { min: 3000, name: 'Planet Protector 🛡️' },
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalCredits >= levels[i].min) {
        return levels[i].name;
      }
    }

    return levels[0].name;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const dataExportService = new DataExportService();