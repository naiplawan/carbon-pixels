'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  action?: {
    text: string
    onClick: () => void
  }
}

interface OnboardingTutorialProps {
  onComplete: () => void
  onSkip: () => void
}

export default function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Thailand Waste Diary! 🇹🇭',
      description: 'Your personal journey towards Thailand\'s 2050 carbon neutrality goal',
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🌱</div>
          <div className="space-y-3">
            <p className="font-sketch text-lg text-ink">
              Transform your daily habits and make a real impact on climate change!
            </p>
            <div className="bg-green-50 p-4 rounded-lg border-2 border-dashed border-green-300">
              <p className="font-handwritten text-green-800 text-sm">
                🎯 <strong>Thailand&apos;s Goal:</strong> Carbon neutrality by 2050
              </p>
              <p className="font-handwritten text-green-700 text-sm mt-1">
                Every gram of waste you track helps us get there!
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-2xl">📱</div>
                <div className="text-xs font-sketch text-blue-700">Track Daily</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-2xl">🌳</div>
                <div className="text-xs font-sketch text-green-700">Save Trees</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-2xl">🏆</div>
                <div className="text-xs font-sketch text-purple-700">Earn Rewards</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'carbon-credits',
      title: 'Understanding Carbon Credits 💚',
      description: 'Learn how your waste choices directly impact the environment',
      content: (
        <div className="space-y-4">
          <div className="text-center text-4xl mb-4">⚖️</div>
          <div className="space-y-3">
            <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-300">
              <div className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <div>
                  <div className="font-sketch font-bold text-red-800">Negative Credits</div>
                  <div className="text-sm text-red-700">Landfill disposal, single-use plastics</div>
                  <div className="text-xs text-red-600 mt-1">Example: Plastic bag to landfill = -67 credits</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-300">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <div className="font-sketch font-bold text-green-800">Positive Credits</div>
                  <div className="text-sm text-green-700">Recycling, composting, waste avoidance</div>
                  <div className="text-xs text-green-600 mt-1">Example: Avoid plastic bag = +67 credits</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="font-handwritten text-blue-800 text-lg">🌳</div>
              <div className="font-sketch text-blue-700 text-sm">
                <strong>500 Credits = 1 Tree Saved!</strong>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Based on official TGO emission factors
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-scanner',
      title: 'AI-Powered Scanning 📷',
      description: 'Quick and easy waste identification with smart technology',
      content: (
        <div className="space-y-4">
          <div className="text-center text-4xl mb-4">🤖</div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <div className="text-center mb-3">
                <div className="font-handwritten text-lg text-ink">How AI Scanning Works:</div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2 text-purple-600">1</div>
                  <div className="text-sm font-sketch">Point camera at your waste item</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2 text-purple-600">2</div>
                  <div className="text-sm font-sketch">AI identifies the waste category</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2 text-purple-600">3</div>
                  <div className="text-sm font-sketch">Choose disposal method & weight</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2 text-purple-600">4</div>
                  <div className="text-sm font-sketch">Instantly see your carbon impact!</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚡</span>
                <div className="text-sm font-sketch text-yellow-800">
                  <strong>Demo Mode:</strong> Currently simulated AI - real recognition coming soon!
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'waste-categories',
      title: 'Thai Waste Categories 🗂️',
      description: 'Understanding the 8 main waste types in Thailand',
      content: (
        <div className="space-y-4">
          <div className="text-center text-4xl mb-4">🇹🇭</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="text-2xl">🍎</div>
              <div className="text-xs font-sketch text-green-700">Food Waste</div>
              <div className="text-xs text-gray-600">Thai scraps</div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="text-2xl">🍾</div>
              <div className="text-xs font-sketch text-blue-700">Plastic Bottles</div>
              <div className="text-xs text-gray-600">Beverages</div>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <div className="text-2xl">🛍️</div>
              <div className="text-xs font-sketch text-red-700">Plastic Bags</div>
              <div className="text-xs text-gray-600">Shopping bags</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center">
              <div className="text-2xl">📄</div>
              <div className="text-xs font-sketch text-yellow-700">Paper</div>
              <div className="text-xs text-gray-600">Packaging</div>
            </div>
            <div className="bg-purple-50 p-2 rounded text-center">
              <div className="text-2xl">🫙</div>
              <div className="text-xs font-sketch text-purple-700">Glass</div>
              <div className="text-xs text-gray-600">Bottles</div>
            </div>
            <div className="bg-gray-50 p-2 rounded text-center">
              <div className="text-2xl">🥫</div>
              <div className="text-xs font-sketch text-gray-700">Metal Cans</div>
              <div className="text-xs text-gray-600">Food cans</div>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="text-2xl">🍃</div>
              <div className="text-xs font-sketch text-green-700">Organic</div>
              <div className="text-xs text-gray-600">Garden waste</div>
            </div>
            <div className="bg-indigo-50 p-2 rounded text-center">
              <div className="text-2xl">📱</div>
              <div className="text-xs font-sketch text-indigo-700">E-Waste</div>
              <div className="text-xs text-gray-600">Electronics</div>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="font-sketch text-blue-800 text-sm">
              <strong>Pro Tip:</strong> Plastic bags have the highest carbon impact!
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Avoiding one plastic bag = +67 credits
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'gamification',
      title: 'Level Up Your Impact! 🎮',
      description: 'Earn levels, achievements, and track your environmental progress',
      content: (
        <div className="space-y-4">
          <div className="text-center text-4xl mb-4">🚀</div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
              <div className="font-handwritten text-center text-lg text-ink mb-2">Level System</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span>🌱</span>
                    <span className="font-sketch text-sm">Eco Beginner</span>
                  </div>
                  <span className="text-xs text-gray-600">0-99 credits</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span>💚</span>
                    <span className="font-sketch text-sm">Green Warrior</span>
                  </div>
                  <span className="text-xs text-gray-600">100-499 credits</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span>🌍</span>
                    <span className="font-sketch text-sm">Eco Champion</span>
                  </div>
                  <span className="text-xs text-gray-600">500-1499 credits</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="font-handwritten text-center text-yellow-800 text-sm mb-2">🏆 Achievements</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded text-center">
                  <div>🌳 First Tree Saved</div>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <div>⚡ Daily Champion</div>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <div>♻️ Recycling Hero</div>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <div>🔥 Week Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tips-maximize',
      title: 'Maximize Your Carbon Credits! 💡',
      description: 'Pro tips for earning the most positive environmental impact',
      content: (
        <div className="space-y-4">
          <div className="text-center text-4xl mb-4">🎯</div>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
              <div className="font-sketch font-bold text-green-800 flex items-center gap-2">
                <span>🚫</span> Waste Avoidance = Highest Credits!
              </div>
              <div className="text-sm text-green-700 mt-1">
                Refuse single-use items, bring reusable bags, choose package-free options
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
              <div className="font-sketch font-bold text-blue-800 flex items-center gap-2">
                <span>♻️</span> Choose Recycling Over Disposal
              </div>
              <div className="text-sm text-blue-700 mt-1">
                Clean containers before recycling, separate materials properly
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
              <div className="font-sketch font-bold text-purple-800 flex items-center gap-2">
                <span>🍃</span> Compost Organic Waste
              </div>
              <div className="text-sm text-purple-700 mt-1">
                Food scraps and organic matter can become valuable compost
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="font-handwritten text-center text-yellow-800 text-sm">
                <strong>Daily Goal:</strong> Track at least 3 waste items for consistency!
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ready-to-start',
      title: 'Ready to Make an Impact! 🌟',
      description: 'You\'re all set to start your waste diary journey',
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎉</div>
          <div className="space-y-3">
            <div className="font-handwritten text-xl text-ink">
              Welcome to your eco-journey!
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <div className="font-sketch text-ink text-sm mb-2">
                You now know how to:
              </div>
              <div className="space-y-1 text-sm text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Track waste with AI scanning or manual entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Understand carbon credits and environmental impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Maximize credits through smart waste choices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Level up and earn achievements</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-handwritten text-green-800 text-lg">
                Let&apos;s save Thailand together! 🇹🇭
              </div>
              <div className="text-sm text-green-700 mt-1">
                Every small action contributes to our 2050 carbon neutrality goal
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Mark tutorial as completed in localStorage
    localStorage.setItem('onboarding_completed', 'true')
    localStorage.setItem('onboarding_completed_date', new Date().toISOString())
    setIsVisible(false)
    setTimeout(() => onComplete(), 300)
  }

  const handleSkip = () => {
    // Mark tutorial as skipped in localStorage
    localStorage.setItem('onboarding_skipped', 'true')
    localStorage.setItem('onboarding_skipped_date', new Date().toISOString())
    setIsVisible(false)
    setTimeout(() => onSkip(), 300)
  }

  if (!isVisible) return null

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          key={currentStep}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden notebook-page border-2 border-dashed border-pencil"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="font-handwritten text-lg text-ink">
                Step {currentStep + 1} of {steps.length}
              </div>
              <button
                onClick={handleSkip}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close tutorial"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              key={`content-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="font-handwritten text-2xl text-ink mb-2">
                {currentStepData.title}
              </h2>
              <p className="font-sketch text-pencil text-sm mb-4">
                {currentStepData.description}
              </p>
              <div className="mb-6">
                {currentStepData.content}
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sketch text-sm transition-colors ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg font-sketch text-sm hover:bg-green-600 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-sketch text-sm hover:bg-blue-600 transition-colors"
                  >
                    Start My Journey!
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-center mt-3">
              <button
                onClick={handleSkip}
                className="text-xs font-sketch text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip tutorial
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}