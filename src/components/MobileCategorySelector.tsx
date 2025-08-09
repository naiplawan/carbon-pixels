'use client';

import { useState, useEffect } from 'react';
import wasteCategories from '@/data/thailand-waste-categories.json';

// Touch feedback utilities
const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100
    };
    navigator.vibrate(patterns[type]);
  }
};

const addTouchFeedback = (element: HTMLElement) => {
  element.style.transition = 'all 0.1s ease-out';
  element.style.transform = 'scale(0.98)';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
};

interface MobileCategorySelectorProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  showDetails?: boolean;
  className?: string;
}

export default function MobileCategorySelector({
  selectedCategory,
  onCategorySelect,
  showDetails = true,
  className = ''
}: MobileCategorySelectorProps) {
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);

  useEffect(() => {
    if (selectedCategory) {
      const categoryData = wasteCategories.wasteCategories.find(
        cat => cat.id === selectedCategory
      );
      setSelectedCategoryData(categoryData);
    } else {
      setSelectedCategoryData(null);
    }
  }, [selectedCategory]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Selection Header */}
      <div className="text-center">
        <h3 className="text-xl font-handwritten text-ink mb-2">
          What type of waste? 🗑️
        </h3>
        <p className="text-sm font-sketch text-gray-600">
          Select the category that best matches your waste item
        </p>
      </div>

      {/* Category Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-4">
        {wasteCategories.wasteCategories.map((category) => (
          <button
            key={category.id}
            onClick={(e) => {
              hapticFeedback('medium');
              addTouchFeedback(e.currentTarget);
              onCategorySelect(category.id);
            }}
            className={`
              min-h-[88px] p-5 border-3 rounded-2xl text-center transition-all duration-200 
              flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md
              active:shadow-sm transform active:scale-95
              ${selectedCategory === category.id
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-800 ring-4 ring-green-200 shadow-lg'
                : 'border-gray-300 bg-white hover:border-green-400 hover:bg-gradient-to-br hover:from-green-25 hover:to-green-50 text-gray-700 active:border-green-500 active:bg-green-100'
              }
            `}
            style={{ touchAction: 'manipulation' }}
            aria-label={`Select ${category.name} waste category`}
            aria-pressed={selectedCategory === category.id}
          >
            <div className="text-4xl mb-1">{category.icon}</div>
            <div className="font-sketch text-sm font-semibold leading-tight">
              {category.name}
            </div>
            <div className="text-xs text-gray-500 font-sketch">
              {category.nameLocal}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Category Details */}
      {showDetails && selectedCategoryData && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-5 shadow-inner">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl">{selectedCategoryData.icon}</div>
            <div className="flex-1">
              <h4 className="font-handwritten text-lg text-blue-900 mb-1">
                {selectedCategoryData.name}
              </h4>
              <p className="text-sm text-blue-700 font-sketch">
                {selectedCategoryData.nameLocal}
              </p>
              {selectedCategoryData.description && (
                <p className="text-sm text-blue-600 mt-2 leading-relaxed">
                  {selectedCategoryData.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Examples */}
          {selectedCategoryData.examples && selectedCategoryData.examples.length > 0 && (
            <div className="bg-white/60 rounded-xl p-3 mb-3">
              <h5 className="font-sketch text-blue-800 mb-2 text-sm font-semibold">
                📦 Common Examples:
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedCategoryData.examples.map((example: string, index: number) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-200 text-blue-800 text-xs px-3 py-1 rounded-full font-sketch"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Carbon Credits Preview */}
          {selectedCategoryData.carbonCredits && (
            <div className="bg-white/60 rounded-xl p-3">
              <h5 className="font-sketch text-blue-800 mb-2 text-sm font-semibold">
                💳 Carbon Credits by Disposal Method:
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(selectedCategoryData.carbonCredits).map(([method, credits]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="text-xs font-sketch text-blue-700 capitalize">
                      {method.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      (credits as number) > 0 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {(credits as number) > 0 ? '+' : ''}{credits as number} CC/kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!selectedCategory && (
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-2xl mb-2">🤔</div>
          <p className="text-sm font-sketch text-gray-600">
            Not sure which category? Most items fall into plastic, food waste, or paper.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactCategorySelector({
  selectedCategory,
  onCategorySelect,
  className = ''
}: Omit<MobileCategorySelectorProps, 'showDetails'>) {
  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-4 gap-2">
        {wasteCategories.wasteCategories.map((category) => (
          <button
            key={category.id}
            onClick={(e) => {
              hapticFeedback('light');
              addTouchFeedback(e.currentTarget);
              onCategorySelect(category.id);
            }}
            className={`
              min-h-[64px] min-w-[64px] p-3 border-2 rounded-xl text-center transition-all duration-150
              flex flex-col items-center justify-center gap-1 shadow-sm
              ${selectedCategory === category.id
                ? 'border-green-500 bg-green-50 text-green-800 ring-2 ring-green-200'
                : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-25 text-gray-700'
              }
            `}
            style={{ touchAction: 'manipulation' }}
            aria-label={`Select ${category.name} category`}
            title={category.name}
          >
            <div className="text-2xl">{category.icon}</div>
            <div className="text-xs font-sketch leading-tight">
              {category.name.split(' ')[0]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}