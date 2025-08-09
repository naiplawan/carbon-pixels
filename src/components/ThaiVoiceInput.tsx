'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Check, AlertCircle, Headphones } from 'lucide-react'
import wasteCategories from '@/data/thailand-waste-categories.json'

interface VoiceRecognitionResult {
  category?: any
  confidence: number
  transcript: string
  language: 'th' | 'en'
  alternatives?: string[]
}

interface ThaiVoiceInputProps {
  onResult: (result: VoiceRecognitionResult) => void
  onCancel?: () => void
  isOpen: boolean
  className?: string
}

// Extended Thai-English voice command mapping
const THAI_VOICE_COMMANDS = {
  // Thai names (formal)
  'เศษอาหาร': 'food_waste',
  'ขวดพลาสติก': 'plastic_bottles',
  'ถุงพลาสติก': 'plastic_bags',
  'กระดาษ': 'paper_cardboard',
  'กล่องกระดาษ': 'paper_cardboard',
  'ขวดแก้ว': 'glass_bottles',
  'กระป่องโลหะ': 'metal_cans',
  'กระป่อง': 'metal_cans',
  'ขยะอินทรีย์': 'organic_waste',
  'ใบไม้': 'organic_waste',
  'ขยะอิเล็กทรอนิกส์': 'electronic_waste',
  'โทรศัพท์': 'electronic_waste',
  'มือถือ': 'electronic_waste',

  // Thai colloquial terms
  'อาหาร': 'food_waste',
  'ข้าว': 'food_waste',
  'ผลไม้': 'food_waste',
  'ขวดน้ำ': 'plastic_bottles',
  'ขวด': 'plastic_bottles',
  'น้ำดื่ม': 'plastic_bottles',
  'ถุง': 'plastic_bags',
  'ถุงช็อปปิ้ง': 'plastic_bags',
  'ซอง': 'plastic_bags',
  'หนังสือพิมพ์': 'paper_cardboard',
  'กล่อง': 'paper_cardboard',
  'ลัง': 'paper_cardboard',
  'แก้ว': 'glass_bottles',
  'ขวดเบียร์': 'glass_bottles',
  'เบียร์': 'glass_bottles',
  'กระป่องโค้ก': 'metal_cans',
  'โค้ก': 'metal_cans',
  'กิ่งไม้': 'organic_waste',
  'ใบ': 'organic_waste',
  'ดอกไม้': 'organic_waste',
  'แบตเตอรี่': 'electronic_waste',
  'แบต': 'electronic_waste',
  'คอมพิวเตอร์': 'electronic_waste',

  // English terms
  'food': 'food_waste',
  'food waste': 'food_waste',
  'plastic bottle': 'plastic_bottles',
  'bottle': 'plastic_bottles',
  'water bottle': 'plastic_bottles',
  'plastic bag': 'plastic_bags',
  'bag': 'plastic_bags',
  'shopping bag': 'plastic_bags',
  'paper': 'paper_cardboard',
  'cardboard': 'paper_cardboard',
  'newspaper': 'paper_cardboard',
  'box': 'paper_cardboard',
  'glass': 'glass_bottles',
  'glass bottle': 'glass_bottles',
  'beer bottle': 'glass_bottles',
  'can': 'metal_cans',
  'metal can': 'metal_cans',
  'soda can': 'metal_cans',
  'aluminum can': 'metal_cans',
  'organic': 'organic_waste',
  'organic waste': 'organic_waste',
  'leaves': 'organic_waste',
  'electronic': 'electronic_waste',
  'electronics': 'electronic_waste',
  'electronic waste': 'electronic_waste',
  'phone': 'electronic_waste',
  'mobile': 'electronic_waste',
  'battery': 'electronic_waste',
  'computer': 'electronic_waste'
}

// Thai pronunciation guide
const PRONUNCIATION_GUIDE = {
  'เศษอาหาร': 'เสด อาหาร',
  'ขวดพลาสติก': 'ขวด พฺลาสติก',
  'ถุงพลาสติก': 'ถุง พฺลาสติก',
  'กระดาษ': 'กระดาด',
  'ขวดแก้ว': 'ขวด แก้ว',
  'กระป่องโลหะ': 'กระปอง โลหะ',
  'ขยะอินทรีย์': 'ขยะ อินทรีย์',
  'ขยะอิเล็กทรอนิกส์': 'ขยะ อิเล็กทรอนิกส์'
}

export default function ThaiVoiceInput({
  onResult,
  onCancel,
  isOpen,
  className = ''
}: ThaiVoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [language, setLanguage] = useState<'th' | 'en' | 'auto'>('auto')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string>('')
  const [showGuide, setShowGuide] = useState(false)
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [voiceLevel, setVoiceLevel] = useState(0)

  const recognitionRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      // Configuration for Thai/English support
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.maxAlternatives = 5
      
      // Set language based on selection
      if (language === 'auto') {
        recognitionRef.current.lang = 'th-TH,en-US'
      } else if (language === 'th') {
        recognitionRef.current.lang = 'th-TH'
      } else {
        recognitionRef.current.lang = 'en-US'
      }

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setError('')
        startVoiceLevelDetection()
      }

      recognitionRef.current.onresult = (event: any) => {
        let interimText = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript

          if (result.isFinal) {
            finalText += text
            setConfidence(result[0].confidence)
            
            // Get alternatives if available
            const alts = []
            for (let j = 1; j < Math.min(result.length, 3); j++) {
              alts.push(result[j].transcript)
            }
            setAlternatives(alts)
            
            handleVoiceCommand(text, result[0].confidence, alts)
          } else {
            interimText += text
          }
        }

        setTranscript(finalText)
        setInterimTranscript(interimText)
      }

      recognitionRef.current.onerror = (event: any) => {
        setError(getErrorMessage(event.error))
        setIsListening(false)
        stopVoiceLevelDetection()
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        stopVoiceLevelDetection()
      }
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
      stopVoiceLevelDetection()
    }
  }, [language])

  const getErrorMessage = (error: string): string => {
    const errorMessages: Record<string, string> = {
      'no-speech': 'ไม่ได้ยินเสียง กรุณาลองใหม่',
      'audio-capture': 'ไม่สามารถเข้าถึงไมโครโฟนได้',
      'not-allowed': 'กรุณาอนุญาตการใช้ไมโครโฟน',
      'network': 'เชื่อมต่ออินเทอร์เน็ตล้มเหลว',
      'service-not-allowed': 'บริการจดจำเสียงไม่พร้อมใช้งาน'
    }
    return errorMessages[error] || `เกิดข้อผิดพลาด: ${error}`
  }

  const startVoiceLevelDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      
      microphoneRef.current.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const updateLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setVoiceLevel(Math.min(100, (average / 255) * 100))
          animationRef.current = requestAnimationFrame(updateLevel)
        }
      }
      
      updateLevel()
    } catch (error) {
      console.error('Error accessing microphone for level detection:', error)
    }
  }

  const stopVoiceLevelDetection = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setVoiceLevel(0)
  }

  const handleVoiceCommand = useCallback((text: string, confidence: number, alternatives: string[] = []) => {
    const lowerText = text.toLowerCase().trim()
    
    // Direct match
    for (const [command, categoryId] of Object.entries(THAI_VOICE_COMMANDS)) {
      if (lowerText.includes(command.toLowerCase())) {
        const category = wasteCategories.wasteCategories.find(c => c.id === categoryId)
        if (category) {
          const detectedLanguage = /[\u0E00-\u0E7F]/.test(text) ? 'th' : 'en'
          onResult({
            category,
            confidence,
            transcript: text,
            language: detectedLanguage,
            alternatives
          })
          speakConfirmation(category.nameLocal)
          return
        }
      }
    }
    
    // Fuzzy matching for partial matches
    const words = lowerText.split(/\s+/)
    for (const word of words) {
      if (word.length < 2) continue
      
      for (const [command, categoryId] of Object.entries(THAI_VOICE_COMMANDS)) {
        if (command.toLowerCase().includes(word) || word.includes(command.toLowerCase())) {
          const category = wasteCategories.wasteCategories.find(c => c.id === categoryId)
          if (category) {
            const detectedLanguage = /[\u0E00-\u0E7F]/.test(text) ? 'th' : 'en'
            onResult({
              category,
              confidence: confidence * 0.8, // Lower confidence for fuzzy match
              transcript: text,
              language: detectedLanguage,
              alternatives
            })
            speakConfirmation(category.nameLocal, true)
            return
          }
        }
      }
    }
    
    // Check category examples
    for (const category of wasteCategories.wasteCategories) {
      for (const example of category.examples) {
        if (lowerText.includes(example.toLowerCase()) || example.toLowerCase().includes(lowerText)) {
          const detectedLanguage = /[\u0E00-\u0E7F]/.test(text) ? 'th' : 'en'
          onResult({
            category,
            confidence: confidence * 0.6,
            transcript: text,
            language: detectedLanguage,
            alternatives
          })
          speakConfirmation(category.nameLocal, true)
          return
        }
      }
    }
    
    // No match found
    onResult({
      confidence: 0,
      transcript: text,
      language: /[\u0E00-\u0E7F]/.test(text) ? 'th' : 'en',
      alternatives
    })
    speakFeedback('ไม่พบข้อมูลที่ตรงกัน กรุณาลองใหม่อีกครั้ง')
  }, [onResult])

  const speakConfirmation = (categoryNameLocal: string, fuzzy: boolean = false) => {
    const message = fuzzy 
      ? `พบความเป็นไปได้ ${categoryNameLocal}` 
      : `พบ ${categoryNameLocal}`
    speakFeedback(message)
  }

  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true)
      speechSynthesis.cancel() // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'th-TH'
      utterance.rate = 0.9
      utterance.pitch = 1.1
      
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      setTimeout(() => speechSynthesis.speak(utterance), 100)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      setInterimTranscript('')
      setError('')
      setAlternatives([])
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const speakInstructions = () => {
    const instructions = language === 'th' 
      ? 'พูดชื่อประเภทขยะ เช่น เศษอาหาร ขวดพลาสติก หรือ ถุงพลาสติก'
      : 'Say waste type like food waste, plastic bottle, or plastic bag'
    speakFeedback(instructions)
  }

  if (!isOpen) return null

  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={`p-3 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-100 text-red-600 animate-pulse' 
              : 'bg-green-100 text-green-600'
          }`}>
            {isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-handwritten text-ink">Voice Input</h3>
            <p className="text-sm text-pencil">การใส่ข้อมูลด้วยเสียง</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center gap-2 mb-4">
          {[
            { value: 'auto', label: 'Auto', emoji: '🌐' },
            { value: 'th', label: 'ไทย', emoji: '🇹🇭' },
            { value: 'en', label: 'EN', emoji: '🇺🇸' }
          ].map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setLanguage(value as any)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                language === value
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Visualization */}
      <div className="mb-6">
        <div className="h-20 bg-gray-50 rounded-xl flex items-center justify-center relative overflow-hidden">
          {isListening ? (
            <div className="flex items-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-green-500 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.max(4, (voiceLevel / 100) * 60 + Math.random() * 20)}px`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-3xl mb-2">🎤</div>
              <div className="text-sm text-gray-600">
                Tap to start • แตะเพื่อเริ่ม
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-sm font-handwritten text-blue-800 mb-2">
            Heard • ได้ยิน:
          </div>
          <div className="text-gray-800">
            {transcript}
            <span className="text-gray-500 italic">
              {interimTranscript}
            </span>
          </div>
          {alternatives.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              <div>Alternatives • ทางเลือกอื่น:</div>
              {alternatives.map((alt, i) => (
                <div key={i} className="text-gray-500">• {alt}</div>
              ))}
            </div>
          )}
          {confidence > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Confidence • ความมั่นใจ: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={toggleListening}
          disabled={isSpeaking}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        <button
          onClick={speakInstructions}
          disabled={isListening || isSpeaking}
          className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          {isSpeaking ? (
            <VolumeX className="w-6 h-6 animate-pulse" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center transition-all duration-200 active:scale-95"
        >
          <Headphones className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Commands */}
      <div className="mb-4">
        <h4 className="text-sm font-handwritten text-gray-700 mb-2">
          Quick Commands • คำสั่งด่วน:
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(THAI_VOICE_COMMANDS).slice(0, 8).map(([command, categoryId]) => {
            const category = wasteCategories.wasteCategories.find(c => c.id === categoryId)
            if (!category) return null
            
            return (
              <button
                key={command}
                onClick={() => handleVoiceCommand(command, 1.0)}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="truncate">{command}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pronunciation Guide */}
      {showGuide && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h4 className="text-sm font-handwritten text-yellow-800 mb-2">
            📢 Pronunciation Guide • คู่มือการออกเสียง
          </h4>
          <div className="space-y-1 text-xs">
            {Object.entries(PRONUNCIATION_GUIDE).map(([word, pronunciation]) => (
              <div key={word} className="flex justify-between">
                <span className="text-yellow-700">{word}</span>
                <span className="text-yellow-600 italic">{pronunciation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-handwritten rounded-xl hover:bg-gray-50 transition-all active:scale-95"
          >
            Cancel • ยกเลิก
          </button>
        )}
        
        <button
          onClick={() => {
            setTranscript('')
            setInterimTranscript('')
            setError('')
            setAlternatives([])
          }}
          className="flex-1 py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white font-handwritten rounded-xl transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4 inline mr-2" />
          Reset • รีเซ็ต
        </button>
      </div>

      {/* Tips */}
      <div className="mt-4 text-xs text-gray-600 text-center">
        💡 Speak clearly and wait for response • พูดให้ชัดและรอการตอบสนอง
      </div>
    </div>
  )
}