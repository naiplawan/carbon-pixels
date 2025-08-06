/**
 * Thailand Carbon Footprint Calculator Logic
 * Using official TGO and EPPO emission factors
 */

import { Answer } from './api'
import thailandData from '@/data/thailand-questions.json'

export interface ThailandCalculationResult {
  totalAnnualEmissions: number // kg CO2e/year
  monthlyBreakdown: {
    transportation: number
    electricity: number
    food: number
    waste: number
    consumption: number
  }
  dailyAverage: number
  category: string
  improvements: string[]
  negativeEmissions: number // From waste avoidance, etc.
}

export class ThailandCarbonCalculator {
  private static readonly DAYS_PER_YEAR = 365
  private static readonly MONTHS_PER_YEAR = 12

  /**
   * Calculate comprehensive Thailand carbon footprint
   */
  static calculateThailandFootprint(answers: Answer[]): ThailandCalculationResult {
    let monthlyEmissions = {
      transportation: 0,
      electricity: 0,
      food: 0,
      waste: 0,
      consumption: 0
    }

    let negativeEmissions = 0
    const improvements: string[] = []

    for (const answer of answers) {
      const question = thailandData.questions.find(q => q.id === answer.questionId)
      if (!question) continue

      const selectedAnswer = question.answers.find(a => a.id === answer.answerId)
      if (!selectedAnswer) continue

      const monthlyValue = this.convertToMonthlyEmissions(
        selectedAnswer.value,
        selectedAnswer.unit || 'kg CO2e/month',
        question.id
      )

      // Categorize emissions by type
      switch (question.id) {
        case 'transportation':
          monthlyEmissions.transportation = monthlyValue
          if (selectedAnswer.id === 'motorcycle' || selectedAnswer.id === 'bicycle_walk') {
            improvements.push('Excellent low-emission transport choice!')
          }
          break
        
        case 'electricity':
          monthlyEmissions.electricity = monthlyValue
          if (selectedAnswer.id === 'low_usage' || selectedAnswer.id === 'minimal_usage') {
            improvements.push('Great energy conservation in Thailand\'s climate!')
          }
          break
        
        case 'diet':
          // Convert daily to monthly
          monthlyEmissions.food = monthlyValue
          if (selectedAnswer.id === 'vegetarian_diet' || selectedAnswer.id === 'vegan_diet') {
            improvements.push('Plant-based diet supports Thailand\'s agricultural sustainability!')
          }
          break
        
        case 'waste_management':
          monthlyEmissions.waste = monthlyValue
          if (monthlyValue < 0) {
            negativeEmissions += Math.abs(monthlyValue)
            improvements.push('Negative emissions through Thai waste avoidance - excellent!')
          }
          break
        
        case 'consumption_habits':
          monthlyEmissions.consumption = monthlyValue
          if (selectedAnswer.id === 'minimal_shopping' || selectedAnswer.id === 'secondhand_focus') {
            improvements.push('Supporting Thai circular economy!')
          }
          break
      }
    }

    const totalMonthlyEmissions = Object.values(monthlyEmissions).reduce((sum, val) => sum + val, 0)
    const totalAnnualEmissions = totalMonthlyEmissions * this.MONTHS_PER_YEAR
    const dailyAverage = totalAnnualEmissions / this.DAYS_PER_YEAR

    const category = this.determineThailandCategory(totalAnnualEmissions)

    return {
      totalAnnualEmissions: Math.round(totalAnnualEmissions * 100) / 100,
      monthlyBreakdown: monthlyEmissions,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      category,
      improvements,
      negativeEmissions: Math.round(negativeEmissions * 100) / 100
    }
  }

  /**
   * Convert various units to monthly emissions for consistency
   */
  private static convertToMonthlyEmissions(
    value: number, 
    unit: string, 
    questionId: string
  ): number {
    switch (unit) {
      case 'kg CO2e/month':
        return value

      case 'kg CO2e/day':
        return value * 30.44 // Average days per month

      case 'kg CO2e/km':
        // For transportation, estimate monthly km based on Thai usage patterns
        return this.estimateMonthlyTransportEmissions(value, questionId)

      case 'kg CO2e/kWh':
        // This shouldn't happen as electricity is pre-calculated
        return value

      default:
        return value
    }
  }

  /**
   * Estimate monthly transport emissions based on Thai usage patterns
   */
  private static estimateMonthlyTransportEmissions(
    emissionFactorPerKm: number, 
    questionId: string
  ): number {
    // Thai-specific monthly distance estimates based on transport mode
    const monthlyKmEstimates = {
      'heavy_duty_diesel': 2000, // Commercial/work use
      'bus_public': 600,         // Regular commuter
      'passenger_car': 1200,     // Thai urban driving
      'pickup_truck': 1500,      // Popular for both personal and work
      'taxi_ride': 400,          // Occasional use
      'motorcycle': 800,         // Very popular in Thailand
      'bicycle_walk': 0          // Zero emissions
    }

    const estimatedKm = monthlyKmEstimates[questionId as keyof typeof monthlyKmEstimates] || 1000
    return emissionFactorPerKm * estimatedKm
  }

  /**
   * Determine Thailand-specific scoring category
   */
  private static determineThailandCategory(annualEmissions: number): string {
    const monthlyEmissions = annualEmissions / 12

    for (const [category, config] of Object.entries(thailandData.scoring)) {
      if (monthlyEmissions <= config.max) {
        return category
      }
    }
    return 'high_impact'
  }

  /**
   * Get Thailand-specific recommendations based on calculation results
   */
  static getThailandRecommendations(result: ThailandCalculationResult): string[] {
    const recommendations: string[] = []
    const { monthlyBreakdown, category } = result

    // Transportation recommendations (Thailand-specific)
    if (monthlyBreakdown.transportation > 50) {
      recommendations.push(
        'Consider using BTS/MRT in Bangkok or public buses for daily commute',
        'If you need personal transport, motorcycles are efficient for Thai traffic',
        'Electric vehicles are gaining support from Thai government incentives'
      )
    }

    // Electricity recommendations (Thai climate)
    if (monthlyBreakdown.electricity > 120) {
      recommendations.push(
        'Set air conditioning to 25-26°C instead of lower temperatures',
        'Look for appliances with Thai Energy Label ratings',
        'Consider rooftop solar - Thailand has excellent solar irradiation'
      )
    }

    // Food recommendations (Thai context)
    if (monthlyBreakdown.food > 40) {
      recommendations.push(
        'Try more plant-based Thai dishes - many are traditionally vegetarian',
        'Choose local Thai produce at markets to reduce transport emissions',
        'Reduce food waste - it\'s 39% of Thailand\'s municipal solid waste'
      )
    }

    // Waste recommendations (TGO factors)
    if (monthlyBreakdown.waste > 0) {
      recommendations.push(
        'Separate waste according to your local Thai municipality guidelines',
        'Compost organic waste - great for Thai gardens and reduces methane',
        'Use reusable bags at markets to avoid single-use plastic'
      )
    }

    // Consumption recommendations (Thai economy)
    if (monthlyBreakdown.consumption > 15) {
      recommendations.push(
        'Shop at local Thai markets instead of imported goods when possible',
        'Support Thai businesses committed to sustainability',
        'Consider repair services - Thailand has skilled local repair shops'
      )
    }

    // Category-specific advice
    if (category === 'high_impact' || category === 'needs_improvement') {
      recommendations.push(
        'Focus on the highest impact categories first for maximum benefit',
        'Thailand aims for carbon neutrality by 2050 - every action counts',
        'Consider joining local Thai environmental community groups'
      )
    }

    return recommendations
  }

  /**
   * Calculate potential emissions reductions from specific actions
   */
  static calculateThailandReductionPotential(currentResult: ThailandCalculationResult): {
    action: string
    potentialReduction: number
    newCategory?: string
  }[] {
    const reductions = []
    const currentAnnual = currentResult.totalAnnualEmissions

    // Transportation reductions
    if (currentResult.monthlyBreakdown.transportation > 30) {
      reductions.push({
        action: 'Switch to motorcycle for daily commute',
        potentialReduction: (currentResult.monthlyBreakdown.transportation - 30) * 12,
        newCategory: this.determineThailandCategory(currentAnnual - (currentResult.monthlyBreakdown.transportation - 30) * 12)
      })
    }

    // Electricity reductions
    if (currentResult.monthlyBreakdown.electricity > 80) {
      reductions.push({
        action: 'Optimize AC usage and use efficient appliances',
        potentialReduction: (currentResult.monthlyBreakdown.electricity - 80) * 12,
        newCategory: this.determineThailandCategory(currentAnnual - (currentResult.monthlyBreakdown.electricity - 80) * 12)
      })
    }

    // Food reductions
    if (currentResult.monthlyBreakdown.food > 25) {
      reductions.push({
        action: 'Adopt more plant-based Thai diet',
        potentialReduction: (currentResult.monthlyBreakdown.food - 25) * 12,
        newCategory: this.determineThailandCategory(currentAnnual - (currentResult.monthlyBreakdown.food - 25) * 12)
      })
    }

    // Waste improvements (can go negative!)
    if (currentResult.monthlyBreakdown.waste > -15) {
      reductions.push({
        action: 'Implement comprehensive waste reduction (avoid plastics)',
        potentialReduction: Math.abs(currentResult.monthlyBreakdown.waste + 15) * 12,
        newCategory: this.determineThailandCategory(currentAnnual - Math.abs(currentResult.monthlyBreakdown.waste + 15) * 12)
      })
    }

    return reductions.sort((a, b) => b.potentialReduction - a.potentialReduction)
  }

  /**
   * Compare user's footprint to Thailand averages
   */
  static compareToThailandAverages(result: ThailandCalculationResult): {
    category: string
    comparisonText: string
    percentDifference: number
  } {
    // Thai average estimates based on national data
    const thaiAverageAnnual = 150 // kg CO2e/year estimated average
    const percentDifference = ((result.totalAnnualEmissions - thaiAverageAnnual) / thaiAverageAnnual) * 100

    let comparisonText = ''
    if (percentDifference < -20) {
      comparisonText = 'Excellent! Your footprint is significantly below Thailand\'s average.'
    } else if (percentDifference < 0) {
      comparisonText = 'Good! Your footprint is below Thailand\'s average.'
    } else if (percentDifference < 20) {
      comparisonText = 'Your footprint is close to Thailand\'s average.'
    } else {
      comparisonText = 'Your footprint is above Thailand\'s average - there\'s room for improvement.'
    }

    return {
      category: result.category,
      comparisonText,
      percentDifference: Math.round(percentDifference)
    }
  }
}