'use client'

import { useState, useEffect, useCallback } from 'react'

interface NetworkConnection {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown'
  downlink: number
  rtt: number
  saveData: boolean
}

interface NetworkConnectionHook {
  isOnline: boolean
  connectionSpeed: string
  isSlowConnection: boolean
  isSaveDataEnabled: boolean
  networkStrength: 'poor' | 'good' | 'excellent' | 'unknown'
  estimatedBandwidth: number
  roundTripTime: number
  adaptConnectionStrategy: () => ConnectionStrategy
}

interface ConnectionStrategy {
  enablePrefetch: boolean
  imageQuality: 'low' | 'medium' | 'high'
  enableAnimations: boolean
  chunkSize: 'small' | 'medium' | 'large'
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal'
}

export function useNetworkConnection(): NetworkConnectionHook {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionSpeed, setConnectionSpeed] = useState('unknown')
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const [isSaveDataEnabled, setIsSaveDataEnabled] = useState(false)
  const [networkStrength, setNetworkStrength] = useState<'poor' | 'good' | 'excellent' | 'unknown'>('unknown')
  const [estimatedBandwidth, setEstimatedBandwidth] = useState(0)
  const [roundTripTime, setRoundTripTime] = useState(0)

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    setIsOnline(navigator.onLine)
    
    const connection = (navigator as any)?.connection as NetworkConnection
    if (connection) {
      const { effectiveType, downlink, rtt, saveData } = connection
      
      setConnectionSpeed(effectiveType || 'unknown')
      setEstimatedBandwidth(downlink || 0)
      setRoundTripTime(rtt || 0)
      setIsSaveDataEnabled(saveData || false)
      
      // Determine if connection is slow
      const slow = ['slow-2g', '2g'].includes(effectiveType) || 
                   downlink < 1 || 
                   rtt > 300
      setIsSlowConnection(slow)
      
      // Determine network strength
      if (effectiveType === 'slow-2g' || downlink < 0.5 || rtt > 500) {
        setNetworkStrength('poor')
      } else if (effectiveType === '4g' && downlink > 5 && rtt < 100) {
        setNetworkStrength('excellent')
      } else {
        setNetworkStrength('good')
      }
    }
  }, [])

  useEffect(() => {
    updateNetworkStatus()

    // Listen for network changes
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleConnectionChange = updateNetworkStatus

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    const connection = (navigator as any)?.connection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // Periodic network quality check
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        updateNetworkStatus()
        measureNetworkSpeed()
      }
    }, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
      
      clearInterval(intervalId)
    }
  }, [updateNetworkStatus])

  // Measure actual network speed
  const measureNetworkSpeed = useCallback(async () => {
    if (!navigator.onLine) return

    try {
      const startTime = performance.now()
      
      // Fetch a small resource to measure speed
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        const endTime = performance.now()
        const latency = endTime - startTime
        
        // Update RTT based on actual measurement
        setRoundTripTime(prev => (prev + latency) / 2) // Moving average
        
        // Adjust network strength based on actual performance
        if (latency > 1000) {
          setNetworkStrength('poor')
        } else if (latency < 200) {
          setNetworkStrength('excellent')
        } else {
          setNetworkStrength('good')
        }
      }
    } catch (error) {
      // Network request failed, likely poor connection
      setNetworkStrength('poor')
    }
  }, [])

  // Adaptive connection strategy
  const adaptConnectionStrategy = useCallback((): ConnectionStrategy => {
    if (!isOnline) {
      return {
        enablePrefetch: false,
        imageQuality: 'low',
        enableAnimations: false,
        chunkSize: 'small',
        cacheStrategy: 'aggressive'
      }
    }

    if (isSaveDataEnabled) {
      return {
        enablePrefetch: false,
        imageQuality: 'low',
        enableAnimations: false,
        chunkSize: 'small',
        cacheStrategy: 'minimal'
      }
    }

    switch (networkStrength) {
      case 'poor':
        return {
          enablePrefetch: false,
          imageQuality: 'low',
          enableAnimations: false,
          chunkSize: 'small',
          cacheStrategy: 'moderate'
        }
      
      case 'good':
        return {
          enablePrefetch: true,
          imageQuality: 'medium',
          enableAnimations: true,
          chunkSize: 'medium',
          cacheStrategy: 'moderate'
        }
      
      case 'excellent':
        return {
          enablePrefetch: true,
          imageQuality: 'high',
          enableAnimations: true,
          chunkSize: 'large',
          cacheStrategy: 'aggressive'
        }
      
      default:
        return {
          enablePrefetch: true,
          imageQuality: 'medium',
          enableAnimations: true,
          chunkSize: 'medium',
          cacheStrategy: 'moderate'
        }
    }
  }, [isOnline, isSaveDataEnabled, networkStrength])

  return {
    isOnline,
    connectionSpeed,
    isSlowConnection,
    isSaveDataEnabled,
    networkStrength,
    estimatedBandwidth,
    roundTripTime,
    adaptConnectionStrategy
  }
}

// Network-aware resource loading
export function useNetworkAwareLoading() {
  const networkInfo = useNetworkConnection()
  
  const shouldPreload = useCallback((priority: 'high' | 'medium' | 'low' = 'medium') => {
    const strategy = networkInfo.adaptConnectionStrategy()
    
    if (!networkInfo.isOnline || !strategy.enablePrefetch) {
      return priority === 'high'
    }
    
    if (networkInfo.isSlowConnection && priority === 'low') {
      return false
    }
    
    return strategy.enablePrefetch || priority === 'high'
  }, [networkInfo])

  const getOptimalImageQuality = useCallback(() => {
    const strategy = networkInfo.adaptConnectionStrategy()
    return strategy.imageQuality
  }, [networkInfo])

  const shouldEnableAnimations = useCallback(() => {
    const strategy = networkInfo.adaptConnectionStrategy()
    return strategy.enableAnimations && !networkInfo.isSaveDataEnabled
  }, [networkInfo])

  const getChunkSize = useCallback(() => {
    const strategy = networkInfo.adaptConnectionStrategy()
    return strategy.chunkSize
  }, [networkInfo])

  return {
    ...networkInfo,
    shouldPreload,
    getOptimalImageQuality,
    shouldEnableAnimations,
    getChunkSize
  }
}

// Battery-aware optimizations
export function useBatteryAwareOptimizations() {
  const [batteryLevel, setBatteryLevel] = useState(1)
  const [isCharging, setIsCharging] = useState(true)
  const [isLowBattery, setIsLowBattery] = useState(false)

  useEffect(() => {
    const updateBatteryInfo = (battery: any) => {
      setBatteryLevel(battery.level)
      setIsCharging(battery.charging)
      setIsLowBattery(battery.level < 0.2) // Low battery at 20%
    }

    // Get battery information
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        updateBatteryInfo(battery)

        // Listen for battery changes
        battery.addEventListener('levelchange', () => updateBatteryInfo(battery))
        battery.addEventListener('chargingchange', () => updateBatteryInfo(battery))
      })
    }
  }, [])

  // Get battery-aware optimizations
  const getBatteryOptimizations = useCallback(() => {
    if (isLowBattery && !isCharging) {
      return {
        reduceAnimations: true,
        lowerFrameRate: true,
        disableBackgroundSync: true,
        useMinimalUI: true,
        reduceCPUUsage: true
      }
    }

    if (batteryLevel < 0.5 && !isCharging) {
      return {
        reduceAnimations: true,
        lowerFrameRate: false,
        disableBackgroundSync: true,
        useMinimalUI: false,
        reduceCPUUsage: true
      }
    }

    return {
      reduceAnimations: false,
      lowerFrameRate: false,
      disableBackgroundSync: false,
      useMinimalUI: false,
      reduceCPUUsage: false
    }
  }, [batteryLevel, isCharging, isLowBattery])

  return {
    batteryLevel,
    isCharging,
    isLowBattery,
    getBatteryOptimizations
  }
}