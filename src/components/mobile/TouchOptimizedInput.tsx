'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Search, 
  Check, 
  X,
  Mic,
  Camera,
  Scale,
  Plus,
  Minus
} from 'lucide-react';

interface TouchOptimizedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; labelTh: string; icon?: string }>;
  placeholder?: string;
  placeholderTh?: string;
  searchable?: boolean;
  className?: string;
}

export function TouchOptimizedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  placeholderTh = 'เลือก...',
  searchable = false,
  className = ''
}: TouchOptimizedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchTerm
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.labelTh.includes(searchTerm)
      )
    : options;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-manipulation min-h-[56px]"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3 flex-1">
          {selectedOption?.icon && (
            <span className="text-2xl">{selectedOption.icon}</span>
          )}
          <div className="flex-1">
            {selectedOption ? (
              <>
                <div className="font-medium text-gray-900">{selectedOption.label}</div>
                <div className="text-sm text-gray-500">{selectedOption.labelTh}</div>
              </>
            ) : (
              <>
                <div className="text-gray-500">{placeholder}</div>
                <div className="text-sm text-gray-400">{placeholderTh}</div>
              </>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Options panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden"
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Select Category</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Search */}
              {searchable && (
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Options list */}
              <div className="flex-1 overflow-y-auto">
                {filteredOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors touch-manipulation"
                    whileTap={{ scale: 0.98 }}
                  >
                    {option.icon && (
                      <span className="text-2xl">{option.icon}</span>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.labelTh}</div>
                    </div>
                    {value === option.value && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TouchOptimizedWeightSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  suggestions?: number[];
  showVisualReference?: boolean;
  className?: string;
}

export function TouchOptimizedWeightSelector({
  value,
  onChange,
  min = 0.1,
  max = 10,
  step = 0.1,
  unit = 'kg',
  suggestions = [0.1, 0.2, 0.5, 1.0, 2.0],
  showVisualReference = true,
  className = ''
}: TouchOptimizedWeightSelectorProps) {
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState(value.toString());

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleSuggestion = (suggestionValue: number) => {
    onChange(suggestionValue);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleCustomSubmit = () => {
    const numValue = parseFloat(customValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
      setIsCustomInput(false);
    }
  };

  const getWeightReference = (weight: number) => {
    if (weight <= 0.1) return '🪙 Coin';
    if (weight <= 0.2) return '🥄 Spoon';
    if (weight <= 0.5) return '🍎 Apple';
    if (weight <= 1.0) return '🥤 Drink';
    if (weight <= 2.0) return '📱 Phone';
    return '📚 Book';
  };

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Weight / น้ำหนัก</h3>
        </div>
        {showVisualReference && (
          <div className="text-2xl" title={getWeightReference(value)}>
            {getWeightReference(value).split(' ')[0]}
          </div>
        )}
      </div>

      {/* Main value display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-green-600 mb-2">
          {value.toFixed(1)} {unit}
        </div>
        {showVisualReference && (
          <div className="text-sm text-gray-500">
            ≈ {getWeightReference(value)}
          </div>
        )}
      </div>

      {/* Increment/Decrement buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <motion.button
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-14 h-14 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-full flex items-center justify-center touch-manipulation"
          whileTap={{ scale: 0.9 }}
        >
          <Minus className="w-6 h-6" />
        </motion.button>

        <div className="flex-1 text-center">
          <div className="text-lg font-medium text-gray-900">
            {value.toFixed(1)} {unit}
          </div>
        </div>

        <motion.button
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-14 h-14 bg-green-500 hover:bg-green-600 disabled:bg-gray-50 disabled:text-gray-300 text-white rounded-full flex items-center justify-center touch-manipulation"
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Quick suggestions */}
      <div className="space-y-3 mb-6">
        <div className="text-sm font-medium text-gray-700 text-center">
          Quick Select / เลือกเร็ว
        </div>
        <div className="grid grid-cols-5 gap-2">
          {suggestions.map((suggestion) => (
            <motion.button
              key={suggestion}
              onClick={() => handleSuggestion(suggestion)}
              className={`py-3 px-2 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                value === suggestion
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {suggestion}{unit}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom input toggle */}
      <div className="text-center">
        <button
          onClick={() => setIsCustomInput(!isCustomInput)}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {isCustomInput ? 'Use Buttons' : 'Custom Weight'} / 
          {isCustomInput ? ' ใช้ปุ่ม' : ' กำหนดเอง'}
        </button>
      </div>

      {/* Custom input */}
      <AnimatePresence>
        {isCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t border-gray-200 pt-4"
          >
            <div className="flex gap-2">
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
              />
              <motion.button
                onClick={handleCustomSubmit}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium touch-manipulation"
                whileTap={{ scale: 0.95 }}
              >
                Set
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced input with voice and camera
interface MultiModalInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  placeholderTh?: string;
  enableVoice?: boolean;
  enableCamera?: boolean;
  type?: 'text' | 'search' | 'number';
  className?: string;
}

export function MultiModalInput({
  value,
  onChange,
  placeholder = 'Type here...',
  placeholderTh = 'พิมพ์ที่นี่...',
  enableVoice = true,
  enableCamera = false,
  type = 'text',
  className = ''
}: MultiModalInputProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleCameraToggle = () => {
    setIsCameraActive(!isCameraActive);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${placeholder} / ${placeholderTh}`}
          className="w-full px-4 py-4 pr-20 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 min-h-[56px]"
        />
        
        <div className="absolute right-2 flex items-center gap-1">
          {enableCamera && (
            <motion.button
              type="button"
              onClick={handleCameraToggle}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                isCameraActive 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <Camera className="w-5 h-5" />
            </motion.button>
          )}
          
          {enableVoice && (
            <motion.button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                isVoiceActive 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <Mic className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Voice indicator */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 left-0 right-0 bg-red-500 text-white text-center py-2 rounded-lg text-sm font-medium"
          >
            🎤 Listening... / กำลังฟัง...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera indicator */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 left-0 right-0 bg-blue-500 text-white text-center py-2 rounded-lg text-sm font-medium"
          >
            📷 Camera Ready... / กล้องพร้อม...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}