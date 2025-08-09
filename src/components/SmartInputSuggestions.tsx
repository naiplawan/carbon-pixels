'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock, MapPin, TrendingUp, Lightbulb, Target } from 'lucide-react'
import wasteCategories from '@/data/thailand-waste-categories.json'

interface SmartSuggestion {
  id: string
  category: any
  reason: string
  confidence: number
  icon: string
  priority: 'high' | 'medium' | 'low'
}

interface SmartInputSuggestionsProps {
  onSuggestionSelect: (category: any) => void
  userLocation?: { lat: number; lng: number }
  recentEntries?: Array<{ categoryId: string; timestamp: Date }>
  className?: string
}

// Bangkok district waste patterns (mock data for demo)
const LOCATION_PATTERNS = {
  'business_district': ['paper_cardboard', 'plastic_bottles', 'electronic_waste', 'food_waste'],
  'residential': ['food_waste', 'plastic_bags', 'organic_waste', 'glass_bottles'],
  'market_area': ['food_waste', 'plastic_bags', 'organic_waste', 'paper_cardboard'],
  'university': ['plastic_bottles', 'food_waste', 'paper_cardboard', 'electronic_waste'],
  'tourist_area': ['plastic_bottles', 'food_waste', 'plastic_bags', 'paper_cardboard']
}

// Thai cultural events and waste patterns
const CULTURAL_PATTERNS = {
  'songkran': ['plastic_bottles', 'food_waste', 'plastic_bags'], // Water festival
  'loy_krathong': ['organic_waste', 'food_waste'], // Floating lantern festival
  'vegetarian_festival': ['food_waste', 'plastic_bags', 'paper_cardboard'],
  'chinese_new_year': ['food_waste', 'paper_cardboard', 'glass_bottles'],
  'regular_market_day': ['food_waste', 'plastic_bags', 'organic_waste']
}

export default function SmartInputSuggestions({
  onSuggestionSelect,
  userLocation,
  recentEntries = [],
  className = ''
}: SmartInputSuggestionsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weatherContext, setWeatherContext] = useState<'sunny' | 'rainy' | 'normal'>('normal')
  const [userPersona, setUserPersona] = useState<'office_worker' | 'student' | 'homemaker' | 'tourist'>('office_worker')
  
  // Extract hour for reuse
  const hour = currentTime.getHours()

  // Update time every minute for dynamic suggestions
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Mock weather detection (in real app, could use weather API)
  useEffect(() => {
    // Simulate weather based on time patterns
    const hour = currentTime.getHours()
    if (hour >= 14 && hour <= 18 && Math.random() > 0.7) {
      setWeatherContext('rainy') // Afternoon rain season
    }
  }, [currentTime])

  const smartSuggestions = useMemo((): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = []
    const dayOfWeek = currentTime.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5

    // Time-based suggestions
    if (hour >= 6 && hour <= 10) {
      // Morning routine
      suggestions.push({
        id: 'morning_food',
        category: wasteCategories.wasteCategories.find(c => c.id === 'food_waste')!,
        reason: 'Morning breakfast time',
        confidence: 0.8,
        icon: '🌅',
        priority: 'high'
      })
      
      suggestions.push({
        id: 'morning_drink',
        category: wasteCategories.wasteCategories.find(c => c.id === 'plastic_bottles')!,
        reason: 'Morning coffee/drink common',
        confidence: 0.7,
        icon: '☕',
        priority: 'medium'
      })

      if (isWorkday) {
        suggestions.push({
          id: 'newspaper',
          category: wasteCategories.wasteCategories.find(c => c.id === 'paper_cardboard')!,
          reason: 'Morning newspaper reading time',
          confidence: 0.6,
          icon: '📰',
          priority: 'medium'
        })
      }
    }

    if (hour >= 11 && hour <= 14) {
      // Lunch time
      suggestions.push({
        id: 'lunch_food',
        category: wasteCategories.wasteCategories.find(c => c.id === 'food_waste')!,
        reason: 'Lunch time peak',
        confidence: 0.9,
        icon: '🍽️',
        priority: 'high'
      })

      suggestions.push({
        id: 'lunch_packaging',
        category: wasteCategories.wasteCategories.find(c => c.id === 'plastic_bags')!,
        reason: 'Food delivery packaging',
        confidence: 0.8,
        icon: '🥡',
        priority: 'high'
      })

      suggestions.push({
        id: 'drink_can',
        category: wasteCategories.wasteCategories.find(c => c.id === 'metal_cans')!,
        reason: 'Lunch beverages',
        confidence: 0.6,
        icon: '🥤',
        priority: 'medium'
      })
    }

    if (hour >= 17 && hour <= 21) {
      // Evening/dinner time
      suggestions.push({
        id: 'dinner_food',
        category: wasteCategories.wasteCategories.find(c => c.id === 'food_waste')!,
        reason: 'Dinner cooking/eating time',
        confidence: 0.9,
        icon: '🍚',
        priority: 'high'
      })

      if (isWeekend) {
        suggestions.push({
          id: 'weekend_drink',
          category: wasteCategories.wasteCategories.find(c => c.id === 'glass_bottles')!,
          reason: 'Weekend evening beverages',
          confidence: 0.7,
          icon: '🍺',
          priority: 'medium'
        })
      }

      suggestions.push({
        id: 'organic_evening',
        category: wasteCategories.wasteCategories.find(c => c.id === 'organic_waste')!,
        reason: 'Evening garden maintenance',
        confidence: 0.5,
        icon: '🌿',
        priority: 'low'
      })
    }

    // Work context suggestions
    if (isWorkday && hour >= 9 && hour <= 17) {
      if (userPersona === 'office_worker') {
        suggestions.push({
          id: 'office_paper',
          category: wasteCategories.wasteCategories.find(c => c.id === 'paper_cardboard')!,
          reason: 'Office work hours - printing/documents',
          confidence: 0.7,
          icon: '🏢',
          priority: 'medium'
        })

        suggestions.push({
          id: 'office_electronics',
          category: wasteCategories.wasteCategories.find(c => c.id === 'electronic_waste')!,
          reason: 'Office tech maintenance time',
          confidence: 0.4,
          icon: '💻',
          priority: 'low'
        })
      }
    }

    // Weekend patterns
    if (isWeekend) {
      suggestions.push({
        id: 'weekend_garden',
        category: wasteCategories.wasteCategories.find(c => c.id === 'organic_waste')!,
        reason: 'Weekend gardening/yard work',
        confidence: 0.6,
        icon: '🌱',
        priority: 'medium'
      })

      suggestions.push({
        id: 'weekend_cleaning',
        category: wasteCategories.wasteCategories.find(c => c.id === 'plastic_bags')!,
        reason: 'Weekend house cleaning',
        confidence: 0.5,
        icon: '🧹',
        priority: 'medium'
      })
    }

    // Weather-based suggestions
    if (weatherContext === 'rainy') {
      suggestions.push({
        id: 'rainy_indoor',
        category: wasteCategories.wasteCategories.find(c => c.id === 'food_waste')!,
        reason: 'Rainy day - more indoor cooking',
        confidence: 0.6,
        icon: '🌧️',
        priority: 'medium'
      })
    }

    // Recent pattern analysis
    const recentCategoryCounts = recentEntries.reduce((counts, entry) => {
      const daysSince = (currentTime.getTime() - entry.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince <= 7) { // Last week
        counts[entry.categoryId] = (counts[entry.categoryId] || 0) + 1
      }
      return counts
    }, {} as Record<string, number>)

    // Suggest categories user frequently uses
    Object.entries(recentCategoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .forEach(([categoryId, count]) => {
        const category = wasteCategories.wasteCategories.find(c => c.id === categoryId)
        if (category && count >= 2) {
          suggestions.push({
            id: `frequent_${categoryId}`,
            category,
            reason: `You track this ${count} times this week`,
            confidence: Math.min(0.8, count * 0.2),
            icon: '📊',
            priority: 'medium'
          })
        }
      })

    // Thai cultural context
    const today = currentTime.toLocaleDateString('th-TH')
    const isMarketDay = dayOfWeek === 6 || dayOfWeek === 0 // Weekend markets
    
    if (isMarketDay) {
      suggestions.push({
        id: 'market_food',
        category: wasteCategories.wasteCategories.find(c => c.id === 'food_waste')!,
        reason: 'Weekend market day - fresh food shopping',
        confidence: 0.7,
        icon: '🏪',
        priority: 'high'
      })

      suggestions.push({
        id: 'market_plastic',
        category: wasteCategories.wasteCategories.find(c => c.id === 'plastic_bags')!,
        reason: 'Market shopping bags',
        confidence: 0.8,
        icon: '🛒',
        priority: 'high'
      })
    }

    // Remove duplicates and sort by priority and confidence
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.category.id === suggestion.category.id)
    )

    return uniqueSuggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return b.confidence - a.confidence
      })
      .slice(0, 6) // Top 6 suggestions

  }, [currentTime, hour, weatherContext, userPersona, recentEntries])

  const getReasonInThai = (reason: string, categoryNameLocal: string): string => {
    const reasonMap: Record<string, string> = {
      'Morning breakfast time': 'เวลาอาหารเช้า',
      'Morning coffee/drink common': 'เวลาดื่มกาแฟตอนเช้า',
      'Morning newspaper reading time': 'เวลาอ่านหนังสือพิมพ์ตอนเช้า',
      'Lunch time peak': 'ช่วงเวลาอาหารกลางวัน',
      'Food delivery packaging': 'บรรจุภัณฑ์ส่งอาหาร',
      'Lunch beverages': 'เครื่องดื่มมื้อกลางวัน',
      'Dinner cooking/eating time': 'เวลาทำอาหารและรับประทาน',
      'Weekend evening beverages': 'เครื่องดื่มช่วงเย็นวันหยุด',
      'Evening garden maintenance': 'ดูแลสวนช่วงเย็น',
      'Office work hours - printing/documents': 'ชั่วโมงทำงาน - เอกสาร/พิมพ์',
      'Office tech maintenance time': 'ดูแลอุปกรณ์เทคโนโลยี',
      'Weekend gardening/yard work': 'ทำสวนวันหยุด',
      'Weekend house cleaning': 'ทำความสะอาดบ้านวันหยุด',
      'Rainy day - more indoor cooking': 'วันฝนตก - ทำอาหารในบ้าน',
      'Weekend market day - fresh food shopping': 'วันไปตลาด - ซื้อของสด',
      'Market shopping bags': 'ถุงช็อปปิ้งจากตลาด'
    }
    
    if (reason.includes('You track this')) {
      const count = reason.match(/(\d+)/)?.[1] || '0'
      return `คุณติดตาม${categoryNameLocal}${count}ครั้งในสัปดาห์นี้`
    }
    
    return reasonMap[reason] || reason
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'border-green-400 bg-green-50'
      case 'medium': return 'border-blue-400 bg-blue-50'
      case 'low': return 'border-gray-400 bg-gray-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  const getPriorityTextColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-green-700'
      case 'medium': return 'text-blue-700'
      case 'low': return 'text-gray-700'
      default: return 'text-gray-600'
    }
  }

  if (smartSuggestions.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="font-handwritten text-ink">
          Smart Suggestions • คำแนะนำอัจฉริยะ
        </h3>
        <div className="text-xs text-gray-500 ml-auto">
          {currentTime.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit'
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {smartSuggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionSelect(suggestion.category)}
            className={`group relative p-4 border-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${getPriorityColor(suggestion.priority)} hover:shadow-lg`}
          >
            {/* Priority indicator */}
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              suggestion.priority === 'high' ? 'bg-green-500' : 
              suggestion.priority === 'medium' ? 'bg-blue-500' : 
              'bg-gray-400'
            }`} />

            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{suggestion.category.icon}</span>
                <span className="text-lg">{suggestion.icon}</span>
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-handwritten text-sm text-gray-800">
                      {suggestion.category.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {suggestion.category.nameLocal}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <div>{suggestion.reason}</div>
                  <div className="text-gray-500">
                    {getReasonInThai(suggestion.reason, suggestion.category.nameLocal)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`text-xs font-medium ${getPriorityTextColor(suggestion.priority)}`}>
                      {suggestion.priority.toUpperCase()}
                    </div>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${suggestion.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
          </button>
        ))}
      </div>

      {/* Context indicators */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>
            {hour >= 6 && hour <= 10 ? 'Morning • เช้า' :
             hour >= 11 && hour <= 14 ? 'Lunch • กลางวัน' :
             hour >= 17 && hour <= 21 ? 'Evening • เย็น' :
             'Late • ดึก'}
          </span>
        </div>

        {weatherContext === 'rainy' && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <span>🌧️ Rainy • ฝนตก</span>
          </div>
        )}

        {currentTime.getDay() === 0 || currentTime.getDay() === 6 ? (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <span>🏪 Market Day • วันตลาด</span>
          </div>
        ) : null}

        <div className="flex items-center gap-1 text-xs text-gray-600">
          <TrendingUp className="w-3 h-3" />
          <span>{smartSuggestions.length} suggestions • คำแนะนำ</span>
        </div>
      </div>

      {/* Learning note */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs text-yellow-700">
          <Target className="w-3 h-3" />
          <span>Suggestions improve with your usage • คำแนะนำดีขึ้นตามการใช้งาน</span>
        </div>
      </div>
    </div>
  )
}

// Hook for using smart suggestions
export function useSmartSuggestions(
  recentEntries?: Array<{ categoryId: string; timestamp: Date }>,
  userLocation?: { lat: number; lng: number }
) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  
  useEffect(() => {
    // This would be where you'd call the SmartInputSuggestions logic
    // For now, return empty array as suggestions are handled by the component
    setSuggestions([])
  }, [recentEntries, userLocation])

  return suggestions
}