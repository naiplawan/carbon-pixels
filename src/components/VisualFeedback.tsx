'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  TrendingUp, 
  Award,
  Target,
  Zap,
  Heart
} from 'lucide-react';

// Feedback types and contexts
interface FeedbackMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error' | 'achievement' | 'streak' | 'milestone';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: any;
}

interface FeedbackContextType {
  showFeedback: (feedback: Omit<FeedbackMessage, 'id'>) => void;
  showQuickSuccess: (message: string) => void;
  showAchievement: (title: string, description: string, data?: any) => void;
  showStreak: (count: number) => void;
  showMilestone: (milestone: string, value: number) => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

// Provider component
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);

  const showFeedback = (feedback: Omit<FeedbackMessage, 'id'>) => {
    const id = `feedback-${Date.now()}-${Math.random()}`;
    const newFeedback: FeedbackMessage = {
      ...feedback,
      id,
      duration: feedback.duration || 5000
    };

    setFeedbacks(prev => [...prev, newFeedback]);

    // Auto-remove after duration
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }, newFeedback.duration);
  };

  const showQuickSuccess = (message: string) => {
    showFeedback({
      type: 'success',
      title: message,
      duration: 3000
    });
  };

  const showAchievement = (title: string, description: string, data?: any) => {
    showFeedback({
      type: 'achievement',
      title,
      message: description,
      duration: 6000,
      data
    });
  };

  const showStreak = (count: number) => {
    showFeedback({
      type: 'streak',
      title: `${count} Day Streak! 🔥`,
      message: `Amazing consistency! You've tracked waste for ${count} days in a row.`,
      duration: 5000,
      data: { count }
    });
  };

  const showMilestone = (milestone: string, value: number) => {
    showFeedback({
      type: 'milestone',
      title: `${milestone} Milestone!`,
      message: `Congratulations! You've reached ${value}!`,
      duration: 6000,
      data: { milestone, value }
    });
  };

  const removeFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  };

  return (
    <FeedbackContext.Provider value={{
      showFeedback,
      showQuickSuccess,
      showAchievement,
      showStreak,
      showMilestone
    }}>
      {children}
      <FeedbackContainer feedbacks={feedbacks} onRemove={removeFeedback} />
    </FeedbackContext.Provider>
  );
}

// Feedback container component
function FeedbackContainer({ 
  feedbacks, 
  onRemove 
}: { 
  feedbacks: FeedbackMessage[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {feedbacks.map(feedback => (
          <FeedbackCard
            key={feedback.id}
            feedback={feedback}
            onRemove={() => onRemove(feedback.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Individual feedback card
function FeedbackCard({
  feedback,
  onRemove
}: {
  feedback: FeedbackMessage;
  onRemove: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    switch (feedback.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'achievement':
        return <Award className="w-5 h-5" />;
      case 'streak':
        return <Target className="w-5 h-5" />;
      case 'milestone':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (feedback.type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          accent: 'bg-green-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-800',
          icon: 'text-amber-600',
          accent: 'bg-amber-500'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          accent: 'bg-blue-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          accent: 'bg-red-500'
        };
      case 'achievement':
        return {
          bg: 'bg-purple-50 border-purple-200',
          text: 'text-purple-800',
          icon: 'text-purple-600',
          accent: 'bg-gradient-to-r from-purple-500 to-pink-500'
        };
      case 'streak':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-600',
          accent: 'bg-gradient-to-r from-orange-500 to-red-500'
        };
      case 'milestone':
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          text: 'text-emerald-800',
          icon: 'text-emerald-600',
          accent: 'bg-gradient-to-r from-emerald-500 to-teal-500'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          accent: 'bg-gray-500'
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${styles.bg} border-2 rounded-lg shadow-lg overflow-hidden cursor-pointer relative`}
      onClick={onRemove}
    >
      {/* Accent bar */}
      <div className={`h-1 ${styles.accent}`} />
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
            {getIcon()}
          </div>
          
          <div className="flex-grow min-w-0">
            <div className={`font-medium ${styles.text} text-sm`}>
              {feedback.title}
            </div>
            
            {feedback.message && (
              <div className={`${styles.text} opacity-80 text-xs mt-1 line-clamp-2`}>
                {feedback.message}
              </div>
            )}
            
            {feedback.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  feedback.action!.onClick();
                  onRemove();
                }}
                className={`mt-2 text-xs font-medium ${styles.icon} hover:underline`}
              >
                {feedback.action.label}
              </button>
            )}
          </div>
          
          {/* Close button that appears on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className={`flex-shrink-0 p-1 rounded ${styles.text} hover:bg-white/50 transition-colors`}
              >
                <XCircle className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Special effects for achievements */}
      {feedback.type === 'achievement' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="absolute -top-2 -right-2"
        >
          <div className="bg-yellow-400 text-yellow-900 rounded-full p-1">
            <Award className="w-4 h-4" />
          </div>
        </motion.div>
      )}

      {feedback.type === 'streak' && (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="absolute -top-1 -right-1"
        >
          <div className="text-xl">🔥</div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Floating particles effect for special moments
export function ParticleExplosion({
  trigger,
  type = 'celebration'
}: {
  trigger: boolean;
  type?: 'celebration' | 'achievement' | 'streak';
}) {
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number; emoji: string }>>([]);

  useEffect(() => {
    if (!trigger) return;

    const emojis = {
      celebration: ['🎉', '🌟', '✨', '💫', '🎊'],
      achievement: ['🏆', '👑', '💎', '🌟', '⚡'],
      streak: ['🔥', '💪', '⚡', '🚀', '🌪️']
    };

    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: `particle-${Date.now()}-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: emojis[type][Math.floor(Math.random() * emojis[type].length)]
    }));

    setParticles(newParticles);

    // Remove particles after animation
    setTimeout(() => setParticles([]), 3000);
  }, [trigger, type]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{
              x: '50vw',
              y: '50vh',
              opacity: 1,
              scale: 0
            }}
            animate={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              opacity: [1, 1, 0],
              scale: [0, 1, 0.5],
              rotate: [0, 360, 720]
            }}
            exit={{
              opacity: 0,
              scale: 0
            }}
            transition={{
              duration: 3,
              ease: 'easeOut'
            }}
            className="absolute text-2xl"
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Button with haptic feedback and visual response
export function FeedbackButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  hapticFeedback = true,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'>) {

  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;

    // Visual feedback
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    // Haptic feedback (mobile)
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    onClick?.();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300';
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'medium':
        return 'px-4 py-2 text-base';
      case 'large':
        return 'px-6 py-3 text-lg';
    }
  };

  return (
    <motion.button
      animate={{
        scale: isPressed ? 0.95 : 1,
        opacity: disabled ? 0.5 : 1
      }}
      transition={{ duration: 0.1 }}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-lg font-medium transition-all duration-200 border-2
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        </motion.div>
      )}
      
      {/* Content */}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>

      {/* Ripple effect */}
      {isPressed && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-white rounded-lg"
        />
      )}
    </motion.button>
  );
}

// Progress indicator with smooth animations
export function AnimatedProgress({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'green',
  size = 'medium',
  animate = true
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'green' | 'blue' | 'purple' | 'orange';
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  const getColorStyles = () => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'blue':
        return 'bg-blue-500';
      case 'purple':
        return 'bg-purple-500';
      case 'orange':
        return 'bg-orange-500';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'h-2';
      case 'medium':
        return 'h-3';
      case 'large':
        return 'h-4';
    }
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showValue && (
            <span className="text-sm text-gray-600">{value}/{max}</span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getSizeStyles()}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animate ? 1 : 0, ease: 'easeOut' }}
          className={`${getSizeStyles()} rounded-full ${getColorStyles()}`}
        />
      </div>
    </div>
  );
}