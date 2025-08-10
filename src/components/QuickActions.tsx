'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Zap, 
  Leaf, 
  Recycle, 
  ShoppingBag,
  Coffee,
  Package,
  Smartphone,
  Check,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  labelTh: string;
  category: string;
  disposal: 'disposed' | 'recycled' | 'composted' | 'avoided';
  weight: number;
  credits: number;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'coffee-cup',
    icon: Coffee,
    label: 'Coffee Cup',
    labelTh: 'แก้วกาแฟ',
    category: 'paper',
    disposal: 'disposed',
    weight: 0.05,
    credits: -2,
    color: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'plastic-bag',
    icon: ShoppingBag,
    label: 'Avoided Bag',
    labelTh: 'ปฏิเสธถุง',
    category: 'plastic_bags',
    disposal: 'avoided',
    weight: 0.02,
    credits: 67,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'food-waste',
    icon: Leaf,
    label: 'Food Scraps',
    labelTh: 'เศษอาหาร',
    category: 'food_waste',
    disposal: 'composted',
    weight: 0.3,
    credits: 15,
    color: 'bg-lime-100 text-lime-700'
  },
  {
    id: 'recycle-bottle',
    icon: Recycle,
    label: 'Recycled Bottle',
    labelTh: 'ขวดรีไซเคิล',
    category: 'plastic_bottles',
    disposal: 'recycled',
    weight: 0.02,
    credits: 5,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'package',
    icon: Package,
    label: 'Cardboard Box',
    labelTh: 'กล่องกระดาษ',
    category: 'paper',
    disposal: 'recycled',
    weight: 0.2,
    credits: 10,
    color: 'bg-yellow-100 text-yellow-700'
  },
  {
    id: 'e-waste',
    icon: Smartphone,
    label: 'Old Phone',
    labelTh: 'โทรศัพท์เก่า',
    category: 'electronics',
    disposal: 'recycled',
    weight: 0.15,
    credits: 30,
    color: 'bg-purple-100 text-purple-700'
  }
];

interface QuickActionsWidgetProps {
  onQuickAdd: (entry: any) => void | Promise<void>;
}

export function QuickActionsWidget({ onQuickAdd }: QuickActionsWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [addedActions, setAddedActions] = useState<Set<string>>(new Set());
  const [todayStats, setTodayStats] = useState({ entries: 0, credits: 0 });

  useEffect(() => {
    // Load recent actions from localStorage
    const stored = localStorage.getItem('recentQuickActions');
    if (stored) {
      setRecentActions(JSON.parse(stored));
    }

    // Calculate today's stats
    const entries = JSON.parse(localStorage.getItem('wasteEntries') || '[]');
    const today = new Date().toDateString();
    const todayEntries = entries.filter((e: any) => 
      new Date(e.timestamp).toDateString() === today
    );
    
    setTodayStats({
      entries: todayEntries.length,
      credits: todayEntries.reduce((sum: number, e: any) => sum + (e.carbonCredits || 0), 0)
    });
  }, []);

  const handleQuickAction = (action: QuickAction) => {
    const entry = {
      id: Date.now().toString(),
      categoryId: action.category,
      categoryName: action.label,
      disposal: action.disposal,
      weight: action.weight,
      carbonCredits: action.credits,
      timestamp: new Date().toISOString(),
      isQuickAction: true
    };

    onQuickAdd(entry);

    // Add to recently added set for animation
    setAddedActions(prev => new Set(prev).add(action.id));
    setTimeout(() => {
      setAddedActions(prev => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }, 2000);

    // Update recent actions
    const newRecent = [action.id, ...recentActions.filter(id => id !== action.id)].slice(0, 4);
    setRecentActions(newRecent);
    localStorage.setItem('recentQuickActions', JSON.stringify(newRecent));

    // Update stats
    setTodayStats(prev => ({
      entries: prev.entries + 1,
      credits: prev.credits + action.credits
    }));

    // Show success feedback
    showSuccessToast(action);
  };

  const showSuccessToast = (action: QuickAction) => {
    // This would integrate with the toast notification system
    const message = action.credits > 0 
      ? `+${action.credits} credits! Great job!`
      : `${action.credits} credits - Consider recycling next time`;
    
    console.log(message); // Placeholder for actual toast
  };

  const getFrequentActions = () => {
    const frequency: Record<string, number> = {};
    recentActions.forEach(id => {
      frequency[id] = (frequency[id] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => quickActions.find(a => a.id === id))
      .filter(Boolean) as QuickAction[];
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 w-80"
          >
            {/* Today's Stats */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {todayStats.entries} entries
                </span>
                <span className={`font-bold ${todayStats.credits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {todayStats.credits > 0 ? '+' : ''}{todayStats.credits} CC
                </span>
              </div>
            </div>

            {/* Frequent Actions */}
            {recentActions.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Frequent
                </div>
                <div className="flex gap-2">
                  {getFrequentActions().map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className={`flex-1 p-2 rounded-lg transition-all ${action.color} ${
                        addedActions.has(action.id) ? 'scale-95 opacity-50' : 'hover:scale-105'
                      }`}
                      disabled={addedActions.has(action.id)}
                    >
                      <action.icon className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-xs">{action.label}</div>
                      {addedActions.has(action.id) && (
                        <Check className="w-3 h-3 mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Quick Actions */}
            <div className="text-xs font-medium text-gray-500 mb-2">Quick Add</div>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map(action => (
                <motion.button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl transition-all ${action.color} ${
                    addedActions.has(action.id) 
                      ? 'scale-95 opacity-50' 
                      : 'hover:scale-105 hover:shadow-md'
                  }`}
                  disabled={addedActions.has(action.id)}
                >
                  <action.icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{action.label}</div>
                  <div className="text-xs opacity-75">{action.weight}kg</div>
                  <div className={`text-xs font-bold mt-1 ${
                    action.credits > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {action.credits > 0 ? '+' : ''}{action.credits} CC
                  </div>
                  {addedActions.has(action.id) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-xl flex items-center justify-center"
                    >
                      <Check className="w-6 h-6 text-green-600" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Custom Entry Link */}
            <button
              onClick={() => {
                setIsExpanded(false);
                // Navigate to manual entry
                window.location.href = '/diary/manual';
              }}
              className="w-full mt-3 p-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Custom Entry →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.95 }}
        className={`relative p-4 rounded-full shadow-lg transition-all ${
          isExpanded 
            ? 'bg-gray-600 text-white rotate-45' 
            : 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
        }`}
      >
        <Zap className="w-6 h-6" />
        
        {/* Pulse animation for attention */}
        {!isExpanded && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </motion.button>

      {/* Keyboard Shortcut Hint */}
      {!isExpanded && (
        <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Press Q for quick add
        </div>
      )}
    </div>
  );
}

// Keyboard shortcut hook
export function useQuickActionsShortcut(onToggle: () => void) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Q key for quick actions
      if (e.key === 'q' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onToggle]);
}

// Smart suggestions based on time of day
export function getSmartSuggestions(): QuickAction[] {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 10) {
    // Morning - likely breakfast waste
    return quickActions.filter(a => 
      ['coffee-cup', 'food-waste'].includes(a.id)
    );
  } else if (hour >= 11 && hour < 14) {
    // Lunch time
    return quickActions.filter(a => 
      ['food-waste', 'plastic-bag', 'package'].includes(a.id)
    );
  } else if (hour >= 17 && hour < 20) {
    // Dinner time
    return quickActions.filter(a => 
      ['food-waste', 'recycle-bottle'].includes(a.id)
    );
  } else {
    // Default suggestions
    return quickActions.slice(0, 3);
  }
}