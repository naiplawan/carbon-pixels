/**
 * Reusable Modal component with accessibility, focus management, and animations
 */

'use client'

import React, { useEffect, useRef, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useTouchFeedback } from '@/lib/touch-feedback'
import { triggerHaptic } from '@/lib/haptic-feedback'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  overlayClassName?: string
  contentClassName?: string
  animationPreset?: 'fade' | 'slide' | 'scale' | 'slideUp'
  preventScroll?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full h-full'
}

const animations = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: { opacity: 0, x: '100%' },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: '100%' }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  slideUp: {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' }
  }
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  animationPreset = 'scale',
  preventScroll = true
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lastActiveElementRef = useRef<HTMLElement | null>(null)

  const { touchHandlers: closeTouchHandlers, styles: closeButtonStyles } = useTouchFeedback({
    scale: 0.95,
    haptic: true,
    hapticType: 'light'
  })

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the last active element
      lastActiveElementRef.current = document.activeElement as HTMLElement
      
      // Focus the close button or first focusable element
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus()
        } else {
          const firstFocusable = contentRef.current?.querySelector(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement
          firstFocusable?.focus()
        }
      }, 100)
    } else {
      // Restore focus to the last active element
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus()
      }
    }
  }, [isOpen])

  // Prevent scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen, preventScroll])

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!closeOnEscape || !isOpen) return

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      triggerHaptic('light')
    }
  }, [isOpen, closeOnEscape, onClose])

  // Focus trap
  const handleFocusTrap = useCallback((event: KeyboardEvent) => {
    if (!isOpen || event.key !== 'Tab') return

    const modal = contentRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleFocusTrap)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleFocusTrap)
    }
  }, [handleKeyDown, handleFocusTrap])

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (!closeOnOverlayClick) return
    if (event.target === overlayRef.current) {
      onClose()
      triggerHaptic('light')
    }
  }, [closeOnOverlayClick, onClose])

  const handleClose = useCallback(() => {
    onClose()
    triggerHaptic('light')
  }, [onClose])

  const animation = animations[animationPreset]

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            ref={overlayRef}
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${overlayClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
            transition={{ duration: 0.2 }}
          />
          
          {/* Modal Content */}
          <motion.div
            ref={contentRef}
            className={`
              relative w-full mx-4 bg-white rounded-lg shadow-2xl
              ${sizeClasses[size]}
              ${size === 'full' ? 'mx-0 rounded-none' : ''}
              ${className}
            `}
            initial={animation.initial}
            animate={animation.animate}
            exit={animation.exit}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              duration: 0.3
            }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                {title && (
                  <h2 
                    className="text-xl font-semibold text-gray-900 font-handwritten"
                    id="modal-title"
                  >
                    {title}
                  </h2>
                )}
                
                {showCloseButton && (
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    onClick={handleClose}
                    aria-label="Close modal"
                    {...closeTouchHandlers}
                    style={closeButtonStyles}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div 
              className={`p-4 ${contentClassName}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal