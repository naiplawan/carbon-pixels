'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  Palette, 
  Volume2, 
  Zap, 
  Shield, 
  Database,
  Moon,
  Sun,
  Eye,
  Calculator,
  Smartphone,
  X
} from 'lucide-react';

interface UserPreferences {
  // Display
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'th';
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  highContrast: boolean;
  
  // Units & Measurements
  weightUnit: 'kg' | 'g' | 'lb';
  carbonUnit: 'credits' | 'co2' | 'trees';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  
  // Privacy & Data
  analytics: boolean;
  crashReports: boolean;
  dataRetention: '30days' | '90days' | '1year' | 'forever';
  autoBackup: boolean;
  
  // Performance
  animations: boolean;
  preloadImages: boolean;
  cacheData: boolean;
  reducedDataMode: boolean;
  
  // Gamification
  showLevel: boolean;
  showStreak: boolean;
  showAchievements: boolean;
  competitiveMode: boolean;
  
  // Quick Actions
  quickAddEnabled: boolean;
  defaultCategory: string;
  defaultDisposal: 'disposed' | 'recycled' | 'composted' | 'avoided';
  defaultWeight: number;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  fontSize: 'medium',
  reduceMotion: false,
  highContrast: false,
  weightUnit: 'kg',
  carbonUnit: 'credits',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  analytics: false,
  crashReports: false,
  dataRetention: '90days',
  autoBackup: true,
  animations: true,
  preloadImages: true,
  cacheData: true,
  reducedDataMode: false,
  showLevel: true,
  showStreak: true,
  showAchievements: true,
  competitiveMode: true,
  quickAddEnabled: true,
  defaultCategory: 'plastic_bags',
  defaultDisposal: 'recycled',
  defaultWeight: 0.1
};

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserPreferencesModal({ isOpen, onClose }: UserPreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [activeTab, setActiveTab] = useState<'display' | 'units' | 'privacy' | 'performance' | 'gamification' | 'quick'>('display');

  useEffect(() => {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      setPreferences(JSON.parse(stored));
    }
  }, []);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
    
    // Apply theme immediately
    if (key === 'theme') {
      applyTheme(value as 'light' | 'dark' | 'auto');
    }
    
    // Apply font size immediately
    if (key === 'fontSize') {
      applyFontSize(value as 'small' | 'medium' | 'large');
    }
    
    // Apply motion preference
    if (key === 'reduceMotion') {
      document.documentElement.style.setProperty('--animation-duration', value ? '0s' : '0.3s');
    }
    
    // Apply high contrast
    if (key === 'highContrast') {
      document.documentElement.classList.toggle('high-contrast', value as boolean);
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.fontSize = sizes[size];
  };

  const resetToDefaults = () => {
    if (confirm('Reset all preferences to defaults? This cannot be undone.')) {
      setPreferences(defaultPreferences);
      localStorage.setItem('userPreferences', JSON.stringify(defaultPreferences));
      applyTheme(defaultPreferences.theme);
      applyFontSize(defaultPreferences.fontSize);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            User Preferences
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'display', label: 'Display', icon: Eye },
            { id: 'units', label: 'Units', icon: Calculator },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'performance', label: 'Performance', icon: Zap },
            { id: 'gamification', label: 'Gamification', icon: Globe },
            { id: 'quick', label: 'Quick Actions', icon: Smartphone }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'auto'] as const).map(theme => (
                    <button
                      key={theme}
                      onClick={() => updatePreference('theme', theme)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        preferences.theme === theme
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {theme === 'light' && <Sun className="w-5 h-5 mx-auto mb-1" />}
                      {theme === 'dark' && <Moon className="w-5 h-5 mx-auto mb-1" />}
                      {theme === 'auto' && <Settings className="w-5 h-5 mx-auto mb-1" />}
                      <div className="text-xs capitalize">{theme}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreference('language', e.target.value as 'en' | 'th')}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="en">English</option>
                  <option value="th">ภาษาไทย (Thai)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => updatePreference('fontSize', size)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        preferences.fontSize === size
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className={`text-${size === 'small' ? 'xs' : size === 'medium' ? 'sm' : 'base'} capitalize`}>
                        {size}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reduce Motion</span>
                  <input
                    type="checkbox"
                    checked={preferences.reduceMotion}
                    onChange={(e) => updatePreference('reduceMotion', e.target.checked)}
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium">High Contrast</span>
                  <input
                    type="checkbox"
                    checked={preferences.highContrast}
                    onChange={(e) => updatePreference('highContrast', e.target.checked)}
                    className="toggle"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'units' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Weight Unit</label>
                <select
                  value={preferences.weightUnit}
                  onChange={(e) => updatePreference('weightUnit', e.target.value as any)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="lb">Pounds (lb)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Carbon Display</label>
                <select
                  value={preferences.carbonUnit}
                  onChange={(e) => updatePreference('carbonUnit', e.target.value as any)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="credits">Carbon Credits</option>
                  <option value="co2">CO₂ Equivalent (g)</option>
                  <option value="trees">Trees Saved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => updatePreference('dateFormat', e.target.value as any)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['12h', '24h'] as const).map(format => (
                    <button
                      key={format}
                      onClick={() => updatePreference('timeFormat', format)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        preferences.timeFormat === format
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {format === '12h' ? '12-hour (AM/PM)' : '24-hour'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Privacy First:</strong> All your data is stored locally on your device. 
                  We never collect or share your personal information.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Anonymous Analytics</div>
                    <div className="text-xs text-gray-500">Help improve the app</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => updatePreference('analytics', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Crash Reports</div>
                    <div className="text-xs text-gray-500">Send error reports</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.crashReports}
                    onChange={(e) => updatePreference('crashReports', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Auto Backup</div>
                    <div className="text-xs text-gray-500">Daily local backups</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.autoBackup}
                    onChange={(e) => updatePreference('autoBackup', e.target.checked)}
                    className="toggle"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Retention</label>
                <select
                  value={preferences.dataRetention}
                  onChange={(e) => updatePreference('dataRetention', e.target.value as any)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="30days">30 Days</option>
                  <option value="90days">90 Days</option>
                  <option value="1year">1 Year</option>
                  <option value="forever">Forever</option>
                </select>
              </div>

              <button
                onClick={() => {
                  if (confirm('Delete all your waste diary data? This cannot be undone!')) {
                    localStorage.removeItem('wasteEntries');
                    localStorage.removeItem('carbonCredits');
                    alert('All data has been deleted.');
                  }
                }}
                className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Database className="w-4 h-4 inline mr-2" />
                Delete All Data
              </button>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Animations</div>
                    <div className="text-xs text-gray-500">Smooth transitions</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.animations}
                    onChange={(e) => updatePreference('animations', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Preload Images</div>
                    <div className="text-xs text-gray-500">Faster loading</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.preloadImages}
                    onChange={(e) => updatePreference('preloadImages', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Cache Data</div>
                    <div className="text-xs text-gray-500">Offline access</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.cacheData}
                    onChange={(e) => updatePreference('cacheData', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Reduced Data Mode</div>
                    <div className="text-xs text-gray-500">Save bandwidth</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.reducedDataMode}
                    onChange={(e) => updatePreference('reducedDataMode', e.target.checked)}
                    className="toggle"
                  />
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <Volume2 className="w-4 h-4 inline mr-1" />
                  Performance settings help optimize the app for your device and network conditions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'gamification' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Show Level</div>
                    <div className="text-xs text-gray-500">Display eco level</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.showLevel}
                    onChange={(e) => updatePreference('showLevel', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Show Streak</div>
                    <div className="text-xs text-gray-500">Daily tracking streak</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.showStreak}
                    onChange={(e) => updatePreference('showStreak', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Show Achievements</div>
                    <div className="text-xs text-gray-500">Milestone badges</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.showAchievements}
                    onChange={(e) => updatePreference('showAchievements', e.target.checked)}
                    className="toggle"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Competitive Mode</div>
                    <div className="text-xs text-gray-500">Rankings & leaderboards</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.competitiveMode}
                    onChange={(e) => updatePreference('competitiveMode', e.target.checked)}
                    className="toggle"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="space-y-6">
              <label className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Quick Add</div>
                  <div className="text-xs text-gray-500">One-tap waste entry</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.quickAddEnabled}
                  onChange={(e) => updatePreference('quickAddEnabled', e.target.checked)}
                  className="toggle"
                />
              </label>

              {preferences.quickAddEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Category</label>
                    <select
                      value={preferences.defaultCategory}
                      onChange={(e) => updatePreference('defaultCategory', e.target.value)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="food_waste">Food Waste</option>
                      <option value="plastic_bottles">Plastic Bottles</option>
                      <option value="plastic_bags">Plastic Bags</option>
                      <option value="paper">Paper/Cardboard</option>
                      <option value="glass">Glass</option>
                      <option value="metal">Metal</option>
                      <option value="organic">Organic</option>
                      <option value="electronics">Electronics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Default Disposal</label>
                    <select
                      value={preferences.defaultDisposal}
                      onChange={(e) => updatePreference('defaultDisposal', e.target.value as any)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="disposed">Disposed (Landfill)</option>
                      <option value="recycled">Recycled</option>
                      <option value="composted">Composted</option>
                      <option value="avoided">Avoided</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Default Weight: {preferences.defaultWeight} kg
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={preferences.defaultWeight}
                      onChange={(e) => updatePreference('defaultWeight', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        .toggle {
          position: relative;
          width: 48px;
          height: 24px;
          appearance: none;
          background: #cbd5e0;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .toggle:checked {
          background: #10b981;
        }
        
        .toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        
        .toggle:checked::after {
          transform: translateX(24px);
        }
        
        .high-contrast {
          filter: contrast(1.2);
        }
        
        .high-contrast * {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      const prefs = JSON.parse(stored);
      setPreferences(prefs);
      
      // Apply preferences on load
      if (prefs.theme) {
        if (prefs.theme === 'auto') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', isDark);
        } else {
          document.documentElement.classList.toggle('dark', prefs.theme === 'dark');
        }
      }
      
      if (prefs.fontSize) {
        const sizes = {
          small: '14px',
          medium: '16px',
          large: '18px'
        };
        document.documentElement.style.fontSize = sizes[prefs.fontSize as keyof typeof sizes];
      }
      
      if (prefs.reduceMotion) {
        document.documentElement.style.setProperty('--animation-duration', '0s');
      }
      
      if (prefs.highContrast) {
        document.documentElement.classList.add('high-contrast');
      }
    }
  }, []);

  return preferences;
}