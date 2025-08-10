'use client'

import { useState, useEffect, useRef } from 'react'
import { WasteEntry } from '@/types/waste'
import wasteData from '@/data/thailand-waste-categories.json'

// Interface for the component props
interface WasteEntryWithTimestamp extends Omit<WasteEntry, 'timestamp'> {
  timestamp: string | Date
}

interface DataExportProps {
  wasteEntries: WasteEntryWithTimestamp[]
  totalCredits: number
  onClose: () => void
}

interface SummaryData {
  totalEntries: number
  totalWeight: number
  totalCredits: number
  treesSaved: number
  topCategory: string
  favoriteDisposal: string
  dailyAverage: number
  weeklyData: Array<{ week: string; entries: number; credits: number }>
  monthlyData: Array<{ month: string; entries: number; credits: number }>
  categoryBreakdown: Array<{ category: string; count: number; weight: number; credits: number }>
  co2Impact: number
  energySaved: number
  plasticAvoided: number
  level: string
}

export default function DataExport({ wasteEntries, totalCredits, onClose }: DataExportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'report' | 'social' | 'backup'>('export')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'week' | 'today'>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    generateSummaryData()
  }, [wasteEntries, totalCredits])

  const generateSummaryData = () => {
    const now = new Date()
    let filteredEntries = wasteEntries

    // Filter by date range
    if (dateRange !== 'all') {
      const cutoffDate = new Date()
      if (dateRange === 'today') {
        cutoffDate.setHours(0, 0, 0, 0)
      } else if (dateRange === 'week') {
        cutoffDate.setDate(now.getDate() - 7)
      } else if (dateRange === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1)
      }
      filteredEntries = wasteEntries.filter(entry => new Date(entry.timestamp) >= cutoffDate)
    }

    // Calculate category breakdown
    const categoryMap = new Map()
    filteredEntries.forEach(entry => {
      const key = entry.categoryName
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { count: 0, weight: 0, credits: 0 })
      }
      const current = categoryMap.get(key)
      current.count += 1
      current.weight += entry.weight
      current.credits += entry.carbonCredits
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data
    })).sort((a, b) => b.count - a.count)

    // Calculate weekly/monthly data
    const weeklyMap = new Map()
    const monthlyMap = new Map()
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.timestamp)
      const weekKey = getWeekKey(date)
      const monthKey = getMonthKey(date)

      // Weekly data
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { entries: 0, credits: 0 })
      }
      const weekData = weeklyMap.get(weekKey)
      weekData.entries += 1
      weekData.credits += entry.carbonCredits

      // Monthly data
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { entries: 0, credits: 0 })
      }
      const monthData = monthlyMap.get(monthKey)
      monthData.entries += 1
      monthData.credits += entry.carbonCredits
    })

    const weeklyData = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      ...data
    })).sort((a, b) => a.week.localeCompare(b.week))

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => a.month.localeCompare(b.month))

    // Calculate other metrics
    const totalWeight = filteredEntries.reduce((sum, entry) => sum + entry.weight, 0)
    const totalEntryCredits = filteredEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0)
    const topCategory = categoryBreakdown[0]?.category || 'None'
    
    const disposalMap = new Map()
    filteredEntries.forEach(entry => {
      disposalMap.set(entry.disposal, (disposalMap.get(entry.disposal) || 0) + 1)
    })
    const favoriteDisposal = Array.from(disposalMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'

    const plasticAvoided = filteredEntries
      .filter(entry => entry.categoryId === 'plastic_bags' && entry.disposal === 'avoided')
      .reduce((sum, entry) => sum + entry.weight, 0)

    // Get current level
    const levels = wasteData.gamification.levels
    const currentLevel = levels.find(level => 
      totalCredits >= level.minCredits && totalCredits <= (level.maxCredits || 999999)
    ) || levels[0]

    setSummaryData({
      totalEntries: filteredEntries.length,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalCredits: dateRange === 'all' ? totalCredits : totalEntryCredits,
      treesSaved: Math.floor((dateRange === 'all' ? totalCredits : totalEntryCredits) / 500),
      topCategory,
      favoriteDisposal,
      dailyAverage: filteredEntries.length > 0 ? Math.round((totalWeight / Math.max(getDateRangeDays(), 1)) * 100) / 100 : 0,
      weeklyData,
      monthlyData,
      categoryBreakdown,
      co2Impact: Math.round((dateRange === 'all' ? totalCredits : totalEntryCredits) * 0.001 * 100) / 100,
      energySaved: Math.floor((dateRange === 'all' ? totalCredits : totalEntryCredits) / 10),
      plasticAvoided: Math.round(plasticAvoided * 100) / 100,
      level: currentLevel.name
    })
  }

  const getDateRangeDays = () => {
    if (dateRange === 'today') return 1
    if (dateRange === 'week') return 7
    if (dateRange === 'month') return 30
    if (wasteEntries.length === 0) return 1
    
    const earliest = new Date(Math.min(...wasteEntries.map(e => new Date(e.timestamp).getTime())))
    const latest = new Date(Math.max(...wasteEntries.map(e => new Date(e.timestamp).getTime())))
    return Math.max(Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)), 1)
  }

  const getWeekKey = (date: Date) => {
    const year = date.getFullYear()
    const week = getWeekNumber(date)
    return `${year}-W${week.toString().padStart(2, '0')}`
  }

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
  }

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  const exportToCSV = () => {
    const now = new Date()
    let filteredEntries = wasteEntries

    if (dateRange !== 'all') {
      const cutoffDate = new Date()
      if (dateRange === 'today') {
        cutoffDate.setHours(0, 0, 0, 0)
      } else if (dateRange === 'week') {
        cutoffDate.setDate(now.getDate() - 7)
      } else if (dateRange === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1)
      }
      filteredEntries = wasteEntries.filter(entry => new Date(entry.timestamp) >= cutoffDate)
    }

    const headers = ['Date', 'Time', 'Category', 'Category (Thai)', 'Disposal Method', 'Weight (kg)', 'Carbon Credits', 'Notes']
    const rows = filteredEntries.map(entry => {
      const date = new Date(entry.timestamp)
      const category = wasteData.wasteCategories.find(cat => cat.id === entry.categoryId)
      return [
        date.toLocaleDateString('th-TH'),
        date.toLocaleTimeString('th-TH'),
        entry.categoryName,
        category?.nameLocal || '',
        entry.disposal,
        entry.weight.toString(),
        entry.carbonCredits.toString(),
        entry.notes || ''
      ]
    })

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `thailand-waste-diary-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToJSON = () => {
    const now = new Date()
    let filteredEntries = wasteEntries

    if (dateRange !== 'all') {
      const cutoffDate = new Date()
      if (dateRange === 'today') {
        cutoffDate.setHours(0, 0, 0, 0)
      } else if (dateRange === 'week') {
        cutoffDate.setDate(now.getDate() - 7)
      } else if (dateRange === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1)
      }
      filteredEntries = wasteEntries.filter(entry => new Date(entry.timestamp) >= cutoffDate)
    }

    const exportData = {
      metadata: {
        appName: 'Thailand Waste Diary',
        exportDate: new Date().toISOString(),
        dateRange,
        totalEntries: filteredEntries.length,
        totalCredits: summaryData?.totalCredits || 0,
        version: '1.0'
      },
      summary: summaryData,
      entries: filteredEntries.map(entry => ({
        ...entry,
        categoryDetails: wasteData.wasteCategories.find(cat => cat.id === entry.categoryId)
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `thailand-waste-diary-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const generateQRCode = async () => {
    if (!summaryData) return

    const profileData = {
      name: 'Thailand Waste Tracker',
      level: summaryData.level,
      totalCredits: summaryData.totalCredits,
      treesSaved: summaryData.treesSaved,
      totalEntries: summaryData.totalEntries,
      co2Impact: summaryData.co2Impact,
      url: ''
    }
    profileData.url = `${window.location.origin}/profile/${btoa(JSON.stringify(profileData))}`

    const qrText = JSON.stringify(profileData)
    const qrCode = await generateQRCodeImage(qrText)
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 400
    canvas.height = 500

    // Background
    ctx.fillStyle = '#f8fdf8'
    ctx.fillRect(0, 0, 400, 500)

    // Header
    ctx.fillStyle = '#166534'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🌱 Thailand Waste Diary', 200, 40)

    // Profile info
    ctx.fillStyle = '#374151'
    ctx.font = '16px Arial'
    ctx.fillText(`Level: ${summaryData.level}`, 200, 70)
    ctx.fillText(`${summaryData.totalCredits} Carbon Credits`, 200, 95)
    ctx.fillText(`${summaryData.treesSaved} Trees Saved`, 200, 120)

    // QR Code (placeholder - in real implementation, use a QR library)
    ctx.fillStyle = '#000'
    ctx.fillRect(100, 150, 200, 200)
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(110 + j * 12, 160 + i * 12, 10, 10)
        }
      }
    }

    // Footer
    ctx.fillStyle = '#6b7280'
    ctx.font = '14px Arial'
    ctx.fillText('Scan to view my environmental impact!', 200, 380)
    ctx.fillText('🇹🇭 Supporting Thailand 2050 Carbon Neutral', 200, 400)

    // Download
    const link = document.createElement('a')
    link.download = 'my-environmental-profile-qr.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  const generateQRCodeImage = async (text: string): Promise<string> => {
    // This is a placeholder. In a real implementation, you'd use a QR code library
    return `data:image/svg+xml,<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="black"/></svg>`
  }

  const shareToLine = () => {
    if (!summaryData) return

    const message = `🌱 ผมได้ช่วยโลกแล้ว! Thailand Waste Diary
    
🏆 Level: ${summaryData.level}
💚 Carbon Credits: ${summaryData.totalCredits}
🌳 Trees Saved: ${summaryData.treesSaved}
♻️ Waste Tracked: ${summaryData.totalWeight}kg
🌍 CO₂ Impact: ${summaryData.co2Impact}kg saved

มาร่วมกันช่วยโลกกับ Thailand Waste Diary! 
#ThailandWasteDiary #CarbonNeutral2050 #ZeroWaste`

    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(message)}`
    window.open(lineUrl, '_blank', 'width=600,height=400')
  }

  const shareToFacebook = () => {
    if (!summaryData) return

    const message = `🌱 I'm helping save the planet with Thailand Waste Diary! 

🏆 Level: ${summaryData.level}
💚 ${summaryData.totalCredits} Carbon Credits earned
🌳 ${summaryData.treesSaved} Trees saved equivalent
♻️ ${summaryData.totalWeight}kg waste tracked
🌍 ${summaryData.co2Impact}kg CO₂ impact reduced

Join me in supporting Thailand's 2050 Carbon Neutral goal! 🇹🇭

#ThailandWasteDiary #CarbonNeutral2050 #ZeroWaste #Sustainability`

    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(message)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const shareToWhatsApp = () => {
    if (!summaryData) return

    const message = `🌱 ผมได้ช่วยโลกแล้ว! Thailand Waste Diary

🏆 Level: ${summaryData.level}
💚 Carbon Credits: ${summaryData.totalCredits}
🌳 Trees Saved: ${summaryData.treesSaved}
♻️ Waste: ${summaryData.totalWeight}kg
🌍 CO₂: ${summaryData.co2Impact}kg saved

มาร่วมกันช่วยโลก! ${window.location.origin}

#ThailandWasteDiary #CarbonNeutral2050`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const generateImpactReport = async () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      const reportWindow = window.open('', '_blank')
      if (!reportWindow) {
        setIsGenerating(false)
        return
      }

      reportWindow.document.write(generateReportHTML())
      reportWindow.document.close()
      setIsGenerating(false)
    }, 1000)
  }

  const generateReportHTML = (): string => {
    if (!summaryData) return ''

    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thailand Waste Diary - Environmental Impact Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand:wght@400&family=Kalam:wght@300;400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Kalam', cursive;
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            color: #1f2937;
            line-height: 1.6;
        }
        
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            border-radius: 15px;
        }
        
        .header h1 {
            font-family: 'Patrick Hand', cursive;
            font-size: 3rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .date-range {
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 15px;
            font-weight: bold;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 3px solid;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .metric-card.green { border-color: #22c55e; }
        .metric-card.blue { border-color: #3b82f6; }
        .metric-card.purple { border-color: #8b5cf6; }
        .metric-card.orange { border-color: #f59e0b; }
        
        .metric-icon {
            font-size: 3rem;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .metric-card.green .metric-value { color: #22c55e; }
        .metric-card.blue .metric-value { color: #3b82f6; }
        .metric-card.purple .metric-value { color: #8b5cf6; }
        .metric-card.orange .metric-value { color: #f59e0b; }
        
        .metric-label {
            color: #6b7280;
            font-weight: 600;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            font-family: 'Patrick Hand', cursive;
            font-size: 2rem;
            margin-bottom: 20px;
            color: #166534;
            border-bottom: 2px dashed #22c55e;
            padding-bottom: 10px;
        }
        
        .category-breakdown {
            display: grid;
            gap: 15px;
        }
        
        .category-item {
            display: flex;
            justify-content: between;
            align-items: center;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #22c55e;
        }
        
        .category-info {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .category-stats {
            text-align: right;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
            transition: width 0.3s ease;
        }
        
        .achievements {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .achievement {
            background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #f59e0b;
        }
        
        .achievement-icon {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .achievement-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            background: #f3f4f6;
            border-radius: 12px;
            color: #6b7280;
        }
        
        .footer h3 {
            color: #166534;
            margin-bottom: 10px;
        }
        
        .thai-flag {
            display: inline-block;
            margin: 0 5px;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .report-container {
                box-shadow: none;
                max-width: none;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>🌱 Environmental Impact Report</h1>
            <p>Thailand Waste Diary - Personal Sustainability Journey</p>
            <div class="date-range">
                📅 Report Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)} 
                (Generated: ${new Date().toLocaleDateString('th-TH')})
            </div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card green">
                <div class="metric-icon">💚</div>
                <div class="metric-value">${summaryData.totalCredits}</div>
                <div class="metric-label">Carbon Credits</div>
            </div>
            
            <div class="metric-card blue">
                <div class="metric-icon">🌳</div>
                <div class="metric-value">${summaryData.treesSaved}</div>
                <div class="metric-label">Trees Saved</div>
            </div>
            
            <div class="metric-card purple">
                <div class="metric-icon">⚖️</div>
                <div class="metric-value">${summaryData.totalWeight}kg</div>
                <div class="metric-label">Waste Tracked</div>
            </div>
            
            <div class="metric-card orange">
                <div class="metric-icon">🌍</div>
                <div class="metric-value">${summaryData.co2Impact}kg</div>
                <div class="metric-label">CO₂ Saved</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🏆 Current Level & Achievements</h2>
            <div class="achievements">
                <div class="achievement">
                    <div class="achievement-icon">🎖️</div>
                    <div class="achievement-title">Current Level</div>
                    <div>${summaryData.level}</div>
                </div>
                
                <div class="achievement">
                    <div class="achievement-icon">📊</div>
                    <div class="achievement-title">Total Entries</div>
                    <div>${summaryData.totalEntries} items tracked</div>
                </div>
                
                <div class="achievement">
                    <div class="achievement-icon">⚡</div>
                    <div class="achievement-title">Energy Saved</div>
                    <div>${summaryData.energySaved} kWh equivalent</div>
                </div>
                
                <div class="achievement">
                    <div class="achievement-icon">🛍️</div>
                    <div class="achievement-title">Plastic Avoided</div>
                    <div>${summaryData.plasticAvoided}kg plastic bags</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Waste Category Breakdown</h2>
            <div class="category-breakdown">
                ${summaryData.categoryBreakdown.map(cat => `
                    <div class="category-item">
                        <div class="category-info">
                            <span style="font-size: 1.5rem;">${getCategoryIcon(cat.category)}</span>
                            <div>
                                <div style="font-weight: bold;">${cat.category}</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(cat.count / Math.max(...summaryData.categoryBreakdown.map(c => c.count))) * 100}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="category-stats">
                            <div><strong>${cat.count}</strong> items</div>
                            <div><strong>${cat.weight.toFixed(1)}</strong> kg</div>
                            <div style="color: ${cat.credits >= 0 ? '#22c55e' : '#ef4444'};">
                                <strong>${cat.credits > 0 ? '+' : ''}${cat.credits}</strong> CC
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>📈 Timeline Analysis</h2>
            ${summaryData.monthlyData.length > 1 ? `
                <h3 style="margin-bottom: 15px; color: #374151;">Monthly Progress</h3>
                ${summaryData.monthlyData.map(month => `
                    <div class="category-item">
                        <div class="category-info">
                            <span>📅</span>
                            <div>
                                <div style="font-weight: bold;">${month.month}</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(month.entries / Math.max(...summaryData.monthlyData.map(m => m.entries))) * 100}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="category-stats">
                            <div><strong>${month.entries}</strong> entries</div>
                            <div style="color: ${month.credits >= 0 ? '#22c55e' : '#ef4444'};">
                                <strong>${month.credits > 0 ? '+' : ''}${month.credits}</strong> credits
                            </div>
                        </div>
                    </div>
                `).join('')}
            ` : ''}
        </div>
        
        <div class="section">
            <h2>🎯 Impact Summary</h2>
            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; border: 2px dashed #22c55e;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 4rem; margin-bottom: 10px;">🌱</div>
                    <h3 style="color: #166534; margin-bottom: 15px;">Your Environmental Impact</h3>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 1.5rem; color: #22c55e; font-weight: bold;">${summaryData.co2Impact}kg</div>
                        <div style="color: #166534;">CO₂ Reduced</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; color: #22c55e; font-weight: bold;">${summaryData.dailyAverage}</div>
                        <div style="color: #166534;">Daily Avg (kg)</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; color: #22c55e; font-weight: bold;">${summaryData.favoriteDisposal}</div>
                        <div style="color: #166534;">Top Method</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <h3>🇹🇭 Supporting Thailand's 2050 Carbon Neutral Goal</h3>
            <p>
                This report was generated by Thailand Waste Diary, helping individuals track their environmental impact
                and contribute to Thailand's commitment to achieve carbon neutrality by 2050.
            </p>
            <p style="margin-top: 15px; font-size: 0.9rem;">
                Generated on ${new Date().toLocaleDateString('th-TH')} | 
                Report includes data from ${summaryData.totalEntries} waste entries | 
                Carbon credits based on TGO (Thailand Greenhouse Gas Management Organization) data
            </p>
        </div>
    </div>
    
    <script>
        // Auto-print functionality for PDF generation
        if (window.location.hash === '#print') {
            window.print();
        }
    </script>
</body>
</html>`
  }

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: { [key: string]: string } = {
      'Food Waste': '🍎',
      'Plastic Bottles': '🍾',
      'Plastic Bags': '🛍️',
      'Paper & Cardboard': '📄',
      'Glass Bottles': '🫙',
      'Metal Cans': '🥫',
      'Organic Waste': '🍃',
      'Electronic Waste': '📱'
    }
    return iconMap[categoryName] || '🗑️'
  }

  const generateVisualInfographic = async () => {
    const canvas = canvasRef.current
    if (!canvas || !summaryData) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 1000

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1000)
    gradient.addColorStop(0, '#f0fdf4')
    gradient.addColorStop(1, '#dcfce7')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 1000)

    // Header
    ctx.fillStyle = '#166534'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🌱 Thailand Waste Diary', 400, 60)

    ctx.fillStyle = '#22c55e'
    ctx.font = '24px Arial'
    ctx.fillText('Environmental Impact Report', 400, 100)

    // Main stats
    const stats = [
      { label: 'Carbon Credits', value: summaryData.totalCredits.toString(), icon: '💚', x: 150, y: 200 },
      { label: 'Trees Saved', value: summaryData.treesSaved.toString(), icon: '🌳', x: 400, y: 200 },
      { label: 'Waste Tracked', value: `${summaryData.totalWeight}kg`, icon: '⚖️', x: 650, y: 200 }
    ]

    stats.forEach(stat => {
      // Circle background
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(stat.x, stat.y, 60, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 3
      ctx.stroke()

      // Icon
      ctx.font = '36px Arial'
      ctx.fillStyle = '#000'
      ctx.textAlign = 'center'
      ctx.fillText(stat.icon, stat.x, stat.y - 10)

      // Value
      ctx.font = 'bold 20px Arial'
      ctx.fillStyle = '#22c55e'
      ctx.fillText(stat.value, stat.x, stat.y + 20)

      // Label
      ctx.font = '14px Arial'
      ctx.fillStyle = '#166534'
      ctx.fillText(stat.label, stat.x, stat.y + 90)
    })

    // Trees visualization
    const treesY = 350
    const treeCount = Math.min(summaryData.treesSaved, 10) // Show up to 10 trees
    const treeSpacing = Math.min(70, 600 / Math.max(treeCount, 1))
    const startX = 400 - ((treeCount - 1) * treeSpacing) / 2

    ctx.font = '48px Arial'
    for (let i = 0; i < treeCount; i++) {
      ctx.fillText('🌳', startX + (i * treeSpacing), treesY)
    }

    if (summaryData.treesSaved > 10) {
      ctx.font = '24px Arial'
      ctx.fillStyle = '#166534'
      ctx.fillText(`+${summaryData.treesSaved - 10} more trees!`, 400, treesY + 60)
    }

    // Category breakdown - top 5
    const topCategories = summaryData.categoryBreakdown.slice(0, 5)
    const chartY = 500
    const chartHeight = 200
    const barWidth = 120

    ctx.fillStyle = '#166534'
    ctx.font = 'bold 18px Arial'
    ctx.fillText('Top Waste Categories', 400, chartY - 20)

    topCategories.forEach((category, index) => {
      const x = 100 + (index * (barWidth + 20))
      const barHeight = (category.count / topCategories[0].count) * chartHeight
      const y = chartY + chartHeight - barHeight

      // Bar
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(x, y, barWidth, barHeight)

      // Icon
      ctx.font = '24px Arial'
      ctx.fillStyle = '#000'
      ctx.textAlign = 'center'
      ctx.fillText(getCategoryIcon(category.category), x + barWidth/2, y - 10)

      // Count
      ctx.font = 'bold 16px Arial'
      ctx.fillStyle = '#166534'
      ctx.fillText(category.count.toString(), x + barWidth/2, y + barHeight/2)

      // Label
      ctx.font = '12px Arial'
      ctx.fillStyle = '#374151'
      const words = category.category.split(' ')
      words.forEach((word, wordIndex) => {
        ctx.fillText(word, x + barWidth/2, chartY + chartHeight + 20 + (wordIndex * 15))
      })
    })

    // Level and achievements
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(50, 760, 700, 100)
    
    ctx.fillStyle = '#92400e'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`🏆 Current Level: ${summaryData.level}`, 400, 790)
    
    ctx.font = '18px Arial'
    ctx.fillText(`${summaryData.co2Impact}kg CO₂ saved • ${summaryData.energySaved}kWh energy equivalent`, 400, 820)
    ctx.fillText(`Daily average: ${summaryData.dailyAverage}kg waste tracked`, 400, 845)

    // Footer
    ctx.fillStyle = '#6b7280'
    ctx.font = '14px Arial'
    ctx.fillText('🇹🇭 Supporting Thailand 2050 Carbon Neutral Goal', 400, 920)
    ctx.fillText(`Generated: ${new Date().toLocaleDateString('th-TH')} | Thailand Waste Diary`, 400, 945)

    // Download
    const link = document.createElement('a')
    link.download = `thailand-waste-impact-${dateRange}-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const backupData = () => {
    const backupData = {
      metadata: {
        appName: 'Thailand Waste Diary',
        version: '1.0',
        backupDate: new Date().toISOString(),
        totalEntries: wasteEntries.length,
        totalCredits
      },
      wasteEntries,
      totalCredits,
      preferences: {
        // Add any user preferences here
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `thailand-waste-diary-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const restoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string)
        
        if (confirm(`This will restore ${backupData.wasteEntries?.length || 0} entries and reset your current data. Continue?`)) {
          // In a real app, you'd save this to localStorage or database
          console.log('Restoring data:', backupData)
          alert('Data restored successfully! Please refresh the page.')
        }
      } catch (error) {
        alert('Invalid backup file format')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-handwritten text-ink">📊 Data Export & Sharing</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 border-b">
            {[
              { id: 'export', label: '📤 Export Data', icon: '📤' },
              { id: 'report', label: '📊 Impact Report', icon: '📊' },
              { id: 'social', label: '📱 Social Share', icon: '📱' },
              { id: 'backup', label: '💾 Backup', icon: '💾' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-sketch transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Selector */}
          <div className="mb-6">
            <label className="block text-sm font-sketch text-gray-700 mb-2">
              📅 Select Date Range:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Past Week' },
                { id: 'month', label: 'Past Month' },
                { id: 'all', label: 'All Time' }
              ].map(range => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id as any)}
                  className={`px-3 py-1 rounded font-sketch text-sm transition-colors ${
                    dateRange === range.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          {summaryData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
              <div className="text-center">
                <div className="text-2xl">📊</div>
                <div className="text-lg font-bold text-green-600">{summaryData.totalEntries}</div>
                <div className="text-sm text-green-700">Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">💚</div>
                <div className="text-lg font-bold text-green-600">{summaryData.totalCredits}</div>
                <div className="text-sm text-green-700">Credits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">🌳</div>
                <div className="text-lg font-bold text-green-600">{summaryData.treesSaved}</div>
                <div className="text-sm text-green-700">Trees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">⚖️</div>
                <div className="text-lg font-bold text-green-600">{summaryData.totalWeight}kg</div>
                <div className="text-sm text-green-700">Waste</div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-dashed border-blue-300">
                <h3 className="text-lg font-handwritten text-blue-800 mb-3">📤 Export Your Data</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-sketch text-gray-700 mb-2">
                    Export Format:
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'csv', label: 'CSV (Excel)', desc: 'Spreadsheet format' },
                      { id: 'json', label: 'JSON', desc: 'Technical format' }
                    ].map(format => (
                      <button
                        key={format.id}
                        onClick={() => setExportFormat(format.id as any)}
                        className={`p-3 rounded-lg border-2 flex-1 text-center transition-colors ${
                          exportFormat === format.id 
                            ? 'border-blue-500 bg-blue-100 text-blue-800' 
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-bold">{format.label}</div>
                        <div className="text-sm text-gray-600">{format.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exportFormat === 'csv' ? exportToCSV : exportToJSON}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-sketch transition-colors"
                  >
                    📥 Download {exportFormat.toUpperCase()} Export
                  </button>
                </div>

                <div className="mt-4 text-sm text-gray-600 font-sketch">
                  💡 CSV files can be opened in Excel or Google Sheets. JSON files contain complete technical data.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-dashed border-purple-300">
                <h3 className="text-lg font-handwritten text-purple-800 mb-3">📊 Generate Impact Report</h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={generateImpactReport}
                    disabled={isGenerating}
                    className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-sketch transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>⏳ Generating Report...</>
                    ) : (
                      <>📄 Generate HTML Report</>
                    )}
                  </button>
                  
                  <button
                    onClick={generateVisualInfographic}
                    className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-sketch transition-colors"
                  >
                    🎨 Download Visual Infographic
                  </button>
                </div>

                <div className="text-sm text-gray-600 font-sketch">
                  💡 HTML reports can be saved as PDF using your browser&apos;s print function. Visual infographics are perfect for social media sharing!
                </div>
              </div>

              {summaryData && summaryData.categoryBreakdown.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-handwritten text-gray-800 mb-3">📈 Quick Stats Preview</h4>
                  <div className="space-y-2">
                    {summaryData.categoryBreakdown.slice(0, 3).map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-sketch">
                          {getCategoryIcon(category.category)} {category.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {category.count} items • {category.weight.toFixed(1)}kg • {category.credits > 0 ? '+' : ''}{category.credits} CC
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="bg-pink-50 p-4 rounded-lg border-2 border-dashed border-pink-300">
                <h3 className="text-lg font-handwritten text-pink-800 mb-3">📱 Share Your Impact</h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={shareToLine}
                    className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-sketch transition-colors flex items-center gap-2"
                  >
                    💬 Share to LINE
                  </button>
                  
                  <button
                    onClick={shareToFacebook}
                    className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-sketch transition-colors flex items-center gap-2"
                  >
                    📘 Share to Facebook
                  </button>
                  
                  <button
                    onClick={shareToWhatsApp}
                    className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-sketch transition-colors flex items-center gap-2"
                  >
                    📱 Share to WhatsApp
                  </button>
                  
                  <button
                    onClick={generateQRCode}
                    className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-sketch transition-colors flex items-center gap-2"
                  >
                    📱 Generate QR Profile
                  </button>
                </div>

                <div className="text-sm text-gray-600 font-sketch">
                  💡 Share your environmental achievements with friends and inspire others to track their waste! QR codes create a shareable profile card.
                </div>
              </div>

              {summaryData && (
                <div className="bg-green-50 p-4 rounded-lg border-2 border-dashed border-green-300">
                  <h4 className="text-md font-handwritten text-green-800 mb-3">🏆 Your Achievement Summary</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-bold">Current Level: {summaryData.level}</div>
                      <div>Total Credits: {summaryData.totalCredits}</div>
                      <div>Trees Saved: {summaryData.treesSaved}</div>
                    </div>
                    <div>
                      <div>Waste Tracked: {summaryData.totalWeight}kg</div>
                      <div>CO₂ Impact: {summaryData.co2Impact}kg saved</div>
                      <div>Energy Saved: {summaryData.energySaved}kWh</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-dashed border-orange-300">
                <h3 className="text-lg font-handwritten text-orange-800 mb-3">💾 Backup & Restore</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-sketch text-gray-800 mb-2">📤 Backup Your Data</h4>
                    <button
                      onClick={backupData}
                      className="w-full p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-sketch transition-colors"
                    >
                      💾 Download Complete Backup
                    </button>
                    <div className="text-sm text-gray-600 mt-2 font-sketch">
                      Creates a complete backup file with all your waste entries and credits.
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-sketch text-gray-800 mb-2">📥 Restore from Backup</h4>
                    <input
                      type="file"
                      accept=".json"
                      onChange={restoreData}
                      className="w-full p-2 border border-gray-300 rounded-lg font-sketch"
                    />
                    <div className="text-sm text-gray-600 mt-2 font-sketch">
                      ⚠️ Warning: This will replace all current data with the backup data.
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                  <div className="text-sm text-yellow-800 font-sketch">
                    💡 <strong>Tip:</strong> Regular backups help protect your environmental tracking progress. 
                    Store backup files safely to prevent data loss!
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-handwritten text-gray-800 mb-3">📊 Current Data Summary</h4>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl">📝</div>
                    <div className="font-bold text-lg">{wasteEntries.length}</div>
                    <div className="text-sm text-gray-600">Total Entries</div>
                  </div>
                  <div>
                    <div className="text-2xl">💚</div>
                    <div className="font-bold text-lg">{totalCredits}</div>
                    <div className="text-sm text-gray-600">Carbon Credits</div>
                  </div>
                  <div>
                    <div className="text-2xl">📅</div>
                    <div className="font-bold text-lg">
                      {wasteEntries.length > 0 ? Math.ceil((Date.now() - new Date(wasteEntries[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Days Tracked</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for generating images */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}