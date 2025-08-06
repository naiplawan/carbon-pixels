'use client'

import { useEffect, useRef } from 'react'
import { Answer } from '@/lib/api'

interface ThailandCarbonCanvasProps {
  currentScore: number
  answers: Answer[]
  currentQuestion: string
}

export default function ThailandCarbonCanvas({ currentScore, answers, currentQuestion }: ThailandCarbonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 500
    canvas.height = 400

    let animationTime = 0

    function animate() {
      if (!ctx || !canvas) return

      // Clear canvas with Thailand-inspired background
      ctx.fillStyle = '#faf9f7'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw Thai notebook style grid
      drawThaiNotebookGrid(ctx, canvas)

      // Draw the Thailand carbon journey
      drawThailandCarbonJourney(ctx, canvas, animationTime)

      // Draw enhanced score visualization
      drawThailandScoreVisualization(ctx, canvas, currentScore, animationTime)

      // Draw Thailand flag or landmarks
      drawThailandElements(ctx, canvas, animationTime)

      animationTime += 0.02
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentScore, answers, currentQuestion]) // eslint-disable-line react-hooks/exhaustive-deps

  const drawThaiNotebookGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Thai-style grid with subtle temple pattern
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.15)'
    ctx.lineWidth = 1
    
    // Horizontal lines
    for (let y = 20; y < canvas.height; y += 25) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Thai red margin line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(60, 0)
    ctx.lineTo(60, canvas.height)
    ctx.stroke()

    // Small Thai temple silhouette in corner
    drawTemplesilhouette(ctx, canvas.width - 50, 20, 0.3)
  }

  const drawThailandCarbonJourney = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Draw Thailand-specific transport and lifestyle choices
    answers.forEach((answer, index) => {
      const angle = (index / Math.max(answers.length, 1)) * Math.PI * 2
      const radius = 80 + Math.sin(time + index) * 8
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      switch (answer.questionId) {
        case 'transportation':
          drawThaiTransportVisual(ctx, x, y, answer.answerId, time)
          break
        case 'electricity':
          drawThaiElectricityVisual(ctx, x, y, answer.answerId, time)
          break
        case 'diet':
          drawThaiDietVisual(ctx, x, y, answer.answerId, time)
          break
        case 'waste_management':
          drawThaiWasteVisual(ctx, x, y, answer.answerId, time)
          break
        case 'consumption_habits':
          drawThaiConsumptionVisual(ctx, x, y, answer.answerId, time)
          break
      }
    })

    // Connect with Thai-inspired flowing lines
    if (answers.length > 1) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 6])
      
      for (let i = 0; i < answers.length; i++) {
        const currentAngle = (i / answers.length) * Math.PI * 2
        const nextAngle = ((i + 1) / answers.length) * Math.PI * 2
        
        const currentRadius = 80 + Math.sin(time + i) * 8
        const nextRadius = 80 + Math.sin(time + i + 1) * 8
        
        const x1 = centerX + Math.cos(currentAngle) * currentRadius
        const y1 = centerY + Math.sin(currentAngle) * currentRadius
        const x2 = centerX + Math.cos(nextAngle) * nextRadius
        const y2 = centerY + Math.sin(nextAngle) * nextRadius
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        
        // Curved connection like Thai art
        const midX = (x1 + x2) / 2 + Math.sin(time * 2) * 10
        const midY = (y1 + y2) / 2 + Math.cos(time * 2) * 10
        ctx.quadraticCurveTo(midX, midY, x2, y2)
        ctx.stroke()
      }
      
      ctx.setLineDash([])
    }
  }

  const drawThailandScoreVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, score: number, time: number) => {
    const graphX = 70
    const graphY = canvas.height - 90
    const graphWidth = canvas.width - 120
    const graphHeight = 70

    // Thailand-themed score visualization
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'
    ctx.lineWidth = 2
    ctx.fillRect(graphX - 10, graphY - graphHeight - 10, graphWidth + 20, graphHeight + 20)
    ctx.strokeRect(graphX - 10, graphY - graphHeight - 10, graphWidth + 20, graphHeight + 20)

    // Draw Thailand target line (2050 carbon neutrality)
    const targetY = graphY - graphHeight * 0.3
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(graphX, targetY)
    ctx.lineTo(graphX + graphWidth, targetY)
    ctx.stroke()
    ctx.setLineDash([])

    // Thailand 2050 target label
    ctx.fillStyle = '#16a34a'
    ctx.font = '12px Patrick Hand, cursive'
    ctx.fillText('Thailand 2050 Target', graphX + graphWidth - 120, targetY - 5)

    // Score visualization with Thai colors
    const scoreHeight = Math.min((Math.abs(score) / 200) * graphHeight, graphHeight)
    const waveOffset = Math.sin(time * 3) * 2
    
    const scoreColor = getThailandScoreColor(score)
    ctx.strokeStyle = scoreColor
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(graphX, graphY)
    
    // Draw flowing line like Thai silk pattern
    for (let x = graphX; x <= graphX + graphWidth; x += 3) {
      const progress = (x - graphX) / graphWidth
      const waveY = Math.sin(progress * Math.PI * 6 + time * 2) * 3
      const y = graphY - (scoreHeight * progress) + waveOffset + waveY
      
      if (x === graphX) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Score display with Thai styling
    ctx.fillStyle = '#1f2937'
    ctx.font = '16px Kalam, cursive'
    const scoreText = score < 0 ? `${score} (Negative Emissions!) 🌱` : `${Math.round(score * 10) / 10} kg CO₂e`
    ctx.fillText(scoreText, graphX, graphY + 25)
  }

  const drawThailandElements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Subtle Thai flag colors in corner
    const flagX = canvas.width - 80
    const flagY = canvas.height - 40
    
    ctx.fillStyle = 'rgba(237, 28, 36, 0.1)'
    ctx.fillRect(flagX, flagY, 60, 4)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(flagX, flagY + 4, 60, 4)
    ctx.fillStyle = 'rgba(0, 30, 98, 0.1)'
    ctx.fillRect(flagX, flagY + 8, 60, 8)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(flagX, flagY + 16, 60, 4)
    ctx.fillStyle = 'rgba(237, 28, 36, 0.1)'
    ctx.fillRect(flagX, flagY + 20, 60, 4)

    // Floating lotus petals for positive actions
    if (currentScore < 100) {
      for (let i = 0; i < 3; i++) {
        const petalX = 100 + i * 80 + Math.sin(time + i) * 20
        const petalY = 60 + Math.cos(time * 1.5 + i) * 15
        drawLotusPetal(ctx, petalX, petalY, time + i)
      }
    }
  }

  const drawThaiTransportVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'heavy_duty_diesel':
        drawThaiTruck(ctx, 0, 0, '#4a5568')
        drawHeavySmog(ctx, 15, -10, time)
        break
      case 'bus_public':
        drawThaiBus(ctx, 0, 0, '#059669') // Thai bus green
        drawMinimalSmog(ctx, 10, -8, time, 0.3)
        break
      case 'passenger_car':
        drawPersonalCar(ctx, 0, 0, '#dc2626')
        drawModerateSmog(ctx, 12, -8, time, 0.6)
        break
      case 'pickup_truck':
        drawThaiPickup(ctx, 0, 0, '#7c3aed') // Popular Thai pickup
        drawModerateSmog(ctx, 12, -8, time, 0.5)
        break
      case 'taxi_ride':
        drawThaiTaxi(ctx, 0, 0, '#f59e0b') // Thai taxi yellow
        drawModerateSmog(ctx, 10, -8, time, 0.4)
        break
      case 'motorcycle':
        drawThaiMotorcycle(ctx, 0, 0, '#ec4899') // Popular Thai motorbike
        drawMinimalSmog(ctx, 8, -5, time, 0.2)
        break
      case 'bicycle_walk':
        drawBicycle(ctx, 0, 0)
        drawLotusPetals(ctx, 10, -5, time) // Positive action
        break
    }
    
    ctx.restore()
  }

  const drawThaiElectricityVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'very_high_usage':
        drawThaiHouse(ctx, 0, 0, '#dc2626')
        drawACUnits(ctx, -15, -10, 3) // Multiple AC units
        drawHeavySmog(ctx, 0, -20, time)
        break
      case 'high_usage':
        drawThaiHouse(ctx, 0, 0, '#f59e0b')
        drawACUnits(ctx, -10, -10, 2) // Two AC units
        drawModerateSmog(ctx, 0, -15, time, 0.6)
        break
      case 'moderate_usage':
        drawThaiHouse(ctx, 0, 0, '#10b981')
        drawACUnits(ctx, -5, -10, 1) // One AC unit
        break
      case 'low_usage':
        drawThaiHouse(ctx, 0, 0, '#059669')
        drawSolarPanels(ctx, -10, -15) // Solar panels
        drawLotusPetals(ctx, 15, -10, time)
        break
      case 'minimal_usage':
        drawEcoThaiHouse(ctx, 0, 0, '#16a34a')
        drawSolarPanels(ctx, -12, -15)
        drawWindTurbine(ctx, 20, -10, time)
        drawLotusPetals(ctx, 15, -5, time)
        break
    }
    
    ctx.restore()
  }

  const drawThaiDietVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'high_meat_diet':
        drawThaiMeatPlate(ctx, 0, 0)
        drawModerateSmog(ctx, 0, -15, time, 0.8)
        break
      case 'moderate_meat_diet':
        drawBalancedThaiPlate(ctx, 0, 0)
        drawMinimalSmog(ctx, 0, -10, time, 0.4)
        break
      case 'low_meat_diet':
        drawVeggieThaiPlate(ctx, 0, 0)
        break
      case 'vegetarian_diet':
        drawVegetarianThaiPlate(ctx, 0, 0)
        drawLotusPetals(ctx, 12, -5, time)
        break
      case 'vegan_diet':
        drawVeganThaiPlate(ctx, 0, 0)
        drawLotusPetals(ctx, 15, -5, time)
        drawRiceGrains(ctx, -10, 5, time)
        break
    }
    
    ctx.restore()
  }

  const drawThaiWasteVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'open_dump_landfill':
        drawThaiLandfill(ctx, 0, 0)
        drawHeavySmog(ctx, 0, -15, time)
        break
      case 'mixed_waste_some_separation':
        drawMixedWasteBins(ctx, 0, 0)
        drawMinimalSmog(ctx, 5, -8, time, 0.3)
        break
      case 'active_recycling':
        drawThaiRecyclingBins(ctx, 0, 0)
        drawLotusPetals(ctx, 10, -5, time)
        break
      case 'comprehensive_waste_management':
        drawComprehensiveWasteSystem(ctx, 0, 0, time)
        drawLotusPetals(ctx, 15, -8, time)
        drawNegativeEmissionAura(ctx, 0, 0, time) // Negative emissions!
        break
      case 'zero_waste_lifestyle':
        drawZeroWasteSymbol(ctx, 0, 0, time)
        drawLotusPetals(ctx, 12, -8, time)
        drawNegativeEmissionAura(ctx, 0, 0, time)
        drawThaiEnvironmentalHalo(ctx, 0, 0, time)
        break
    }
    
    ctx.restore()
  }

  const drawThaiConsumptionVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'frequent_shopping':
        drawShoppingBags(ctx, 0, 0, 4, '#dc2626')
        drawModerateSmog(ctx, 0, -10, time, 0.6)
        break
      case 'moderate_shopping':
        drawShoppingBags(ctx, 0, 0, 2, '#f59e0b')
        break
      case 'minimal_shopping':
        drawThaiMarketBasket(ctx, 0, 0)
        drawLotusPetals(ctx, 10, -5, time)
        break
      case 'secondhand_focus':
        drawSecondhandItems(ctx, 0, 0)
        drawRecycleSymbol(ctx, 8, -8, time)
        drawLotusPetals(ctx, 12, -5, time)
        break
      case 'minimalist_lifestyle':
        drawMinimalistSymbol(ctx, 0, 0)
        drawLotusPetals(ctx, 10, -8, time)
        drawThaiZenCircle(ctx, 0, 0, time)
        break
    }
    
    ctx.restore()
  }

  // Thailand-specific drawing functions
  const drawTemplesilhouette = (ctx: CanvasRenderingContext2D, x: number, y: number, opacity: number) => {
    ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`
    ctx.beginPath()
    ctx.moveTo(x, y + 20)
    ctx.lineTo(x + 15, y + 20)
    ctx.lineTo(x + 20, y + 10)
    ctx.lineTo(x + 25, y + 15)
    ctx.lineTo(x + 30, y + 5)
    ctx.lineTo(x + 35, y + 15)
    ctx.lineTo(x + 40, y + 10)
    ctx.lineTo(x + 45, y + 20)
    ctx.closePath()
    ctx.fill()
  }

  const drawThaiTruck = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 15, y - 8, 30, 16)
    ctx.fillRect(x - 10, y - 15, 20, 7)
    // Thai truck details
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 8, y - 12, 4, 3)
    ctx.fillRect(x + 4, y - 12, 4, 3)
  }

  const drawThaiBus = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 20, y - 10, 40, 20)
    // Thai bus windows
    ctx.fillStyle = '#e5e7eb'
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x - 15 + i * 6, y - 7, 4, 5)
    }
  }

  const drawThaiPickup = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 12, y - 6, 24, 12)
    ctx.fillRect(x - 8, y - 12, 10, 6)
    // Pickup bed
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.strokeRect(x + 2, y - 6, 10, 12)
  }

  const drawThaiTaxi = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 10, y - 5, 20, 10)
    ctx.fillRect(x - 5, y - 10, 10, 5)
    // Thai taxi sign
    ctx.fillStyle = '#000000'
    ctx.font = '8px Arial'
    ctx.fillText('TAXI', x - 8, y - 6)
  }

  const drawThaiMotorcycle = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    // Motorcycle body
    ctx.fillStyle = color
    ctx.fillRect(x - 6, y - 2, 12, 4)
    // Wheels
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x - 6, y + 3, 3, 0, Math.PI * 2)
    ctx.arc(x + 6, y + 3, 3, 0, Math.PI * 2)
    ctx.stroke()
  }

  const drawPersonalCar = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 10, y - 5, 20, 10)
    ctx.fillRect(x - 5, y - 10, 10, 5)
    // Car windows
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(x - 4, y - 9, 8, 3)
  }

  const drawThaiHouse = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 12, y - 5, 24, 15)
    // Thai-style roof
    ctx.beginPath()
    ctx.moveTo(x - 15, y - 5)
    ctx.lineTo(x, y - 18)
    ctx.lineTo(x + 15, y - 5)
    ctx.fill()
  }

  const drawACUnits = (ctx: CanvasRenderingContext2D, x: number, y: number, count: number) => {
    ctx.fillStyle = '#6b7280'
    for (let i = 0; i < count; i++) {
      ctx.fillRect(x + i * 8, y, 6, 4)
      // AC waves
      ctx.strokeStyle = '#9ca3af'
      ctx.lineWidth = 1
      for (let j = 0; j < 3; j++) {
        ctx.beginPath()
        ctx.moveTo(x + i * 8, y + 6 + j * 2)
        ctx.lineTo(x + i * 8 + 6, y + 6 + j * 2)
        ctx.stroke()
      }
    }
  }

  const drawLotusPetal = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.fillStyle = 'rgba(236, 72, 153, 0.6)'
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(time)
    ctx.beginPath()
    ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const drawLotusPetals = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + time
      const petalX = x + Math.cos(angle) * 6
      const petalY = y + Math.sin(angle) * 6
      drawLotusPetal(ctx, petalX, petalY, angle)
    }
  }

  const drawNegativeEmissionAura = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    // Green glowing aura for negative emissions
    const gradient = ctx.createRadialGradient(x, y, 5, x, y, 25)
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)')
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, 20 + Math.sin(time * 3) * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawThaiEnvironmentalHalo = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(x, y, 25 + Math.sin(time * 2) * 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Additional Thailand-specific visual functions would go here...
  const drawThaiMeatPlate = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.stroke()
    // Meat portions
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(x - 4, y - 2, 3, 3)
    ctx.fillRect(x + 1, y - 3, 3, 3)
  }

  const drawVeganThaiPlate = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.stroke()
    // Thai vegetables
    ctx.fillStyle = '#16a34a'
    ctx.beginPath()
    ctx.arc(x - 3, y - 1, 2, 0, Math.PI * 2)
    ctx.arc(x + 2, y + 1, 2, 0, Math.PI * 2)
    ctx.arc(x, y - 3, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawThaiMarketBasket = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#92400e'
    ctx.lineWidth = 2
    // Basket weave pattern
    ctx.beginPath()
    ctx.rect(x - 6, y - 3, 12, 8)
    ctx.stroke()
    // Weave lines
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(x - 6, y - 3 + i * 3)
      ctx.lineTo(x + 6, y - 3 + i * 3)
      ctx.stroke()
    }
  }

  const getThailandScoreColor = (score: number): string => {
    if (score < 0) return '#16a34a' // Green for negative emissions
    if (score <= 50) return '#22c55e' // Light green
    if (score <= 100) return '#10b981' // Green
    if (score <= 180) return '#f59e0b' // Yellow/orange
    if (score <= 280) return '#ef4444' // Red
    return '#dc2626' // Dark red
  }

  // Simplified versions of other drawing functions for brevity...
  const drawBicycle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x - 6, y + 3, 3, 0, Math.PI * 2)
    ctx.arc(x + 6, y + 3, 3, 0, Math.PI * 2)
    ctx.moveTo(x - 6, y + 3)
    ctx.lineTo(x, y - 3)
    ctx.lineTo(x + 6, y + 3)
    ctx.stroke()
  }

  const drawHeavySmog = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.fillStyle = 'rgba(107, 114, 128, 0.7)'
    for (let i = 0; i < 4; i++) {
      const offsetX = Math.sin(time + i) * 4
      const offsetY = Math.sin(time * 1.5 + i) * 3
      ctx.beginPath()
      ctx.arc(x + offsetX + i * 4, y + offsetY, 4 + i, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawModerateSmog = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, opacity: number = 0.5) => {
    ctx.fillStyle = `rgba(156, 163, 175, ${opacity})`
    for (let i = 0; i < 3; i++) {
      const offsetX = Math.sin(time + i) * 3
      const offsetY = Math.sin(time * 2 + i) * 2
      ctx.beginPath()
      ctx.arc(x + offsetX + i * 3, y + offsetY, 3 + i * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawMinimalSmog = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, opacity: number = 0.3) => {
    ctx.fillStyle = `rgba(209, 213, 219, ${opacity})`
    for (let i = 0; i < 2; i++) {
      const offsetX = Math.sin(time + i) * 2
      const offsetY = Math.sin(time * 1.5 + i) * 1
      ctx.beginPath()
      ctx.arc(x + offsetX + i * 2, y + offsetY, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Additional simplified drawing functions...
  const drawSolarPanels = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#1e40af'
    ctx.fillRect(x, y, 8, 4)
    ctx.fillRect(x + 3, y + 2, 8, 4)
  }

  const drawWindTurbine = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + 10)
    ctx.stroke()
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(time * 5)
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(6, -2)
      ctx.stroke()
    }
    ctx.restore()
  }

  const drawRecycleSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(time * 2)
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    
    for (let i = 0; i < 3; i++) {
      ctx.save()
      ctx.rotate((i * Math.PI * 2) / 3)
      ctx.beginPath()
      ctx.arc(0, -6, 3, Math.PI / 3, (Math.PI * 4) / 3)
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()
  }

  // Placeholder functions for other visuals...
  const drawEcoThaiHouse = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => drawThaiHouse(ctx, x, y, color)
  const drawBalancedThaiPlate = (ctx: CanvasRenderingContext2D, x: number, y: number) => drawThaiMeatPlate(ctx, x, y)
  const drawVeggieThaiPlate = (ctx: CanvasRenderingContext2D, x: number, y: number) => drawVeganThaiPlate(ctx, x, y)
  const drawVegetarianThaiPlate = (ctx: CanvasRenderingContext2D, x: number, y: number) => drawVeganThaiPlate(ctx, x, y)
  const drawRiceGrains = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => drawLotusPetals(ctx, x, y, time)
  const drawThaiLandfill = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#6b7280'
    ctx.fillRect(x - 8, y - 4, 16, 8)
  }
  const drawMixedWasteBins = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const colors = ['#dc2626', '#f59e0b']
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(x + i * 6 - 6, y - 4, 5, 8)
    }
  }
  const drawThaiRecyclingBins = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b']
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(x + i * 4 - 6, y - 4, 3, 8)
    }
  }
  const drawComprehensiveWasteSystem = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    drawThaiRecyclingBins(ctx, x, y)
    drawRecycleSymbol(ctx, x + 10, y - 5, time)
  }
  const drawZeroWasteSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - 6, y - 6)
    ctx.lineTo(x + 6, y + 6)
    ctx.stroke()
  }
  const drawShoppingBags = (ctx: CanvasRenderingContext2D, x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = color
      ctx.fillRect(x + i * 3 - count * 1.5, y - 5, 4, 8)
    }
  }
  const drawSecondhandItems = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 2
    ctx.strokeRect(x - 6, y - 4, 12, 8)
    ctx.fillStyle = '#059669'
    ctx.font = '8px Arial'
    ctx.fillText('2nd', x - 6, y)
  }
  const drawMinimalistSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 2
    ctx.strokeRect(x - 4, y - 4, 8, 8)
  }
  const drawThaiZenCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, 15 + Math.sin(time) * 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  return (
    <div className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-pencil">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-handwritten text-ink">Your Thailand Carbon Story 🇹🇭</h3>
        <p className="text-pencil font-sketch">Official TGO & EPPO emission factors</p>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full max-w-lg mx-auto border border-gray-300 rounded-lg sketch-element"
        style={{ maxHeight: '400px' }}
      />
      
      <div className="text-center mt-4 text-sm text-pencil">
        <div>Thailand 2050 Carbon Neutrality Goal</div>
        <div className="text-xs mt-1">Every choice supports national climate action</div>
      </div>
    </div>
  )
}