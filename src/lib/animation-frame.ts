/**
 * Utility for managing animation frames with proper cleanup
 */

import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook for managing animation frames with automatic cleanup
 */
export const useAnimationFrame = (
  callback: (deltaTime: number) => void,
  isRunning: boolean = true
) => {
  const requestRef = useRef<number | undefined>(undefined)
  const previousTimeRef = useRef<number | undefined>(undefined)
  const callbackRef = useRef(callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current
      callbackRef.current(deltaTime)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate)
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = undefined
      }
    }
  }, [isRunning, animate])

  return {
    start: () => {
      if (!requestRef.current) {
        requestRef.current = requestAnimationFrame(animate)
      }
    },
    stop: () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = undefined
      }
      previousTimeRef.current = undefined
    }
  }
}

/**
 * Class for managing complex canvas animations with cleanup
 */
export class CanvasAnimationManager {
  private animationId: number | null = null
  private isRunning = false
  private lastTime = 0

  constructor(
    private canvas: HTMLCanvasElement,
    private drawCallback: (ctx: CanvasRenderingContext2D, deltaTime: number) => void
  ) {}

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.animate(0)
  }

  stop() {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = (currentTime: number) => {
    if (!this.isRunning) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    const ctx = this.canvas.getContext('2d')
    if (ctx) {
      this.drawCallback(ctx, deltaTime)
    }

    this.animationId = requestAnimationFrame(this.animate)
  }

  destroy() {
    this.stop()
  }
}

/**
 * Hook for canvas animations with automatic cleanup
 */
export const useCanvasAnimation = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, deltaTime: number) => void,
  isRunning: boolean = true
) => {
  const managerRef = useRef<CanvasAnimationManager | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const manager = new CanvasAnimationManager(canvasRef.current, draw)
    managerRef.current = manager

    if (isRunning) {
      manager.start()
    }

    return () => {
      manager.destroy()
      managerRef.current = null
    }
  }, []) // Only create manager once

  useEffect(() => {
    if (!managerRef.current) return

    if (isRunning) {
      managerRef.current.start()
    } else {
      managerRef.current.stop()
    }
  }, [isRunning])

  return {
    start: () => managerRef.current?.start(),
    stop: () => managerRef.current?.stop()
  }
}

/**
 * Performance-optimized animation frame for reduced motion preference
 */
export const useReducedMotionAnimationFrame = (
  callback: (deltaTime: number) => void,
  isRunning: boolean = true
) => {
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = mediaQuery.matches

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return useAnimationFrame(
    (deltaTime) => {
      if (!prefersReducedMotion.current) {
        callback(deltaTime)
      }
    },
    isRunning
  )
}