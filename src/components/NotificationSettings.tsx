'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationPreferences } from './NotificationSystem';

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onPreferencesChange: (preferences: Partial<NotificationPreferences>) => void;
  onRequestPermission: () => Promise<boolean>;
  onTestNotification: () => Promise<void>;
  permissionStatus: 'default' | 'granted' | 'denied';
  className?: string;
}

export default function NotificationSettings({
  preferences,
  onPreferencesChange,
  onRequestPermission,
  onTestNotification,
  permissionStatus,
  className = ''
}: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [testSoundPlaying, setTestSoundPlaying] = useState<string | null>(null);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    onPreferencesChange({ [key]: value });
  }, [onPreferencesChange]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await onRequestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  const playTestSound = useCallback(async (soundName: string) => {
    if (testSoundPlaying) return;
    
    setTestSoundPlaying(soundName);
    try {
      const audio = new Audio();
      const soundMap = {
        'achievement': '/sounds/achievement.mp3',
        'success': '/sounds/success.mp3',
        'gentle-chime': '/sounds/gentle-chime.mp3',
        'level-up': '/sounds/level-up.mp3',
        'streak': '/sounds/streak.mp3'
      };
      
      const soundPath = soundMap[soundName as keyof typeof soundMap];
      if (soundPath) {
        audio.src = soundPath;
        audio.volume = 0.6;
        await audio.play();
        audio.onended = () => setTestSoundPlaying(null);
      }
    } catch (error) {
      console.log('Could not play test sound:', error);
      setTestSoundPlaying(null);
    }
  }, [testSoundPlaying]);

  // Permission status indicator
  const PermissionBanner = () => {
    if (permissionStatus === 'denied') {
      return (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🚫</div>
            <div>
              <h3 className="font-handwritten text-red-800 text-lg">Notifications Blocked</h3>
              <p className="font-sketch text-red-700 text-sm">
                Notifications are currently blocked. Please update your browser settings to enable them.
              </p>
            </div>
          </div>
          
          <details className="mt-3">
            <summary className="font-sketch text-red-800 cursor-pointer hover:text-red-900">
              Show browser-specific instructions →
            </summary>
            <div className="mt-2 text-xs text-red-600 space-y-1 font-sketch">
              <div><strong>Chrome/Edge:</strong> Click the 🔒 icon in your address bar → Site Settings → Notifications → Allow</div>
              <div><strong>Firefox:</strong> Click the 🛡️ icon → Permissions → Allow Notifications</div>
              <div><strong>Safari:</strong> Safari menu → Preferences → Websites → Notifications → Allow</div>
              <div><strong>Mobile:</strong> Check your browser settings under Site Permissions or Notifications</div>
            </div>
          </details>
        </div>
      );
    }

    if (permissionStatus === 'granted') {
      return (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-handwritten text-green-800 text-lg">Notifications Enabled</h3>
                <p className="font-sketch text-green-700 text-sm">
                  Great! We&apos;ll help you stay motivated with your environmental goals.
                </p>
              </div>
            </div>
            <button
              onClick={onTestNotification}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-sketch text-sm"
            >
              Test 🧪
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔔</div>
            <div>
              <h3 className="font-handwritten text-blue-800 text-lg">Enable Notifications</h3>
              <p className="font-sketch text-blue-700 text-sm">
                Get helpful reminders and celebrate your achievements!
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-sketch"
          >
            {isLoading ? 'Setting up...' : 'Enable'}
          </button>
        </div>
      </div>
    );
  };

  // Toggle switch component
  const ToggleSwitch = ({ checked, onChange, disabled = false }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-leaf"></div>
    </label>
  );

  // Time input component
  const TimeInput = ({ value, onChange, disabled = false }: {
    value: string;
    onChange: (time: string) => void;
    disabled?: boolean;
  }) => (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-leaf focus:border-green-leaf disabled:opacity-50 disabled:cursor-not-allowed font-sketch"
    />
  );

  // Select component
  const Select = ({ value, onChange, options, disabled = false }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    disabled?: boolean;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-leaf focus:border-green-leaf disabled:opacity-50 disabled:cursor-not-allowed font-sketch bg-white"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  // Section component
  const Section = ({ id, title, icon, children, defaultExpanded = false }: {
    id: string;
    title: string;
    icon: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.includes(id);
    
    return (
      <div className="border-2 border-gray-200 rounded-lg mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <span className="font-handwritten text-lg text-gray-800">{title}</span>
          </div>
          <span className="text-gray-500 font-sketch text-sm">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        
        {isExpanded && (
          <div className="border-t-2 border-gray-100 p-4 bg-gray-50/50">
            {children}
          </div>
        )}
      </div>
    );
  };

  const isDisabled = permissionStatus !== 'granted';

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔔</span>
        <div>
          <h2 className="text-2xl font-handwritten text-gray-800">Notification Preferences</h2>
          <p className="text-sm font-sketch text-gray-600">Customize how and when you receive reminders</p>
        </div>
      </div>

      <PermissionBanner />

      {/* Basic Notifications */}
      <Section id="basic" title="Daily Reminders" icon="⏰" defaultExpanded>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Daily Reminders</div>
              <div className="text-sm text-gray-600 font-sketch">Get reminded to track your waste</div>
            </div>
            <ToggleSwitch
              checked={preferences.dailyReminders}
              onChange={(checked) => updatePreference('dailyReminders', checked)}
              disabled={isDisabled}
            />
          </div>

          {preferences.dailyReminders && (
            <div className="ml-4 space-y-4 border-l-2 border-gray-200 pl-4">
              <div>
                <label className="text-sm font-sketch font-medium text-gray-700 mb-2 block">
                  How often would you like reminders?
                </label>
                <Select
                  value={preferences.reminderFrequency}
                  onChange={(value) => updatePreference('reminderFrequency', value as any)}
                  disabled={isDisabled}
                  options={[
                    { value: 'once', label: 'Once per day (morning)' },
                    { value: 'twice', label: 'Twice per day (morning & evening)' },
                    { value: 'custom', label: 'Custom times' }
                  ]}
                />
              </div>

              {preferences.reminderFrequency !== 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-sketch font-medium text-gray-700 mb-1 block">
                      Morning reminder
                    </label>
                    <TimeInput
                      value={preferences.morningTime}
                      onChange={(time) => updatePreference('morningTime', time)}
                      disabled={isDisabled}
                    />
                  </div>
                  
                  {preferences.reminderFrequency === 'twice' && (
                    <div>
                      <label className="text-sm font-sketch font-medium text-gray-700 mb-1 block">
                        Evening reminder
                      </label>
                      <TimeInput
                        value={preferences.eveningTime}
                        onChange={(time) => updatePreference('eveningTime', time)}
                        disabled={isDisabled}
                      />
                    </div>
                  )}
                </div>
              )}

              {preferences.reminderFrequency === 'custom' && (
                <div>
                  <label className="text-sm font-sketch font-medium text-gray-700 mb-2 block">
                    Custom reminder times
                  </label>
                  <div className="text-xs text-gray-500 font-sketch mb-2">
                    Add up to 4 custom reminder times throughout the day
                  </div>
                  {/* Custom times implementation would go here - simplified for this demo */}
                  <div className="text-sm text-gray-400 font-sketch italic">
                    Custom times feature coming soon!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Achievement Notifications */}
      <Section id="achievements" title="Achievements & Milestones" icon="🏆">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Achievement Notifications</div>
              <div className="text-sm text-gray-600 font-sketch">Celebrate your environmental wins</div>
            </div>
            <ToggleSwitch
              checked={preferences.achievementNotifications}
              onChange={(checked) => updatePreference('achievementNotifications', checked)}
              disabled={isDisabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Milestone Alerts</div>
              <div className="text-sm text-gray-600 font-sketch">Trees saved, credit milestones</div>
            </div>
            <ToggleSwitch
              checked={preferences.milestoneAlerts}
              onChange={(checked) => updatePreference('milestoneAlerts', checked)}
              disabled={isDisabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Streak Reminders</div>
              <div className="text-sm text-gray-600 font-sketch">Keep your tracking streak alive</div>
            </div>
            <ToggleSwitch
              checked={preferences.streakReminders}
              onChange={(checked) => updatePreference('streakReminders', checked)}
              disabled={isDisabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Level Up Notifications</div>
              <div className="text-sm text-gray-600 font-sketch">When you advance to new eco levels</div>
            </div>
            <ToggleSwitch
              checked={preferences.levelUpNotifications}
              onChange={(checked) => updatePreference('levelUpNotifications', checked)}
              disabled={isDisabled}
            />
          </div>
        </div>
      </Section>

      {/* Weekly Reports */}
      <Section id="reports" title="Weekly Reports" icon="📊">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Weekly Impact Reports</div>
              <div className="text-sm text-gray-600 font-sketch">Summary of your environmental impact</div>
            </div>
            <ToggleSwitch
              checked={preferences.weeklyReports}
              onChange={(checked) => updatePreference('weeklyReports', checked)}
              disabled={isDisabled}
            />
          </div>

          {preferences.weeklyReports && (
            <div className="ml-4 space-y-4 border-l-2 border-gray-200 pl-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-sketch font-medium text-gray-700 mb-1 block">
                    Report day
                  </label>
                  <Select
                    value={preferences.weeklyReportDay}
                    onChange={(value) => updatePreference('weeklyReportDay', value)}
                    disabled={isDisabled}
                    options={[
                      { value: 'sunday', label: 'Sunday' },
                      { value: 'monday', label: 'Monday' },
                      { value: 'tuesday', label: 'Tuesday' },
                      { value: 'wednesday', label: 'Wednesday' },
                      { value: 'thursday', label: 'Thursday' },
                      { value: 'friday', label: 'Friday' },
                      { value: 'saturday', label: 'Saturday' }
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-sketch font-medium text-gray-700 mb-1 block">
                    Report time
                  </label>
                  <TimeInput
                    value={preferences.weeklyReportTime}
                    onChange={(time) => updatePreference('weeklyReportTime', time)}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Sound Settings */}
      <Section id="sounds" title="Sound Effects" icon="🔊">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Enable Sounds</div>
              <div className="text-sm text-gray-600 font-sketch">Audio feedback for actions and notifications</div>
            </div>
            <ToggleSwitch
              checked={preferences.soundEnabled}
              onChange={(checked) => updatePreference('soundEnabled', checked)}
            />
          </div>

          {preferences.soundEnabled && (
            <div className="ml-4 space-y-4 border-l-2 border-gray-200 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-sketch font-medium text-gray-800">Achievement Sounds</div>
                  <div className="text-sm text-gray-600 font-sketch">Play sounds for achievements and milestones</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playTestSound('achievement')}
                    disabled={testSoundPlaying === 'achievement'}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 font-sketch"
                  >
                    {testSoundPlaying === 'achievement' ? '🔊' : '▶️'}
                  </button>
                  <ToggleSwitch
                    checked={preferences.achievementSounds}
                    onChange={(checked) => updatePreference('achievementSounds', checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-sketch font-medium text-gray-800">Reminder Sounds</div>
                  <div className="text-sm text-gray-600 font-sketch">Gentle chimes for daily reminders</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playTestSound('gentle-chime')}
                    disabled={testSoundPlaying === 'gentle-chime'}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 font-sketch"
                  >
                    {testSoundPlaying === 'gentle-chime' ? '🔊' : '▶️'}
                  </button>
                  <ToggleSwitch
                    checked={preferences.reminderSounds}
                    onChange={(checked) => updatePreference('reminderSounds', checked)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Do Not Disturb */}
      <Section id="dnd" title="Do Not Disturb" icon="🌙">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Quiet Hours</div>
              <div className="text-sm text-gray-600 font-sketch">Disable notifications during specified times</div>
            </div>
            <ToggleSwitch
              checked={preferences.quietHoursEnabled}
              onChange={(checked) => updatePreference('quietHoursEnabled', checked)}
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="ml-4 space-y-4 border-l-2 border-gray-200 pl-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-sketch font-medium text-gray-700 mb-1 block">
                    Quiet hours start
                  </label>
                  <TimeInput
                    value={preferences.quietHoursStart}
                    onChange={(time) => updatePreference('quietHoursStart', time)}
                  />
                </div>
                <div>
                  <label className="text-sm font-sketch font-medium text-gray-700 mb-1 block">
                    Quiet hours end
                  </label>
                  <TimeInput
                    value={preferences.quietHoursEnd}
                    onChange={(time) => updatePreference('quietHoursEnd', time)}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-500 font-sketch">
                {preferences.quietHoursStart > preferences.quietHoursEnd 
                  ? `Quiet hours: ${preferences.quietHoursStart} - ${preferences.quietHoursEnd} (overnight)`
                  : `Quiet hours: ${preferences.quietHoursStart} - ${preferences.quietHoursEnd}`
                }
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Advanced Settings */}
      <Section id="advanced" title="Advanced Settings" icon="⚙️">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-sketch font-medium text-gray-700 mb-2 block">
              Maximum notifications per day
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="20"
                value={preferences.maxNotificationsPerDay}
                onChange={(e) => updatePreference('maxNotificationsPerDay', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-sketch text-sm font-medium min-w-[2rem] text-center">
                {preferences.maxNotificationsPerDay}
              </span>
            </div>
            <div className="text-xs text-gray-500 font-sketch mt-1">
              Prevents notification fatigue by limiting daily notifications
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Challenge Notifications</div>
              <div className="text-sm text-gray-600 font-sketch">Daily environmental challenges</div>
            </div>
            <ToggleSwitch
              checked={preferences.challengeNotifications}
              onChange={(checked) => updatePreference('challengeNotifications', checked)}
              disabled={isDisabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-sketch font-medium text-gray-800">Challenge Reminders</div>
              <div className="text-sm text-gray-600 font-sketch">Reminders to complete daily challenges</div>
            </div>
            <ToggleSwitch
              checked={preferences.challengeReminders}
              onChange={(checked) => updatePreference('challengeReminders', checked)}
              disabled={isDisabled}
            />
          </div>
        </div>
      </Section>

      {/* Reset Settings */}
      <div className="mt-6 pt-4 border-t-2 border-gray-100">
        <button
          onClick={() => {
            const defaultPrefs: NotificationPreferences = {
              dailyReminders: true,
              morningTime: '09:00',
              eveningTime: '19:00',
              customTimes: [],
              achievementNotifications: true,
              milestoneAlerts: true,
              streakReminders: true,
              levelUpNotifications: true,
              weeklyReports: true,
              weeklyReportDay: 'sunday',
              weeklyReportTime: '10:00',
              challengeNotifications: true,
              challengeReminders: true,
              soundEnabled: true,
              achievementSounds: true,
              reminderSounds: false,
              quietHoursEnabled: false,
              quietHoursStart: '22:00',
              quietHoursEnd: '08:00',
              reminderFrequency: 'twice',
              maxNotificationsPerDay: 5
            };
            onPreferencesChange(defaultPrefs);
          }}
          className="text-sm font-sketch text-gray-500 hover:text-gray-700 underline"
        >
          Reset to default settings
        </button>
      </div>
    </div>
  );
}