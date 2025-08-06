'use client'

import { Question } from '@/lib/api'

interface QuestionStepProps {
  question: Question
  selectedAnswer?: string
  onAnswer: (questionId: string, answerId: string, value: number) => void
}

export default function QuestionStep({ question, selectedAnswer, onAnswer }: QuestionStepProps) {
  return (
    <section 
      className="bg-white/70 p-4 sm:p-6 rounded-lg border-2 border-dashed border-pencil"
      aria-labelledby={`question-${question.id}`}
    >
      <div className="text-center mb-6">
        <div 
          className="text-4xl sm:text-5xl mb-3" 
          role="img" 
          aria-label={`Question category: ${question.title}`}
        >
          {question.icon}
        </div>
        <h2 
          id={`question-${question.id}`}
          className="text-2xl sm:text-3xl font-handwritten text-ink mb-2"
        >
          {question.title}
        </h2>
        <p className="text-base sm:text-lg text-pencil font-sketch">
          {question.description}
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">
          Choose your answer for: {question.title}
        </legend>
        {question.answers.map((answer, index) => (
          <button
            key={answer.id}
            onClick={() => onAnswer(question.id, answer.id, answer.value)}
            className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all duration-200 focus-visible ${
              selectedAnswer === answer.id
                ? 'border-green-leaf bg-green-50 text-green-800 ring-2 ring-green-500'
                : 'border-gray-300 hover:border-pencil hover:bg-gray-50 focus:border-green-500'
            }`}
            aria-pressed={selectedAnswer === answer.id}
            aria-describedby={`answer-${answer.id}-description`}
            type="button"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="text-base sm:text-lg font-sketch text-ink mb-1 break-words">
                  {answer.text}
                </div>
                <div 
                  id={`answer-${answer.id}-description`}
                  className="text-sm text-pencil break-words"
                >
                  {answer.description}
                </div>
              </div>
              <div className="ml-4 text-right flex-shrink-0">
                <div className="text-xs sm:text-sm text-gray-500 font-mono">
                  {answer.value === 0 ? '0' : `+${answer.value}`} CO₂
                </div>
                {selectedAnswer === answer.id && (
                  <div 
                    className="text-green-600 text-xl" 
                    aria-hidden="true"
                  >
                    ✓
                  </div>
                )}
                <span className="sr-only">
                  {selectedAnswer === answer.id ? 'Selected' : 'Not selected'}
                </span>
              </div>
            </div>
          </button>
        ))}
      </fieldset>
    </section>
  )
}