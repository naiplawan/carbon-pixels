'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, Volume2, VolumeX, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Web Speech API types
interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
  };
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'start', listener: () => void): void;
  addEventListener(type: 'end', listener: () => void): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: any) => void): void;
  removeEventListener(type: string, listener: any): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Waste category mapping for voice recognition
const VOICE_COMMANDS: Record<string, {
  category: string;
  keywords: string[];
  disposal?: string;
  weight?: number;
}> = {
  'food waste': {
    category: 'food_waste',
    keywords: ['food', 'fruit', 'vegetable', 'leftover', 'scrap', 'banana', 'apple', 'rice'],
    disposal: 'composted',
    weight: 0.2
  },
  'plastic bottle': {
    category: 'plastic_bottles',
    keywords: ['bottle', 'plastic bottle', 'water bottle', 'soda bottle', 'beverage'],
    disposal: 'recycled',
    weight: 0.02
  },
  'plastic bag': {
    category: 'plastic_bags',
    keywords: ['bag', 'plastic bag', 'shopping bag', 'grocery bag'],
    disposal: 'avoided',
    weight: 0.01
  },
  'paper': {
    category: 'paper',
    keywords: ['paper', 'newspaper', 'cardboard', 'box', 'document', 'receipt'],
    disposal: 'recycled',
    weight: 0.1
  },
  'glass bottle': {
    category: 'glass',
    keywords: ['glass', 'glass bottle', 'jar', 'bottle glass'],
    disposal: 'recycled',
    weight: 0.3
  },
  'metal can': {
    category: 'metal',
    keywords: ['can', 'metal', 'aluminum', 'tin', 'soda can'],
    disposal: 'recycled',
    weight: 0.015
  },
  'electronic': {
    category: 'electronics',
    keywords: ['phone', 'battery', 'electronic', 'computer', 'cable', 'charger'],
    disposal: 'recycled',
    weight: 0.15
  }
};

// Thai-English keyword mapping
const THAI_KEYWORDS: Record<string, string> = {
  'อาหาร': 'food',
  'เศษอาหาร': 'food waste',
  'ขวด': 'bottle',
  'ขวดพลาสติก': 'plastic bottle',
  'ถุง': 'bag',
  'ถุงพลาสติก': 'plastic bag',
  'กระดาษ': 'paper',
  'กล่อง': 'box',
  'แก้ว': 'glass',
  'ขวดแก้ว': 'glass bottle',
  'กระป๋อง': 'can',
  'โทรศัพท์': 'phone',
  'แบตเตอรี่': 'battery'
};

interface VoiceInputProps {
  onResult: (result: {
    category: string;
    disposal: string;
    weight: number;
    transcript: string;
    confidence: number;
  }) => void;
  onError?: (error: string) => void;
  language?: 'en' | 'th' | 'auto';
  disabled?: boolean;
}

export function VoiceInput({ 
  onResult, 
  onError, 
  language = 'auto',
  disabled = false 
}: VoiceInputProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      
      // Set language
      if (language === 'th') {
        recognition.lang = 'th-TH';
      } else if (language === 'en') {
        recognition.lang = 'en-US';
      } else {
        recognition.lang = navigator.language || 'en-US';
      }

      recognition.addEventListener('start', handleStart);
      recognition.addEventListener('result', handleResult);
      recognition.addEventListener('end', handleEnd);
      recognition.addEventListener('error', handleError);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.removeEventListener('start', handleStart);
        recognitionRef.current.removeEventListener('result', handleResult);
        recognitionRef.current.removeEventListener('end', handleEnd);
        recognitionRef.current.removeEventListener('error', handleError);
      }
      stopAudioLevel();
    };
  }, [language]);

  const handleStart = useCallback(() => {
    setIsListening(true);
    setTranscript('');
    setConfidence(0);
    setError(null);
    startAudioLevel();
  }, []);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';
    let maxConfidence = 0;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      if (result.isFinal) {
        finalTranscript += transcript;
        maxConfidence = Math.max(maxConfidence, confidence);
      } else {
        interimTranscript += transcript;
      }
    }

    setTranscript(finalTranscript || interimTranscript);
    setConfidence(maxConfidence);

    if (finalTranscript) {
      setIsProcessing(true);
      processVoiceCommand(finalTranscript, maxConfidence);
    }
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
    setIsProcessing(false);
    stopAudioLevel();
  }, []);

  const handleError = useCallback((event: any) => {
    setIsListening(false);
    setIsProcessing(false);
    stopAudioLevel();
    
    const errorMessage = getErrorMessage(event.error);
    setError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'Microphone not accessible. Please check permissions.';
      case 'not-allowed':
        return 'Microphone access denied. Please enable microphone permissions.';
      case 'network':
        return 'Network error. Please check your connection.';
      case 'service-not-allowed':
        return 'Speech recognition service not available.';
      default:
        return 'Speech recognition error. Please try again.';
    }
  };

  const processVoiceCommand = (transcript: string, confidence: number) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Translate Thai keywords to English if needed
    let processedTranscript = lowerTranscript;
    for (const [thai, english] of Object.entries(THAI_KEYWORDS)) {
      if (lowerTranscript.includes(thai)) {
        processedTranscript = processedTranscript.replace(thai, english);
      }
    }

    // Find matching waste category
    let bestMatch: typeof VOICE_COMMANDS[string] | null = null;
    let highestScore = 0;

    for (const [category, command] of Object.entries(VOICE_COMMANDS)) {
      const score = command.keywords.reduce((acc, keyword) => {
        if (processedTranscript.includes(keyword.toLowerCase())) {
          return acc + keyword.length; // Longer matches score higher
        }
        return acc;
      }, 0);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = command;
      }
    }

    if (bestMatch && confidence > 0.6) {
      onResult({
        category: bestMatch.category,
        disposal: bestMatch.disposal || 'disposed',
        weight: bestMatch.weight || 0.1,
        transcript,
        confidence
      });
    } else {
      setError('Could not understand the waste item. Please try again or use manual entry.');
    }

    setTimeout(() => {
      setIsProcessing(false);
      setTranscript('');
      setConfidence(0);
    }, 2000);
  };

  const startListening = () => {
    if (!isSupported || disabled || isListening) return;

    try {
      recognitionRef.current?.start();
    } catch (error) {
      setError('Could not start speech recognition.');
    }
  };

  const stopListening = () => {
    if (!isListening) return;
    recognitionRef.current?.stop();
  };

  const startAudioLevel = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      updateAudioLevel();
    } catch (error) {
      console.warn('Could not access microphone for audio level visualization');
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
    setAudioLevel(average / 255);
    
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const stopAudioLevel = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
        <MicOff className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Voice input not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Voice Input</h3>
        </div>
        <div className="text-xs text-gray-500">
          {language === 'th' ? 'Thai' : language === 'en' ? 'English' : 'Auto'}
        </div>
      </div>

      <div className="text-center space-y-4">
        {/* Voice Activity Visualization */}
        <div className="relative">
          <motion.button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled || isProcessing}
            whileTap={{ scale: 0.95 }}
            className={`relative w-16 h-16 rounded-full border-4 transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 border-red-600 text-white' 
                : 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 border-2 border-current border-t-transparent rounded-full"
              />
            ) : isListening ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>

          {/* Audio level visualization */}
          {isListening && (
            <motion.div
              animate={{
                scale: 1 + audioLevel * 0.5,
                opacity: 0.7
              }}
              className="absolute inset-0 bg-blue-400 rounded-full -z-10"
            />
          )}
        </div>

        <div className="text-sm text-center">
          {isListening ? (
            <span className="text-red-600 font-medium">🎤 Listening...</span>
          ) : isProcessing ? (
            <span className="text-blue-600 font-medium">⚡ Processing...</span>
          ) : (
            <span className="text-gray-600">Click to start voice recognition</span>
          )}
        </div>

        {/* Transcript Display */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-50 p-3 rounded-lg"
            >
              <div className="text-sm text-gray-800">&quot;{transcript}&quot;</div>
              {confidence > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 p-3 rounded-lg"
            >
              <div className="text-sm text-red-800">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage Instructions */}
        <details className="text-left">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Voice commands help
          </summary>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <p><strong>Try saying:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>&quot;Plastic bottle&quot; or &quot;ขวดพลาสติก&quot;</li>
              <li>&quot;Food waste&quot; or &quot;เศษอาหาร&quot;</li>
              <li>&quot;Paper&quot; or &quot;กระดาษ&quot;</li>
              <li>&quot;Plastic bag&quot; or &quot;ถุงพลาสติก&quot;</li>
              <li>&quot;Glass bottle&quot; or &quot;ขวดแก้ว&quot;</li>
            </ul>
            <p className="mt-2"><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Speak clearly and close to microphone</li>
              <li>Use simple, direct phrases</li>
              <li>Allow microphone access when prompted</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}

// Enhanced voice-enabled manual entry form
export function VoiceEnabledForm({ onSubmit }: { onSubmit: (entry: any) => void }) {
  const [formData, setFormData] = useState({
    category: '',
    disposal: '',
    weight: 0.1,
    transcript: '',
    confidence: 0
  });

  const handleVoiceResult = (result: {
    category: string;
    disposal: string;
    weight: number;
    transcript: string;
    confidence: number;
  }) => {
    setFormData(result);
    
    // Auto-submit if confidence is high
    if (result.confidence > 0.8) {
      onSubmit({
        id: Date.now().toString(),
        categoryId: result.category,
        categoryName: getCategoryName(result.category),
        disposal: result.disposal,
        weight: result.weight,
        carbonCredits: calculateCredits(result.category, result.disposal, result.weight),
        timestamp: new Date().toISOString(),
        isVoiceEntry: true,
        transcript: result.transcript,
        confidence: result.confidence
      });
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const names: Record<string, string> = {
      food_waste: 'Food Waste',
      plastic_bottles: 'Plastic Bottles',
      plastic_bags: 'Plastic Bags',
      paper: 'Paper/Cardboard',
      glass: 'Glass Bottles',
      metal: 'Metal Cans',
      electronics: 'Electronic Waste'
    };
    return names[categoryId] || 'Unknown';
  };

  const calculateCredits = (category: string, disposal: string, weight: number): number => {
    // Simplified credit calculation - in real app, use the full waste data
    const baseCredits: Record<string, number> = {
      food_waste: disposal === 'composted' ? 20 : -5,
      plastic_bottles: disposal === 'recycled' ? 10 : -3,
      plastic_bags: disposal === 'avoided' ? 67 : disposal === 'recycled' ? 5 : -67,
      paper: disposal === 'recycled' ? 15 : -2,
      glass: disposal === 'recycled' ? 8 : -1,
      metal: disposal === 'recycled' ? 12 : -2,
      electronics: disposal === 'recycled' ? 50 : -10
    };
    
    return Math.round((baseCredits[category] || 0) * weight);
  };

  return (
    <div className="space-y-6">
      <VoiceInput 
        onResult={handleVoiceResult}
        language="auto"
      />

      {/* Voice result preview */}
      {formData.category && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 p-4 rounded-lg"
        >
          <h4 className="font-medium text-green-800 mb-2">Voice Recognition Result</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium">{getCategoryName(formData.category)}</span>
            </div>
            <div>
              <span className="text-gray-600">Disposal:</span>
              <span className="ml-2 font-medium capitalize">{formData.disposal}</span>
            </div>
            <div>
              <span className="text-gray-600">Weight:</span>
              <span className="ml-2 font-medium">{formData.weight}kg</span>
            </div>
            <div>
              <span className="text-gray-600">Credits:</span>
              <span className="ml-2 font-medium text-green-600">
                {calculateCredits(formData.category, formData.disposal, formData.weight)} CC
              </span>
            </div>
          </div>
          
          {formData.transcript && (
            <div className="mt-2 text-xs text-gray-600">
              Transcript: &quot;{formData.transcript}&quot; ({Math.round(formData.confidence * 100)}% confidence)
            </div>
          )}

          <button
            onClick={() => onSubmit({
              id: Date.now().toString(),
              categoryId: formData.category,
              categoryName: getCategoryName(formData.category),
              disposal: formData.disposal,
              weight: formData.weight,
              carbonCredits: calculateCredits(formData.category, formData.disposal, formData.weight),
              timestamp: new Date().toISOString(),
              isVoiceEntry: true,
              transcript: formData.transcript,
              confidence: formData.confidence
            })}
            className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Add This Entry
          </button>
        </motion.div>
      )}
    </div>
  );
}