// Thai Language Input Utilities for Carbon Pixels Waste Diary

// Thai keyboard layout optimization
export const THAI_KEYBOARD_HINTS = {
  // Common waste-related Thai words with keyboard shortcuts
  'ขยะ': 'kya', // waste
  'อาหาร': 'aahaan', // food
  'ขวด': 'kuad', // bottle
  'ถุง': 'tung', // bag
  'กระดาษ': 'kradaat', // paper
  'แก้ว': 'gaeo', // glass
  'โลหะ': 'loha', // metal
  'ใบไม้': 'baimai', // leaves
  'ทิ้ง': 'ting', // dispose
  'รีไซเคิล': 'recycle', // recycle
  'ปุ่ย': 'puy', // compost
  'น้ำหนัก': 'namnak', // weight
  'กิโลกรัม': 'kilogram', // kilogram
  'เครดิต': 'credit' // credit
}

// Thai numeral conversion
export const THAI_NUMERALS = {
  '๐': '0',
  '๑': '1',
  '๒': '2',
  '๓': '3',
  '๔': '4',
  '๕': '5',
  '๖': '6',
  '๗': '7',
  '๘': '8',
  '๙': '9'
}

export const ARABIC_NUMERALS = {
  '0': '๐',
  '1': '๑',
  '2': '๒',
  '3': '๓',
  '4': '๔',
  '5': '๕',
  '6': '๖',
  '7': '๗',
  '8': '๘',
  '9': '๙'
}

// Convert Thai numerals to Arabic numerals
export function convertThaiNumeralsToArabic(input: string): string {
  return input.replace(/[๐-๙]/g, (match) => THAI_NUMERALS[match as keyof typeof THAI_NUMERALS] || match)
}

// Convert Arabic numerals to Thai numerals
export function convertArabicNumeralsToThai(input: string): string {
  return input.replace(/[0-9]/g, (match) => ARABIC_NUMERALS[match as keyof typeof ARABIC_NUMERALS] || match)
}

// Detect if text contains Thai characters
export function containsThai(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text)
}

// Thai text normalization for search
export function normalizeThaiText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalize common Thai character variations
    .replace(/ำ/g, 'าม') // Normalize sara am
    .replace(/ิ์/g, 'ิ') // Remove mai taikhu when with sara i
    .replace(/ุ์/g, 'ุ') // Remove mai taikhu when with sara u
    // Remove tone marks for fuzzy matching
    .replace(/[่้๊๋]/g, '')
}

// Smart Thai input suggestions
export interface ThaiInputSuggestion {
  text: string
  romanization?: string
  category: 'waste_type' | 'action' | 'location' | 'weight'
  confidence: number
}

export function getThaiInputSuggestions(input: string): ThaiInputSuggestion[] {
  const normalizedInput = normalizeThaiText(input)
  const suggestions: ThaiInputSuggestion[] = []

  // Waste type suggestions
  const wasteTypeSuggestions = [
    { thai: 'เศษอาหาร', roman: 'set aahaan', english: 'food waste' },
    { thai: 'ขวดพลาสติก', roman: 'kuad plastic', english: 'plastic bottle' },
    { thai: 'ถุงพลาสติก', roman: 'tung plastic', english: 'plastic bag' },
    { thai: 'กระดาษ', roman: 'kradaat', english: 'paper' },
    { thai: 'ขวดแก้ว', roman: 'kuad gaeo', english: 'glass bottle' },
    { thai: 'กระป่องโลหะ', roman: 'krapong loha', english: 'metal can' },
    { thai: 'ขยะอินทรีย์', roman: 'kaya intrii', english: 'organic waste' },
    { thai: 'ขยะอิเล็กทรอนิกส์', roman: 'kaya electronic', english: 'electronic waste' }
  ]

  // Action suggestions
  const actionSuggestions = [
    { thai: 'ทิ้งถังขยะ', roman: 'ting tang kaya', english: 'dispose in trash' },
    { thai: 'รีไซเคิล', roman: 'recycle', english: 'recycle' },
    { thai: 'ทำปุ่ย', roman: 'tam puy', english: 'compost' },
    { thai: 'นำกลับมาใช้', roman: 'nam klap maa chai', english: 'reuse' },
    { thai: 'หลีกเลี่ยง', roman: 'leek liang', english: 'avoid' },
    { thai: 'บริจาค', roman: 'borichak', english: 'donate' },
    { thai: 'ส่งคืน', roman: 'song kuen', english: 'return' },
    { thai: 'ขาย', roman: 'kaai', english: 'sell' }
  ]

  // Location suggestions
  const locationSuggestions = [
    { thai: 'บ้าน', roman: 'baan', english: 'home' },
    { thai: 'ออฟฟิศ', roman: 'office', english: 'office' },
    { thai: 'ร้านอาหาร', roman: 'raan aahaan', english: 'restaurant' },
    { thai: 'ตลาด', roman: 'talaat', english: 'market' },
    { thai: 'โรงเรียน', roman: 'rong rian', english: 'school' },
    { thai: 'สวนสาธารณะ', roman: 'suan saatharana', english: 'park' },
    { thai: 'ถนน', roman: 'tanon', english: 'street' },
    { thai: 'ห้างสรรพสินค้า', roman: 'haang sappasinkhaa', english: 'mall' }
  ]

  // Weight/measurement suggestions
  const weightSuggestions = [
    { thai: 'กิโลกรัม', roman: 'kilogram', english: 'kilogram' },
    { thai: 'กรัม', roman: 'gram', english: 'gram' },
    { thai: 'น้ำหนัก', roman: 'nam nak', english: 'weight' },
    { thai: 'เบา', roman: 'bao', english: 'light' },
    { thai: 'หนัก', roman: 'nak', english: 'heavy' }
  ]

  const allSuggestions = [
    ...wasteTypeSuggestions.map(s => ({ ...s, category: 'waste_type' as const })),
    ...actionSuggestions.map(s => ({ ...s, category: 'action' as const })),
    ...locationSuggestions.map(s => ({ ...s, category: 'location' as const })),
    ...weightSuggestions.map(s => ({ ...s, category: 'weight' as const }))
  ]

  // Match suggestions based on input
  for (const suggestion of allSuggestions) {
    let confidence = 0

    // Exact Thai match
    if (suggestion.thai === input) {
      confidence = 1.0
    }
    // Partial Thai match
    else if (suggestion.thai.includes(input) || input.includes(suggestion.thai)) {
      confidence = 0.8
    }
    // Normalized Thai match
    else if (normalizeThaiText(suggestion.thai).includes(normalizedInput)) {
      confidence = 0.7
    }
    // Romanization match
    else if (suggestion.roman && suggestion.roman.toLowerCase().includes(input.toLowerCase())) {
      confidence = 0.6
    }
    // English match
    else if (suggestion.english.toLowerCase().includes(input.toLowerCase())) {
      confidence = 0.5
    }

    if (confidence > 0.4) {
      suggestions.push({
        text: suggestion.thai,
        romanization: suggestion.roman,
        category: suggestion.category,
        confidence
      })
    }
  }

  // Sort by confidence and return top 5
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
}

// Format Thai text for display
export function formatThaiText(text: string, options: {
  showRomanization?: boolean
  showEnglish?: boolean
} = {}): string {
  let formatted = text

  if (options.showRomanization || options.showEnglish) {
    // Add romanization or English if available
    const suggestions = getThaiInputSuggestions(text)
    if (suggestions.length > 0 && suggestions[0].confidence > 0.9) {
      const suggestion = suggestions[0]
      if (options.showRomanization && suggestion.romanization) {
        formatted += ` (${suggestion.romanization})`
      }
    }
  }

  return formatted
}

// Thai voice input helpers
export const THAI_VOICE_PATTERNS = {
  // Common mispronunciations and corrections
  'เซ็ดอาหาร': 'เศษอาหาร',
  'คว้ดพลาสติก': 'ขวดพลาสติก',
  'ตุงพลาสติก': 'ถุงพลาสติก',
  'กะดาด': 'กระดาษ',
  'แก้ว': 'แก้ว', // exact match
  'โลหะ': 'โลหะ', // exact match
  'รีไซเคิ้ล': 'รีไซเคิล',
  'รีไซเคิ่ล': 'รีไซเคิล'
}

// Correct common Thai voice recognition errors
export function correctThaiVoiceInput(input: string): string {
  let corrected = input

  // Apply voice correction patterns
  for (const [wrong, correct] of Object.entries(THAI_VOICE_PATTERNS)) {
    corrected = corrected.replace(new RegExp(wrong, 'gi'), correct)
  }

  // Normalize spacing
  corrected = corrected.replace(/\s+/g, ' ').trim()

  return corrected
}

// Thai keyboard input helpers
export interface ThaiKeyboardLayout {
  key: string
  thai: string
  shift?: string
  description?: string
}

export const THAI_KEYBOARD_LAYOUT: ThaiKeyboardLayout[] = [
  { key: 'q', thai: 'ๆ', description: 'repeat character' },
  { key: 'w', thai: 'ไ', description: 'sara ai' },
  { key: 'e', thai: 'ำ', description: 'sara am' },
  { key: 'r', thai: 'พ', description: 'pho phan' },
  { key: 't', thai: 'ะ', description: 'sara a' },
  { key: 'y', thai: 'ั', description: 'mai hanakat' },
  { key: 'u', thai: 'ี', description: 'sara ii' },
  { key: 'i', thai: 'ร', description: 'ro rua' },
  { key: 'o', thai: 'น', description: 'no nen' },
  { key: 'p', thai: 'ย', description: 'yo yak' },
  // Add more keyboard mappings as needed
]

// Get keyboard hint for Thai character
export function getThaiKeyboardHint(thaiChar: string): string | undefined {
  const layout = THAI_KEYBOARD_LAYOUT.find(l => l.thai === thaiChar || l.shift === thaiChar)
  return layout?.key
}

// Mobile input optimization
export interface MobileInputConfig {
  inputMode: 'text' | 'numeric' | 'decimal' | 'search'
  autoComplete: string
  spellCheck: boolean
  autoCorrect: boolean
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters'
}

export function getOptimalMobileInputConfig(
  inputType: 'thai_text' | 'english_text' | 'number' | 'weight' | 'search'
): MobileInputConfig {
  const configs: Record<string, MobileInputConfig> = {
    thai_text: {
      inputMode: 'text',
      autoComplete: 'off',
      spellCheck: false,
      autoCorrect: false,
      autoCapitalize: 'none'
    },
    english_text: {
      inputMode: 'text',
      autoComplete: 'on',
      spellCheck: true,
      autoCorrect: true,
      autoCapitalize: 'sentences'
    },
    number: {
      inputMode: 'numeric',
      autoComplete: 'off',
      spellCheck: false,
      autoCorrect: false,
      autoCapitalize: 'none'
    },
    weight: {
      inputMode: 'decimal',
      autoComplete: 'off',
      spellCheck: false,
      autoCorrect: false,
      autoCapitalize: 'none'
    },
    search: {
      inputMode: 'search',
      autoComplete: 'off',
      spellCheck: false,
      autoCorrect: true,
      autoCapitalize: 'none'
    }
  }

  return configs[inputType] || configs.thai_text
}

// Cultural context helpers
export interface CulturalContext {
  isWorkingHour: boolean
  isLunchTime: boolean
  isMarketDay: boolean
  isReligiousDay: boolean
  season: 'hot' | 'rainy' | 'cool'
}

export function getCulturalContext(): CulturalContext {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  const month = now.getMonth() + 1

  return {
    isWorkingHour: hour >= 8 && hour <= 17 && day >= 1 && day <= 5,
    isLunchTime: hour >= 11 && hour <= 14,
    isMarketDay: day === 0 || day === 6, // Weekend markets
    isReligiousDay: day === 0, // Sunday (Buddhist day)
    season: month >= 3 && month <= 5 ? 'hot' :
            month >= 6 && month <= 10 ? 'rainy' : 'cool'
  }
}

// Get contextual waste suggestions based on Thai cultural patterns
export function getContextualWasteSuggestions(): string[] {
  const context = getCulturalContext()
  const suggestions: string[] = []

  if (context.isLunchTime) {
    suggestions.push('เศษอาหาร', 'ถุงพลาสติก', 'กระป่องโลหะ')
  }

  if (context.isMarketDay) {
    suggestions.push('เศษอาหาร', 'ถุงพลาสติก', 'ขยะอินทรีย์')
  }

  if (context.isWorkingHour) {
    suggestions.push('กระดาษ', 'ขวดพลาสติก', 'ขยะอิเล็กทรอนิกส์')
  }

  if (context.season === 'rainy') {
    suggestions.push('ขยะอินทรีย์', 'เศษอาหาร') // More indoor activities
  }

  return [...new Set(suggestions)] // Remove duplicates
}