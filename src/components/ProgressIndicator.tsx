'use client'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  currentScore: number
}

export default function ProgressIndicator({ currentStep, totalSteps, currentScore }: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <section className="mb-6" aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="sr-only">
        Progress through carbon footprint calculator
      </h2>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
        <span className="text-sm font-sketch text-pencil">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-base sm:text-lg font-handwritten text-ink">
          Current Score: <span className="font-mono">{Math.round(currentScore * 10) / 10}</span> CO₂
        </span>
      </div>
      
      <div 
        className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Progress: step ${currentStep + 1} of ${totalSteps} completed`}
      >
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500" aria-hidden="true">
        <span>Start</span>
        <span>Your Carbon Story</span>
      </div>
    </section>
  )
}