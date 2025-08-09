'use client'

import { useState, useEffect } from 'react'
import wasteData from '@/data/thailand-waste-categories.json'
import { hapticFeedback, addTouchFeedback } from '@/components/TouchFeedback'

interface GameificationPanelProps {
  totalCredits: number
  todayCredits: number
  level: number
  achievements: string[]
}

export default function GameificationPanel({ 
  totalCredits, 
  todayCredits, 
  level, 
  achievements 
}: GameificationPanelProps) {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [nextLevelCredits, setNextLevelCredits] = useState(100)
  const [levelName, setLevelName] = useState('Eco Beginner')
  const [levelIcon, setLevelIcon] = useState('🌱')
  const [progressToNext, setProgressToNext] = useState(0)

  useEffect(() => {
    // Determine current level based on total credits
    const levels = wasteData.gamification.levels
    let foundLevel = levels[0]
    
    for (const lvl of levels) {
      if (totalCredits >= lvl.minCredits && totalCredits <= lvl.maxCredits) {
        foundLevel = lvl
        break
      }
    }
    
    setCurrentLevel(foundLevel.level)
    setLevelName(foundLevel.name)
    setLevelIcon(foundLevel.icon)
    
    // Find next level
    const nextLevel = levels.find(lvl => lvl.level === foundLevel.level + 1)
    if (nextLevel) {
      setNextLevelCredits(nextLevel.minCredits)
      setProgressToNext(((totalCredits - foundLevel.minCredits) / (nextLevel.minCredits - foundLevel.minCredits)) * 100)
    } else {
      setNextLevelCredits(foundLevel.maxCredits)
      setProgressToNext(100)
    }
  }, [totalCredits])

  const getTreeEquivalent = () => {
    return Math.floor(totalCredits / wasteData.gamification.treeEquivalent.creditsPerTree)
  }

  const getComparisonMessages = () => {
    const trees = getTreeEquivalent()
    if (trees === 0) return "Keep going! You&apos;re building towards your first tree! 🌱"
    if (trees === 1) return "Amazing! You've saved enough CO₂ equivalent to 1 tree! 🌳"
    if (trees < 5) return `Fantastic! You've saved CO₂ equal to ${trees} trees! 🌲`
    if (trees < 10) return `Incredible! You've saved a small forest worth (${trees} trees)! 🌲🌳🌲`
    return `You&apos;re a forest hero! ${trees} trees worth of CO₂ saved! 🌲🌳🌲🌲`
  }

  const getCO2Equivalent = () => {
    // Roughly 1 credit = 1 gram CO2 equivalent
    return (totalCredits / 1000).toFixed(2) // Convert to kg
  }

  const getDailyStreak = () => {
    // This would be calculated from actual diary data
    // For demo, we'll simulate based on activity
    return Math.floor(totalCredits / 50) + 1
  }

  return (
    <div className="bg-white/70 p-6 rounded-lg border-2 border-dashed border-pencil">
      <h2 className="text-2xl font-handwritten text-ink mb-6 text-center">
        Your Eco Journey 🎮
      </h2>

      {/* Current Level */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">{levelIcon}</div>
        <div className="text-xl font-handwritten text-ink mb-1">Level {currentLevel}</div>
        <div className="text-lg font-sketch text-green-600 mb-2">{levelName}</div>
        
        {/* Level Progress */}
        <div className="mb-2">
          <div className="text-sm text-gray-600 mb-1">
            {totalCredits} / {nextLevelCredits} credits to next level
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fun Statistics */}
      <section aria-labelledby="stats-heading">
        <h3 id="stats-heading" className="sr-only">Environmental Impact Statistics</h3>
        <div className="grid grid-cols-2 gap-4 mb-6" role="list">
        <div className="text-center p-3 bg-green-50 rounded-lg" role="listitem" aria-label={`${getTreeEquivalent()} trees saved`}>
          <div className="text-2xl mb-1" aria-hidden="true">🌳</div>
          <div className="font-handwritten text-green-600 text-lg">{getTreeEquivalent()}</div>
          <div className="text-xs text-green-700">Trees Saved</div>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg" role="listitem" aria-label={`${getDailyStreak()} day streak`}>
          <div className="text-2xl mb-1" aria-hidden="true">🔥</div>
          <div className="font-handwritten text-blue-600 text-lg">{getDailyStreak()}</div>
          <div className="text-xs text-blue-700">Day Streak</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg" role="listitem" aria-label={`${getCO2Equivalent()} kilograms of CO2 saved`}>
          <div className="text-2xl mb-1" aria-hidden="true">💨</div>
          <div className="font-handwritten text-purple-600 text-lg">{getCO2Equivalent()}kg</div>
          <div className="text-xs text-purple-700">CO₂ Saved</div>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg" role="listitem" aria-label={`${todayCredits} points earned today`}>
          <div className="text-2xl mb-1" aria-hidden="true">⭐</div>
          <div className="font-handwritten text-orange-600 text-lg">{todayCredits}</div>
          <div className="text-xs text-orange-700">Today&apos;s Points</div>
        </div>
      </div>
      </section>

      {/* Fun Comparison */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
        <div className="text-center">
          <div className="text-sm font-sketch text-green-800 mb-2">Environmental Impact</div>
          <div className="text-sm text-green-700 leading-relaxed">
            {getComparisonMessages()}
          </div>
        </div>
      </div>

      {/* Daily Goals - Mobile optimized */}
      <div className="mb-8">
        <h3 className="font-handwritten text-ink mb-4 text-xl text-center">Today&apos;s Challenges 🎯</h3>
        <div className="space-y-3">
          {wasteData.gamification.dailyGoals.map((goal, index) => {
            const isCompleted = todayCredits >= goal.credits
            return (
              <button
                key={goal.id}
                onClick={(e) => {
                  hapticFeedback(isCompleted ? 'light' : 'medium');
                  addTouchFeedback(e.currentTarget);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:shadow-inner min-h-[64px] ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-2 border-green-300' 
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-300 hover:from-green-25 hover:to-green-50'
                }`}
                style={{ touchAction: 'manipulation' }}
                aria-label={`Challenge: ${goal.name}. ${isCompleted ? 'Completed' : 'Not completed'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{isCompleted ? '✅' : '⭕'}</div>
                  <div className="text-base font-sketch font-medium text-left">{goal.name}</div>
                </div>
                <div className="text-sm font-bold bg-white/60 px-3 py-1 rounded-full">+{goal.credits} CC</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="mb-4">
        <h3 className="font-sketch text-ink mb-3">Achievements 🏆</h3>
        
        {/* Check for milestone achievements */}
        {totalCredits >= 100 && totalCredits < 200 && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-2">
            <div className="flex items-center gap-2">
              <div className="text-xl">🏆</div>
              <div>
                <div className="font-sketch text-yellow-800">Green Warrior Unlocked!</div>
                <div className="text-xs text-yellow-600">You&apos;ve earned 100+ carbon credits</div>
              </div>
            </div>
          </div>
        )}

        {getTreeEquivalent() >= 1 && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-2">
            <div className="flex items-center gap-2">
              <div className="text-xl">🌳</div>
              <div>
                <div className="font-sketch text-green-800">Tree Saver!</div>
                <div className="text-xs text-green-600">CO₂ savings equal to {getTreeEquivalent()} tree(s)</div>
              </div>
            </div>
          </div>
        )}

        {todayCredits > 50 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-2">
            <div className="flex items-center gap-2">
              <div className="text-xl">⚡</div>
              <div>
                <div className="font-sketch text-blue-800">Daily Champion!</div>
                <div className="text-xs text-blue-600">Over 50 credits earned today</div>
              </div>
            </div>
          </div>
        )}

        {achievements.length === 0 && totalCredits < 50 && (
          <div className="text-center text-gray-500 py-4">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm">Start tracking waste to earn achievements!</div>
          </div>
        )}
      </div>

      {/* Motivation Message */}
      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <div className="text-sm font-sketch text-purple-800 mb-1">
          Keep it up! 💪
        </div>
        <div className="text-xs text-purple-600">
          Every scan helps Thailand reach its 2050 carbon neutrality goal!
        </div>
      </div>
    </div>
  )
}