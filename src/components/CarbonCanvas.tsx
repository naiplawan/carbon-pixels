'use client'

import { useEffect, useRef } from 'react'
import { Answer } from '@/lib/api'

interface CarbonCanvasProps {
  currentScore: number
  answers: Answer[]
  currentQuestion: string
}

export default function CarbonCanvas({ currentScore, answers, currentQuestion }: CarbonCanvasProps) {
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

      // Clear canvas with paper-like background
      ctx.fillStyle = '#faf9f7'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines (notebook style)
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)'
      ctx.lineWidth = 1
      
      // Horizontal lines
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Vertical margin line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(60, 0)
      ctx.lineTo(60, canvas.height)
      ctx.stroke()

      // Draw the carbon journey
      drawCarbonJourney(ctx, canvas, animationTime)

      // Draw score graph
      drawScoreGraph(ctx, canvas, currentScore, animationTime)

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

  const drawCarbonJourney = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Draw based on current answers
    answers.forEach((answer, index) => {
      const angle = (index / Math.max(answers.length, 1)) * Math.PI * 2
      const radius = 80 + Math.sin(time + index) * 10
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      switch (answer.questionId) {
        case 'transportation':
          drawTransportationVisual(ctx, x, y, answer.answerId, time)
          break
        case 'home_energy':
          drawHomeEnergyVisual(ctx, x, y, answer.answerId, time)
          break
        case 'diet':
          drawDietVisual(ctx, x, y, answer.answerId, time)
          break
        case 'consumption':
          drawConsumptionVisual(ctx, x, y, answer.answerId, time)
          break
        case 'waste':
          drawWasteVisual(ctx, x, y, answer.answerId, time)
          break
      }
    })

    // Draw connecting lines between elements
    if (answers.length > 1) {
      ctx.strokeStyle = 'rgba(72, 187, 120, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      
      for (let i = 0; i < answers.length; i++) {
        const currentAngle = (i / answers.length) * Math.PI * 2
        const nextAngle = ((i + 1) / answers.length) * Math.PI * 2
        
        const currentRadius = 80 + Math.sin(time + i) * 10
        const nextRadius = 80 + Math.sin(time + i + 1) * 10
        
        const x1 = centerX + Math.cos(currentAngle) * currentRadius
        const y1 = centerY + Math.sin(currentAngle) * currentRadius
        const x2 = centerX + Math.cos(nextAngle) * nextRadius
        const y2 = centerY + Math.sin(nextAngle) * nextRadius
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      
      ctx.setLineDash([])
    }
  }

  const drawScoreGraph = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, score: number, time: number) => {
    const graphX = 70
    const graphY = canvas.height - 80
    const graphWidth = canvas.width - 100
    const graphHeight = 60

    // Draw graph background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillRect(graphX - 10, graphY - graphHeight - 10, graphWidth + 20, graphHeight + 20)
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(graphX - 10, graphY - graphHeight - 10, graphWidth + 20, graphHeight + 20)

    // Draw score line
    const scoreHeight = Math.min((score / 100) * graphHeight, graphHeight)
    const waveOffset = Math.sin(time * 3) * 3
    
    ctx.strokeStyle = getScoreColor(score)
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(graphX, graphY)
    
    for (let x = graphX; x <= graphX + graphWidth; x += 2) {
      const progress = (x - graphX) / graphWidth
      const y = graphY - (scoreHeight * progress) + waveOffset * Math.sin(progress * Math.PI * 4)
      
      if (x === graphX) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Draw score text
    ctx.fillStyle = '#2d3748'
    ctx.font = '16px Patrick Hand, cursive'
    ctx.fillText(`CO₂ Score: ${Math.round(score * 10) / 10}`, graphX, graphY + 25)
  }

  const getScoreColor = (score: number): string => {
    if (score <= 20) return '#48bb78' // Green
    if (score <= 35) return '#68d391' // Light green
    if (score <= 55) return '#f6e05e' // Yellow
    return '#fc8181' // Red
  }

  const drawTransportationVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'car_alone':
        // Draw car with smog
        drawCar(ctx, 0, 0, '#4a5568')
        drawSmog(ctx, 15, -10, time)
        break
      case 'car_carpool':
        // Draw car with less smog
        drawCar(ctx, 0, 0, '#4a5568')
        drawSmog(ctx, 15, -10, time, 0.5)
        break
      case 'public_transport':
        // Draw bus/train with minimal emissions
        drawBus(ctx, 0, 0, '#48bb78')
        break
      case 'bike_walk':
        // Draw bike or walking figure with flowers
        drawBike(ctx, 0, 0)
        drawFlowers(ctx, 15, 5, time)
        break
    }
    
    ctx.restore()
  }

  const drawHomeEnergyVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'coal_gas':
        drawHouse(ctx, 0, 0, '#4a5568')
        drawSmog(ctx, 0, -20, time)
        break
      case 'mixed_grid':
        drawHouse(ctx, 0, 0, '#6b7280')
        break
      case 'renewable_mix':
        drawHouse(ctx, 0, 0, '#48bb78')
        drawSolarPanels(ctx, -10, -15)
        break
      case 'full_renewable':
        drawHouse(ctx, 0, 0, '#22c55e')
        drawSolarPanels(ctx, -10, -15)
        drawWindTurbine(ctx, 20, -10, time)
        break
    }
    
    ctx.restore()
  }

  const drawDietVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'heavy_meat':
        drawCow(ctx, 0, 0)
        drawSmog(ctx, 0, -15, time, 0.8)
        break
      case 'moderate_meat':
        drawPlate(ctx, 0, 0, '#d97706')
        break
      case 'pescatarian':
        drawFish(ctx, 0, 0)
        break
      case 'vegetarian':
        drawVegetables(ctx, 0, 0)
        break
      case 'vegan':
        drawLeaves(ctx, 0, 0, time)
        break
    }
    
    ctx.restore()
  }

  const drawConsumptionVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'frequent_new':
        drawShoppingBags(ctx, 0, 0, 4)
        break
      case 'occasional_new':
        drawShoppingBags(ctx, 0, 0, 2)
        break
      case 'secondhand_focus':
        drawRecycleSymbol(ctx, 0, 0, time)
        break
      case 'minimal_buying':
        drawMinimalItems(ctx, 0, 0)
        break
    }
    
    ctx.restore()
  }

  const drawWasteVisual = (ctx: CanvasRenderingContext2D, x: number, y: number, answerId: string, time: number) => {
    ctx.save()
    ctx.translate(x, y)
    
    switch (answerId) {
      case 'mostly_trash':
        drawTrashCan(ctx, 0, 0, true)
        break
      case 'some_recycling':
        drawTrashCan(ctx, 0, 0, false)
        drawRecycleSymbol(ctx, 15, 0, time, 0.7)
        break
      case 'active_recycling':
        drawRecycleBins(ctx, 0, 0)
        break
      case 'comprehensive_waste':
        drawCompostBin(ctx, 0, 0, time)
        break
    }
    
    ctx.restore()
  }

  // Helper drawing functions (simplified versions)
  const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 10, y - 5, 20, 10)
    ctx.fillRect(x - 5, y - 10, 10, 5)
  }

  const drawSmog = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, opacity: number = 1) => {
    ctx.fillStyle = `rgba(107, 114, 128, ${0.6 * opacity})`
    for (let i = 0; i < 3; i++) {
      const offsetX = Math.sin(time + i) * 3
      const offsetY = Math.sin(time * 2 + i) * 2
      ctx.beginPath()
      ctx.arc(x + offsetX + i * 3, y + offsetY, 3 + i, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawBus = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 15, y - 8, 30, 16)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 10, y - 5, 5, 3)
    ctx.fillRect(x, y - 5, 5, 3)
  }

  const drawBike = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x - 8, y + 5, 4, 0, Math.PI * 2)
    ctx.arc(x + 8, y + 5, 4, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x - 8, y + 5)
    ctx.lineTo(x, y - 5)
    ctx.lineTo(x + 8, y + 5)
    ctx.stroke()
  }

  const drawFlowers = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    for (let i = 0; i < 3; i++) {
      const offsetX = i * 5
      const offsetY = Math.sin(time + i) * 2
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(x + offsetX, y + offsetY, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawHouse = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x - 10, y - 5, 20, 15)
    ctx.beginPath()
    ctx.moveTo(x - 12, y - 5)
    ctx.lineTo(x, y - 15)
    ctx.lineTo(x + 12, y - 5)
    ctx.fill()
  }

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
    
    // Rotating blades
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

  const drawCow = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#8b5cf6'
    ctx.fillRect(x - 8, y - 3, 16, 8)
    ctx.fillRect(x - 10, y + 2, 4, 6)
    ctx.fillRect(x + 6, y + 2, 4, 6)
  }

  const drawPlate = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  const drawFish = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#06b6d4'
    ctx.beginPath()
    ctx.ellipse(x, y, 8, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + 8, y)
    ctx.lineTo(x + 12, y - 3)
    ctx.lineTo(x + 12, y + 3)
    ctx.fill()
  }

  const drawVegetables = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(x - 3, y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(x + 3, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawLeaves = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + time
      const leafX = x + Math.cos(angle) * 6
      const leafY = y + Math.sin(angle) * 6
      
      ctx.fillStyle = '#22c55e'
      ctx.save()
      ctx.translate(leafX, leafY)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  const drawShoppingBags = (ctx: CanvasRenderingContext2D, x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = `hsl(${i * 60}, 70%, 60%)`
      ctx.fillRect(x + i * 4 - count * 2, y - 5, 6, 10)
      ctx.strokeStyle = '#4a5568'
      ctx.lineWidth = 1
      ctx.strokeRect(x + i * 4 - count * 2, y - 5, 6, 10)
    }
  }

  const drawRecycleSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, scale: number = 1) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.rotate(time)
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

  const drawMinimalItems = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 2
    ctx.strokeRect(x - 3, y - 3, 6, 6)
  }

  const drawTrashCan = (ctx: CanvasRenderingContext2D, x: number, y: number, full: boolean) => {
    ctx.fillStyle = full ? '#6b7280' : '#d1d5db'
    ctx.fillRect(x - 5, y - 5, 10, 12)
    ctx.fillStyle = '#4b5563'
    ctx.fillRect(x - 6, y - 6, 12, 2)
  }

  const drawRecycleBins = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b']
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(x + i * 4 - 6, y - 4, 3, 8)
    }
  }

  const drawCompostBin = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.fillStyle = '#92400e'
    ctx.fillRect(x - 6, y - 4, 12, 8)
    
    // Growing plants
    for (let i = 0; i < 2; i++) {
      const growthY = Math.sin(time + i) * 2
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(x + i * 4 - 2, y - 8 + growthY, 2, 4)
    }
  }

  return (
    <div className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-pencil">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-handwritten text-ink">Your Carbon Story</h3>
        <p className="text-pencil font-sketch">Watch your choices come to life</p>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full max-w-lg mx-auto border border-gray-300 rounded-lg sketch-element"
        style={{ maxHeight: '400px' }}
      />
      
      <div className="text-center mt-4 text-sm text-pencil">
        Each choice shapes your environmental story
      </div>
    </div>
  )
}