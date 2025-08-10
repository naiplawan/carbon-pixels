'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X } from 'lucide-react'

interface TooltipProps {
  content: React.ReactNode
  title?: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click'
  maxWidth?: number
  className?: string
  disabled?: boolean
}

export default function Tooltip({
  content,
  title,
  children,
  position = 'top',
  trigger = 'hover',
  maxWidth = 250,
  className = '',
  disabled = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      // Calculate best position to avoid viewport overflow
      let newPosition = position

      // Check if tooltip would overflow on the preferred position
      if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
        newPosition = 'top'
      } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
        newPosition = 'right'
      } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewport.width - 10) {
        newPosition = 'left'
      }

      setActualPosition(newPosition)
    }
  }, [isVisible, position])

  const showTooltip = () => {
    if (!disabled) {
      setIsVisible(true)
    }
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      showTooltip()
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      hideTooltip()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip()
      } else {
        showTooltip()
      }
    }
  }

  // Close tooltip when clicking outside
  useEffect(() => {
    if (trigger === 'click' && isVisible) {
      const handleOutsideClick = (e: MouseEvent) => {
        if (
          triggerRef.current &&
          tooltipRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          !tooltipRef.current.contains(e.target as Node)
        ) {
          hideTooltip()
        }
      }

      document.addEventListener('mousedown', handleOutsideClick)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [trigger, isVisible])

  const getTooltipPosition = () => {
    switch (actualPosition) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px'
        }
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px'
        }
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px'
        }
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px'
        }
      default:
        return {}
    }
  }

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0 border-solid'
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} border-l-transparent border-r-transparent border-b-transparent border-t-white top-full left-1/2 transform -translate-x-1/2 border-t-8 border-l-8 border-r-8`
      case 'bottom':
        return `${baseClasses} border-l-transparent border-r-transparent border-t-transparent border-b-white bottom-full left-1/2 transform -translate-x-1/2 border-b-8 border-l-8 border-r-8`
      case 'left':
        return `${baseClasses} border-t-transparent border-b-transparent border-r-transparent border-l-white left-full top-1/2 transform -translate-y-1/2 border-l-8 border-t-8 border-b-8`
      case 'right':
        return `${baseClasses} border-t-transparent border-b-transparent border-l-transparent border-r-white right-full top-1/2 transform -translate-y-1/2 border-r-8 border-t-8 border-b-8`
      default:
        return baseClasses
    }
  }

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: actualPosition === 'top' ? 5 : actualPosition === 'bottom' ? -5 : 0,
      x: actualPosition === 'left' ? 5 : actualPosition === 'right' ? -5 : 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: actualPosition === 'top' ? 5 : actualPosition === 'bottom' ? -5 : 0,
      x: actualPosition === 'left' ? 5 : actualPosition === 'right' ? -5 : 0
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={trigger === 'click' ? 'cursor-pointer' : ''}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50"
            style={{
              ...getTooltipPosition(),
              maxWidth: `${maxWidth}px`,
              minWidth: '120px'
            }}
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {/* Arrow */}
              <div className={getArrowClasses()} />
              
              {/* Header */}
              {title && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-handwritten text-sm font-bold text-ink">
                      {title}
                    </h3>
                    {trigger === 'click' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          hideTooltip()
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close tooltip"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="p-3">
                <div className="font-sketch text-sm text-gray-700 leading-relaxed">
                  {content}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Specialized help icon tooltip for quick help hints
export function HelpTooltip({
  content,
  title,
  position = 'top',
  className = ''
}: {
  content: React.ReactNode
  title?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  return (
    <Tooltip
      content={content}
      title={title}
      position={position}
      trigger="hover"
      className={className}
    >
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
    </Tooltip>
  )
}

// Interactive tooltip for click-based interactions
export function InteractiveTooltip({
  content,
  title,
  children,
  position = 'top',
  maxWidth = 300,
  className = ''
}: {
  content: React.ReactNode
  title?: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: number
  className?: string
}) {
  return (
    <Tooltip
      content={content}
      title={title}
      position={position}
      trigger="click"
      maxWidth={maxWidth}
      className={className}
    >
      {children}
    </Tooltip>
  )
}

// Feature highlight tooltip for onboarding highlights
export function FeatureHighlight({
  content,
  title,
  children,
  isVisible,
  onClose,
  position = 'top'
}: {
  content: React.ReactNode
  title: string
  children: React.ReactNode
  isVisible: boolean
  onClose: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-50 pointer-events-auto"
            style={{
              top: position === 'bottom' ? '100%' : position === 'top' ? 'auto' : '50%',
              bottom: position === 'top' ? '100%' : 'auto',
              left: position === 'right' ? '100%' : position === 'left' ? 'auto' : '50%',
              right: position === 'left' ? '100%' : 'auto',
              transform: position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
              marginTop: position === 'bottom' ? '12px' : '0',
              marginBottom: position === 'top' ? '12px' : '0',
              marginLeft: position === 'right' ? '12px' : '0',
              marginRight: position === 'left' ? '12px' : '0'
            }}
          >
            <div className="bg-white border-2 border-yellow-300 rounded-lg shadow-xl max-w-xs">
              {/* Arrow */}
              <div className={`absolute w-0 h-0 border-solid ${
                position === 'top' ? 'border-l-transparent border-r-transparent border-b-transparent border-t-yellow-300 top-full left-1/2 transform -translate-x-1/2 border-t-8 border-l-8 border-r-8' :
                position === 'bottom' ? 'border-l-transparent border-r-transparent border-t-transparent border-b-yellow-300 bottom-full left-1/2 transform -translate-x-1/2 border-b-8 border-l-8 border-r-8' :
                position === 'left' ? 'border-t-transparent border-b-transparent border-r-transparent border-l-yellow-300 left-full top-1/2 transform -translate-y-1/2 border-l-8 border-t-8 border-b-8' :
                'border-t-transparent border-b-transparent border-l-transparent border-r-yellow-300 right-full top-1/2 transform -translate-y-1/2 border-r-8 border-t-8 border-b-8'
              }`} />
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-2 border-b border-yellow-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-handwritten text-sm font-bold text-yellow-800 flex items-center gap-1">
                    <span className="text-yellow-600">💡</span>
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-yellow-100 rounded-full transition-colors"
                    aria-label="Close feature highlight"
                  >
                    <X className="w-3 h-3 text-yellow-600" />
                  </button>
                </div>
              </div>
              
              <div className="p-3">
                <div className="font-sketch text-sm text-yellow-800 leading-relaxed">
                  {content}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}