'use client';

import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, TreePine, Zap } from 'lucide-react';
import { 
  WasteCategory, 
  DisposalMethod, 
  WASTE_CONSTANTS 
} from '@/types/waste';
import { 
  calculateCredits, 
  formatCredits, 
  getWeightComparison 
} from '@/utils/waste-utils';

interface LiveCreditPreviewProps {
  category: WasteCategory | undefined;
  disposal: DisposalMethod;
  weight: number;
  showAnimation?: boolean;
  compact?: boolean;
  showAlternatives?: boolean;
}

export function LiveCreditPreview({ 
  category, 
  disposal, 
  weight, 
  showAnimation = true,
  compact = false,
  showAlternatives = true
}: LiveCreditPreviewProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [previousCredits, setPreviousCredits] = useState(0);

  const credits = category ? calculateCredits(category, disposal, weight) : 0;
  const formattedCredits = formatCredits(credits);
  const treeProgress = credits / WASTE_CONSTANTS.CREDITS_PER_TREE;
  const co2Impact = Math.abs(credits) * WASTE_CONSTANTS.CARBON_CREDITS_PER_GRAM;

  // Animation trigger when credits change significantly
  useEffect(() => {
    if (Math.abs(credits - previousCredits) > 10) {
      setAnimationKey(prev => prev + 1);
    }
    setPreviousCredits(credits);
  }, [credits, previousCredits]);

  // Get alternative disposal methods with better credits
  const getAlternatives = () => {
    if (!category || !showAlternatives) return [];
    
    const alternatives = Object.entries(category.carbonCredits)
      .filter(([method]) => method !== disposal)
      .map(([method, altCredits]) => ({
        method: method as DisposalMethod,
        credits: (altCredits || 0) * weight,
        improvement: ((altCredits || 0) * weight) - credits
      }))
      .filter(alt => alt.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 2);

    return alternatives;
  };

  const alternatives = getAlternatives();

  if (!category) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        <div className="text-2xl mb-2">📊</div>
        <div className="text-sm">Select a category to see impact preview</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        credits > 0 
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
          : credits < 0 
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200'
      }`}>
        <span className="text-xs">
          {credits > 0 ? '✨' : credits < 0 ? '⚠️' : '📊'}
        </span>
        <span className="font-bold">
          {formattedCredits.sign}{formattedCredits.value} CC
        </span>
        {credits > 0 && treeProgress > 0.01 && (
          <span className="text-xs opacity-75">
            +{treeProgress.toFixed(3)} 🌳
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main credit display with animation */}
      <div 
        key={animationKey}
        className={`relative overflow-hidden rounded-lg border-2 p-6 text-center transition-all duration-300 ${
          credits > 0 
            ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100/50' 
            : credits < 0 
              ? 'bg-amber-50 border-amber-200 shadow-amber-100/50'
              : 'bg-gray-50 border-gray-200'
        } ${showAnimation ? 'animate-pulse-gentle' : ''}`}
      >
        {/* Background pattern for positive impact */}
        {credits > 0 && showAnimation && (
          <div className="absolute inset-0 opacity-10">
            <div className="animate-float-sparkles text-4xl">✨</div>
          </div>
        )}

        {/* Main content */}
        <div className="relative z-10">
          <div className="text-4xl mb-3">
            {credits > 0 ? <Sparkles className="w-10 h-10 mx-auto text-emerald-500" /> 
             : credits < 0 ? <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
             : <div className="w-10 h-10 mx-auto text-gray-400">📊</div>}
          </div>

          <div className={`text-3xl font-bold mb-2 ${formattedCredits.color}`}>
            {formattedCredits.sign}{formattedCredits.value} Carbon Credits
          </div>

          <div className="text-sm text-gray-600 mb-4">
            {formattedCredits.description}
          </div>

          {/* Impact breakdown */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-handwritten">
                <TreePine className="w-5 h-5 inline mr-1 text-green-600" />
                Trees
              </div>
              <div className={`text-sm font-medium ${credits > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {credits > 0 ? '+' : ''}{treeProgress.toFixed(3)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-handwritten">
                <Zap className="w-5 h-5 inline mr-1 text-blue-600" />
                CO₂ Impact
              </div>
              <div className={`text-sm font-medium ${credits > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                {credits > 0 ? '-' : '+'}{co2Impact}g
              </div>
            </div>
          </div>

          {/* Weight context */}
          <div className="mt-3 text-xs text-gray-500 bg-white/50 rounded px-2 py-1">
            📏 {weight}kg ≈ {getWeightComparison(weight)}
          </div>
        </div>

        {/* Celebration animation for high positive impact */}
        {credits > 50 && showAnimation && (
          <div className="absolute top-2 right-2 animate-bounce text-2xl">
            🎉
          </div>
        )}
      </div>

      {/* Alternative suggestions */}
      {alternatives.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-handwritten text-lg text-blue-700 mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Better Choices Available!
          </h4>
          
          <div className="space-y-2">
            {alternatives.map((alt) => {
              const altFormatted = formatCredits(alt.credits);
              const improvement = alt.improvement;
              
              return (
                <div key={alt.method} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center">
                    <div className="mr-3 text-lg">
                      {alt.method === 'recycled' && '♻️'}
                      {alt.method === 'composted' && '🌱'}
                      {alt.method === 'avoided' && '🚫'}
                      {alt.method === 'reused' && '🔄'}
                    </div>
                    <div>
                      <div className="font-medium text-sm capitalize">
                        {alt.method.replace('_', ' ')} instead
                      </div>
                      <div className="text-xs text-gray-500">
                        {alt.method === 'recycled' && 'Proper recycling bin'}
                        {alt.method === 'composted' && 'Organic composting'}
                        {alt.method === 'avoided' && 'Don\'t buy/use next time'}
                        {alt.method === 'reused' && 'Find another purpose'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold text-sm ${altFormatted.color}`}>
                      {altFormatted.sign}{altFormatted.value} CC
                    </div>
                    <div className="text-xs text-green-600">
                      +{Math.round(improvement)} better!
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-blue-600 text-center">
            💡 Small changes, big environmental impact!
          </div>
        </div>
      )}

      {/* Milestone progress */}
      {credits > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm font-handwritten text-green-700 mb-2">
            🎯 Thailand 2050 Goal Progress
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-600">This action contributes:</span>
            <span className="font-bold text-green-700">
              {((credits / WASTE_CONSTANTS.CREDITS_PER_TREE) * 100).toFixed(1)}% of 1 tree goal
            </span>
          </div>
          
          <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (credits / WASTE_CONSTANTS.CREDITS_PER_TREE) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Micro-celebration component for special achievements
export function CelebrationOverlay({ 
  credits, 
  show, 
  onComplete 
}: { 
  credits: number; 
  show: boolean; 
  onComplete: () => void; 
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || credits < 50) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-celebration bg-white border-4 border-green-400 rounded-lg p-6 shadow-2xl transform scale-110">
        <div className="text-center">
          <div className="text-6xl mb-2">🎉</div>
          <div className="font-handwritten text-2xl text-green-600 mb-1">
            Amazing Impact!
          </div>
          <div className="font-bold text-lg text-green-700">
            +{credits} Carbon Credits!
          </div>
          <div className="text-sm text-green-600">
            You&apos;re helping Thailand reach carbon neutrality! 🇹🇭
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom CSS animations (add to globals.css)
export const animationStyles = `
@keyframes pulse-gentle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes float-sparkles {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(10px, -10px) rotate(90deg); }
  50% { transform: translate(-5px, -15px) rotate(180deg); }
  75% { transform: translate(-10px, -5px) rotate(270deg); }
}

@keyframes celebration {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  10% { transform: scale(1.2) rotate(5deg); opacity: 1; }
  90% { transform: scale(1.1) rotate(-2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 0; }
}

.animate-pulse-gentle {
  animation: pulse-gentle 2s ease-in-out infinite;
}

.animate-float-sparkles {
  animation: float-sparkles 3s ease-in-out infinite;
}

.animate-celebration {
  animation: celebration 2s ease-out;
}
`;