'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface WasteEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  disposal: string;
  weight: number;
  carbonCredits: number;
  timestamp: string;
}

export default function HistoryPage() {
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  useEffect(() => {
    const entries = JSON.parse(localStorage.getItem('wasteEntries') || '[]');
    setWasteEntries(entries);
  }, []);

  // Group entries by date
  const entriesByDate = wasteEntries.reduce((acc, entry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, WasteEntry[]>);

  // Get unique dates with entries
  const datesWithEntries = Object.keys(entriesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Calculate stats
  const totalEntries = wasteEntries.length;
  const totalCredits = wasteEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
  const totalWeight = wasteEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const treesSaved = Math.floor(totalCredits / 500);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
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
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-sketch transition-colors ${
                viewMode === 'list' 
                  ? 'bg-green-leaf text-white' 
                  : 'bg-white text-carbon hover:bg-gray-50'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-sketch transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-green-leaf text-white' 
                  : 'bg-white text-carbon hover:bg-gray-50'
              }`}
            >
              📅 Calendar View
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-handwritten text-carbon mb-2 sketch-element">
          📚 Waste Diary History
        </h1>
        <p className="text-pencil font-sketch">
          Track your environmental journey over time
        </p>
      </div>

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

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {wasteEntries.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center sketch-element">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-2xl font-handwritten text-carbon mb-2">No Entries Yet</h3>
            <p className="text-pencil font-sketch mb-6">
              Start tracking your waste to see your history here!
            </p>
            <Link 
              href="/diary" 
              className="inline-block px-6 py-3 bg-green-leaf text-white rounded-lg font-sketch hover:bg-green-600 transition-colors"
            >
              🚀 Start Tracking
            </Link>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}