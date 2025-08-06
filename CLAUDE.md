# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Thailand Waste Diary Project

A gamified daily waste tracking application designed specifically for Thailand, similar to a food diary but for garbage! Users scan waste items with AI recognition, earn carbon credits for sustainable disposal choices, and visualize their environmental impact as trees saved. Built with official TGO emission factors to support Thailand's 2050 carbon neutrality goal.

## Technology Stack

**Frontend Framework**: Next.js 15 with App Router and TypeScript
**Styling**: Tailwind CSS with custom "notebook paper" aesthetic
**Fonts**: Patrick Hand (handwritten) and Kalam (sketch) for personal touch
**Data Storage**: localStorage for client-side persistence
**Architecture**: Component-based with React hooks

## Development Commands

```bash
# Development (primary command)
pnpm dev              # Start development server at http://localhost:3000

# Build and production
pnpm build            # Build for production
pnpm start            # Start production server
pnpm type-check       # TypeScript type checking
pnpm lint             # ESLint code linting
```

## Project Architecture

### Core Application Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page with app overview
│   ├── diary/             # Main waste diary application
│   │   ├── page.tsx       # Dashboard with daily stats
│   │   ├── manual/        # Manual waste entry form
│   │   └── history/       # Historical tracking views
│   └── calculator/        # Original carbon footprint calculator
├── components/            # Reusable React components
│   ├── WasteScanner.tsx   # AI-powered scanning simulation
│   └── GameificationPanel.tsx # Levels, achievements, tree comparisons
└── data/                  # Core application data
    └── thailand-waste-categories.json # TGO emission factors & game data
```

## Key Features Implemented

### 🗂️ **Waste Diary System**
- **AI-Powered Scanning**: Simulated 3-second AI recognition with fallback to manual selection
- **8 Thai Waste Categories**: Food waste, plastic bottles/bags, paper, glass, metal, organic, e-waste
- **Weight Input**: User enters waste weight in kg with common suggestions (0.1, 0.2, 0.5, 1.0, 2.0)
- **Daily Tracking**: Calendar-style interface showing daily waste entries with timestamps

### 💚 **Carbon Credit System**
- **TGO Official Data**: All emission factors from Thailand Greenhouse Gas Management Organization
- **Positive/Negative Credits**: 
  - Negative (bad): Landfill disposal, single-use plastics
  - Positive (good): Recycling, composting, waste avoidance
  - Special high rewards: -67 credits for avoided HDPE plastic bags
- **Real-time Calculation**: Credits = base_credits_per_kg × weight_in_kg

### 🎮 **Gamification Elements**
- **5-Level System**: Eco Beginner 🌱 → Green Warrior 💚 → Eco Champion 🌍 → Climate Hero 🦸 → Planet Protector 🛡️
- **Tree Equivalency**: 500 credits = 1 tree saved (visual impact measurement)
- **Daily Challenges**: Scan 5 items, recycle something, avoid plastic bags
- **Achievement System**: First scan, daily tracker, recycling hero, tree saver milestones
- **Progress Tracking**: Level advancement bars, streak counters

### 📊 **Dashboard Analytics**
- **Daily Overview**: Today's waste weight, credits earned, tree equivalent
- **Statistics Cards**: Total credits, trees saved, CO₂ impact (1 credit ≈ 1g CO₂)
- **Thailand Ranking**: Simulated percentile based on total credits
- **Energy Conversion**: Credits to kWh saved visualization

## Data Structure

### thailand-waste-categories.json
Core data file containing:
- **wasteCategories**: 8 categories with Thai names, icons, examples, disposal methods
- **carbonCredits**: TGO emission factors for each disposal method per category
- **gamification**: Level definitions, tree equivalency (500 credits/tree), daily goals
- **tips**: Sustainability advice for each waste category

Example category structure:
```json
{
  "id": "plastic_bags",
  "name": "Plastic Bags",
  "nameLocal": "ถุงพลาสติก",
  "icon": "🛍️",
  "carbonCredits": {
    "disposed": -67,      // Landfill disposal (negative)
    "recycled": 5,        // Recycling (positive)
    "avoided": 67         // Waste avoidance (highest positive)
  },
  "examples": ["Shopping bags", "Food packaging"],
  "tips": ["Bring reusable bags", "Refuse single-use bags"]
}
```

## Component Architecture

### WasteScanner.tsx
- **Camera Simulation**: 3-second "AI scanning" with loading states
- **Manual Fallback**: Category selection grid if scanning unavailable
- **Disposal Selection**: Radio buttons for different disposal methods
- **Weight Input**: Number input with validation (0.1kg minimum)
- **Credit Calculation**: Real-time preview of credits earned/lost

### GameificationPanel.tsx
- **Level Progression**: Dynamic level calculation based on total credits
- **Statistics Grid**: Trees saved, daily streak, CO₂ impact, today's points
- **Daily Challenges**: Goal tracking with completion states
- **Achievement Badges**: Milestone celebrations (100+ credits, first tree, etc.)
- **Motivation Messages**: Thailand 2050 carbon neutrality context

### Manual Entry Form
- **Category Selection**: Visual grid with Thai/English labels
- **Category Information**: Dynamic display of examples and tips
- **Disposal Method Selection**: Shows carbon credit impact per method
- **Weight Suggestions**: Quick-select common waste weights
- **Credit Preview**: Live calculation of carbon credits to be earned

## Thailand-Specific Implementation

### Official Data Integration
- **TGO Emission Factors**: Thailand Greenhouse Gas Management Organization certified data
- **EPPO Electricity**: 0.399 kg CO₂e/kWh (Energy Policy and Planning Office 2024)
- **Local Context**: Thai market waste types, traditional packaging materials
- **Cultural Elements**: Buddhist minimalism context, dual-language support

### Waste Categories Tailored for Thailand
1. **Food Waste** (🍎): Thai cuisine scraps, coconut shells, fruit peels
2. **Plastic Bottles** (🍾): Beverage containers, sauce bottles
3. **Plastic Bags** (🛍️): Shopping bags, food packaging (highest penalty/reward)
4. **Paper/Cardboard** (📄): Packaging, newspapers, office paper
5. **Glass Bottles** (🫙): Beer bottles, condiment jars
6. **Metal Cans** (🥫): Food cans, beverage cans
7. **Organic Waste** (🍃): Garden trimmings, biodegradable materials
8. **Electronic Waste** (📱): Phones, electronics, batteries

## User Experience Design

### Hand-Drawn Notebook Aesthetic
- **CSS Custom Properties**: Paper-like backgrounds, ink/pencil colors
- **Sketch Elements**: Dashed borders, drop shadows, hand-drawn feel
- **Typography**: Patrick Hand and Kalam fonts for authentic handwritten look
- **Color Scheme**: Warm paper tones with green eco accents

### Mobile-First Responsive Design
- **Touch-Friendly**: Large tap targets for waste category selection
- **Grid Layouts**: Responsive cards for statistics and categories
- **Progressive Enhancement**: Works without JavaScript for core functionality

## Data Persistence Strategy

### localStorage Implementation
- **wasteEntries**: Array of all waste diary entries with timestamps
- **carbonCredits**: Running total of earned/lost credits
- **userLevel**: Current gamification level (derived from credits)
- **dailyStreak**: Consecutive days of tracking (future enhancement)

### Data Structure Example
```javascript
// Waste entry format
{
  id: "1641234567890",
  categoryId: "plastic_bags",
  categoryName: "Plastic Bags",
  disposal: "avoided",
  weight: 0.1,
  carbonCredits: 67,
  timestamp: "2024-01-01T10:30:00.000Z"
}
```

## Performance Considerations

### Optimizations Implemented
- **Component Splitting**: Lazy loading for scanner modal
- **localStorage Caching**: Persistent data without server calls
- **Efficient Filtering**: Today's entries calculated client-side
- **CSS-in-JS**: Tailwind utilities for minimal bundle size

## Accessibility Features

### WCAG Compliance Elements
- **Semantic HTML**: Proper heading hierarchy, form labels
- **ARIA Labels**: Screen reader support for interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: High contrast for text readability
- **Alternative Text**: Meaningful alt text for emoji and icons

## Future Enhancement Opportunities

### Potential Features
- **Real Camera Integration**: Actual AI waste recognition with TensorFlow.js
- **Supabase Backend**: Multi-user support, cloud synchronization
- **Social Features**: Community challenges, leaderboards
- **Advanced Analytics**: Weekly/monthly trend analysis, carbon footprint tracking
- **Thai Government Integration**: Connection to official waste management programs
- **Offline PWA**: Progressive Web App for offline functionality

## Testing Strategy

### Current Testing Approach
- **Manual Testing**: Cross-browser compatibility, mobile responsiveness
- **TypeScript**: Compile-time error detection
- **ESLint**: Code quality and consistency

### Recommended Testing Additions
- **Jest Unit Tests**: Component logic, calculation functions
- **Cypress E2E**: User journey testing
- **Accessibility Testing**: axe-core integration

## Development Notes

### Code Quality Standards
- **TypeScript Strict Mode**: Full type safety (some `as any` used for dynamic JSON access)
- **ESLint Configuration**: Next.js recommended rules
- **Component Organization**: Single responsibility principle
- **Consistent Naming**: camelCase for variables, PascalCase for components

### Known Technical Debt
- **Type Safety**: Dynamic JSON property access requires type assertions
- **Hardcoded Values**: Some magic numbers (500 credits/tree) should be configurable
- **Error Handling**: Limited error boundaries and validation
- **Performance**: No virtualization for large entry lists

### Environment Variables
Currently self-contained without external APIs:
```env
# Future enhancement - if adding external services
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_CLOUD_VISION_API_KEY=  # For real AI waste recognition
```

This waste diary application successfully transforms abstract carbon footprint concepts into concrete, actionable daily habits through gamification, making environmental consciousness accessible and engaging for Thai users.