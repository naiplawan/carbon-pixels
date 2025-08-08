'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, TrendingUp } from 'lucide-react';
import AdvancedSearch from '@/components/AdvancedSearch';
import type { WasteEntry } from '@/types/waste';

export default function HistoryPage() {
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WasteEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'analytics'>('list');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const entries = JSON.parse(localStorage.getItem('wasteEntries') || '[]');
    setWasteEntries(entries);
    setFilteredEntries(entries); // Initialize filtered entries
  }, []);

  // Update filtered entries display data
  const displayEntries = showSearch ? filteredEntries : wasteEntries;

  // Group entries by date (use displayEntries for search results)
  const entriesByDate = displayEntries.reduce((acc, entry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, WasteEntry[]>);

  // Get unique dates with entries
  const datesWithEntries = Object.keys(entriesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Calculate stats (use displayEntries for search results)
  const totalEntries = displayEntries.length;
  const totalCredits = displayEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
  const totalWeight = displayEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const treesSaved = Math.floor(totalCredits / 500);

  // Analytics data
  const getAnalyticsData = () => {
    const categoryStats: { [key: string]: { count: number; weight: number; credits: number } } = {};
    const disposalStats: { [key: string]: { count: number; weight: number; credits: number } } = {};
    
    displayEntries.forEach(entry => {
      // Category stats
      if (!categoryStats[entry.categoryName]) {
        categoryStats[entry.categoryName] = { count: 0, weight: 0, credits: 0 };
      }
      categoryStats[entry.categoryName].count++;
      categoryStats[entry.categoryName].weight += entry.weight;
      categoryStats[entry.categoryName].credits += entry.carbonCredits;
      
      // Disposal stats
      if (!disposalStats[entry.disposal]) {
        disposalStats[entry.disposal] = { count: 0, weight: 0, credits: 0 };
      }
      disposalStats[entry.disposal].count++;
      disposalStats[entry.disposal].weight += entry.weight;
      disposalStats[entry.disposal].credits += entry.carbonCredits;
    });
    
    return { categoryStats, disposalStats };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getDisposalIcon = (disposal: string) => {
    switch (disposal) {
      case 'disposed': return '🗑️';
      case 'recycled': return '♻️';
      case 'composted': return '🌱';
      case 'avoided': return '🚫';
      default: return '📝';
    }
  };

  const getDisposalLabel = (disposal: string) => {
    switch (disposal) {
      case 'disposed': return 'Disposed';
      case 'recycled': return 'Recycled';
      case 'composted': return 'Composted';
      case 'avoided': return 'Avoided';
      default: return disposal;
    }
  };

  return (
    <div className="min-h-screen bg-paper p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/diary" 
            className="flex items-center text-carbon hover:text-green-leaf transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="font-sketch">Back to Dashboard</span>
          </Link>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`px-3 py-2 rounded-lg font-sketch transition-colors ${
                showSearch 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-carbon hover:bg-gray-50'
              }`}
            >
              🔍 {showSearch ? 'Hide' : 'Search'}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg font-sketch transition-colors ${
                viewMode === 'list' 
                  ? 'bg-green-leaf text-white' 
                  : 'bg-white text-carbon hover:bg-gray-50'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-2 rounded-lg font-sketch transition-colors ${
                viewMode === 'analytics' 
                  ? 'bg-green-leaf text-white' 
                  : 'bg-white text-carbon hover:bg-gray-50'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-lg font-sketch transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-green-leaf text-white' 
                  : 'bg-white text-carbon hover:bg-gray-50'
              }`}
            >
              📅 Calendar
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-handwritten text-carbon mb-2 sketch-element">
          📚 Waste Diary History
        </h1>
        <p className="text-pencil font-sketch">
          Track your environmental journey over time{showSearch && ' - Showing search results'}
        </p>
      </div>

      {/* Advanced Search */}
      {showSearch && (
        <div className="max-w-4xl mx-auto mb-8">
          <AdvancedSearch
            entries={wasteEntries}
            onResultsChange={(results) => {
              setFilteredEntries(results);
            }}
          />
        </div>
      )}

      {/* Summary Stats */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 sketch-element">
            <div className="text-2xl font-handwritten text-carbon">📊</div>
            <div className="text-2xl font-handwritten text-carbon">{totalEntries}</div>
            <div className="text-sm font-sketch text-pencil">Total Entries</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 sketch-element">
            <div className="text-2xl font-handwritten text-carbon">⚖️</div>
            <div className="text-2xl font-handwritten text-carbon">{totalWeight.toFixed(1)}kg</div>
            <div className="text-sm font-sketch text-pencil">Total Weight</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 sketch-element">
            <div className="text-2xl font-handwritten text-carbon">💚</div>
            <div className={`text-2xl font-handwritten ${totalCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalCredits > 0 ? '+' : ''}{totalCredits} CC
            </div>
            <div className="text-sm font-sketch text-pencil">Carbon Credits</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 sketch-element">
            <div className="text-2xl font-handwritten text-carbon">🌳</div>
            <div className="text-2xl font-handwritten text-green-600">{treesSaved}</div>
            <div className="text-sm font-sketch text-pencil">Trees Saved</div>
          </div>
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && displayEntries.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          {(() => {
            const { categoryStats, disposalStats } = getAnalyticsData();
            return (
              <div className="space-y-6">
                {/* Category Analytics */}
                <div className="bg-white rounded-lg p-6 sketch-element">
                  <h3 className="text-2xl font-handwritten text-carbon mb-4 flex items-center">
                    📊 Category Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(categoryStats)
                      .sort(([,a], [,b]) => b.count - a.count)
                      .map(([category, stats]) => (
                        <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-sketch text-carbon">{category}</div>
                            <div className="text-sm text-pencil">
                              {stats.count} entries • {stats.weight.toFixed(1)}kg
                            </div>
                          </div>
                          <div className={`font-handwritten text-lg ${
                            stats.credits >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stats.credits > 0 ? '+' : ''}{stats.credits} CC
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Disposal Methods Analytics */}
                <div className="bg-white rounded-lg p-6 sketch-element">
                  <h3 className="text-2xl font-handwritten text-carbon mb-4 flex items-center">
                    ♻️ Disposal Methods
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(disposalStats)
                      .sort(([,a], [,b]) => b.count - a.count)
                      .map(([method, stats]) => (
                        <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getDisposalIcon(method)}</span>
                            <div>
                              <div className="font-sketch text-carbon capitalize">{method}</div>
                              <div className="text-sm text-pencil">
                                {stats.count} entries • {stats.weight.toFixed(1)}kg
                              </div>
                            </div>
                          </div>
                          <div className={`font-handwritten text-lg ${
                            stats.credits >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stats.credits > 0 ? '+' : ''}{stats.credits} CC
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 sketch-element border-2 border-green-200">
                  <h3 className="text-2xl font-handwritten text-carbon mb-4 flex items-center">
                    💡 Smart Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {(() => {
                      const insights = [];
                      const avgCreditsPerEntry = totalCredits / totalEntries;
                      const avgWeightPerEntry = totalWeight / totalEntries;
                      
                      if (avgCreditsPerEntry > 10) {
                        insights.push(`🌟 Excellent! You're averaging ${avgCreditsPerEntry.toFixed(1)} credits per entry.`);
                      } else if (avgCreditsPerEntry < 0) {
                        insights.push(`⚠️ Consider more recycling - you're averaging ${avgCreditsPerEntry.toFixed(1)} credits per entry.`);
                      }
                      
                      const recycledCount = disposalStats['recycled']?.count || 0;
                      const recyclingRate = (recycledCount / totalEntries * 100);
                      if (recyclingRate > 50) {
                        insights.push(`♻️ Great recycling habit! ${recyclingRate.toFixed(0)}% of your waste is recycled.`);
                      } else if (recyclingRate < 25) {
                        insights.push(`📈 Try to recycle more - only ${recyclingRate.toFixed(0)}% of your waste is currently recycled.`);
                      }
                      
                      const topCategory = Object.entries(categoryStats).sort(([,a], [,b]) => b.count - a.count)[0];
                      if (topCategory) {
                        insights.push(`📊 Most tracked: ${topCategory[0]} (${topCategory[1].count} entries)`);
                      }
                      
                      if (treesSaved > 0) {
                        insights.push(`🌳 Amazing! You've saved ${treesSaved} tree equivalent${treesSaved > 1 ? 's' : ''}.`);
                      }
                      
                      return insights.map((insight, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                          <p className="font-sketch text-carbon">{insight}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {displayEntries.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center sketch-element">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-2xl font-handwritten text-carbon mb-2">
              {showSearch ? 'No Matching Entries' : 'No Entries Yet'}
            </h3>
            <p className="text-pencil font-sketch mb-6">
              {showSearch ? 
                'Try adjusting your search filters or clearing your search.' :
                'Start tracking your waste to see your history here!'
              }
            </p>
            {showSearch ? (
              <button
                onClick={() => setShowSearch(false)}
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg font-sketch hover:bg-blue-600 transition-colors"
              >
                🔍 Clear Search
              </button>
            ) : (
              <Link 
                href="/diary" 
                className="inline-block px-6 py-3 bg-green-leaf text-white rounded-lg font-sketch hover:bg-green-600 transition-colors"
              >
                🚀 Start Tracking
              </Link>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-6">
            {datesWithEntries.map(dateString => {
              const entries = entriesByDate[dateString];
              const dayCredits = entries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
              const dayWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
              
              return (
                <div key={dateString} className="bg-white rounded-lg p-6 sketch-element">
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-gray-200">
                    <div>
                      <h3 className="text-xl font-handwritten text-carbon">
                        📅 {formatDate(dateString)}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm font-sketch text-pencil">
                        <span>⚖️ {dayWeight.toFixed(1)}kg</span>
                        <span className={dayCredits >= 0 ? 'text-green-600' : 'text-red-600'}>
                          💚 {dayCredits > 0 ? '+' : ''}{dayCredits} CC
                        </span>
                        <span>📝 {entries.length} entries</span>
                      </div>
                    </div>
                  </div>

                  {/* Entries */}
                  <div className="space-y-3">
                    {entries
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {getDisposalIcon(entry.disposal)}
                            </div>
                            <div>
                              <div className="font-sketch text-carbon">
                                {entry.categoryName} • {entry.weight}kg
                              </div>
                              <div className="text-sm text-pencil">
                                {getDisposalLabel(entry.disposal)} • {formatTime(entry.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className={`text-lg font-handwritten ${
                            entry.carbonCredits >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.carbonCredits > 0 ? '+' : ''}{entry.carbonCredits} CC
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="bg-white rounded-lg p-8 text-center sketch-element">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-handwritten text-carbon mb-2">Calendar View Coming Soon!</h3>
            <p className="text-pencil font-sketch mb-6">
              Calendar visualization is under development. Use List or Analytics view for now.
            </p>
            <button
              onClick={() => setViewMode('list')}
              className="px-6 py-3 bg-green-leaf text-white rounded-lg font-sketch hover:bg-green-600 transition-colors"
            >
              📋 Switch to List View
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}