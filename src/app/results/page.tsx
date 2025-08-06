'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Answer, CalculationResult, calculateCarbonFootprint } from '@/lib/api'
import ThailandCarbonCanvas from '@/components/ThailandCarbonCanvas'
import Link from 'next/link'

function ResultsContent() {
  const searchParams = useSearchParams()
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResults() {
      try {
        const answersParam = searchParams.get('answers')
        if (!answersParam) {
          setError('No answers provided')
          setLoading(false)
          return
        }

        const parsedAnswers: Answer[] = JSON.parse(decodeURIComponent(answersParam))
        setAnswers(parsedAnswers)

        const calculationResult = await calculateCarbonFootprint(parsedAnswers)
        setResult(calculationResult)
        setLoading(false)
      } catch (err) {
        console.error('Failed to calculate results:', err)
        setError('Failed to calculate your carbon footprint')
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchParams])

  const shareResults = async () => {
    if (!result) return

    const shareText = `I just calculated my carbon footprint! My score is ${result.totalScore} CO₂ - ${result.scoringInfo.title} 🌍`
    const shareUrl = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Carbon Footprint Journey',
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        alert('Results copied to clipboard!')
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      alert('Results copied to clipboard!')
    }
  }

  const restartJourney = () => {
    window.location.href = '/calculator'
  }

  if (loading) {
    return (
      <div className="notebook-page p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl font-handwritten text-ink mb-4">Calculating your impact...</div>
          <div className="text-pencil">Creating your carbon story</div>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="notebook-page p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-handwritten text-ink mb-4">Oops! Something went wrong</div>
          <div className="text-pencil mb-4">{error || 'Unable to load your results'}</div>
          <Link 
            href="/calculator"
            className="px-6 py-3 bg-green-leaf text-white font-sketch rounded-lg hover:bg-green-600"
          >
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  const thailandTips = [
    {
      icon: '🚊',
      title: 'Thai Transportation',
      tip: 'Use BTS, MRT, or public buses in Bangkok. Consider electric motorcycles becoming popular in Thai cities.'
    },
    {
      icon: '🌞',
      title: 'Energy in Thailand',
      tip: 'Set AC to 25-26°C, use Thai Energy Label appliances, consider rooftop solar - Thailand has excellent solar potential.'
    },
    {
      icon: '🍜',
      title: 'Thai Food Choices',
      tip: 'Reduce food waste (39% of Thailand\'s waste), choose local Thai produce, try plant-based Thai dishes.'
    },
    {
      icon: '🏪',
      title: 'Local Shopping',
      tip: 'Shop at Thai markets, choose local over imported goods, support Thai businesses committed to sustainability.'
    },
    {
      icon: '♻️',
      title: 'Thai Waste Management',
      tip: 'Follow municipality guidelines, compost at home, avoid single-use plastics, use reusable bags at markets.'
    },
    {
      icon: '🇹🇭',
      title: 'Thailand 2050 Goals',
      tip: 'Support Thailand\'s carbon neutrality by 2050 and net-zero emissions by 2065 through your daily choices.'
    }
  ]

  return (
    <div className="notebook-page min-h-screen">
      <div className="max-w-6xl mx-auto p-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-handwritten text-ink mb-4">Your Thailand Carbon Story 🇹🇭</h1>
          <p className="text-xl text-pencil font-sketch max-w-2xl mx-auto">
            Here&apos;s your environmental impact using official TGO and EPPO data. 
            See how you can help Thailand achieve carbon neutrality by 2050.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Results Summary */}
          <div className="bg-white/70 p-8 rounded-lg border-2 border-dashed border-pencil">
            <div className="text-center mb-6">
              <div 
                className="text-8xl font-handwritten mb-4"
                style={{ color: result.scoringInfo.color }}
              >
                {result.totalScore}
              </div>
              <div className="text-2xl font-handwritten text-ink mb-2">
                CO₂ Units per Year
              </div>
              <div 
                className="text-3xl font-sketch mb-4"
                style={{ color: result.scoringInfo.color }}
              >
                {result.scoringInfo.title}
              </div>
              <p className="text-lg text-pencil font-sketch leading-relaxed">
                {result.scoringInfo.description}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-handwritten text-ink mb-4">Your Thailand Carbon Breakdown</h3>
              {result.answerDetails.map((detail, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-sketch text-ink font-semibold">{detail.category || detail.questionTitle}</div>
                      <div className="text-sm text-pencil">{detail.answerText}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-mono text-sm font-semibold text-gray-800">
                        {detail.value > 0 ? `+${detail.value}` : detail.value} {detail.unit || 'CO₂e'}
                      </div>
                    </div>
                  </div>
                  {detail.source && (
                    <div className="text-xs text-gray-500 mt-1">
                      Source: {detail.source}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={shareResults}
                className="px-6 py-3 bg-blue-500 text-white font-sketch rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                📤 Share My Story
              </button>
              <button
                onClick={restartJourney}
                className="px-6 py-3 bg-green-leaf text-white font-sketch rounded-lg hover:bg-green-600"
              >
                🔄 Try Again
              </button>
            </div>
          </div>

          {/* Final Thailand Canvas Visualization */}
          <div>
            <ThailandCarbonCanvas 
              currentScore={result.totalScore}
              answers={answers}
              currentQuestion="final"
            />
            
            {/* Thailand-specific calculation breakdown */}
            {result.thailandCalculation && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
                <h4 className="text-lg font-handwritten text-green-800 mb-3">
                  Thailand Calculation Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Annual Total:</strong> {result.thailandCalculation.totalAnnualEmissions} kg CO₂e
                  </div>
                  <div>
                    <strong>Daily Average:</strong> {result.thailandCalculation.dailyAverage} kg CO₂e
                  </div>
                  {result.thailandCalculation.negativeEmissions > 0 && (
                    <div className="col-span-2 text-green-700 font-semibold">
                      🌱 Negative Emissions: -{result.thailandCalculation.negativeEmissions} kg CO₂e/year
                      <div className="text-xs text-green-600">From waste avoidance and sustainable practices!</div>
                    </div>
                  )}
                </div>
                
                {result.thailandCalculation.improvements && result.thailandCalculation.improvements.length > 0 && (
                  <div className="mt-3">
                    <strong className="text-green-800">Excellent Choices:</strong>
                    <ul className="text-xs text-green-700 mt-1 list-disc list-inside">
                      {result.thailandCalculation.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thailand-Specific Action Tips */}
        <div className="bg-white/70 p-8 rounded-lg border-2 border-dashed border-pencil">
          <h2 className="text-3xl font-handwritten text-ink text-center mb-8">
            Thailand-Specific Actions for Lower Emissions 🇹🇭
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {thailandTips.map((tip, index) => (
              <div key={index} className="text-center p-4">
                <div className="text-4xl mb-3">{tip.icon}</div>
                <h3 className="text-xl font-sketch text-ink mb-2">{tip.title}</h3>
                <p className="text-pencil text-sm leading-relaxed">{tip.tip}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
            <div className="text-2xl font-handwritten text-green-800 mb-2">
              Together for Thailand&apos;s Climate Future! 🌱
            </div>
            <p className="text-green-700 font-sketch mb-3">
              Your actions contribute to Thailand&apos;s ambitious climate goals: 
              Carbon neutrality by 2050 and net-zero emissions by 2065.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <strong className="text-blue-700">Official Data Sources:</strong>
                <br />Thailand Greenhouse Gas Management Organization (TGO) & 
                Energy Policy and Planning Office (EPPO)
              </div>
              <div className="bg-white p-3 rounded-lg">
                <strong className="text-green-700">Updated Annually:</strong>
                <br />Emission factors reflect Thailand&apos;s evolving energy mix 
                and sustainability improvements
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/"
            className="text-lg text-pencil font-sketch hover:text-ink transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="notebook-page p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl font-handwritten text-ink mb-4">Loading your results...</div>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}