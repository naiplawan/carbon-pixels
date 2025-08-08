'use client';

import { useState, useEffect, useRef } from 'react';
import { Scale, Minus, Plus } from 'lucide-react';
import { WASTE_CONSTANTS } from '@/types/waste';
import { getWeightComparison } from '@/utils/waste-utils';

interface MobileWeightSelectorProps {
  value: number;
  onChange: (weight: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showVisualReference?: boolean;
  className?: string;
}

export function MobileWeightSelector({
  value,
  onChange,
  min = WASTE_CONSTANTS.MIN_WEIGHT_KG,
  max = WASTE_CONSTANTS.MAX_WEIGHT_KG,
  step = 0.1,
  showVisualReference = true,
  className = ''
}: MobileWeightSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, value: 0 });
  const sliderRef = useRef<HTMLDivElement>(null);

  // Clamp value within bounds
  const clampedValue = Math.max(min, Math.min(max, value));

  // Handle slider change
  const handleSliderChange = (newValue: number) => {
    const rounded = Math.round(newValue / step) * step;
    const clamped = Math.max(min, Math.min(max, rounded));
    onChange(clamped);
  };

  // Handle quick weight button
  const handleQuickWeight = (weight: number) => {
    handleSliderChange(weight);
  };

  // Handle increment/decrement
  const handleIncrement = () => {
    handleSliderChange(clampedValue + step);
  };

  const handleDecrement = () => {
    handleSliderChange(clampedValue - step);
  };

  // Touch/mouse events for custom slider
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, value: clampedValue });
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const deltaX = clientX - dragStart.x;
    const deltaPercent = deltaX / rect.width;
    const deltaValue = deltaPercent * (max - min);
    const newValue = dragStart.value + deltaValue;

    handleSliderChange(newValue);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add/remove global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart]);

  const sliderPercent = ((clampedValue - min) / (max - min)) * 100;

  const getWeightEmoji = (weight: number): string => {
    if (weight <= 0.2) return '🪶'; // Feather - very light
    if (weight <= 0.5) return '🍎'; // Apple - light
    if (weight <= 1.0) return '📱'; // Phone - medium-light
    if (weight <= 2.0) return '📖'; // Book - medium
    if (weight <= 5.0) return '🍉'; // Watermelon - heavy
    return '🎒'; // Backpack - very heavy
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with current value */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-gray-600" />
          <span className="font-handwritten text-xl text-ink">
            Weight: {clampedValue.toFixed(1)}kg
          </span>
        </div>
        
        {showVisualReference && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 inline-block">
            <div className="text-2xl mb-1">{getWeightEmoji(clampedValue)}</div>
            <div className="text-sm text-yellow-700">
              ≈ {getWeightComparison(clampedValue)}
            </div>
          </div>
        )}
      </div>

      {/* Custom slider */}
      <div className="px-2">
        <div
          ref={sliderRef}
          className="relative h-8 bg-gray-200 rounded-full cursor-pointer touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Slider track */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-150"
            style={{ width: `${sliderPercent}%` }}
          />
          
          {/* Slider thumb */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white border-2 border-green-400 rounded-full shadow-lg transition-all duration-150 ${
              isDragging ? 'scale-110 border-green-500' : 'hover:scale-105'
            }`}
            style={{ left: `calc(${sliderPercent}% - 16px)` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>

          {/* Weight markers */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
            <span>{min}kg</span>
            <span className="text-center">{((max + min) / 2).toFixed(1)}kg</span>
            <span>{max > 10 ? '10+kg' : `${max}kg`}</span>
          </div>
        </div>
      </div>

      {/* Increment/Decrement buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleDecrement}
          disabled={clampedValue <= min}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-full border-2 border-gray-200 transition-colors"
          aria-label="Decrease weight"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="min-w-[100px] text-center">
          <input
            type="number"
            value={clampedValue.toFixed(1)}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              handleSliderChange(newValue);
            }}
            min={min}
            max={max}
            step={step}
            className="w-full text-center text-lg font-handwritten border-2 border-gray-200 rounded-lg py-2 px-3 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
            aria-label="Weight in kilograms"
          />
          <div className="text-xs text-gray-500 mt-1">kg</div>
        </div>

        <button
          onClick={handleIncrement}
          disabled={clampedValue >= max}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-full border-2 border-gray-200 transition-colors"
          aria-label="Increase weight"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Quick weight selection buttons */}
      <div className="space-y-2">
        <div className="text-center text-sm font-handwritten text-gray-600">
          Quick Selections:
        </div>
        <div className="grid grid-cols-5 gap-2">
          {WASTE_CONSTANTS.DEFAULT_WEIGHT_SUGGESTIONS.map((weight) => (
            <button
              key={weight}
              onClick={() => handleQuickWeight(weight)}
              className={`py-3 px-2 rounded-lg text-sm font-handwritten border-2 transition-all duration-150 ${
                Math.abs(clampedValue - weight) < 0.01
                  ? 'border-green-400 bg-green-50 text-green-700 shadow-md'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-25 text-gray-700'
              }`}
            >
              <div className="font-medium">{weight}kg</div>
              <div className="text-xs opacity-75 mt-1">
                {getWeightEmoji(weight)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Weight categories for common items */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-handwritten text-blue-700 mb-2">
          💡 Common Thai Waste Items:
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleQuickWeight(0.1)}
            className="text-left p-2 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium">Plastic bag 🛍️</div>
            <div className="text-blue-600">~0.1kg</div>
          </button>
          <button
            onClick={() => handleQuickWeight(0.5)}
            className="text-left p-2 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium">Water bottle 🍾</div>
            <div className="text-blue-600">~0.5kg</div>
          </button>
          <button
            onClick={() => handleQuickWeight(0.3)}
            className="text-left p-2 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium">Food container 🥡</div>
            <div className="text-blue-600">~0.3kg</div>
          </button>
          <button
            onClick={() => handleQuickWeight(1.0)}
            className="text-left p-2 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium">Newspaper 📰</div>
            <div className="text-blue-600">~1.0kg</div>
          </button>
        </div>
      </div>

      {/* Validation message */}
      {(clampedValue !== value) && (
        <div className="text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2 px-3">
          ⚠️ Weight adjusted to valid range ({min}kg - {max}kg)
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactWeightSelector({
  value,
  onChange,
  className = ''
}: Pick<MobileWeightSelectorProps, 'value' | 'onChange' | 'className'>) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => onChange(Math.max(WASTE_CONSTANTS.MIN_WEIGHT_KG, value - 0.1))}
        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300"
      >
        <Minus className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value.toFixed(1)}
          onChange={(e) => onChange(parseFloat(e.target.value) || WASTE_CONSTANTS.MIN_WEIGHT_KG)}
          min={WASTE_CONSTANTS.MIN_WEIGHT_KG}
          max={WASTE_CONSTANTS.MAX_WEIGHT_KG}
          step="0.1"
          className="w-16 text-center text-sm font-handwritten border border-gray-300 rounded px-2 py-1"
        />
        <span className="text-sm text-gray-600">kg</span>
      </div>
      
      <button
        onClick={() => onChange(Math.min(WASTE_CONSTANTS.MAX_WEIGHT_KG, value + 0.1))}
        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}