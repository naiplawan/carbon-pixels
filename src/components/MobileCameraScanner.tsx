'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, X, RotateCcw, Flashlight, FlashlightOff, Download, Zap, Target, Crosshair } from 'lucide-react'
import wasteCategories from '@/data/thailand-waste-categories.json'

interface CameraScanResult {
  category: any
  confidence: number
  boundingBox?: { x: number; y: number; width: number; height: number }
  imageData?: string
  processingTime: number
}

interface MobileCameraScannerProps {
  onResult: (result: CameraScanResult) => void
  onClose: () => void
  isOpen: boolean
  className?: string
}

// Mock AI confidence weights for demo (in real app, this would be ML model)
const AI_CATEGORY_WEIGHTS = {
  'food_waste': {
    colors: ['brown', 'green', 'orange', 'red'],
    shapes: ['irregular', 'organic'],
    contexts: ['kitchen', 'table', 'plate']
  },
  'plastic_bottles': {
    colors: ['clear', 'blue', 'white'],
    shapes: ['cylindrical', 'bottle'],
    contexts: ['outdoor', 'table']
  },
  'plastic_bags': {
    colors: ['white', 'black', 'clear'],
    shapes: ['flexible', 'bag'],
    contexts: ['shopping', 'packaging']
  },
  'paper_cardboard': {
    colors: ['brown', 'white', 'beige'],
    shapes: ['rectangular', 'flat'],
    contexts: ['office', 'packaging']
  },
  'glass_bottles': {
    colors: ['green', 'brown', 'clear'],
    shapes: ['bottle', 'cylindrical'],
    contexts: ['kitchen', 'bar']
  },
  'metal_cans': {
    colors: ['silver', 'gold', 'red'],
    shapes: ['cylindrical', 'can'],
    contexts: ['kitchen', 'outdoor']
  },
  'organic_waste': {
    colors: ['green', 'brown', 'yellow'],
    shapes: ['natural', 'irregular'],
    contexts: ['garden', 'outdoor']
  },
  'electronic_waste': {
    colors: ['black', 'silver', 'white'],
    shapes: ['rectangular', 'complex'],
    contexts: ['office', 'home']
  }
}

export default function MobileCameraScanner({
  onResult,
  onClose,
  isOpen,
  className = ''
}: MobileCameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [scanProgress, setScanProgress] = useState(0)
  const [detectedObjects, setDetectedObjects] = useState<Array<{x: number; y: number; width: number; height: number; confidence: number}>>([])
  const [lastFrameAnalysis, setLastFrameAnalysis] = useState<Date>(new Date())
  const [cameraError, setCameraError] = useState<string>('')
  const [imageCapture, setImageCapture] = useState<any>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  const scanTimeoutRef = useRef<NodeJS.Timeout>()

  // Camera permissions and setup
  useEffect(() => {
    if (isOpen) {
      initializeCamera()
    } else {
      cleanup()
    }

    return () => cleanup()
  }, [isOpen, facingMode])

  const initializeCamera = async () => {
    try {
      setCameraError('')
      
      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported on this device')
        return
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setHasCamera(true)

        // Initialize ImageCapture for flash support
        const videoTrack = stream.getVideoTracks()[0]
        if ('ImageCapture' in window) {
          setImageCapture(new (window as any).ImageCapture(videoTrack))
        }

        // Start frame analysis after video loads
        videoRef.current.onloadedmetadata = () => {
          startFrameAnalysis()
        }
      }
    } catch (error) {
      console.error('Camera initialization error:', error)
      setCameraError('Unable to access camera. Please check permissions.')
    }
  }

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setHasCamera(false)
    setIsScanning(false)
    setScanProgress(0)
    setDetectedObjects([])
  }

  const startFrameAnalysis = () => {
    if (!videoRef.current || !canvasRef.current) return

    const analyzeFrame = () => {
      if (!isOpen) return

      const video = videoRef.current!
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!

      // Update canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Simulate object detection (in real app, this would be AI model)
      if (Date.now() - lastFrameAnalysis.getTime() > 500) { // Analyze every 500ms
        simulateObjectDetection(ctx, canvas.width, canvas.height)
        setLastFrameAnalysis(new Date())
      }

      if (isOpen && !isScanning) {
        animationRef.current = requestAnimationFrame(analyzeFrame)
      }
    }

    analyzeFrame()
  }

  const simulateObjectDetection = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Simple color/edge detection simulation
    const detectedObjects: Array<{x: number; y: number; width: number; height: number; confidence: number}> = []
    
    // Simulate finding 1-3 objects randomly
    const numObjects = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < numObjects; i++) {
      const x = Math.random() * width * 0.5
      const y = Math.random() * height * 0.5
      const w = width * 0.2 + Math.random() * width * 0.3
      const h = height * 0.2 + Math.random() * height * 0.3
      
      detectedObjects.push({
        x,
        y,
        width: w,
        height: h,
        confidence: 0.3 + Math.random() * 0.4 // 30-70% confidence
      })
    }
    
    setDetectedObjects(detectedObjects)
  }

  const toggleFlash = async () => {
    if (!streamRef.current) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities()
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn }]
        })
        setIsFlashOn(!isFlashOn)
      }
    } catch (error) {
      console.error('Flash toggle error:', error)
    }
  }

  const switchCamera = () => {
    setFacingMode(current => current === 'user' ? 'environment' : 'user')
  }

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return

    setIsScanning(true)
    setScanProgress(0)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!

      // Capture high-quality frame
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data
      const imageDataURL = canvas.toDataURL('image/jpeg', 0.8)
      const startTime = Date.now()

      // Simulate AI processing with progress
      const progressSteps = [
        { progress: 20, message: 'Analyzing image...' },
        { progress: 40, message: 'Detecting objects...' },
        { progress: 60, message: 'Classifying waste...' },
        { progress: 80, message: 'Calculating confidence...' },
        { progress: 100, message: 'Complete!' }
      ]

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setScanProgress(step.progress)
      }

      // Simulate AI classification
      const categories = wasteCategories.wasteCategories
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      
      // Simulate higher confidence for certain categories based on "context"
      const hour = new Date().getHours()
      let confidence = 0.6 + Math.random() * 0.3

      // Contextual boosts
      if (hour >= 11 && hour <= 14 && randomCategory.id === 'food_waste') {
        confidence = Math.min(0.95, confidence + 0.2) // Lunch time food detection
      }
      if (randomCategory.id === 'plastic_bottles') {
        confidence = Math.min(0.9, confidence + 0.15) // Bottles are easier to detect
      }

      const processingTime = Date.now() - startTime
      
      // Select best bounding box if available
      const bestBox = detectedObjects.reduce((best, current) => 
        current.confidence > best.confidence ? current : best,
        detectedObjects[0] || { x: 100, y: 100, width: 200, height: 200, confidence: 0.5 }
      )

      // Haptic feedback for success
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }

      const result: CameraScanResult = {
        category: randomCategory,
        confidence,
        boundingBox: bestBox,
        imageData: imageDataURL,
        processingTime
      }

      onResult(result)
    } catch (error) {
      console.error('Capture and analysis error:', error)
      setCameraError('Failed to analyze image')
    } finally {
      setIsScanning(false)
      setScanProgress(0)
    }
  }, [detectedObjects, onResult, isScanning])

  const saveImage = async () => {
    if (!canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      // Create download link
      const link = document.createElement('a')
      link.download = `waste-scan-${Date.now()}.jpg`
      link.href = imageData
      link.click()
    } catch (error) {
      console.error('Save image error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black z-50 ${className}`}>
      {/* Camera View */}
      <div className="relative w-full h-full">
        {hasCamera && !cameraError ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {/* Hidden canvas for image processing */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Detection Overlays */}
            {detectedObjects.map((obj, index) => (
              <div
                key={index}
                className="absolute border-2 border-green-400 bg-green-400/20 rounded"
                style={{
                  left: `${(obj.x / (videoRef.current?.videoWidth || 1)) * 100}%`,
                  top: `${(obj.y / (videoRef.current?.videoHeight || 1)) * 100}%`,
                  width: `${(obj.width / (videoRef.current?.videoWidth || 1)) * 100}%`,
                  height: `${(obj.height / (videoRef.current?.videoHeight || 1)) * 100}%`,
                }}
              >
                <div className="bg-green-400 text-white text-xs px-1 rounded-tl rounded-br">
                  {Math.round(obj.confidence * 100)}%
                </div>
              </div>
            ))}

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-green-200 rounded-full animate-ping"></div>
                    <div className="relative w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                      <Zap className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-lg font-handwritten text-ink mb-2">
                    AI Analyzing...
                  </div>
                  <div className="text-sm text-pencil mb-4">
                    AI กำลังวิเคราะห์...
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {scanProgress}% Complete
                  </div>
                </div>
              </div>
            )}

            {/* Camera Controls Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
                <button
                  onClick={onClose}
                  className="w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex gap-2">
                  {streamRef.current?.getVideoTracks()[0]?.getCapabilities()?.torch && (
                    <button
                      onClick={toggleFlash}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isFlashOn ? 'bg-yellow-500 text-white' : 'bg-black/50 hover:bg-black/70 text-white'
                      }`}
                    >
                      {isFlashOn ? <Flashlight className="w-6 h-6" /> : <FlashlightOff className="w-6 h-6" />}
                    </button>
                  )}

                  <button
                    onClick={switchCamera}
                    className="w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Center Crosshair */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Crosshair className="w-8 h-8 text-white opacity-50" />
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-8 left-4 right-4 pointer-events-auto">
                <div className="flex justify-center items-center gap-6">
                  <button
                    onClick={saveImage}
                    className="w-14 h-14 bg-gray-600/80 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Download className="w-6 h-6" />
                  </button>

                  {/* Main Capture Button */}
                  <button
                    onClick={captureAndAnalyze}
                    disabled={isScanning}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      isScanning 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-white hover:bg-gray-100 shadow-lg'
                    }`}
                  >
                    {isScanning ? (
                      <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-10 h-10 text-gray-800" />
                    )}
                  </button>

                  <button
                    onClick={() => setDetectedObjects([])}
                    className="w-14 h-14 bg-blue-600/80 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Target className="w-6 h-6" />
                  </button>
                </div>

                {/* Instructions */}
                <div className="text-center mt-4">
                  <div className="bg-black/50 inline-block px-4 py-2 rounded-full">
                    <p className="text-white text-sm font-handwritten">
                      Point camera at waste item • ชี้กล้องไปที่ขยะ
                    </p>
                  </div>
                </div>
              </div>

              {/* Object Detection Count */}
              {detectedObjects.length > 0 && (
                <div className="absolute top-20 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-handwritten">
                  {detectedObjects.length} objects detected
                </div>
              )}
            </div>
          </>
        ) : (
          /* Error/Loading State */
          <div className="flex items-center justify-center h-full bg-gray-900 text-white">
            <div className="text-center px-6">
              {cameraError ? (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h3 className="text-xl font-handwritten mb-2">Camera Error</h3>
                  <p className="text-gray-300 mb-4">{cameraError}</p>
                  <button
                    onClick={initializeCamera}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-handwritten transition-colors"
                  >
                    Try Again • ลองใหม่
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <h3 className="text-xl font-handwritten mb-2">Loading Camera</h3>
                  <p className="text-gray-300">กำลังเปิดกล้อง...</p>
                </>
              )}
              
              <button
                onClick={onClose}
                className="mt-4 text-gray-400 hover:text-white transition-colors"
              >
                Cancel • ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for camera permissions
export function CameraPermissionPrompt({ onGranted, onDenied }: {
  onGranted: () => void
  onDenied: () => void
}) {
  const [requesting, setRequesting] = useState(false)

  const requestPermission = async () => {
    setRequesting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // Clean up test stream
      onGranted()
    } catch (error) {
      onDenied()
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="text-center p-6">
      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-xl font-handwritten text-ink mb-2">
        Camera Permission Required
      </h3>
      <p className="text-pencil mb-4">
        กรุณาอนุญาตให้เข้าถึงกล้องเพื่อสแกนขยะ
      </p>
      <button
        onClick={requestPermission}
        disabled={requesting}
        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-handwritten transition-colors"
      >
        {requesting ? 'Requesting...' : 'Allow Camera • อนุญาตกล้อง'}
      </button>
    </div>
  )
}