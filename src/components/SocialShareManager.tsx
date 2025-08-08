'use client';

import { useState, useEffect, useCallback } from 'react';
import { Share2, Twitter, Facebook, Instagram, Copy, Download, Camera, Sparkles } from 'lucide-react';

interface ShareableAchievement {
  id: string;
  type: 'milestone' | 'streak' | 'tree' | 'category' | 'impact';
  title: string;
  description: string;
  stats: {
    totalCredits: number;
    treesEquivalent: number;
    co2Saved: number; // in kg
    streakDays?: number;
    topCategory?: string;
    wasteTracked: number; // in kg
  };
  visual: {
    backgroundColor: string;
    accentColor: string;
    emoji: string;
    pattern: 'trees' | 'leaves' | 'waves' | 'geometric';
  };
  hashtags: string[];
  createdAt: Date;
}

interface SocialTemplate {
  id: string;
  name: string;
  description: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'whatsapp' | 'generic';
  template: string;
  maxLength?: number;
  includeImage: boolean;
}

const SOCIAL_TEMPLATES: SocialTemplate[] = [
  {
    id: 'twitter-milestone',
    name: 'Twitter Milestone',
    description: 'Perfect for sharing credit milestones',
    platform: 'twitter',
    template: '🌱 Just reached {credits} carbon credits on Thailand Waste Diary! I\'ve saved {trees} tree{treePlural} equivalent and {co2}kg of CO₂! 🌍✨ Join me in tracking waste for Thailand\'s 2050 carbon neutral goal! {hashtags}',
    maxLength: 280,
    includeImage: true
  },
  {
    id: 'facebook-story',
    name: 'Facebook Story',
    description: 'Share your environmental journey',
    platform: 'facebook',
    template: '🌍 Environmental Update! 🌱\n\nI\'ve been tracking my waste with Thailand Waste Diary and the results are amazing:\n📊 {credits} carbon credits earned\n🌳 {trees} tree{treePlural} equivalent saved\n♻️ {waste}kg of waste tracked responsibly\n\nEvery small action counts toward Thailand\'s 2050 carbon neutrality goal! Who wants to join me in this journey? {hashtags}',
    includeImage: true
  },
  {
    id: 'instagram-achievement',
    name: 'Instagram Post',
    description: 'Visual achievement sharing',
    platform: 'instagram',
    template: '🌱✨ GREEN MILESTONE UNLOCKED! ✨🌱\n\n{description}\n\n📈 My Impact:\n🔹 {credits} carbon credits\n🔹 {trees} tree{treePlural} saved\n🔹 {co2}kg CO₂ reduced\n🔹 {waste}kg waste tracked\n\n🇹🇭 Supporting Thailand\'s 2050 carbon neutral vision, one waste entry at a time!\n\n{hashtags}',
    includeImage: true
  },
  {
    id: 'whatsapp-share',
    name: 'WhatsApp Message',
    description: 'Share with friends and family',
    platform: 'whatsapp',
    template: '🌱 Hey! Check out my environmental progress!\n\nI\'ve been using Thailand Waste Diary and just hit {credits} carbon credits! 🎉\n\n🌳 Trees saved: {trees}\n♻️ CO₂ reduced: {co2}kg\n📊 Waste tracked: {waste}kg\n\nWant to join me in helping Thailand reach carbon neutrality by 2050? It\'s actually pretty fun tracking waste! 😄',
    includeImage: false
  }
];

const DEFAULT_HASHTAGS = [
  '#ThailandWasteDiary',
  '#CarbonNeutral2050',
  '#SustainableThailand',
  '#EcoFriendly',
  '#ClimateAction',
  '#WasteTracking',
  '#GreenLiving',
  '#EnvironmentalImpact'
];

export default function SocialShareManager({ 
  totalCredits, 
  wasteEntries,
  onClose 
}: { 
  totalCredits: number; 
  wasteEntries: any[];
  onClose: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<SocialTemplate>(SOCIAL_TEMPLATES[0]);
  const [customMessage, setCustomMessage] = useState('');
  const [shareableAchievement, setShareableAchievement] = useState<ShareableAchievement | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Calculate user stats
  const userStats = {
    totalCredits,
    treesEquivalent: Math.floor(totalCredits / 500),
    co2Saved: Math.round(totalCredits * 0.001 * 100) / 100,
    wasteTracked: Math.round(wasteEntries.reduce((sum, entry) => sum + entry.weight, 0) * 10) / 10,
    topCategory: getMostTrackedCategory(wasteEntries),
    streakDays: calculateStreak(wasteEntries)
  };

  // Generate shareable achievement based on current stats
  useEffect(() => {
    const achievement = generateAchievement(userStats);
    setShareableAchievement(achievement);
  }, [totalCredits]);

  // Generate custom message when template or achievement changes
  useEffect(() => {
    if (shareableAchievement && selectedTemplate) {
      const message = generateMessage(selectedTemplate, shareableAchievement);
      setCustomMessage(message);
    }
  }, [selectedTemplate, shareableAchievement]);

  function getMostTrackedCategory(entries: any[]): string {
    if (entries.length === 0) return 'Mixed waste';
    
    const counts: { [key: string]: number } = {};
    entries.forEach(entry => {
      counts[entry.categoryName] = (counts[entry.categoryName] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  function calculateStreak(entries: any[]): number {
    if (entries.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasEntry = entries.some(entry => 
        new Date(entry.timestamp).toDateString() === dateString
      );
      
      if (hasEntry) {
        streak++;
      } else if (i === 0) {
        continue; // Skip today if no entries yet
      } else {
        break;
      }
    }
    
    return streak;
  }

  function generateAchievement(stats: typeof userStats): ShareableAchievement {
    let achievement: ShareableAchievement;

    // Determine achievement type based on milestones
    if (stats.treesEquivalent > 0) {
      achievement = {
        id: `tree-${stats.treesEquivalent}-${Date.now()}`,
        type: 'tree',
        title: `${stats.treesEquivalent} Tree${stats.treesEquivalent > 1 ? 's' : ''} Saved!`,
        description: `Amazing! I've saved ${stats.treesEquivalent} tree equivalent${stats.treesEquivalent > 1 ? 's' : ''} through responsible waste tracking!`,
        stats,
        visual: {
          backgroundColor: '#10b981',
          accentColor: '#34d399',
          emoji: '🌳',
          pattern: 'trees'
        },
        hashtags: DEFAULT_HASHTAGS.slice(0, 6),
        createdAt: new Date()
      };
    } else if (stats.totalCredits >= 100) {
      achievement = {
        id: `milestone-${stats.totalCredits}-${Date.now()}`,
        type: 'milestone',
        title: `${stats.totalCredits} Carbon Credits Earned!`,
        description: `Reached ${stats.totalCredits} carbon credits milestone! Every waste entry counts toward a sustainable future!`,
        stats,
        visual: {
          backgroundColor: '#3b82f6',
          accentColor: '#60a5fa',
          emoji: '🎉',
          pattern: 'geometric'
        },
        hashtags: DEFAULT_HASHTAGS.slice(0, 5),
        createdAt: new Date()
      };
    } else if (stats.streakDays >= 3) {
      achievement = {
        id: `streak-${stats.streakDays}-${Date.now()}`,
        type: 'streak',
        title: `${stats.streakDays} Day Tracking Streak!`,
        description: `${stats.streakDays} days of consistent waste tracking! Building sustainable habits one day at a time!`,
        stats,
        visual: {
          backgroundColor: '#f59e0b',
          accentColor: '#fbbf24',
          emoji: '🔥',
          pattern: 'waves'
        },
        hashtags: DEFAULT_HASHTAGS.slice(0, 4),
        createdAt: new Date()
      };
    } else {
      achievement = {
        id: `impact-${Date.now()}`,
        type: 'impact',
        title: 'Making Environmental Impact!',
        description: `Started my environmental journey with Thailand Waste Diary! Every small action counts!`,
        stats,
        visual: {
          backgroundColor: '#8b5cf6',
          accentColor: '#a78bfa',
          emoji: '🌱',
          pattern: 'leaves'
        },
        hashtags: DEFAULT_HASHTAGS.slice(0, 4),
        createdAt: new Date()
      };
    }

    return achievement;
  }

  function generateMessage(template: SocialTemplate, achievement: ShareableAchievement): string {
    const { stats } = achievement;
    
    let message = template.template
      .replace(/\{credits\}/g, stats.totalCredits.toString())
      .replace(/\{trees\}/g, stats.treesEquivalent.toString())
      .replace(/\{treePlural\}/g, stats.treesEquivalent === 1 ? '' : 's')
      .replace(/\{co2\}/g, stats.co2Saved.toString())
      .replace(/\{waste\}/g, stats.wasteTracked.toString())
      .replace(/\{streak\}/g, (stats.streakDays || 0).toString())
      .replace(/\{category\}/g, stats.topCategory || 'Mixed waste')
      .replace(/\{description\}/g, achievement.description)
      .replace(/\{hashtags\}/g, achievement.hashtags.join(' '));

    // Trim to platform limits
    if (template.maxLength && message.length > template.maxLength) {
      const hashtagsText = achievement.hashtags.join(' ');
      const maxContentLength = template.maxLength - hashtagsText.length - 5; // buffer
      message = message.substring(0, maxContentLength) + '... ' + hashtagsText;
    }

    return message;
  }

  const generateShareImage = useCallback(async (): Promise<string> => {
    if (!shareableAchievement) return '';

    setIsGeneratingImage(true);

    try {
      // Create a canvas for the share image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size (Instagram post size)
      canvas.width = 1080;
      canvas.height = 1080;

      const { visual, stats, title, description } = shareableAchievement;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, visual.backgroundColor);
      gradient.addColorStop(1, visual.accentColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pattern overlay
      ctx.globalAlpha = 0.1;
      drawPattern(ctx, visual.pattern, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      // Draw main content
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';

      // Main emoji
      ctx.font = '120px Arial';
      ctx.fillText(visual.emoji, canvas.width / 2, 200);

      // Title
      ctx.font = 'bold 64px Arial';
      ctx.fillText(title, canvas.width / 2, 320);

      // Stats
      ctx.font = '48px Arial';
      const statsY = 450;
      const statSpacing = 140;
      
      ctx.fillText(`${stats.totalCredits} Credits`, canvas.width / 2, statsY);
      if (stats.treesEquivalent > 0) {
        ctx.fillText(`${stats.treesEquivalent} Tree${stats.treesEquivalent > 1 ? 's' : ''} Saved`, canvas.width / 2, statsY + statSpacing);
      }
      ctx.fillText(`${stats.co2Saved}kg CO₂ Reduced`, canvas.width / 2, statsY + statSpacing * 2);

      // Bottom branding
      ctx.font = '36px Arial';
      ctx.fillText('Thailand Waste Diary', canvas.width / 2, canvas.height - 120);
      ctx.font = '28px Arial';
      ctx.fillText('🇹🇭 Supporting Carbon Neutral 2050', canvas.width / 2, canvas.height - 60);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;

    } catch (error) {
      console.error('Error generating share image:', error);
      return '';
    } finally {
      setIsGeneratingImage(false);
    }
  }, [shareableAchievement]);

  function drawPattern(ctx: CanvasRenderingContext2D, pattern: string, width: number, height: number) {
    switch (pattern) {
      case 'trees':
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          ctx.font = '60px Arial';
          ctx.fillText('🌳', x, y);
        }
        break;
      case 'leaves':
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          ctx.font = '40px Arial';
          ctx.fillText('🍃', x, y);
        }
        break;
      case 'waves':
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          const y = (height / 8) * i;
          ctx.moveTo(0, y);
          for (let x = 0; x < width; x += 20) {
            ctx.lineTo(x, y + Math.sin(x * 0.01) * 20);
          }
          ctx.stroke();
        }
        break;
      case 'geometric':
        for (let i = 0; i < 30; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = 20 + Math.random() * 40;
          ctx.fillRect(x, y, size, size);
        }
        break;
    }
  }

  const handleShare = async (platform: string) => {
    if (!shareableAchievement) return;

    let shareUrl = '';
    const text = encodeURIComponent(customMessage);
    const url = encodeURIComponent(window.location.origin);

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(customMessage);
          // Show success message
          const button = document.querySelector(`[data-platform="${platform}"]`);
          if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to copy to clipboard:', error);
        }
        return;
      case 'download':
        if (!generatedImageUrl) {
          const imageUrl = await generateShareImage();
          setGeneratedImageUrl(imageUrl);
          if (imageUrl) {
            const link = document.createElement('a');
            link.download = `thailand-waste-diary-${shareableAchievement.id}.png`;
            link.href = imageUrl;
            link.click();
          }
        } else {
          const link = document.createElement('a');
          link.download = `thailand-waste-diary-${shareableAchievement.id}.png`;
          link.href = generatedImageUrl;
          link.click();
        }
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleGenerateImage = async () => {
    const imageUrl = await generateShareImage();
    setGeneratedImageUrl(imageUrl);
  };

  if (!shareableAchievement) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Share2 className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Share Your Impact!</h2>
              <p className="text-sm text-gray-600">Inspire others with your environmental journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Achievement Preview */}
        <div className="p-6 border-b">
          <div 
            className="rounded-lg p-6 text-white text-center"
            style={{ 
              background: `linear-gradient(135deg, ${shareableAchievement.visual.backgroundColor}, ${shareableAchievement.visual.accentColor})` 
            }}
          >
            <div className="text-4xl mb-4">{shareableAchievement.visual.emoji}</div>
            <h3 className="text-2xl font-bold mb-2">{shareableAchievement.title}</h3>
            <p className="text-lg opacity-90 mb-4">{shareableAchievement.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-xl font-bold">{shareableAchievement.stats.totalCredits}</div>
                <div>Credits</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-xl font-bold">{shareableAchievement.stats.treesEquivalent}</div>
                <div>Trees</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-xl font-bold">{shareableAchievement.stats.co2Saved}kg</div>
                <div>CO₂ Saved</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-xl font-bold">{shareableAchievement.stats.wasteTracked}kg</div>
                <div>Tracked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div className="p-6 border-b">
          <h4 className="text-lg font-semibold mb-4">Choose Platform</h4>
          <div className="grid grid-cols-2 gap-3">
            {SOCIAL_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedTemplate.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                {template.maxLength && (
                  <div className="text-xs text-blue-600 mt-1">Max {template.maxLength} chars</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Message Customization */}
        <div className="p-6 border-b">
          <h4 className="text-lg font-semibold mb-4">Customize Message</h4>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Customize your message..."
          />
          <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
            <span>Click to edit the generated message</span>
            {selectedTemplate.maxLength && (
              <span className={customMessage.length > selectedTemplate.maxLength ? 'text-red-600' : ''}>
                {customMessage.length}/{selectedTemplate.maxLength}
              </span>
            )}
          </div>
        </div>

        {/* Image Generation */}
        {selectedTemplate.includeImage && (
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Share Image</h4>
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isGeneratingImage ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
            
            {generatedImageUrl && (
              <div className="text-center">
                <img 
                  src={generatedImageUrl} 
                  alt="Generated share image" 
                  className="max-w-full h-64 mx-auto rounded-lg shadow-lg object-cover"
                />
                <p className="text-sm text-gray-600 mt-2">Perfect for Instagram, Facebook, and Twitter!</p>
              </div>
            )}
          </div>
        )}

        {/* Share Buttons */}
        <div className="p-6">
          <h4 className="text-lg font-semibold mb-4">Share Now</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center justify-center px-4 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </button>
            
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </button>
            
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              💬
              WhatsApp
            </button>
            
            <button
              onClick={() => handleShare('copy')}
              data-platform="copy"
              className="flex items-center justify-center px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
          </div>
          
          {selectedTemplate.includeImage && (
            <button
              onClick={() => handleShare('download')}
              className="w-full mt-3 flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="p-6 bg-gray-50 rounded-b-lg">
          <div className="flex items-start">
            <Sparkles className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-gray-900 mb-1">Pro Tips:</div>
              <ul className="text-gray-600 space-y-1">
                <li>• Share regularly to inspire others and build accountability</li>
                <li>• Tag friends to invite them to join your environmental journey</li>
                <li>• Post during peak hours (7-9 AM, 7-9 PM) for better engagement</li>
                <li>• Use local hashtags like #SustainableThailand for community reach</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}