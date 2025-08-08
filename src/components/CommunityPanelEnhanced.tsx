'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Trophy, Target, Heart, MessageCircle, Share2, 
  TrendingUp, Globe, Award, Flame, ChevronRight, X 
} from 'lucide-react';

interface SharedAchievement {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLocation: string;
  achievementType: 'milestone' | 'streak' | 'tree' | 'recycling' | 'challenge';
  title: string;
  description: string;
  credits: number;
  visual: string;
  imageUrl?: string;
  hashtags: string[];
  likes: number;
  comments: Comment[];
  shares: number;
  timestamp: Date;
  isLiked?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

interface ChallengeInfo {
  id: string;
  title: string;
  description: string;
  goal: number;
  currentProgress: number;
  participants: number;
  endDate: Date;
  reward: number;
  icon: string;
}

export default function CommunityPanelEnhanced({ 
  totalCredits,
  onClose 
}: { 
  totalCredits: number;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'challenges'>('feed');
  const [sharedAchievements, setSharedAchievements] = useState<SharedAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<ChallengeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [communityStats, setCommunityStats] = useState({
    totalUsers: 48392,
    totalTrees: 1267,
    totalCredits: 633500,
    activeToday: 2847
  });

  useEffect(() => {
    // Simulate loading community data
    setTimeout(() => {
      loadCommunityData();
      setIsLoading(false);
    }, 1000);
  }, []);

  const loadCommunityData = () => {
    // Simulate shared achievements from the community
    const achievements: SharedAchievement[] = [
      {
        id: 'ach-1',
        userId: 'user-1',
        userName: 'Somchai P.',
        userAvatar: '👨',
        userLocation: 'Bangkok',
        achievementType: 'tree',
        title: 'Saved 5 Trees! 🌳',
        description: 'Just reached 2500 carbon credits! Every small action adds up to big environmental impact.',
        credits: 2500,
        visual: '🌳',
        hashtags: ['#5TreesSaved', '#CarbonNeutral2050', '#ThailandWasteDiary'],
        likes: 142,
        comments: [
          { id: 'c1', userId: 'u2', userName: 'Malee', text: 'Amazing! Keep it up! 💚', timestamp: new Date() },
          { id: 'c2', userId: 'u3', userName: 'Nong', text: 'Inspiring! Just started my journey', timestamp: new Date() }
        ],
        shares: 18,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isLiked: false
      },
      {
        id: 'ach-2',
        userId: 'user-2',
        userName: 'Siriporn K.',
        userAvatar: '👩',
        userLocation: 'Chiang Mai',
        achievementType: 'streak',
        title: '30 Day Streak! 🔥',
        description: 'One month of consistent waste tracking! Building sustainable habits one day at a time.',
        credits: 1850,
        visual: '🔥',
        hashtags: ['#30DayStreak', '#HabitBuilding', '#SustainableThailand'],
        likes: 98,
        comments: [
          { id: 'c3', userId: 'u4', userName: 'Preecha', text: 'Goals! I\'m on day 15', timestamp: new Date() }
        ],
        shares: 12,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isLiked: true
      },
      {
        id: 'ach-3',
        userId: 'user-3',
        userName: 'Green Team CMU',
        userAvatar: '🎓',
        userLocation: 'Chiang Mai University',
        achievementType: 'challenge',
        title: 'Campus Zero Waste Challenge Winner! 🏆',
        description: 'Our university team diverted 500kg of waste from landfills this month!',
        credits: 8500,
        visual: '🏆',
        hashtags: ['#CampusChallenge', '#ZeroWaste', '#CMU'],
        likes: 523,
        comments: [
          { id: 'c4', userId: 'u5', userName: 'Prof. Ananda', text: 'So proud of our students!', timestamp: new Date() },
          { id: 'c5', userId: 'u6', userName: 'Student Council', text: 'Leading by example! 👏', timestamp: new Date() },
          { id: 'c6', userId: 'u7', userName: 'Green Club', text: 'Next target: 1000kg!', timestamp: new Date() }
        ],
        shares: 67,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isLiked: true
      },
      {
        id: 'ach-4',
        userId: 'user-4',
        userName: 'Eco Restaurant BKK',
        userAvatar: '🍴',
        userLocation: 'Bangkok',
        achievementType: 'recycling',
        title: 'Composting Champion! 🌱',
        description: 'Composted 100kg of food waste this week, turning waste into nutrient-rich soil!',
        credits: 3200,
        visual: '🌱',
        hashtags: ['#Composting', '#RestaurantSustainability', '#CircularEconomy'],
        likes: 287,
        comments: [
          { id: 'c7', userId: 'u8', userName: 'Customer', text: 'This is why I love eating here!', timestamp: new Date() },
          { id: 'c8', userId: 'u9', userName: 'Local Farmer', text: 'Thank you for the compost supply!', timestamp: new Date() }
        ],
        shares: 34,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isLiked: false
      }
    ];

    // Simulate leaderboard data
    const leaderboardData = [
      { rank: 1, name: 'EcoWarrior_BKK', location: 'Bangkok', credits: 12847, level: 'Planet Protector', avatar: '👑', trend: 'up' },
      { rank: 2, name: 'GreenMama', location: 'Chiang Mai', credits: 11203, level: 'Climate Hero', avatar: '🥈', trend: 'up' },
      { rank: 3, name: 'RecycleKing', location: 'Phuket', credits: 10956, level: 'Climate Hero', avatar: '🥉', trend: 'down' },
      { rank: 4, name: 'ZeroWasteLife', location: 'Bangkok', credits: 9834, level: 'Climate Hero', avatar: '🌟', trend: 'up' },
      { rank: 5, name: 'PlasticFreeZone', location: 'Hat Yai', credits: 8765, level: 'Eco Champion', avatar: '♻️', trend: 'same' },
      { rank: 87, name: 'You', location: 'Your Location', credits: totalCredits, level: 'Your Level', avatar: '🙂', trend: 'up', isCurrentUser: true }
    ];

    // Simulate active challenges
    const challengesData: ChallengeInfo[] = [
      {
        id: 'ch-1',
        title: 'Plastic-Free November',
        description: 'Avoid single-use plastics for the entire month',
        goal: 30,
        currentProgress: 18,
        participants: 3847,
        endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        reward: 500,
        icon: '🚫'
      },
      {
        id: 'ch-2',
        title: 'Compost Champion',
        description: 'Compost at least 10kg of organic waste',
        goal: 10,
        currentProgress: 6.5,
        participants: 1293,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reward: 300,
        icon: '🌱'
      },
      {
        id: 'ch-3',
        title: 'Campus Zero Waste',
        description: 'Universities competing for highest waste diversion rate',
        goal: 1000,
        currentProgress: 623,
        participants: 15,
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        reward: 2000,
        icon: '🎓'
      },
      {
        id: 'ch-4',
        title: '7-Day Streak Starter',
        description: 'Track waste for 7 consecutive days',
        goal: 7,
        currentProgress: 3,
        participants: 892,
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        reward: 100,
        icon: '🔥'
      }
    ];

    setSharedAchievements(achievements);
    setLeaderboard(leaderboardData);
    setChallenges(challengesData);
  };

  const handleLike = (achievementId: string) => {
    setSharedAchievements(prev => prev.map(ach => {
      if (ach.id === achievementId) {
        return {
          ...ach,
          likes: ach.isLiked ? ach.likes - 1 : ach.likes + 1,
          isLiked: !ach.isLiked
        };
      }
      return ach;
    }));
  };

  const handleComment = (achievementId: string, comment: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      text: comment,
      timestamp: new Date()
    };

    setSharedAchievements(prev => prev.map(ach => {
      if (ach.id === achievementId) {
        return {
          ...ach,
          comments: [...ach.comments, newComment]
        };
      }
      return ach;
    }));
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Globe className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Thailand Waste Diary Community</h2>
                <p className="text-green-100">Together for Carbon Neutral 2050</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-2xl font-bold">{communityStats.totalUsers.toLocaleString()}</div>
              <div className="text-sm">Active Users</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-2xl font-bold">{communityStats.totalTrees.toLocaleString()}</div>
              <div className="text-sm">Trees Saved</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-2xl font-bold">{(communityStats.totalCredits / 1000).toFixed(0)}K</div>
              <div className="text-sm">Total Credits</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-2xl font-bold">{communityStats.activeToday.toLocaleString()}</div>
              <div className="text-sm">Active Today</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'feed' 
                ? 'border-b-2 border-green-500 text-green-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Community Feed
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'leaderboard' 
                ? 'border-b-2 border-green-500 text-green-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'challenges' 
                ? 'border-b-2 border-green-500 text-green-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Target className="w-5 h-5 inline mr-2" />
            Challenges
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading community data...</p>
            </div>
          ) : (
            <>
              {/* Community Feed */}
              {activeTab === 'feed' && (
                <div className="p-6 space-y-6">
                  {sharedAchievements.map((achievement) => (
                    <div key={achievement.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      {/* User Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">{achievement.userAvatar}</div>
                          <div>
                            <div className="font-semibold text-gray-900">{achievement.userName}</div>
                            <div className="text-sm text-gray-600">
                              {achievement.userLocation} • {formatTimeAgo(achievement.timestamp)}
                            </div>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Achievement Content */}
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <span className="text-3xl mr-3">{achievement.visual}</span>
                          <h3 className="text-xl font-bold text-gray-900">{achievement.title}</h3>
                        </div>
                        <p className="text-gray-700 mb-3">{achievement.description}</p>
                        <div className="flex items-center text-sm text-green-600 font-medium">
                          <Trophy className="w-4 h-4 mr-1" />
                          {achievement.credits} Carbon Credits Earned
                        </div>
                      </div>

                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {achievement.hashtags.map((tag, index) => (
                          <span key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Engagement */}
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLike(achievement.id)}
                            className={`flex items-center space-x-2 transition-colors ${
                              achievement.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${achievement.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{achievement.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{achievement.comments.length}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm">{achievement.shares}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments */}
                      {achievement.comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          {achievement.comments.slice(0, 2).map((comment) => (
                            <div key={comment.id} className="text-sm">
                              <span className="font-semibold">{comment.userName}:</span>{' '}
                              <span className="text-gray-700">{comment.text}</span>
                            </div>
                          ))}
                          {achievement.comments.length > 2 && (
                            <button className="text-sm text-blue-600 hover:underline">
                              View all {achievement.comments.length} comments
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Leaderboard */}
              {activeTab === 'leaderboard' && (
                <div className="p-6">
                  <div className="space-y-3">
                    {leaderboard.map((user) => (
                      <div
                        key={user.rank}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          user.isCurrentUser 
                            ? 'bg-green-50 border-2 border-green-500' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="text-2xl font-bold text-gray-600 w-12 text-center">
                            {user.rank <= 3 ? user.avatar : `#${user.rank}`}
                          </div>
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900">
                              {user.name} {user.isCurrentUser && '(You)'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {user.location} • {user.level}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-3">
                            <div className="font-bold text-lg text-gray-900">
                              {user.credits.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">credits</div>
                          </div>
                          {user.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                          {user.trend === 'down' && <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges */}
              {activeTab === 'challenges' && (
                <div className="p-6 space-y-4">
                  {challenges.map((challenge) => (
                    <div key={challenge.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start">
                          <div className="text-3xl mr-4">{challenge.icon}</div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{challenge.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">+{challenge.reward} Credits</div>
                          <div className="text-xs text-gray-500">Reward</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{((challenge.currentProgress / challenge.goal) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(challenge.currentProgress / challenge.goal) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Challenge Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          {challenge.participants.toLocaleString()} participants
                        </div>
                        <div className="text-gray-600">
                          Ends in {Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>

                      <button className="w-full mt-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                        Join Challenge
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}