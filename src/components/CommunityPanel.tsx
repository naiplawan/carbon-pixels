'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, Target, Zap, Crown, Medal, ChevronRight } from 'lucide-react';
import { UserStats, WasteEntry } from '@/types/waste';

interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  credits: number;
  level: string;
  recentAction: string;
  timeAgo: string;
  location: string;
}

interface Community {
  totalUsers: number;
  totalTrees: number;
  totalCredits: number;
  weeklyGoal: number;
  weeklyProgress: number;
  recentActivity: CommunityUser[];
  leaderboard: CommunityUser[];
}

interface CommunityPanelProps {
  userStats: UserStats;
  compact?: boolean;
  showLeaderboard?: boolean;
}

export function CommunityPanel({ 
  userStats, 
  compact = false, 
  showLeaderboard = true 
}: CommunityPanelProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'leaderboard' | 'challenges'>('activity');

  // Simulate community data (would come from real backend)
  useEffect(() => {
    const simulatedCommunity: Community = {
      totalUsers: 47832,
      totalTrees: 1247,
      totalCredits: 623500,
      weeklyGoal: 100000,
      weeklyProgress: 73500,
      recentActivity: generateRecentActivity(),
      leaderboard: generateLeaderboard()
    };
    
    setCommunity(simulatedCommunity);
  }, []);

  const generateRecentActivity = (): CommunityUser[] => {
    const actions = [
      'Recycled plastic bottles',
      'Composted food waste',
      'Avoided plastic bags',
      'Reused glass containers',
      'Properly disposed electronics',
      'Started using refillable bottle',
      'Joined zero-waste challenge'
    ];

    const locations = ['Bangkok', 'Chiang Mai', 'Phuket', 'Khon Kaen', 'Hat Yai', 'Nakhon Ratchasima'];
    const names = ['Siriporn', 'Niran', 'Ploy', 'Kamon', 'Malee', 'Somchai', 'Preecha'];
    const levels = ['Eco Beginner 🌱', 'Green Warrior 💚', 'Eco Champion 🌍'];

    return Array.from({ length: 8 }, (_, i) => ({
      id: `user-${i}`,
      name: names[Math.floor(Math.random() * names.length)],
      avatar: `👤`, // Would be real avatars
      credits: Math.floor(Math.random() * 1000) + 50,
      level: levels[Math.floor(Math.random() * levels.length)],
      recentAction: actions[Math.floor(Math.random() * actions.length)],
      timeAgo: `${Math.floor(Math.random() * 60) + 1}m ago`,
      location: locations[Math.floor(Math.random() * locations.length)]
    }));
  };

  const generateLeaderboard = (): CommunityUser[] => {
    const topUsers = [
      { name: 'EcoWarrior_BKK', credits: 12847, level: 'Planet Protector 🛡️', location: 'Bangkok' },
      { name: 'GreenMama', credits: 11203, level: 'Climate Hero 🦸', location: 'Chiang Mai' },
      { name: 'RecycleKing', credits: 10956, level: 'Climate Hero 🦸', location: 'Phuket' },
      { name: 'ZeroWasteLife', credits: 9834, level: 'Climate Hero 🦸', location: 'Bangkok' },
      { name: 'PlasticFreeZone', credits: 8765, level: 'Eco Champion 🌍', location: 'Hat Yai' }
    ];

    return topUsers.map((user, i) => ({
      id: `leader-${i}`,
      name: user.name,
      avatar: i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤',
      credits: user.credits,
      level: user.level,
      recentAction: 'Leading Thailand\'s sustainability movement',
      timeAgo: 'Active now',
      location: user.location
    }));
  };

  // Calculate user's ranking (simulated)
  const getUserRanking = () => {
    if (!community) return { position: 0, percentage: 0 };
    
    const position = Math.floor((1 - userStats.rankingPercentile! / 100) * community.totalUsers) || 1;
    return {
      position,
      percentage: userStats.rankingPercentile || 0
    };
  };

  const ranking = getUserRanking();

  if (!community) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-handwritten text-lg text-blue-700 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Thailand Impact 🇹🇭
          </h3>
          <span className="text-sm text-blue-600">#{ranking.position}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="font-bold text-blue-600">{community.totalTrees.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Trees Saved</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="font-bold text-green-600">{ranking.percentage.toFixed(0)}%</div>
            <div className="text-xs text-gray-600">Top Percentile</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-t-lg border-b border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-handwritten text-xl text-blue-700 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Thailand Community Impact 🇹🇭
          </h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">Your Ranking</div>
            <div className="font-bold text-lg text-blue-600">#{ranking.position}</div>
          </div>
        </div>
        
        <div className="text-sm text-blue-600">
          You're ahead of {ranking.percentage.toFixed(0)}% of Thai eco-warriors!
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="font-bold text-lg text-gray-800">{community.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🌳</div>
            <div className="font-bold text-lg text-green-600">{community.totalTrees.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Trees Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="font-bold text-lg text-blue-600">{Math.round(community.totalCredits / 1000)}K</div>
            <div className="text-xs text-gray-600">Credits Earned</div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-handwritten text-lg text-gray-700 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-500" />
            Weekly Thailand Goal
          </h4>
          <span className="text-sm text-green-600">
            {Math.round((community.weeklyProgress / community.weeklyGoal) * 100)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(community.weeklyProgress / community.weeklyGoal) * 100}%` }}
          ></div>
        </div>
        
        <div className="text-sm text-gray-600 text-center">
          {community.weeklyProgress.toLocaleString()} / {community.weeklyGoal.toLocaleString()} credits
          <span className="block text-xs mt-1 text-green-600">
            {community.weeklyGoal - community.weeklyProgress > 0 
              ? `${(community.weeklyGoal - community.weeklyProgress).toLocaleString()} credits to go!`
              : '🎉 Goal achieved! Amazing work Thailand!'
            }
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['activity', 'leaderboard', 'challenges'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'activity' && <Zap className="w-4 h-4 inline mr-1" />}
              {tab === 'leaderboard' && <Trophy className="w-4 h-4 inline mr-1" />}
              {tab === 'challenges' && <Medal className="w-4 h-4 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'activity' && (
          <div className="space-y-3">
            <h4 className="font-handwritten text-lg text-gray-700 mb-3">
              Recent Eco Actions 🌱
            </h4>
            {community.recentActivity.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{user.avatar}</div>
                  <div>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-600">{user.recentAction}</div>
                    <div className="text-xs text-blue-600">{user.location} • {user.timeAgo}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-green-600">+{user.credits} CC</div>
                  <div className="text-xs text-gray-500">{user.level.split(' ')[0]}</div>
                </div>
              </div>
            ))}
            
            <div className="text-center pt-2">
              <button className="text-blue-600 text-sm hover:text-blue-700 flex items-center justify-center mx-auto">
                View More Activity
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && showLeaderboard && (
          <div className="space-y-3">
            <h4 className="font-handwritten text-lg text-gray-700 mb-3">
              Top Eco Warriors 🏆
            </h4>
            {community.leaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-8 text-center mr-3">
                    {index === 0 ? <Crown className="w-5 h-5 text-yellow-500 mx-auto" /> : `#${index + 1}`}
                  </div>
                  <div className="text-2xl mr-3">{user.avatar}</div>
                  <div>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-600">{user.level}</div>
                    <div className="text-xs text-blue-600">{user.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-green-600">{user.credits.toLocaleString()} CC</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(user.credits / 500)} trees
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="text-center">
                <div className="font-handwritten text-sm text-blue-700 mb-1">
                  Your Progress to Top 10:
                </div>
                <div className="text-xs text-blue-600">
                  Need {Math.max(0, community.leaderboard[4]?.credits - userStats.totalCredits).toLocaleString()} more credits
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-3">
            <h4 className="font-handwritten text-lg text-gray-700 mb-3">
              Community Challenges 🎯
            </h4>
            
            {/* Weekly Challenge */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-purple-700">Plastic-Free Week Challenge</h5>
                <span className="text-sm text-purple-600">5 days left</span>
              </div>
              <p className="text-sm text-purple-600 mb-3">
                Avoid single-use plastics and earn bonus credits!
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-bold">12,847</span> participants
                </div>
                <div className="text-sm text-purple-700">
                  <span className="font-bold">+50 CC</span> bonus per avoided plastic
                </div>
              </div>
            </div>

            {/* Monthly Challenge */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-green-700">Zero Food Waste Month</h5>
                <span className="text-sm text-green-600">18 days left</span>
              </div>
              <p className="text-sm text-green-600 mb-3">
                Compost all food scraps and help Thailand reduce organic waste!
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-bold">3,421</span> participants
                </div>
                <div className="text-sm text-green-700">
                  <span className="font-bold">+25 CC</span> per composting action
                </div>
              </div>
            </div>

            {/* Achievement Challenge */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-yellow-700">Tree Saver Achievement</h5>
                <span className="text-sm text-yellow-600">Lifetime Goal</span>
              </div>
              <p className="text-sm text-yellow-600 mb-3">
                Save your first tree equivalent (500 credits) and join the Tree Saver club!
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  Progress: <span className="font-bold">{userStats.totalCredits}/500 CC</span>
                </div>
                <div className="text-sm text-yellow-700">
                  <span className="font-bold">🌳</span> Special badge + certificate
                </div>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (userStats.totalCredits / 500) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-b-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Together, we're building a sustainable Thailand! 🇹🇭
          </p>
          <button className="bg-green-500 hover:bg-green-600 text-white text-sm font-handwritten px-4 py-2 rounded-lg transition-colors">
            Invite Friends to Join
          </button>
        </div>
      </div>
    </div>
  );
}