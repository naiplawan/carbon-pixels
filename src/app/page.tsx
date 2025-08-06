import Link from 'next/link'

export default function Home() {
  return (
    <main className="notebook-page p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-handwritten text-ink mb-4 sketch-element">
            Thailand Waste Diary 🗂️🇹🇭
          </h1>
          <p className="text-xl text-pencil font-sketch max-w-2xl mx-auto leading-relaxed">
            Track your daily waste like a food diary! Scan garbage, earn carbon credits, 
            and gamify your journey to help Thailand reach carbon neutrality by 2050. 
            See how many trees you&apos;ve saved! 🌳
          </p>
        </header>

        <div className="text-center mb-8">
          <div className="inline-block p-6 border-2 border-dashed border-pencil rounded-lg bg-white/50">
            <p className="text-lg text-pencil mb-4">Ready to start tracking? 📱</p>
            <Link 
              href="/diary"
              className="inline-block px-8 py-4 bg-green-leaf text-white text-xl font-sketch rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-200 sketch-element"
            >
              📷 Start Waste Diary
            </Link>
          </div>
          
          <div className="mt-4">
            <Link 
              href="/calculator"
              className="text-pencil font-sketch hover:text-ink transition-colors underline"
            >
              Or try the Carbon Footprint Calculator →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">📱</div>
            <h3 className="text-xl font-sketch text-ink mb-2">Scan & Track</h3>
            <p className="text-pencil text-sm">AI-powered waste recognition</p>
            <p className="text-pencil text-xs mt-1">Just point your camera and scan!</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">💚</div>
            <h3 className="text-xl font-sketch text-ink mb-2">Carbon Credits</h3>
            <p className="text-pencil text-sm">Earn points for good choices</p>
            <p className="text-pencil text-xs mt-1">Recycling, composting, avoiding waste</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🌳</div>
            <h3 className="text-xl font-sketch text-ink mb-2">Tree Comparison</h3>
            <p className="text-pencil text-sm">See your impact in trees saved!</p>
            <p className="text-pencil text-xs mt-1">500 credits = 1 tree equivalent</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🎮</div>
            <h3 className="text-xl font-sketch text-ink mb-2">Gamification</h3>
            <p className="text-pencil text-sm">Levels, achievements, daily goals</p>
            <p className="text-pencil text-xs mt-1">From Eco Beginner to Planet Protector</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🗂️</div>
            <h3 className="text-xl font-sketch text-ink mb-2">Daily Diary</h3>
            <p className="text-pencil text-sm">Track like a food diary</p>
            <p className="text-pencil text-xs mt-1">Calendar view, history, statistics</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
            <div className="text-4xl mb-2">🇹🇭</div>
            <h3 className="text-xl font-sketch text-green-800 mb-2">Thailand Focus</h3>
            <p className="text-green-700 text-sm font-semibold">TGO certified data</p>
            <p className="text-green-600 text-xs mt-1">Supporting 2050 carbon neutrality</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg border-2 border-dashed border-green-200">
          <h2 className="text-3xl font-handwritten text-center text-green-800 mb-8">How It Works 🚀</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl mb-3">📷</div>
              <div className="font-sketch text-green-800 mb-2">1. Scan</div>
              <p className="text-sm text-green-700">Point camera at waste item or select manually</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🤖</div>
              <div className="font-sketch text-green-800 mb-2">2. AI Identifies</div>
              <p className="text-sm text-green-700">AI recognizes waste type and suggests disposal</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">💚</div>
              <div className="font-sketch text-green-800 mb-2">3. Earn Credits</div>
              <p className="text-sm text-green-700">Get carbon credits based on your disposal choice</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🌳</div>
              <div className="font-sketch text-green-800 mb-2">4. Save Trees</div>
              <p className="text-sm text-green-700">Watch your environmental impact grow!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}