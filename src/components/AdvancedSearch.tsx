'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Filter, X, Calendar, TrendingUp, Lightbulb, ChevronDown } from 'lucide-react';
import type { WasteEntry, DisposalMethod } from '@/types/waste';

interface SearchFilters {
  query: string;
  categories: string[];
  disposalMethods: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  creditRange: {
    min: number;
    max: number;
  };
  weightRange: {
    min: number;
    max: number;
  };
  sortBy: 'date' | 'credits' | 'weight' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

interface AISearchSuggestion {
  id: string;
  type: 'category' | 'pattern' | 'insight' | 'tip';
  title: string;
  description: string;
  action?: () => void;
  priority: number;
}

export default function AdvancedSearch({ 
  entries, 
  onResultsChange 
}: { 
  entries: WasteEntry[]; 
  onResultsChange: (results: WasteEntry[]) => void; 
}) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    disposalMethods: [],
    dateRange: { start: null, end: null },
    creditRange: { min: -100, max: 100 },
    weightRange: { min: 0, max: 10 },
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilters({
      query: '',
      categories: [],
      disposalMethods: [],
      dateRange: { start: null, end: null },
      creditRange: { min: -100, max: 100 },
      weightRange: { min: 0, max: 10 },
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }, []);

  // Available categories and disposal methods
  const availableCategories = [
    'food_waste', 'plastic_bottles', 'plastic_bags', 'paper_cardboard',
    'glass_bottles', 'metal_cans', 'organic_waste', 'electronic_waste'
  ];

  const availableDisposalMethods: DisposalMethod[] = [
    'disposed', 'recycled', 'composted', 'avoided', 'reused'
  ];

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('wasteSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((searchFilters: SearchFilters) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const results = performSearch(entries, searchFilters);
      onResultsChange(results);
      
      // Generate AI suggestions based on search results
      const suggestions = generateAISuggestions(searchFilters, results, entries);
      setAiSuggestions(suggestions);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, onResultsChange]);

  // Trigger search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  const performSearch = (allEntries: WasteEntry[], searchFilters: SearchFilters): WasteEntry[] => {
    let results = [...allEntries];

    // Text search
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase();
      results = results.filter(entry =>
        entry.categoryName.toLowerCase().includes(query) ||
        entry.disposal.toLowerCase().includes(query) ||
        entry.categoryId.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (searchFilters.categories.length > 0) {
      results = results.filter(entry => 
        searchFilters.categories.includes(entry.categoryId)
      );
    }

    // Disposal method filter
    if (searchFilters.disposalMethods.length > 0) {
      results = results.filter(entry => 
        searchFilters.disposalMethods.includes(entry.disposal)
      );
    }

    // Date range filter
    if (searchFilters.dateRange.start || searchFilters.dateRange.end) {
      results = results.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const start = searchFilters.dateRange.start;
        const end = searchFilters.dateRange.end;
        
        if (start && entryDate < start) return false;
        if (end && entryDate > end) return false;
        return true;
      });
    }

    // Credit range filter
    results = results.filter(entry => 
      entry.carbonCredits >= searchFilters.creditRange.min &&
      entry.carbonCredits <= searchFilters.creditRange.max
    );

    // Weight range filter
    results = results.filter(entry => 
      entry.weight >= searchFilters.weightRange.min &&
      entry.weight <= searchFilters.weightRange.max
    );

    // Sorting
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (searchFilters.sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'credits':
          comparison = a.carbonCredits - b.carbonCredits;
          break;
        case 'weight':
          comparison = a.weight - b.weight;
          break;
        case 'relevance':
          // Simple relevance scoring based on query match
          if (searchFilters.query.trim()) {
            const query = searchFilters.query.toLowerCase();
            const aScore = (a.categoryName.toLowerCase().includes(query) ? 2 : 0) + 
                          (a.disposal.toLowerCase().includes(query) ? 1 : 0);
            const bScore = (b.categoryName.toLowerCase().includes(query) ? 2 : 0) + 
                          (b.disposal.toLowerCase().includes(query) ? 1 : 0);
            comparison = bScore - aScore;
          }
          break;
      }

      return searchFilters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return results;
  };

  const generateAISuggestions = (
    searchFilters: SearchFilters, 
    results: WasteEntry[], 
    allEntries: WasteEntry[]
  ): AISearchSuggestion[] => {
    const suggestions: AISearchSuggestion[] = [];

    // Pattern recognition suggestions
    if (results.length > 0) {
      const mostCommonCategory = findMostCommon(results.map(r => r.categoryName));
      const avgCredits = results.reduce((sum, r) => sum + r.carbonCredits, 0) / results.length;
      
      if (mostCommonCategory) {
        suggestions.push({
          id: 'pattern-category',
          type: 'pattern',
          title: `Most common: ${mostCommonCategory}`,
          description: `${Math.round((results.filter(r => r.categoryName === mostCommonCategory).length / results.length) * 100)}% of your results`,
          priority: 8
        });
      }

      if (avgCredits > 0) {
        suggestions.push({
          id: 'insight-positive',
          type: 'insight',
          title: 'Great sustainable choices! 🌱',
          description: `Average ${Math.round(avgCredits)} credits per item in these results`,
          priority: 7
        });
      } else if (avgCredits < -10) {
        suggestions.push({
          id: 'tip-improvement',
          type: 'tip',
          title: 'Improvement opportunity',
          description: 'Consider recycling or composting these items for better credits',
          priority: 9
        });
      }
    }

    // Category suggestions based on search query
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase();
      const matchingCategories = availableCategories.filter(cat => 
        cat.includes(query) || getCategoryName(cat).toLowerCase().includes(query)
      );
      
      matchingCategories.forEach(cat => {
        if (!searchFilters.categories.includes(cat)) {
          suggestions.push({
            id: `suggest-category-${cat}`,
            type: 'category',
            title: `Add ${getCategoryName(cat)} filter`,
            description: `Filter by ${getCategoryName(cat)} category`,
            action: () => {
              setFilters(prev => ({
                ...prev,
                categories: [...prev.categories, cat]
              }));
            },
            priority: 6
          });
        }
      });
    }

    // Time-based insights
    const recentEntries = allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    if (recentEntries.length > 5) {
      suggestions.push({
        id: 'insight-recent',
        type: 'insight',
        title: 'Active tracking! 📊',
        description: `${recentEntries.length} entries in the past week`,
        action: () => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          setFilters(prev => ({
            ...prev,
            dateRange: { start: weekAgo, end: new Date() }
          }));
        },
        priority: 5
      });
    }

    // Smart filter suggestions
    if (results.length === 0 && searchFilters.query.trim()) {
      suggestions.push({
        id: 'tip-broaden',
        type: 'tip',
        title: 'No results found',
        description: 'Try broadening your search or check your filters',
        action: clearAllFilters,
        priority: 10
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
  };

  const findMostCommon = (items: string[]): string | null => {
    if (items.length === 0) return null;
    
    const counts: { [key: string]: number } = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const getCategoryName = (categoryId: string): string => {
    const names: { [key: string]: string } = {
      'food_waste': 'Food Waste',
      'plastic_bottles': 'Plastic Bottles',
      'plastic_bags': 'Plastic Bags',
      'paper_cardboard': 'Paper/Cardboard',
      'glass_bottles': 'Glass Bottles',
      'metal_cans': 'Metal Cans',
      'organic_waste': 'Organic Waste',
      'electronic_waste': 'Electronic Waste'
    };
    return names[categoryId] || categoryId;
  };

  const handleQueryChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
    
    // Save to search history if non-empty
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 9)]; // Keep only 10 items
      setSearchHistory(newHistory);
      localStorage.setItem('wasteSearchHistory', JSON.stringify(newHistory));
    }
  };


  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleDisposalMethod = (method: string) => {
    setFilters(prev => ({
      ...prev,
      disposalMethods: prev.disposalMethods.includes(method)
        ? prev.disposalMethods.filter(m => m !== method)
        : [...prev.disposalMethods, method]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Advanced Search
        </h3>
        <button
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filters
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search waste entries... (e.g. 'plastic recycled', 'food waste')"
          value={filters.query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {filters.query && (
          <button
            onClick={() => handleQueryChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search History Dropdown */}
        {showSuggestions && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            <div className="p-2 text-xs text-gray-500 border-b">Recent searches:</div>
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQueryChange(item)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">Smart suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={suggestion.action}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  suggestion.type === 'tip' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                  suggestion.type === 'insight' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                  suggestion.type === 'pattern' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                  'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
                title={suggestion.description}
              >
                {suggestion.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {isFilterPanelOpen && (
        <div className="border-t pt-4 space-y-4">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryName(category)}
                </button>
              ))}
            </div>
          </div>

          {/* Disposal Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disposal Methods</label>
            <div className="flex flex-wrap gap-2">
              {availableDisposalMethods.map(method => (
                <button
                  key={method}
                  onClick={() => toggleDisposalMethod(method)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors capitalize ${
                    filters.disposalMethods.includes(method)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="date">Date</option>
                <option value="credits">Carbon Credits</option>
                <option value="weight">Weight</option>
                <option value="relevance">Relevance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}