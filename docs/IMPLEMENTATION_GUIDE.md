# 🚀 Environmental Design System - Implementation Guide

## Quick Start

### 1. Installation & Setup

```bash
# The design system is already integrated into carbon-pixels
# No additional installation required

# For development, ensure you have the required dependencies:
pnpm install
```

### 2. Basic Usage

```tsx
import { 
  EcoButton, 
  EcoProgressRing, 
  WasteImpactCard,
  BatteryAwareContainer,
  useEnvironmentalDesignSystem 
} from '@/components/design-system'

function MyWasteTrackingPage() {
  // Initialize the design system
  const designSystem = useEnvironmentalDesignSystem({
    thaiContext: true,
    performanceMonitoring: true,
    batteryOptimization: true
  })
  
  return (
    <BatteryAwareContainer optimizationLevel="moderate">
      <div className="p-6 space-y-6">
        {/* Eco-friendly action button */}
        <EcoButton
          variant="eco-positive"
          size="lg"
          ecoScore={25}
          onClick={() => handleRecycleAction()}
        >
          รีไซเคิล Plastic Bottle
        </EcoButton>
        
        {/* Environmental progress visualization */}
        <EcoProgressRing
          progress={75}
          targetValue={500}
          currentValue={375}
          label="Carbon Credits This Month"
          color="green"
          ecoMetric={{
            type: 'trees',
            value: 0.75,
            unit: 'trees saved'
          }}
        />
        
        {/* Behavioral reinforcement card */}
        <WasteImpactCard
          wasteType="Plastic Bottle"
          wasteTypeLocal="ขวดพลาสติก"
          weight={0.1}
          disposal="recycled"
          carbonCredits={25}
          thaiContext={true}
          ecoComparison={{
            type: 'co2',
            value: 25,
            description: 'grams of CO₂ prevented from entering atmosphere'
          }}
        />
      </div>
    </BatteryAwareContainer>
  )
}
```

## 🧱 Component Library

### EcoButton - Behavioral Reinforcement Button

The primary action component that reinforces eco-friendly choices through visual and haptic feedback.

#### Props & Variants

```tsx
interface EcoButtonProps {
  variant: 'eco-positive' | 'eco-negative' | 'neutral' | 'warning'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ecoScore?: number // Carbon credits earned/lost
  children: React.ReactNode
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  hapticIntensity?: 'light' | 'medium' | 'heavy'
  batteryOptimized?: boolean
  fullWidth?: boolean
}
```

#### Usage Examples

```tsx
// Positive environmental action
<EcoButton
  variant="eco-positive"
  size="lg"
  ecoScore={50}
  hapticIntensity="success"
  onClick={handleCompostAction}
>
  🌱 Compost Organic Waste
</EcoButton>

// Negative impact warning
<EcoButton
  variant="eco-negative"
  size="md"
  ecoScore={-25}
  hapticIntensity="warning"
  onClick={handleLandfillAction}
>
  🗑️ Send to Landfill
</EcoButton>

// Battery-optimized version
<EcoButton
  variant="eco-positive"
  batteryOptimized={true}
  size="md"
  onClick={handleAction}
>
  Save Energy Mode
</EcoButton>
```

#### Behavioral Psychology Features

- **Color Psychology**: Green for positive actions triggers dopamine release
- **Haptic Feedback**: Different vibration patterns reinforce action consequences  
- **Instant Gratification**: Carbon credit display provides immediate reward
- **Cultural Context**: Thai golden accents for cultural familiarity
- **Accessibility**: High contrast modes, screen reader support

### EcoProgressRing - Environmental Impact Visualization

Circular progress component that connects abstract carbon credits to tangible environmental outcomes.

#### Props & Configuration

```tsx
interface EcoProgressRingProps {
  progress: number // 0-100
  targetValue: number
  currentValue: number
  label: string
  color?: 'green' | 'blue' | 'gold' | 'red'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showAnimation?: boolean
  ecoMetric?: {
    type: 'trees' | 'co2' | 'energy' | 'credits'
    value: number
    unit: string
  }
}
```

#### Advanced Usage

```tsx
// Trees saved visualization
<EcoProgressRing
  progress={60}
  targetValue={500}
  currentValue={300}
  label="Monthly Goal"
  color="green"
  size="lg"
  ecoMetric={{
    type: 'trees',
    value: 0.6,
    unit: 'trees equivalent'
  }}
/>

// CO₂ reduction tracking
<EcoProgressRing
  progress={85}
  targetValue={1000}
  currentValue={850}
  label="CO₂ Reduction"
  color="blue"
  ecoMetric={{
    type: 'co2',
    value: 850,
    unit: 'grams saved'
  }}
/>

// Battery-aware alternative
<SmartEcoProgressRing
  progress={45}
  targetValue={200}
  currentValue={90}
  label="Weekly Credits"
  // Automatically switches to text-only on low battery
/>
```

#### Performance Optimizations

- **Intersection Observer**: Only animates when visible
- **Battery Awareness**: Disables animations on low battery
- **GPU Acceleration**: Uses `transform3d` for smooth animations
- **Minimal Fallback**: Text-only version for extreme battery saving

### WasteImpactCard - Psychological Behavioral Design

Comprehensive card component that displays waste disposal impact with strong behavioral psychology elements.

#### Props & Features

```tsx
interface WasteImpactCardProps {
  wasteType: string
  wasteTypeLocal?: string // Thai translation
  weight: number
  disposal: 'recycled' | 'composted' | 'landfill' | 'avoided' | 'reused'
  carbonCredits: number
  ecoComparison?: {
    type: 'trees' | 'energy' | 'water' | 'co2'
    value: number
    description: string
  }
  thaiContext?: boolean
  showDetails?: boolean
  timestamp?: Date
  onAction?: () => void
  onShare?: () => void
}
```

#### Cultural Integration

```tsx
// Thai Buddhist context
<WasteImpactCard
  wasteType="Plastic Bag"
  wasteTypeLocal="ถุงพลาสติก"
  weight={0.05}
  disposal="avoided"
  carbonCredits={67}
  thaiContext={true}
  ecoComparison={{
    type: 'co2',
    value: 67,
    description: 'grams CO₂ prevented'
  }}
  onShare={handleSocialShare}
/>
```

#### Behavioral Elements

- **Immediate Feedback**: Large, prominent carbon credit display
- **Social Proof**: Impact comparison to trees, energy, water
- **Cultural Motivation**: Buddhist-inspired encouragement messages
- **Achievement Recognition**: Visual badges for high-impact actions
- **Progress Reinforcement**: Star ratings for environmental impact

### BatteryAwareContainer - Intelligent Resource Management

Smart container that adapts rendering strategy based on device battery level and performance capabilities.

#### Props & Optimization Levels

```tsx
interface BatteryAwareContainerProps {
  children: React.ReactNode
  optimizationLevel?: 'none' | 'moderate' | 'aggressive'
  fallbackContent?: React.ReactNode
  loadingComponent?: React.ReactNode
  lazyLoad?: boolean
  criticalPath?: boolean
  energyBudget?: 'low' | 'medium' | 'high'
  onPerformanceWarning?: (metric: string, value: number) => void
}
```

#### Optimization Strategies

```tsx
// Moderate optimization (default)
<BatteryAwareContainer optimizationLevel="moderate">
  <ExpensiveWasteVisualization />
</BatteryAwareContainer>

// Aggressive battery saving
<BatteryAwareContainer 
  optimizationLevel="aggressive"
  fallbackContent={<SimpleTextVersion />}
  energyBudget="low"
>
  <ComplexAnimatedChart />
</BatteryAwareContainer>

// Critical path rendering (always renders)
<BatteryAwareContainer 
  criticalPath={true}
  optimizationLevel="moderate"
>
  <NavigationHeader />
</BatteryAwareContainer>
```

## 🎨 Design Token System

### CSS Custom Properties

The design system automatically sets up CSS custom properties when initialized:

```css
:root {
  /* Environmental colors */
  --eco-positive: #10b981;
  --eco-negative: #ef4444;
  --eco-thai-gold: #fbbf24;
  --eco-thai-blue: #3b82f6;
  
  /* Battery-optimized dark theme */
  --eco-dark-background: #000000;
  --eco-dark-surface: #0a0a0a;
  --eco-dark-text: #ffffff;
  
  /* Touch targets */
  --eco-touch-min: 44px;
  --eco-touch-comfortable: 48px;
  --eco-touch-generous: 56px;
}
```

### Utility Functions

```tsx
import { ENVIRONMENTAL_UTILS, ACCESSIBILITY_HELPERS } from '@/components/design-system'

// Calculate OLED energy savings
const dailySavings = ENVIRONMENTAL_UTILS.calculateOLEDSavings(4, 0.8) // 4 hours, 80% dark mode
console.log(`Daily energy savings: ${dailySavings}Wh`)

// Get appropriate button variant
const variant = ENVIRONMENTAL_UTILS.getEcoVariant(carbonCredits)

// Generate accessible labels
const ariaLabel = ACCESSIBILITY_HELPERS.getEcoAriaLabel('recycle', 25, true)
```

## 🌍 Thai Cultural Integration

### Language & Context

```tsx
// Enable Thai cultural context
const MyApp = () => {
  const { thaiContext } = useEnvironmentalDesignSystem({ 
    thaiContext: true 
  })
  
  return (
    <div className="app" data-cultural-context="thai">
      {/* Components automatically adapt to Thai context */}
    </div>
  )
}
```

### Cultural Color Usage

```tsx
import { THAI_CONTEXT } from '@/components/design-system'

// Use culturally appropriate colors
const ThaiThemedButton = () => {
  const goldColor = THAI_CONTEXT.culturalColors.royalGold.color
  
  return (
    <button style={{ backgroundColor: goldColor }}>
      Achieve Royal Status! 👑
    </button>
  )
}
```

### Buddhist-Inspired Messaging

```tsx
const getMotivationalMessage = (isPositive: boolean) => {
  const messages = isPositive ? 
    THAI_CONTEXT.motivationalMessages.positive :
    THAI_CONTEXT.motivationalMessages.encouraging
    
  return messages[Math.floor(Math.random() * messages.length)]
}
```

## ⚡ Performance & Battery Optimization

### Battery-Aware Component Patterns

```tsx
import { withBatteryOptimization } from '@/components/design-system'

// Wrap expensive components with battery optimization
const OptimizedWasteChart = withBatteryOptimization(WasteChart, {
  optimizationLevel: 'aggressive',
  energyBudget: 'low',
  fallbackComponent: SimpleWasteList
})

// Use in your app
<OptimizedWasteChart data={wasteData} />
```

### Performance Monitoring

```tsx
import { useComponentPerformance } from '@/components/design-system'

const MyComponent = () => {
  const metrics = useComponentPerformance('MyComponent')
  
  // Log performance warnings automatically
  useEffect(() => {
    if (metrics.averageRenderTime > 16) {
      console.warn('Component exceeding 60fps budget')
    }
  }, [metrics])
  
  return <div>Component content</div>
}
```

### Energy Budget Management

```tsx
// Set performance budgets for different component types
const ExpensiveComponent = () => (
  <BatteryAwareContainer 
    energyBudget="high"      // 33ms render budget
    onPerformanceWarning={(metric, value, threshold) => {
      console.warn(`${metric}: ${value}ms exceeded ${threshold}ms budget`)
    }}
  >
    <ComplexVisualization />
  </BatteryAwareContainer>
)
```

## ♿ Accessibility Implementation

### WCAG 2.1 AAA Compliance

The design system is built with accessibility as a core requirement:

```tsx
// Screen reader support
<EcoButton
  variant="eco-positive"
  ariaLabel="Recycle plastic bottle, earning 25 carbon credits"
>
  Recycle
</EcoButton>

// High contrast mode automatic adaptation
<EcoProgressRing
  progress={75}
  label="Monthly Progress"
  // Automatically adapts colors and removes animations in high contrast mode
/>
```

### Keyboard Navigation

All components support full keyboard navigation:

```tsx
// Focus management
<div className="waste-entry-form">
  <EcoButton 
    size="lg"
    onClick={handleNext}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleNext()
      }
    }}
  >
    Next Step
  </EcoButton>
</div>
```

### Voice Interface Support

Components provide rich ARIA descriptions for voice control:

```tsx
<WasteImpactCard
  wasteType="Organic Food Waste"
  disposal="composted"
  carbonCredits={30}
  // Generates comprehensive aria-description automatically
  // "Organic food waste, 0.5 kilograms, composted, positive environmental impact, 30 carbon credits earned"
/>
```

## 🔧 Development Tools

### Performance Monitoring

Enable development-time performance indicators:

```tsx
// In development environment
{process.env.NODE_ENV === 'development' && (
  <BatteryAwareContainer>
    {/* Shows battery level, render time, optimization status */}
    <MyComponent />
  </BatteryAwareContainer>
)}
```

### Design System Debugging

```tsx
import { EcoButtonWithPerformanceMonitoring } from '@/components/design-system'

// Enable performance monitoring for specific components
<EcoButtonWithPerformanceMonitoring
  enableMonitoring={true}
  variant="eco-positive"
  onClick={handleAction}
>
  Debug Mode Button
</EcoButtonWithPerformanceMonitoring>
```

## 📦 Integration Examples

### Existing Carbon-Pixels Components

```tsx
// Enhance existing GameificationPanel with design system
import { EcoProgressRing, WasteImpactCard } from '@/components/design-system'

const EnhancedGameificationPanel = ({ totalCredits, todayCredits }) => (
  <div className="gamification-panel">
    <EcoProgressRing
      progress={(totalCredits / 2500) * 100}
      currentValue={totalCredits}
      targetValue={2500}
      label="Level Progress"
      color="green"
      ecoMetric={{
        type: 'trees',
        value: Math.floor(totalCredits / 500),
        unit: 'trees saved'
      }}
    />
    
    {/* Replace existing cards with enhanced versions */}
    <div className="recent-entries">
      {recentEntries.map(entry => (
        <WasteImpactCard
          key={entry.id}
          {...entry}
          thaiContext={true}
          onShare={() => shareToSocial(entry)}
        />
      ))}
    </div>
  </div>
)
```

### WasteScanner Integration

```tsx
// Wrap scanner with battery optimization
import { BatteryAwareContainer } from '@/components/design-system'

const OptimizedWasteScanner = () => (
  <BatteryAwareContainer
    optimizationLevel="moderate"
    energyBudget="high"
    fallbackContent={<ManualEntryForm />}
  >
    <WasteScanner />
  </BatteryAwareContainer>
)
```

## 🚀 Deployment Checklist

### Production Readiness

- [ ] **Design Tokens**: CSS custom properties applied globally
- [ ] **Performance Budgets**: Component render times under 16ms
- [ ] **Battery Optimization**: Low battery fallbacks implemented
- [ ] **Accessibility**: WCAG 2.1 AA compliance verified
- [ ] **Thai Localization**: Cultural context properly configured
- [ ] **Error Boundaries**: Graceful degradation for component failures
- [ ] **Performance Monitoring**: Production metrics collection enabled

### Testing Requirements

```bash
# Run accessibility tests
pnpm test:accessibility

# Performance budget testing
pnpm test:performance

# Battery optimization testing (requires device testing)
pnpm test:battery

# Thai cultural context validation
pnpm test:i18n
```

## 📈 Measuring Success

### Environmental Impact Metrics

Track the real-world environmental benefits:

```typescript
// Example metrics tracking
const trackEnvironmentalImpact = {
  // Energy savings from OLED dark mode
  energySavedKwh: calculateOLEDSavings(userScreenTime),
  
  // Behavioral change measurement
  positiveActionsIncrease: measureBehaviorChange(),
  
  // Carbon footprint reduction
  co2SavedKg: calculateCarbonReduction(userActions),
  
  // User engagement with sustainability features
  sustainabilityEngagement: measureFeatureUsage()
}
```

### User Experience Metrics

Monitor the psychological effectiveness:

- **Task Completion Rate**: How many users complete eco-friendly actions
- **Return Engagement**: Daily/weekly active users for environmental features
- **Behavioral Persistence**: Long-term adoption of sustainable practices
- **Cultural Resonance**: User feedback on Thai cultural elements
- **Accessibility Success**: Usage patterns from assistive technology users

This comprehensive implementation guide provides everything needed to successfully deploy and maintain the Environmental Design System in the carbon-pixels application while achieving measurable environmental and user experience benefits.