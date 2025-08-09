'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, TreePine, Target, Zap } from 'lucide-react';
import { 
  WasteEntry, 
  DisposalMethod, 
  WasteCategory,
  WASTE_CONSTANTS,
  STORAGE_KEYS
} from '@/types/waste';
import { 
  getCategoryData, 
  calculateCredits, 
  createWasteEntry,
  safeLocalStorageGet,
  safeLocalStorageSet,
  getWeightComparison,
  formatCredits
} from '@/utils/waste-utils';
import wasteCategories from '@/data/thailand-waste-categories.json';

type QuickStartStep = 'welcome' | 'category' | 'disposal' | 'weight' | 'success';

export default function QuickStartPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<QuickStartStep>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalMethod>('disposed');
  const [weight, setWeight] = useState<number>(0.5);
  const [isLoading, setIsLoading] = useState(false);

  // Get category data safely
  const categoryData = getCategoryData(wasteCategories as any, selectedCategory);
  const previewCredits = categoryData ? calculateCredits(categoryData, selectedDisposal, weight) : 0;
  const formattedCredits = formatCredits(previewCredits);

  const handleSaveEntry = async () => {
    if (!categoryData) return;

    setIsLoading(true);

    try {
      const newEntry = createWasteEntry({
        categoryId: selectedCategory,
        categoryName: categoryData.name,
        disposal: selectedDisposal,
        weight,
        carbonCredits: previewCredits
      });

      // Save to localStorage
      const existingEntries = safeLocalStorageGet<WasteEntry[]>(STORAGE_KEYS.WASTE_ENTRIES, []);
      const updatedEntries = [...existingEntries, newEntry];
      
      safeLocalStorageSet(STORAGE_KEYS.WASTE_ENTRIES, updatedEntries);

      // Update total credits
      const existingCredits = safeLocalStorageGet<number>(STORAGE_KEYS.CARBON_CREDITS, 0);
      safeLocalStorageSet(STORAGE_KEYS.CARBON_CREDITS, existingCredits + previewCredits);

      setCurrentStep('success');
    } catch (error) {
      console.error('Error saving entry:', error);
      // Could add error state here
    } finally {
      setIsLoading(false);
    }
  };

  const stepContent = {
    welcome: (
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="font-handwritten text-3xl text-ink mb-4">
          Welcome to Your Waste Diary!
        </h1>
        <p className="text-pencil text-lg mb-6 leading-relaxed">
          Like a food diary, but for the planet! Track what you throw away 
          and see your positive environmental impact grow.
        </p>
        
        <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-handwritten text-xl text-green-700 mb-2">
            Quick Demo: 30 Seconds to Impact! ⚡
          </h3>
          <p className="text-green-600 text-sm">
            We&apos;ll walk you through tracking your first item. 
            See how every choice makes a difference for Thailand&apos;s 2050 carbon goal!
          </p>
        </div>

        <button
          onClick={() => setCurrentStep('category')}
          className="bg-green-500 hover:bg-green-600 text-white font-handwritten text-xl px-8 py-4 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
        >
          Let&apos;s Start! 🚀
        </button>
        
        <div className="text-sm text-gray-500 mt-4">
          <Link href="/diary" className="underline hover:text-gray-700">
            Skip to main diary →
          </Link>
        </div>
      </div>
    ),

    category: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🗂️</div>
          <h2 className="font-handwritten text-2xl text-ink mb-2">
            What did you throw away recently?
          </h2>
          <p className="text-pencil">
            Pick something you actually discarded today - let&apos;s make this real!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {wasteCategories.wasteCategories.slice(0, 6).map((category: any) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg border-2 text-center transition-all duration-200 hover:scale-105 ${
                selectedCategory === category.id
                  ? 'border-green-400 bg-green-50 shadow-lg'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
              }`}
              aria-pressed={selectedCategory === category.id}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-handwritten text-sm font-medium">{category.name}</div>
              <div className="text-xs text-gray-500">({category.nameLocal})</div>
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-handwritten text-lg text-blue-700 mb-2">
              Great choice! {categoryData?.icon}
            </h4>
            <p className="text-blue-600 text-sm mb-2">
              <strong>Examples:</strong> {categoryData?.examples?.join(', ')}
            </p>
            <p className="text-blue-600 text-xs">
              💡 <strong>Tip:</strong> {categoryData?.tips?.[0]}
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('welcome')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          {selectedCategory && (
            <button
              onClick={() => setCurrentStep('disposal')}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-handwritten px-6 py-2 rounded-lg transition-colors"
            >
              Next: How did you dispose of it?
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    ),

    disposal: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h2 className="font-handwritten text-2xl text-ink mb-2">
            How did you dispose of it?
          </h2>
          <p className="text-pencil">
            Your disposal choice affects your environmental impact!
          </p>
        </div>

        <div className="space-y-3">
          {Object.entries(categoryData?.carbonCredits || {}).map(([method, credits]) => {
            const formattedMethodCredits = formatCredits(credits as number);
            return (
              <label
                key={method}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  selectedDisposal === method
                    ? 'border-green-400 bg-green-50 shadow-lg'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="disposal"
                    value={method}
                    checked={selectedDisposal === method}
                    onChange={(e) => setSelectedDisposal(e.target.value as DisposalMethod)}
                    className="sr-only"
                  />
                  <div className="mr-3">
                    {method === 'disposed' && '🗑️'}
                    {method === 'recycled' && '♻️'}
                    {method === 'composted' && '🌱'}
                    {method === 'avoided' && '🚫'}
                    {method === 'reused' && '🔄'}
                  </div>
                  <div>
                    <div className="font-handwritten text-lg capitalize">
                      {method.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {method === 'disposed' && 'Sent to landfill/trash'}
                      {method === 'recycled' && 'Proper recycling bin'}
                      {method === 'composted' && 'Organic composting'}
                      {method === 'avoided' && 'Didn&apos;t use/buy it'}
                      {method === 'reused' && 'Found another use'}
                    </div>
                  </div>
                </div>
                
                <div className={`text-right ${formattedMethodCredits.color}`}>
                  <div className="font-bold">
                    {formattedMethodCredits.sign}{formattedMethodCredits.value} CC
                  </div>
                  <div className="text-xs">
                    per kg
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('category')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <button
            onClick={() => setCurrentStep('weight')}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white font-handwritten px-6 py-2 rounded-lg transition-colors"
          >
            Next: How much?
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    ),

    weight: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚖️</div>
          <h2 className="font-handwritten text-2xl text-ink mb-2">
            About how much did it weigh?
          </h2>
          <p className="text-pencil">
            Don&apos;t worry about being exact - a good estimate is perfect!
          </p>
        </div>

        <div className="space-y-4">
          {/* Visual weight reference */}
          <div className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📏</div>
            <div className="font-handwritten text-lg text-yellow-700">
              {weight}kg ≈ {getWeightComparison(weight)}
            </div>
          </div>

          {/* Weight slider */}
          <div className="space-y-2">
            <label htmlFor="weight-slider" className="font-handwritten text-lg">
              Weight: {weight}kg
            </label>
            <input
              id="weight-slider"
              type="range"
              min={WASTE_CONSTANTS.MIN_WEIGHT_KG}
              max="5.0"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.1kg (light)</span>
              <span>5kg (heavy)</span>
            </div>
          </div>

          {/* Quick weight buttons */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {WASTE_CONSTANTS.DEFAULT_WEIGHT_OPTIONS.map((suggestedWeight) => (
              <button
                key={suggestedWeight}
                onClick={() => setWeight(suggestedWeight)}
                className={`py-2 px-3 rounded border text-sm font-handwritten ${
                  weight === suggestedWeight
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                {suggestedWeight}kg
              </button>
            ))}
          </div>

          {/* Live credit preview */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">
              {previewCredits > 0 ? '✨' : previewCredits < 0 ? '⚠️' : '📊'}
            </div>
            <div className={`font-bold text-xl ${formattedCredits.color}`}>
              {formattedCredits.sign}{formattedCredits.value} Carbon Credits
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formattedCredits.description}
            </div>
            {previewCredits > 0 && (
              <div className="text-xs text-green-600 mt-2">
                🌳 Tree progress: +{(previewCredits / WASTE_CONSTANTS.CREDITS_PER_TREE).toFixed(3)}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('disposal')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <button
            onClick={handleSaveEntry}
            disabled={isLoading}
            className="flex items-center bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-handwritten px-6 py-2 rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                Save My Impact! 🎉
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    ),

    success: (
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        
        <h1 className="font-handwritten text-3xl text-green-600 mb-4">
          Amazing! You&apos;re Making a Difference!
        </h1>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
          <div className="text-4xl">{categoryData?.icon}</div>
          <div className="font-handwritten text-xl">
            {categoryData?.name} ({weight}kg) → {selectedDisposal}
          </div>
          <div className={`text-2xl font-bold ${formattedCredits.color}`}>
            {formattedCredits.sign}{formattedCredits.value} Carbon Credits Earned! 🌟
          </div>
          
          {previewCredits > 0 && (
            <div className="space-y-2">
              <div className="text-green-600">
                <TreePine className="w-5 h-5 inline mr-2" />
                Tree Progress: +{(previewCredits / WASTE_CONSTANTS.CREDITS_PER_TREE).toFixed(3)} trees
              </div>
              <div className="text-green-600">
                <Target className="w-5 h-5 inline mr-2" />
                Thailand 2050 Goal: Every credit counts! 🇹🇭
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-4">
          <h3 className="font-handwritten text-lg text-blue-700 mb-2">
            What happens next?
          </h3>
          <ul className="text-blue-600 text-sm space-y-1 text-left">
            <li>• Track more items to level up (Eco Beginner → Green Warrior)</li>
            <li>• Every 500 credits = 1 tree saved equivalent 🌳</li>
            <li>• See your Thailand environmental ranking improve</li>
            <li>• Unlock achievements and earn special rewards</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/diary')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-handwritten text-xl px-8 py-4 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Continue to Full Diary 📖
          </button>
          
          <button
            onClick={() => {
              setCurrentStep('welcome');
              setSelectedCategory('');
              setSelectedDisposal('disposed');
              setWeight(0.5);
            }}
            className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50 font-handwritten text-lg px-6 py-3 rounded-lg transition-colors"
          >
            Track Another Item ➕
          </button>
        </div>

        <div className="text-sm text-gray-500 mt-4">
          <Link href="/" className="underline hover:text-gray-700">
            ← Back to home
          </Link>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-paper to-paper-light p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 font-handwritten">Quick Start</span>
            <span className="text-sm text-gray-500">
              Step {currentStep === 'welcome' ? 1 : currentStep === 'category' ? 2 : currentStep === 'disposal' ? 3 : currentStep === 'weight' ? 4 : 5} of 5
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${
                  currentStep === 'welcome' ? 20 : 
                  currentStep === 'category' ? 40 : 
                  currentStep === 'disposal' ? 60 : 
                  currentStep === 'weight' ? 80 : 100
                }%` 
              }}
            ></div>
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-paper border-2 border-dashed border-ink/10 p-6 md:p-8">
          {stepContent[currentStep]}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <div className="font-handwritten mb-2">🌱 Thailand Waste Diary</div>
          <div>Supporting Thailand&apos;s 2050 carbon neutrality goal, one entry at a time</div>
        </div>
      </div>
    </div>
  );
}