# Thailand Waste Diary 🗂️🇹🇭

A gamified daily waste tracking application designed specifically for Thailand, similar to a food diary but for garbage! Users scan waste items with AI recognition, earn carbon credits for sustainable disposal choices, and see their environmental impact visualized as trees saved. Built with official TGO emission factors and designed to support Thailand's 2050 carbon neutrality goal through engaging waste management gamification.

## ✨ Waste Diary Features

### 📱 **AI-Powered Waste Scanning**
- **Smart Recognition**: Point camera at waste items for instant AI identification
- **8 Thai Waste Categories**: Food waste, plastic bottles/bags, paper, glass, metal, organic, e-waste
- **Manual Entry Option**: Select categories manually if camera isn't available
- **Local Context**: Includes Thai-specific items like coconut shells, traditional packaging

### 💚 **Carbon Credit System**
- **Reward Good Choices**: Earn credits for recycling, composting, avoiding waste
- **Penalize Bad Choices**: Lose credits for landfill disposal, single-use plastics
- **TGO Official Data**: All emission factors from Thailand Greenhouse Gas Management Organization
- **Negative Emissions**: Special rewards for plastic avoidance (-67 credits for avoided HDPE bags!)

### 🎮 **Gamification Elements**
- **5-Level System**: From Eco Beginner 🌱 to Planet Protector 🌍
- **Tree Comparisons**: 500 credits = 1 tree planted equivalent 🌳
- **Daily Challenges**: Scan 5 items, recycle something, avoid plastic
- **Achievements System**: First scan, daily tracker, recycling hero, tree saver
- **Streak Tracking**: Build momentum with consecutive tracking days

### 📊 **Dashboard & Analytics**
- **Daily Overview**: Today's waste, credits earned, tree equivalent
- **Monthly Trends**: Calendar view showing waste patterns
- **Impact Visualization**: CO₂ saved, energy equivalent, Thailand ranking
- **Progress Tracking**: Level advancement, achievement unlocking

### 🇹🇭 **Thailand-Specific Context**
- **Local Waste Categories**: Thai food waste, traditional packaging, local materials
- **Cultural Integration**: Thai/English labels, Buddhist context for minimalism
- **Market Integration**: Tips for Thai markets, local recycling programs
- **Climate Goal Connection**: Links to Thailand's 2050 carbon neutrality target

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (preferred) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
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

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript type checking
```

## 📱 Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom notebook theme
- **API**: Next.js API Routes
- **Canvas**: HTML5 Canvas with custom drawing functions
- **Fonts**: Patrick Hand (handwritten) and Kalam (sketch)
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## 🎨 Design Philosophy

The application follows a "hand-drawn notebook" aesthetic to make the carbon footprint calculation feel personal and engaging rather than clinical. Key design elements include:

- Paper-like background with subtle textures
- Hand-drawn style animations and illustrations
- Handwritten fonts for a personal touch
- Sketched UI elements with drop shadows
- Progressive visual storytelling through the canvas

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

## ♿ Accessibility Features

- Skip to main content link
- Semantic HTML structure with proper headings
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Reduced motion preferences
- Mobile-first responsive design

## 🔧 API Endpoints

- `GET /api/questions` - Fetch all questions and scoring data
- `POST /api/calculate` - Calculate carbon footprint from answers

## 🎨 Customization

The application uses CSS custom properties and Tailwind utilities for easy theming:

```css
:root {
  --paper: 48 20% 97%;
  --ink: 222.2 47% 11%;
  --pencil: 217.2 32.6% 17.5%;
}
```

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🌍 Environmental Impact

This calculator aims to educate users about their carbon footprint and provide actionable steps toward more sustainable living. Every interaction is designed to build awareness and inspire positive environmental choices.
