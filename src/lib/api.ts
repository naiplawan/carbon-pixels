export interface Answer {
  questionId: string
  answerId: string
}

export interface CalculationResult {
  totalScore: number
  scoreCategory: string
  scoringInfo: {
    title: string
    description: string
    color: string
  }
  answerDetails: Array<{
    questionId: string
    questionTitle: string
    answerId: string
    answerText: string
    value: number
    visual: string
    description: string
    unit?: string
    source?: string
    category?: string
  }>
  thailandCalculation?: {
    totalAnnualEmissions: number
    monthlyBreakdown: {
      transportation: number
      electricity: number
      food: number
      waste: number
      consumption: number
    }
    dailyAverage: number
    negativeEmissions: number
    improvements: string[]
  }
  recommendations?: string[]
  reductionPotential?: Array<{
    action: string
    potentialReduction: number
    newCategory?: string
  }>
  comparison?: {
    category: string
    comparisonText: string
    percentDifference: number
  }
  metadata?: {
    country?: string
    dataSource?: string
    lastUpdated?: string
    calculationMethod?: string
    annualUpdateCycle?: boolean
  }
  timestamp: string
}

export interface Question {
  id: string
  title: string
  description: string
  icon: string
  answers: Array<{
    id: string
    text: string
    value: number
    visual: string
    description: string
  }>
}

export interface QuestionsData {
  questions: Question[]
  scoring: Record<string, {
    max: number
    title: string
    description: string
    color: string
  }>
}

export async function calculateCarbonFootprint(answers: Answer[]): Promise<CalculationResult> {
  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers }),
  })

  if (!response.ok) {
    throw new Error('Failed to calculate carbon footprint')
  }

  return response.json()
}

export async function getQuestions(): Promise<QuestionsData> {
  const response = await fetch('/api/questions')
  
  if (!response.ok) {
    throw new Error('Failed to fetch questions')
  }

  return response.json()
}