# Thailand Waste Diary 🗂️🇹🇭

A gamified daily waste tracking application designed specifically for Thailand, similar to a food diary but for garbage! Users track waste items through AI scanning simulation and manual entry, earn carbon credits for sustainable disposal choices, and visualize their environmental impact as trees saved. Built with official TGO emission factors to support Thailand's 2050 carbon neutrality goal.

> **Latest Update**: Comprehensive data export and sharing system with CSV/JSON downloads, beautiful impact reports, Thai social media integration (LINE, Facebook, WhatsApp), QR profile cards, and complete backup/restore functionality.

## ✨ Key Features

### 🔍 **Waste Tracking System**
- **AI Scanner Demo**: Simulated AI waste recognition with educational focus
- **Manual Entry** (Recommended): Accurate category selection with detailed guidance  
- **8 Thai Waste Categories**: Food waste, plastic bottles/bags, paper, glass, metal, organic, e-waste
- **Real-time Feedback**: Instant carbon credit calculation with disposal method comparison
- **Local Context**: Thai-specific items, coconut shells, traditional packaging materials

### 💚 **Carbon Credit Gamification**
- **Scientific Basis**: Official TGO (Thailand Greenhouse Gas Management) emission factors
- **Reward System**: +Credits for recycling, composting, waste avoidance
- **Penalty System**: -Credits for landfill disposal, single-use plastics
- **Impact Amplification**: Special rewards for plastic avoidance (-67 credits for avoided HDPE bags)
- **Tree Equivalency**: 500 credits = 1 tree saved (clear impact visualization)

### 🎮 **Engaging User Experience**
- **5-Level Progression**: Eco Beginner 🌱 → Green Warrior → Eco Champion → Climate Hero → Planet Protector 🛡️
- **Achievement System**: First scan, daily tracker, recycling hero, tree saver milestones
- **Progress Tracking**: Level advancement bars, streak counters, goal completion
- **Thailand Ranking**: Percentile-based comparison with simulated national data

### 📊 **Comprehensive Analytics & Export**
- **Daily Dashboard**: Today's credits, waste weight, tree equivalent, goal progress
- **Historical Tracking**: Complete calendar view with entry details and trends
- **Impact Insights**: CO₂ saved, energy equivalent (kWh), ranking progression  
- **Data Export**: CSV/JSON downloads with flexible date ranges (today, week, month, all-time)
- **Impact Reports**: Beautiful HTML reports with detailed statistics and visualizations
- **Visual Infographics**: Downloadable PNG summaries perfect for social media sharing
- **Collapsible Details**: Advanced metrics available on-demand to reduce cognitive load

### ♿ **Accessibility Excellence** 
- **WCAG 2.1 Compliance**: Full screen reader support, keyboard navigation
- **Focus Management**: Proper tab order, focus trapping in modals
- **ARIA Implementation**: Comprehensive labels, descriptions, live regions
- **Keyboard Support**: ESC key modal closing, arrow key navigation
- **Visual Accessibility**: High contrast mode, reduced motion preferences

### 📱 **Social Sharing & Community**
- **Thai Platform Integration**: Dedicated sharing for LINE, Facebook, and WhatsApp
- **QR Profile Cards**: Generate scannable profiles with environmental achievements
- **Visual Impact Cards**: Beautiful infographics showcasing tree equivalents and CO₂ savings
- **Multi-format Sharing**: Customizable messages for different platforms in Thai/English
- **Data Backup/Restore**: Complete data export/import for device transfers
- **Achievement Celebrations**: Share milestones like trees saved and level progression

### 🇹🇭 **Thailand Cultural Integration**
- **Dual Language**: Thai/English labels throughout interface
- **Local Waste Categories**: Thailand-specific materials and disposal methods
- **Cultural Context**: Buddhist minimalism principles, community responsibility
- **Market Integration**: Tips for Thai markets, local recycling programs
- **National Goals**: Direct connection to Thailand's 2050 carbon neutrality target

### 📱 **Advanced Mobile Navigation System**
- **Thai-Inspired Design**: Cultural animations with wai gestures, lotus blooming, traditional colors
- **Haptic Feedback**: Device vibration for tactile confirmation of actions
- **Swipe Navigation**: Intuitive gesture-based page transitions
- **Bottom Tab Navigation**: Quick access to main sections (Home, Scanner, History)
- **Floating Action Button**: Context-aware quick actions
- **Breadcrumb Navigation**: Clear path indicators for nested pages
- **Safe Area Support**: iPhone X+ notch and home indicator compatibility
- **Pull-to-Refresh**: Mobile-native gesture support with haptic feedback

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (preferred) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/naiplawan/carbon-pixels.git
cd carbon-pixels
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Quick Start Guide

1. **Landing Page**: Overview of the waste tracking system and carbon credit concept
2. **Diary Dashboard**: Main interface with today's stats and action buttons
3. **Manual Entry**: Recommended method for accurate waste categorization  
4. **AI Scanner Demo**: Educational simulation of waste recognition technology
5. **History View**: Comprehensive tracking with calendar interface and insights

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production  
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript type checking
```

## 📱 Application Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with app overview
│   ├── diary/
│   │   ├── page.tsx               # Main dashboard with stats & actions
│   │   ├── manual/page.tsx        # Manual waste entry form
│   │   └── history/page.tsx       # Historical tracking calendar
│   ├── calculator/page.tsx        # Carbon footprint calculator
│   └── globals.css                # Global styles with notebook theme
├── components/
│   ├── WasteScanner.tsx           # AI scanning modal with accessibility
│   ├── GameificationPanel.tsx    # Level progress and achievements
│   └── navigation/                # Advanced mobile navigation system
│       ├── MobileNavigationLayout.tsx  # Main navigation wrapper
│       ├── BottomTabNavigation.tsx    # Bottom tab bar
│       ├── FloatingActionButton.tsx   # Context-aware FAB
│       ├── MobileHamburgerMenu.tsx    # Slide-out menu
│       ├── MobileBreadcrumbs.tsx      # Path indicators
│       ├── GestureNavigation.tsx      # Swipe and pull gestures
│       ├── NavigationProvider.tsx     # Context and state management
│       ├── NavigationAnimations.tsx   # Thai-inspired animations
│       └── index.ts                   # Unified navigation system export
└── data/
    └── thailand-waste-categories.json # TGO emission factors & game data
```

## 📱 Technology Stack

- **Frontend**: Next.js 15 with App Router and React 19
- **Language**: TypeScript (strict mode, full type safety)
- **Styling**: Tailwind CSS with custom "notebook paper" aesthetic
- **Animation**: Framer Motion for smooth transitions and Thai cultural animations
- **State Management**: React hooks with localStorage persistence
- **Navigation**: Advanced mobile-first system with gesture support and haptic feedback
- **Accessibility**: WCAG 2.1 AA compliant, full ARIA implementation
- **Icons**: Lucide React with custom emoji integration  
- **Fonts**: Patrick Hand (handwritten) and Kalam (sketch) for authentic feel
- **Development**: ESLint, Prettier, TypeScript strict mode

## 🎨 Design Philosophy

The application uses a "hand-drawn notebook" aesthetic to make waste tracking feel personal and engaging rather than clinical. This design approach transforms environmental consciousness into an accessible, diary-like experience.

### Visual Design System
- **Paper Texture**: Warm, notebook-style backgrounds with subtle aging effects
- **Handwritten Typography**: Patrick Hand and Kalam fonts for authentic personal feel
- **Sketch Elements**: Dashed borders, drop shadows, hand-drawn style animations
- **Color Psychology**: Green earth tones with high contrast for accessibility
- **Progressive Disclosure**: Information organized to reduce cognitive overload

### User Experience Principles
- **Mobile-First**: Touch-friendly interactions designed for smartphone usage
- **Accessibility-First**: WCAG 2.1 AA compliance from initial design phase  
- **Clarity Over Cleverness**: Simple, obvious interactions over complex features
- **Cultural Sensitivity**: Thai language integration and local context awareness
- **Gamification Balance**: Motivating without overwhelming, educational focus

## 🆕 Recent Improvements (v2.1)

### TypeScript Infrastructure Overhaul
- ✅ **Complete Type Safety**: Fixed 50+ TypeScript errors across the codebase
- ✅ **Enhanced Type Definitions**: Added comprehensive interfaces for waste tracking, validation, and user stats
- ✅ **Next.js 15 Compatibility**: Updated to stable Turbopack configuration
- ✅ **Test Type Safety**: Fixed all Jest and Playwright test type issues
- ✅ **Animation Type Safety**: Resolved Framer Motion transition and easing type conflicts

### Critical UX/UI Fixes Implemented
- ✅ **Missing History Page**: Complete historical tracking with calendar view and insights
- ✅ **Modal Accessibility**: Full ARIA implementation, focus management, keyboard navigation  
- ✅ **Dashboard Overload**: Streamlined layout with collapsible details section
- ✅ **AI Scanner Clarity**: Clear demo mode indicators and user expectation management

### Development Infrastructure Improvements
- **Enhanced Type System**: Added `DisposalMethod`, `ValidationResult`, `UserStats`, and storage keys
- **Test Framework Fixes**: Resolved Jest DOM matchers, canvas mocking, and Playwright compatibility
- **Configuration Updates**: Migrated from deprecated `experimental.turbo` to stable `turbopack`
- **Error Prevention**: Comprehensive type checking prevents runtime errors and improves developer experience

### Accessibility Enhancements
- **Focus Management**: Automatic focus on modal open, focus trapping, ESC key support
- **Screen Reader Support**: Comprehensive ARIA labels, descriptions, live regions
- **Keyboard Navigation**: Full tab order, arrow key support, accessible form controls
- **Visual Indicators**: Clear button states, loading indicators, validation feedback

## 🌱 Thailand Carbon Footprint Calculation

The scoring system uses official TGO and EPPO emission factors across five key areas:

### 1. **Transportation** (Thailand-specific)
- Heavy-duty diesel: 1.1988 kg CO₂e/km
- Public bus: 0.7073 kg CO₂e/km
- Personal car: 0.30947 kg CO₂e/km
- Pickup truck: 0.23452 kg CO₂e/km (popular in Thailand)
- Motorcycle: 0.0425 kg CO₂e/km (52.81% of Thai vehicles)

### 2. **Electricity** (EPPO 2024 Data)
- Grid emission factor: 0.399 kg CO₂e/kWh
- Based on Thailand's energy mix (60% natural gas, 14% coal, 12% renewables)

### 3. **Food & Diet** (Thai dietary categories)
- High meat diet: 1.83 kg CO₂e/day
- Moderate meat: 1.4 kg CO₂e/day
- Low meat: 1.1 kg CO₂e/day
- Vegetarian: 0.85 kg CO₂e/day
- Vegan: 0.57 kg CO₂e/day

### 4. **Waste Management** (TGO emission factors)
- Landfill: 1.0388 kg CO₂e/kg
- Plastic recycling: 0.4044 kg CO₂e/kg
- Avoided plastics: -1.91 kg CO₂e/kg (negative emissions!)
- Avoided HDPE bags: -6.7071 kg CO₂e/kg

### 5. **Consumption Habits**
- Emphasis on local Thai products vs imports
- Supporting Thai circular economy initiatives

### Thailand-Specific Scoring Categories

- **Carbon Champion** (0-50): Aligned with Thailand's climate goals
- **Eco-Conscious Thai** (51-100): Supporting national sustainability
- **Climate Action Starter** (101-180): Average for Thailand
- **Needs Improvement** (181-280): Above Thailand average
- **Urgent Action Needed** (280+): Significant impact reduction needed

## 🎯 User Journey

1. **Welcome Page**: Introduction with overview of categories
2. **Interactive Calculator**: 5-question journey with real-time visuals
3. **Results Summary**: Personalized score, visual story, and actionable tips
4. **Social Sharing**: Ability to share results and journey

## 🔧 Data & Persistence

### Local Storage Strategy
- **Waste Entries**: Complete tracking history with timestamps and metadata
- **Carbon Credits**: Running total with transaction history  
- **User Progress**: Level advancement, achievements, streak tracking
- **Preferences**: Theme settings, accessibility options

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

### API Endpoints
- `GET /api/questions` - Carbon footprint calculator questions and scoring
- `POST /api/calculate` - Calculate carbon footprint from user answers

## ♿ Accessibility Compliance

### WCAG 2.1 AA Standards Met
- **Perceivable**: High contrast ratios, scalable text, alt text for images
- **Operable**: Full keyboard navigation, no seizure-inducing content
- **Understandable**: Clear language, consistent navigation, error identification  
- **Robust**: Semantic HTML, ARIA attributes, cross-browser compatibility

### Specific Features Implemented
- Skip to main content links on all pages
- Semantic HTML structure with proper heading hierarchy
- Comprehensive ARIA labels and descriptions
- Full keyboard navigation with visible focus indicators
- Screen reader announcements for dynamic content
- High contrast mode and reduced motion support
- Mobile-first responsive design with touch accessibility

## 🎨 Customization

The application uses CSS custom properties and Tailwind utilities for easy theming:

```css
:root {
  --paper: 48 20% 97%;
  --ink: 222.2 47% 11%;
  --pencil: 217.2 32.6% 17.5%;
}
```

## 🚀 Future Enhancement Roadmap

### Phase 3: Advanced Features
- **Real AI Integration**: TensorFlow.js waste recognition with camera API
- **Cloud Synchronization**: Multi-device support with Supabase backend
- **Social Features**: Community challenges, leaderboards, friend comparisons
- **Advanced Analytics**: Weekly/monthly trends, carbon footprint forecasting

### Phase 4: Platform Expansion  
- **Progressive Web App**: Offline functionality, app-like experience
- **Thai Government Integration**: Official waste management program connections
- **Corporate Partnerships**: Business waste tracking, sustainability reporting
- **Educational Content**: Gamified learning modules about climate change

## 🤝 Contributing

Contributions are welcome! Areas where help is especially appreciated:

- **Thai Localization**: Native Thai language improvements and cultural context
- **Accessibility Testing**: Screen reader testing, keyboard navigation validation
- **Performance Optimization**: Bundle size reduction, loading speed improvements  
- **Data Science**: Enhanced carbon credit calculations, waste category expansion

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with proper TypeScript typing
4. Test accessibility compliance with screen readers
5. Submit a Pull Request with detailed description

## 📄 License

This project is open source and available under the MIT License.

## 🌍 Environmental Impact & Mission

This waste tracking application transforms abstract environmental concepts into concrete, actionable daily habits. By gamifying sustainable waste disposal choices, it makes environmental consciousness accessible and engaging for Thai users.

### Supporting Thailand's Climate Goals
- Directly aligned with Thailand's 2050 carbon neutrality commitment
- Uses official TGO emission factors for scientific accuracy
- Promotes circular economy principles through gamified rewards
- Builds environmental awareness through hands-on daily tracking

### Educational Philosophy
Every interaction is designed to:
- Build awareness about waste's environmental impact
- Inspire positive environmental choices through clear feedback
- Make sustainability engaging rather than overwhelming
- Connect individual actions to national climate goals

---

**Made with 💚 for Thailand's sustainable future**  
*Supporting the path to carbon neutrality by 2050, one waste entry at a time.*
