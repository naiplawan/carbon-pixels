'use client'

import { useState, useEffect } from 'react'
import { Question, Answer, getQuestions } from '@/lib/api'
import QuestionStep from '@/components/QuestionStep'
import ProgressIndicator from '@/components/ProgressIndicator'
import ThailandCarbonCanvas from '@/components/ThailandCarbonCanvas'
import { useRouter } from 'next/navigation'

export default function CalculatorPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentScore, setCurrentScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const data = await getQuestions()
        setQuestions(data.questions)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch questions:', error)
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleAnswer = (questionId: string, answerId: string, value: number) => {
    const newAnswer: Answer = { questionId, answerId }
    const updatedAnswers = [...answers.filter(a => a.questionId !== questionId), newAnswer]
    setAnswers(updatedAnswers)
    
    // Update current score (simplified calculation for real-time feedback)
    const newScore = currentScore + value
    setCurrentScore(newScore)
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Navigate to results with answers
      const encodedAnswers = encodeURIComponent(JSON.stringify(answers))
      router.push(`/results?answers=${encodedAnswers}`)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading) {
    return (
      <div className="notebook-page p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl font-handwritten text-ink mb-4">Loading your journey...</div>
          <div className="text-pencil">Getting everything ready</div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="notebook-page p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-handwritten text-ink mb-4">Oops! Something went wrong</div>
          <div className="text-pencil mb-4">We couldn&apos;t load the questions</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-leaf text-white font-sketch rounded-lg hover:bg-green-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === questions.length - 1
  const canProceed = answers.some(a => a.questionId === currentQuestion.id)

  return (
    <div className="notebook-page min-h-screen">
      <div className="max-w-6xl mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-handwritten text-ink mb-2">Thailand Carbon Journey Calculator 🇹🇭</h1>
          <div className="text-sm text-pencil mb-4">
            Using official TGO and EPPO emission factors for accurate Thailand calculations
          </div>
          <ProgressIndicator 
            currentStep={currentStep} 
            totalSteps={questions.length}
            currentScore={currentScore}
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Section */}
          <div className="order-2 lg:order-1">
            <QuestionStep 
              question={currentQuestion}
              selectedAnswer={answers.find(a => a.questionId === currentQuestion.id)?.answerId}
              onAnswer={handleAnswer}
            />

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-6 py-3 border-2 border-pencil text-pencil font-sketch rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="px-8 py-3 bg-green-leaf text-white font-sketch rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastStep ? 'See My Results' : 'Next →'}
              </button>
            </div>
          </div>

          {/* Canvas Section */}
          <div className="order-1 lg:order-2">
            <ThailandCarbonCanvas 
              currentScore={currentScore}
              answers={answers}
              currentQuestion={currentQuestion.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}