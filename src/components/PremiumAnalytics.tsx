'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Crown, 
  Lock, 
  Zap,
  Target,
  Award,
  FileText,
  Share2,
  Settings
} from 'lucide-react';
import { WasteEntry, UserStats } from '@/types/waste';

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tier: 'basic' | 'pro' | 'expert';
  available: boolean;
}

interface AnalyticsData {
  weeklyTrends: { week: string; credits: number; weight: number }[];
  categoryBreakdown: { category: string; percentage: number; credits: number }[];
  monthlyGoals: { month: string; target: number; achieved: number }[];
  environmentalImpact: {
    co2Saved: number;
    energyEquivalent: number;
    waterSaved: number;
    landfillDiverted: number;
  };
  predictions: {
    nextMonthCredits: number;
    yearEndTrees: number;
    sustainabilityScore: number;
  };
}

interface PremiumAnalyticsProps {
  userStats: UserStats;
  entries: WasteEntry[];
  isPremium?: boolean;
  tier?: 'free' | 'basic' | 'pro' | 'expert';
  onUpgrade?: () => void;
}

export function PremiumAnalytics({ 
  userStats, 
  entries, 
  isPremium = false, 
  tier = 'free',
  onUpgrade 
}: PremiumAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');

  // Generate analytics data
  useEffect(() => {
    const data = generateAnalyticsData(entries);
    setAnalyticsData(data);
  }, [entries]);

  const premiumFeatures: PremiumFeature[] = [
    {
      id: 'advanced-charts',
      name: 'Advanced Charts & Trends',
      description: 'Interactive charts with detailed weekly/monthly breakdowns',
      icon: <BarChart3 className="w-5 h-5" />,
      tier: 'basic',
      available: tier !== 'free'
    },
    {
      id: 'export-reports',
      name: 'Export Reports',
      description: 'Download PDF reports for personal tracking or sharing',
      icon: <Download className="w-5 h-5" />,
      tier: 'basic',
      available: tier !== 'free'
    },
    {
      id: 'goal-tracking',
      name: 'Personal Goal Tracking',
      description: 'Set custom goals and track progress with notifications',
      icon: <Target className="w-5 h-5" />,
      tier: 'basic',
      available: tier !== 'free'
    },
    {
      id: 'predictive-analytics',
      name: 'AI Predictions',
      description: 'Predict your environmental impact and suggest improvements',
      icon: <TrendingUp className="w-5 h-5" />,
      tier: 'pro',
      available: ['pro', 'expert'].includes(tier)
    },
    {
      id: 'carbon-certificates',
      name: 'Carbon Impact Certificates',
      description: 'Official certificates for your environmental achievements',
      icon: <Award className="w-5 h-5" />,
      tier: 'pro',
      available: ['pro', 'expert'].includes(tier)
    },
    {
      id: 'business-insights',
      name: 'Business Integration',
      description: 'Corporate reporting and team challenges',
      icon: <FileText className="w-5 h-5" />,
      tier: 'expert',
      available: tier === 'expert'
    }
  ];

  const PricingTier = ({ 
    name, 
    price, 
    features, 
    recommended = false, 
    current = false 
  }: {
    name: string;
    price: string;
    features: string[];
    recommended?: boolean;
    current?: boolean;
  }) => (
    <div className={`border-2 rounded-lg p-6 relative ${
      recommended ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
    } ${current ? 'ring-2 ring-blue-400' : ''}`}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          MOST POPULAR
        </div>
      )}
      {current && (
        <div className="absolute -top-3 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          CURRENT PLAN
        </div>
      )}
      
      <div className="text-center mb-4">
        <h3 className="font-handwritten text-xl mb-2">{name}</h3>
        <div className="text-3xl font-bold text-green-600 mb-1">{price}</div>
        <div className="text-sm text-gray-600">per month</div>
      </div>
      
      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center text-sm">
            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            {feature}
          </li>
        ))}
      </ul>
      
      <button
        onClick={onUpgrade}
        className={`w-full py-3 px-4 rounded-lg font-handwritten text-lg transition-colors ${
          current 
            ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
            : recommended
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        disabled={current}
      >
        {current ? 'Current Plan' : 'Upgrade Now'}
      </button>
    </div>
  );

  if (!analyticsData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Upgrade Banner for Free Users */}
      {tier === 'free' && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8">
            <Crown className="w-24 h-24 opacity-20" />
          </div>
          <div className="relative z-10">
            <h3 className="font-handwritten text-2xl mb-2 flex items-center">
              <Crown className="w-6 h-6 mr-2 text-yellow-300" />
              Unlock Premium Analytics
            </h3>
            <p className="text-purple-100 mb-4">
              Get detailed insights, export reports, and track your environmental impact like never before!
            </p>
            <button 
              onClick={onUpgrade}
              className="bg-white text-purple-600 hover:bg-purple-50 font-handwritten px-6 py-2 rounded-lg transition-colors"
            >
              Start Free Trial - 7 Days
            </button>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Range Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-handwritten text-lg">Analytics Dashboard</h3>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['week', 'month', 'year'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                      selectedTimeframe === timeframe
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>

            {/* Charts Area */}
            {tier === 'free' ? (
              <div className="relative">
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-600 font-handwritten">
                      Premium Feature
                    </div>
                    <div className="text-sm text-gray-500">
                      Advanced charts available with Basic plan
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/80 rounded-lg"></div>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                {/* Simplified chart visualization */}
                <div className="flex items-end justify-between h-full">
                  {analyticsData.weeklyTrends.slice(-7).map((week, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div 
                        className="bg-green-400 w-6 rounded-t"
                        style={{ height: `${(week.credits / 200) * 100}px` }}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2 transform -rotate-45">
                        W{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-handwritten text-lg mb-4">Waste Category Insights</h4>
            
            {tier === 'free' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm">Detailed category analysis</span>
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Crown className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm">Upgrade for detailed breakdowns</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData.categoryBreakdown.slice(0, 5).map((category, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">{category.category}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="text-sm text-gray-600 mr-2">{category.percentage}%</div>
                      <div className="text-sm font-bold text-green-600">
                        +{category.credits} CC
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Environmental Impact */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-handwritten text-lg mb-4">Environmental Impact</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl mb-1">🌱</div>
                <div className="font-bold text-green-600">
                  {tier === 'free' ? '••••' : `${analyticsData.environmentalImpact.co2Saved}kg`}
                </div>
                <div className="text-xs text-gray-600">CO₂ Saved</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-1">⚡</div>
                <div className="font-bold text-blue-600">
                  {tier === 'free' ? '••••' : `${analyticsData.environmentalImpact.energyEquivalent}kWh`}
                </div>
                <div className="text-xs text-gray-600">Energy Saved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Premium Features List */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-handwritten text-lg mb-4 flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-500" />
              Premium Features
            </h4>
            
            <div className="space-y-3">
              {premiumFeatures.map((feature) => (
                <div key={feature.id} className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`mr-3 ${feature.available ? 'text-green-500' : 'text-gray-400'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${feature.available ? 'text-gray-800' : 'text-gray-500'}`}>
                        {feature.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                  {!feature.available && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* AI Predictions (Pro+) */}
          {['pro', 'expert'].includes(tier) && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-handwritten text-lg mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-500" />
                AI Predictions
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Next Month Credits</span>
                  <span className="font-bold text-purple-600">
                    +{analyticsData.predictions.nextMonthCredits}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Year-End Trees</span>
                  <span className="font-bold text-green-600">
                    {analyticsData.predictions.yearEndTrees} 🌳
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Sustainability Score</span>
                  <span className="font-bold text-blue-600">
                    {analyticsData.predictions.sustainabilityScore}/100
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-handwritten text-lg mb-4">Quick Actions</h4>
            
            <div className="space-y-2">
              <button 
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  tier === 'free' 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-green-50 hover:bg-green-100 text-green-700'
                }`}
                disabled={tier === 'free'}
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export Monthly Report
                {tier === 'free' && <Lock className="w-4 h-4 inline float-right" />}
              </button>
              
              <button 
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  ['pro', 'expert'].includes(tier)
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!['pro', 'expert'].includes(tier)}
              >
                <Award className="w-4 h-4 inline mr-2" />
                Generate Certificate
                {!['pro', 'expert'].includes(tier) && <Lock className="w-4 h-4 inline float-right" />}
              </button>
              
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
                <Share2 className="w-4 h-4 inline mr-2" />
                Share Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers (shown for free users or in settings) */}
      {tier === 'free' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-handwritten text-2xl text-center mb-6">
            Choose Your Plan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingTier
              name="Basic"
              price="฿99"
              features={[
                'Advanced charts & trends',
                'Export PDF reports',
                'Personal goal tracking',
                'Email notifications',
                'Priority support'
              ]}
            />
            
            <PricingTier
              name="Pro"
              price="฿199"
              features={[
                'Everything in Basic',
                'AI predictions & insights',
                'Carbon certificates',
                'Custom challenges',
                'Advanced analytics',
                'Team collaboration'
              ]}
              recommended={true}
            />
            
            <PricingTier
              name="Expert"
              price="฿299"
              features={[
                'Everything in Pro',
                'Business integration',
                'White-label options',
                'API access',
                'Custom reporting',
                'Dedicated support'
              ]}
            />
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 mb-4">
              All plans include 7-day free trial • Cancel anytime • Thai Baht pricing
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <span>✓ 30-day money-back guarantee</span>
              <span>✓ Secure payment processing</span>
              <span>✓ Support Thai environmental goals</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to generate mock analytics data
function generateAnalyticsData(entries: WasteEntry[]): AnalyticsData {
  // This would be replaced with real analytics calculations
  return {
    weeklyTrends: Array.from({ length: 12 }, (_, i) => ({
      week: `W${i + 1}`,
      credits: Math.floor(Math.random() * 300) + 50,
      weight: Math.floor(Math.random() * 10) + 2
    })),
    categoryBreakdown: [
      { category: 'Plastic Bottles', percentage: 35, credits: 450 },
      { category: 'Food Waste', percentage: 28, credits: 380 },
      { category: 'Paper', percentage: 20, credits: 250 },
      { category: 'Glass', percentage: 12, credits: 180 },
      { category: 'Metal', percentage: 5, credits: 90 }
    ],
    monthlyGoals: Array.from({ length: 6 }, (_, i) => ({
      month: `Month ${i + 1}`,
      target: 1000,
      achieved: Math.floor(Math.random() * 1200) + 800
    })),
    environmentalImpact: {
      co2Saved: 47.8,
      energyEquivalent: 120,
      waterSaved: 890,
      landfillDiverted: 23.4
    },
    predictions: {
      nextMonthCredits: 850,
      yearEndTrees: 8.7,
      sustainabilityScore: 87
    }
  };
}