'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, RotateCcw, Lightbulb, BookOpen } from 'lucide-react'

interface FloatingHelpProps {
  onRestartTutorial?: () => void
}

export default function FloatingHelp({ onRestartTutorial }: FloatingHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleRestartTutorial = () => {
    localStorage.removeItem('onboarding_completed')
    localStorage.removeItem('onboarding_skipped')
    localStorage.removeItem('feature_highlights_seen')
    if (onRestartTutorial) {
      onRestartTutorial()
    } else {
      window.location.reload()
    }
  }

  const quickTips = [
    {
      icon: "💚",
      tip: "Avoid plastic bags for +67 credits each!"
    },
    {
      icon: "♻️",
      tip: "Choose recycling over landfill disposal"
    },
    {
      icon: "🌱",
      tip: "Compost organic waste for positive credits"
    },
    {
      icon: "📱",
      tip: "Track daily for better habits"
    }
  ]

  return (
    <>
      {/* Floating Help Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open help menu"
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Help Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Help Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl max-w-sm w-80 border-2 border-dashed border-pencil z-50"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-handwritten text-lg text-ink flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-green-600" />
                    Help & Tips
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close help menu"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Quick Tips */}
                <div>
                  <h4 className="font-sketch text-ink mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    Quick Tips
                  </h4>
                  <div className="space-y-2">
                    {quickTips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <span className="text-lg">{tip.icon}</span>
                        <span className="text-sm text-gray-700 font-sketch">{tip.tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleRestartTutorial}
                    className="w-full flex items-center gap-3 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-sketch"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restart Tutorial
                  </button>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-sketch text-sm text-blue-800">How to Use</span>
                    </div>
                    <ul className="text-xs text-blue-700 space-y-1 font-sketch">
                      <li>• Click on stats cards for detailed info</li>
                      <li>• Hover over ? icons for quick help</li>
                      <li>• Use manual entry for best accuracy</li>
                      <li>• Track daily for maximum impact</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-sketch text-xs text-purple-800 text-center">
                      <strong>Thailand 2050 Goal 🇹🇭</strong>
                      <br />
                      Every action brings us closer to carbon neutrality!
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Alternative compact floating help for mobile
export function CompactFloatingHelp({ onRestartTutorial }: FloatingHelpProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleRestartTutorial = () => {
    localStorage.removeItem('onboarding_completed')
    localStorage.removeItem('onboarding_skipped')
    localStorage.removeItem('feature_highlights_seen')
    if (onRestartTutorial) {
      onRestartTutorial()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <motion.div
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        className="relative"
      >
        <button
          onClick={handleRestartTutorial}
          className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors"
          aria-label="Restart tutorial"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
            >
              Restart Tutorial
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}