import { NextRequest, NextResponse } from 'next/server'
import thailandQuestionsData from '@/data/thailand-questions.json'
import { ThailandCarbonCalculator } from '@/lib/thailand-calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers } = body

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected answers array.' },
        { status: 400 }
      )
    }

    // Use Thailand-specific calculator
    const thailandResult = ThailandCarbonCalculator.calculateThailandFootprint(answers)
    const recommendations = ThailandCarbonCalculator.getThailandRecommendations(thailandResult)
    const reductionPotential = ThailandCarbonCalculator.calculateThailandReductionPotential(thailandResult)
    const comparison = ThailandCarbonCalculator.compareToThailandAverages(thailandResult)

    const answerDetails = []
    let totalScore = 0

    // Build answer details for display
    for (const userAnswer of answers) {
      const question = thailandQuestionsData.questions.find(q => q.id === userAnswer.questionId)
      if (!question) continue

      const selectedAnswer = question.answers.find(a => a.id === userAnswer.answerId)
      if (!selectedAnswer) continue

      totalScore += selectedAnswer.value
      answerDetails.push({
        questionId: question.id,
        questionTitle: question.title,
        answerId: selectedAnswer.id,
        answerText: selectedAnswer.text,
        value: selectedAnswer.value,
        visual: selectedAnswer.visual,
        description: selectedAnswer.description,
        unit: selectedAnswer.unit,
        source: selectedAnswer.source,
        category: question.category
      })
    }

    const response = {
      // Basic scoring (for compatibility)
      totalScore: Math.round(totalScore * 10) / 10,
      scoreCategory: thailandResult.category,
      scoringInfo: thailandQuestionsData.scoring[thailandResult.category as keyof typeof thailandQuestionsData.scoring],
      answerDetails,
      
      // Thailand-specific enhanced results
      thailandCalculation: {
        totalAnnualEmissions: thailandResult.totalAnnualEmissions,
        monthlyBreakdown: thailandResult.monthlyBreakdown,
        dailyAverage: thailandResult.dailyAverage,
        negativeEmissions: thailandResult.negativeEmissions,
        improvements: thailandResult.improvements
      },
      
      // Actionable recommendations
      recommendations,
      reductionPotential,
      comparison,
      
      // Metadata
      metadata: {
        ...thailandQuestionsData.metadata,
        calculationMethod: 'Thailand-specific with TGO/EPPO factors',
        annualUpdateCycle: true
      },
      timestamp: new Date().toISOString()
    }

    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Carbon Footprint Calculator API - Use POST with answers array' },
    { status: 200 }
  )
}