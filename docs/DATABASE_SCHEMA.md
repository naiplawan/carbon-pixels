# Carbon-Pixels Database Schema Design

## Overview

This document defines the complete database schema for the carbon-pixels Thailand waste diary application. The schema is designed for PostgreSQL with Supabase Row Level Security (RLS) and optimized for performance at scale.

## Database Configuration

**Primary Database:** PostgreSQL 15+
**Extensions Required:**
- `uuid-ossp` - UUID generation
- `pg_stat_statements` - Query performance monitoring  
- `pg_trgm` - Full-text search optimization
- `timescaledb` - Time-series optimization (optional for analytics)

**Connection Settings:**
- Max connections: 100 per service
- Statement timeout: 30 seconds
- Idle transaction timeout: 10 minutes

## 1. Authentication & User Management

### Profiles Table (extends Supabase auth.users)

```sql
-- User profiles extending Supabase auth
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(15) UNIQUE,
  email VARCHAR(255),
  province VARCHAR(50),
  district VARCHAR(50),
  sub_district VARCHAR(50),
  postal_code VARCHAR(10),
  avatar_url TEXT,
  bio TEXT,
  privacy_level INTEGER DEFAULT 2 CHECK (privacy_level IN (1, 2, 3)),
  -- 1=public, 2=friends_only, 3=private
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX profiles_username_idx ON profiles (username) WHERE username IS NOT NULL;
CREATE INDEX profiles_phone_idx ON profiles (phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX profiles_province_idx ON profiles (province);
CREATE INDEX profiles_active_idx ON profiles (is_active, last_active_at) WHERE is_active = true;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles visible to all" ON profiles
  FOR SELECT USING (privacy_level = 1 AND is_active = true);

CREATE POLICY "Friends can view friends-only profiles" ON profiles
  FOR SELECT USING (
    privacy_level = 2 AND is_active = true AND
    auth.uid() IN (
      SELECT CASE 
        WHEN requester_id = auth.uid() THEN addressee_id
        WHEN addressee_id = auth.uid() THEN requester_id
      END FROM friendships 
      WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
      AND status = 'accepted'
    )
  );
```

### User Preferences

```sql
CREATE TABLE user_preferences (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  language VARCHAR(10) DEFAULT 'th-TH',
  timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h',
  measurement_unit VARCHAR(10) DEFAULT 'metric', -- metric or imperial
  currency VARCHAR(5) DEFAULT 'THB',
  
  -- App preferences
  daily_goal INTEGER DEFAULT 100 CHECK (daily_goal > 0),
  weekly_goal INTEGER DEFAULT 700 CHECK (weekly_goal > 0), 
  theme VARCHAR(20) DEFAULT 'notebook',
  auto_sync BOOLEAN DEFAULT true,
  offline_mode BOOLEAN DEFAULT false,
  
  -- Notification preferences
  notification_settings JSONB DEFAULT '{
    "daily_reminder": true,
    "achievements": true,
    "level_ups": true,
    "challenges": true,
    "friends": true,
    "community": false,
    "marketing": false
  }'::jsonb,
  
  -- Privacy preferences
  share_stats BOOLEAN DEFAULT true,
  visible_in_leaderboard BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### Device Management

```sql
CREATE TABLE user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_id VARCHAR(100) NOT NULL,
  device_name VARCHAR(100),
  platform VARCHAR(20) NOT NULL, -- web, ios, android
  app_version VARCHAR(20),
  os_version VARCHAR(50),
  browser VARCHAR(50),
  fcm_token TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX user_devices_user_active_idx ON user_devices (user_id, is_active);
CREATE INDEX user_devices_fcm_idx ON user_devices (fcm_token) WHERE fcm_token IS NOT NULL;

-- RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own devices" ON user_devices
  FOR ALL USING (auth.uid() = user_id);
```

## 2. Waste Tracking System

### Waste Categories (Static Reference Data)

```sql
CREATE TABLE waste_categories (
  id VARCHAR(50) PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_th VARCHAR(100) NOT NULL,
  name_local JSONB, -- For other regional languages
  description_en TEXT,
  description_th TEXT,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex color code
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- TGO emission factors
  carbon_impact JSONB NOT NULL,
  -- Example: {"landfill": 2.53, "compost": 0.33, "recycle": 0.40}
  
  -- Gamification credits per disposal method
  carbon_credits JSONB NOT NULL,
  -- Example: {"disposed": -25, "composted": 22, "recycled": 15}
  
  examples JSONB, -- Array of examples
  tips JSONB,     -- Array of sustainability tips
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Thai waste categories
INSERT INTO waste_categories (id, name_en, name_th, icon, color, carbon_impact, carbon_credits, examples, tips) VALUES
('food_waste', 'Food Waste', 'เศษอาหาร', '🍎', '#dc2626', 
 '{"landfill": 2.53, "compost": 0.3326, "animal_feed": 0, "biogas": -0.5}',
 '{"disposed": -25, "composted": 22, "animal_feed": 25, "reduced": 30}',
 '["rice leftovers", "fruit peels", "vegetables", "meat scraps", "bread"]',
 '["Compost at home to earn carbon credits!", "Donate edible food to reduce waste"]'),

('plastic_bottles', 'Plastic Bottles', 'ขวดพลาสติก', '🍾', '#3b82f6',
 '{"landfill": 1.0388, "recycled": 0.4044, "reused": 0.1, "avoided": -1.91}',
 '{"disposed": -19, "recycled": 15, "reused": 18, "avoided": 25}',
 '["water bottles", "soft drink bottles", "milk bottles", "shampoo bottles"]',
 '["Bring reusable water bottle to earn credits!", "Recycle at 7-Eleven collection points"]');

-- Add other categories...

CREATE INDEX waste_categories_active_idx ON waste_categories (is_active, sort_order);
```

### Waste Entries (Partitioned by Month)

```sql
-- Main waste entries table (partitioned for performance)
CREATE TABLE waste_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id VARCHAR(50) REFERENCES waste_categories(id) NOT NULL,
  category_name VARCHAR(100) NOT NULL, -- Denormalized for performance
  category_icon VARCHAR(10) NOT NULL,  -- Denormalized for performance
  
  disposal_method VARCHAR(50) NOT NULL,
  weight_kg DECIMAL(8,3) NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 1000),
  carbon_credits INTEGER NOT NULL,
  co2_impact_kg DECIMAL(10,6), -- Calculated CO2 impact
  
  -- Optional location data
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  location_province VARCHAR(50),
  
  -- Image and metadata
  image_url TEXT,
  image_id VARCHAR(100),
  notes TEXT,
  tags TEXT[], -- Array of user-defined tags
  
  -- Tracking metadata
  source VARCHAR(20) DEFAULT 'manual', -- manual, ai_scan, bulk_import
  confidence DECIMAL(3,2), -- AI confidence score (0.00-1.00)
  device_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- Sync management
  offline_id VARCHAR(100), -- For offline sync deduplication
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Temporal columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
  
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for current year and next year
CREATE TABLE waste_entries_y2024m01 PARTITION OF waste_entries
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE waste_entries_y2024m02 PARTITION OF waste_entries
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- ... continue for all months

-- Critical indexes for performance
CREATE INDEX waste_entries_user_date_idx ON waste_entries (user_id, created_at DESC);
CREATE INDEX waste_entries_user_credits_idx ON waste_entries (user_id) INCLUDE (carbon_credits);
CREATE INDEX waste_entries_category_idx ON waste_entries (category_id, created_at DESC);
CREATE INDEX waste_entries_location_idx ON waste_entries (location_province, created_at DESC);
CREATE INDEX waste_entries_sync_idx ON waste_entries (user_id, synced_at) WHERE synced_at IS NOT NULL;
CREATE INDEX waste_entries_offline_idx ON waste_entries (offline_id) WHERE offline_id IS NOT NULL;

-- Partial indexes for common queries
CREATE INDEX waste_entries_today_idx ON waste_entries (user_id, carbon_credits) 
  WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL;

CREATE INDEX waste_entries_this_week_idx ON waste_entries (user_id) 
  WHERE created_at >= DATE_TRUNC('week', NOW()) AND deleted_at IS NULL;

-- RLS Policies
ALTER TABLE waste_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own waste entries" ON waste_entries
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically create future partitions
CREATE OR REPLACE FUNCTION create_waste_entries_partition()
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for next 3 months
    FOR i IN 0..2 LOOP
        start_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month' * (i + 1);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'waste_entries_y' || EXTRACT(YEAR FROM start_date) || 'm' || LPAD(EXTRACT(MONTH FROM start_date)::TEXT, 2, '0');
        
        EXECUTE 'CREATE TABLE IF NOT EXISTS ' || partition_name || 
                ' PARTITION OF waste_entries FOR VALUES FROM (''' || start_date || ''') TO (''' || end_date || ''')';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule partition creation monthly
SELECT cron.schedule('create-partitions', '0 0 1 * *', 'SELECT create_waste_entries_partition();');
```

### Waste Entry Images

```sql
CREATE TABLE waste_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  waste_entry_id UUID REFERENCES waste_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- File information
  original_filename VARCHAR(255),
  file_size INTEGER, -- bytes
  mime_type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  
  -- Storage URLs
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  compressed_url TEXT,
  
  -- AI processing results
  ai_processed BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),
  ai_detected_category VARCHAR(50),
  ai_suggestions JSONB, -- Array of category suggestions with confidence
  
  -- Metadata
  exif_data JSONB, -- EXIF metadata from image
  processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX waste_images_entry_idx ON waste_images (waste_entry_id);
CREATE INDEX waste_images_user_idx ON waste_images (user_id, created_at DESC);
CREATE INDEX waste_images_ai_idx ON waste_images (ai_processed, processing_status);

-- RLS
ALTER TABLE waste_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own images" ON waste_images
  FOR ALL USING (auth.uid() = user_id);
```

## 3. Gamification System

### User Gamification Progress

```sql
CREATE TABLE user_gamification (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Core metrics
  total_credits INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 10),
  credits_to_next_level INTEGER DEFAULT 100,
  level_progress DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
  
  -- Streaks and consistency
  daily_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  weekly_consistency INTEGER DEFAULT 0, -- Days active this week
  monthly_consistency INTEGER DEFAULT 0, -- Days active this month
  
  -- Environmental impact
  total_waste_kg DECIMAL(12,3) DEFAULT 0,
  total_co2_saved_kg DECIMAL(12,6) DEFAULT 0,
  trees_saved INTEGER DEFAULT 0, -- Calculated: total_credits / 500
  
  -- Activity stats
  total_entries INTEGER DEFAULT 0,
  entries_this_week INTEGER DEFAULT 0,
  entries_this_month INTEGER DEFAULT 0,
  
  -- Achievement counts
  achievements_unlocked INTEGER DEFAULT 0,
  rare_achievements INTEGER DEFAULT 0,
  
  -- Social metrics
  friends_count INTEGER DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  
  -- Rankings (updated periodically)
  rank_global INTEGER,
  rank_province INTEGER,
  rank_friends INTEGER,
  percentile DECIMAL(5,2), -- 0.00 to 100.00
  
  -- Timestamps
  last_activity_date DATE,
  last_entry_date DATE,
  last_level_up TIMESTAMP WITH TIME ZONE,
  streak_started_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for leaderboards and rankings
CREATE INDEX user_gamification_credits_idx ON user_gamification (total_credits DESC);
CREATE INDEX user_gamification_level_idx ON user_gamification (current_level DESC, total_credits DESC);
CREATE INDEX user_gamification_streak_idx ON user_gamification (daily_streak DESC);
CREATE INDEX user_gamification_activity_idx ON user_gamification (last_activity_date DESC) WHERE last_activity_date IS NOT NULL;

-- Partial indexes for active users
CREATE INDEX user_gamification_active_leaderboard_idx ON user_gamification (total_credits DESC) 
  WHERE last_activity_date >= CURRENT_DATE - INTERVAL '30 days';

-- RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own gamification data" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification data" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate user level from credits
CREATE OR REPLACE FUNCTION calculate_user_level(credits INTEGER)
RETURNS TABLE(level INTEGER, level_name TEXT, credits_to_next INTEGER) AS $$
BEGIN
  IF credits < 100 THEN
    RETURN QUERY SELECT 1, 'Eco Beginner'::TEXT, (100 - credits);
  ELSIF credits < 500 THEN
    RETURN QUERY SELECT 2, 'Green Warrior'::TEXT, (500 - credits);
  ELSIF credits < 1000 THEN
    RETURN QUERY SELECT 3, 'Eco Champion'::TEXT, (1000 - credits);
  ELSIF credits < 2500 THEN
    RETURN QUERY SELECT 4, 'Climate Hero'::TEXT, (2500 - credits);
  ELSE
    RETURN QUERY SELECT 5, 'Planet Protector'::TEXT, 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Achievements System

```sql
CREATE TABLE achievements (
  id VARCHAR(50) PRIMARY KEY,
  name_en VARCHAR(200) NOT NULL,
  name_th VARCHAR(200) NOT NULL,
  description_en TEXT NOT NULL,
  description_th TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  category VARCHAR(30) NOT NULL, -- first_steps, consistency, impact, social, special
  rarity VARCHAR(20) DEFAULT 'common', -- common, uncommon, rare, epic, legendary
  
  -- Reward system
  credits_reward INTEGER NOT NULL DEFAULT 0,
  badge_color VARCHAR(7) DEFAULT '#22c55e',
  
  -- Unlock criteria (flexible JSON structure)
  criteria JSONB NOT NULL,
  -- Examples:
  -- {"type": "total_credits", "value": 1000}
  -- {"type": "daily_streak", "value": 7}
  -- {"type": "category_entries", "category": "food_waste", "count": 10}
  -- {"type": "composite", "requirements": [{"type": "total_entries", "value": 50}, {"type": "friends", "value": 5}]}
  
  -- Display and ordering
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false, -- Hidden until unlocked
  
  -- Metadata
  unlock_message_en TEXT,
  unlock_message_th TEXT,
  share_message_en TEXT,
  share_message_th TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX achievements_category_idx ON achievements (category, sort_order);
CREATE INDEX achievements_rarity_idx ON achievements (rarity, sort_order);
CREATE INDEX achievements_active_idx ON achievements (is_active, is_hidden, sort_order);

-- Sample achievements
INSERT INTO achievements VALUES
('first_scan', 'First Step', 'ก้าวแรก', 'Scanned your first waste item', 'สแกนขยะรายการแรก', '🎯', 'first_steps', 'common', 10, '#22c55e', 
 '{"type": "total_entries", "value": 1}', 0, true, false, 'Welcome to your sustainability journey!', 'ยินดีต้อนรับสู่การเดินทางเพื่อความยั่งยืน!', null, null, NOW(), NOW()),

('daily_tracker', 'Daily Tracker', 'นักติดตามรายวัน', 'Tracked waste for 7 consecutive days', 'ติดตามขยะต่อเนื่อง 7 วัน', '📅', 'consistency', 'uncommon', 50, '#3b82f6',
 '{"type": "daily_streak", "value": 7}', 10, true, false, 'Consistency is key to making a difference!', 'ความสม่ำเสมอเป็นกุญแจสำคัญในการสร้างความเปลี่ยนแปลง!', null, null, NOW(), NOW()),

('tree_saver', 'Tree Saver', 'ผู้ช่วยต้นไม้', 'Saved equivalent of planting 1 tree', 'ช่วยโลกเทียบเท่าการปลูกต้นไม้ 1 ต้น', '🌳', 'impact', 'rare', 100, '#16a34a',
 '{"type": "total_credits", "value": 500}', 20, true, false, 'Every tree makes a difference!', 'ต้นไม้ทุกต้นสร้างความแตกต่าง!', null, null, NOW(), NOW());
```

### User Achievement Progress

```sql
CREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_progress JSONB DEFAULT '{}', -- Track progress toward criteria
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_unlocked BOOLEAN DEFAULT false,
  
  -- Unlock details
  unlocked_at TIMESTAMP WITH TIME ZONE,
  credits_earned INTEGER DEFAULT 0,
  notified BOOLEAN DEFAULT false,
  
  -- Social sharing
  shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMP WITH TIME ZONE,
  
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX user_achievements_unlocked_idx ON user_achievements (user_id, unlocked_at DESC) WHERE is_unlocked = true;
CREATE INDEX user_achievements_progress_idx ON user_achievements (user_id, progress_percentage DESC) WHERE is_unlocked = false;
CREATE INDEX user_achievements_notify_idx ON user_achievements (user_id, notified) WHERE is_unlocked = true AND notified = false;

-- RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
```

### Daily Challenges

```sql
CREATE TABLE daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  challenge_type VARCHAR(50) NOT NULL, -- scan_items, recycle_count, avoid_plastic, etc.
  
  -- Multi-language content
  title_en VARCHAR(200) NOT NULL,
  title_th VARCHAR(200) NOT NULL,
  description_en TEXT NOT NULL,
  description_th TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  
  -- Challenge parameters
  target_value INTEGER NOT NULL,
  target_unit VARCHAR(20) DEFAULT 'count', -- count, kg, credits
  credits_reward INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0, -- Extra credits for early completion
  
  -- Metadata
  difficulty VARCHAR(20) DEFAULT 'easy', -- easy, medium, hard
  category VARCHAR(30), -- consistency, recycling, reduction, etc.
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX daily_challenges_date_type_idx ON daily_challenges (date, challenge_type);
CREATE INDEX daily_challenges_active_date_idx ON daily_challenges (date, is_active) WHERE is_active = true;

-- User participation in daily challenges
CREATE TABLE user_daily_challenges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_progress INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT false,
  
  -- Completion details
  completed_at TIMESTAMP WITH TIME ZONE,
  credits_earned INTEGER DEFAULT 0,
  bonus_earned BOOLEAN DEFAULT false,
  
  -- Engagement
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_progress_at TIMESTAMP WITH TIME ZONE,
  
  PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX user_daily_challenges_date_idx ON user_daily_challenges (user_id, (SELECT date FROM daily_challenges WHERE id = challenge_id));
CREATE INDEX user_daily_challenges_completed_idx ON user_daily_challenges (user_id, completed_at DESC) WHERE is_completed = true;

-- RLS
ALTER TABLE user_daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own challenge participation" ON user_daily_challenges
  FOR ALL USING (auth.uid() = user_id);
```

## 4. Social Features

### Friendships and Social Graph

```sql
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  
  -- Metadata
  message TEXT, -- Optional message with friend request
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate requests
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

CREATE INDEX friendships_requester_idx ON friendships (requester_id, status);
CREATE INDEX friendships_addressee_idx ON friendships (addressee_id, status);
CREATE INDEX friendships_accepted_idx ON friendships (requester_id, addressee_id) WHERE status = 'accepted';
CREATE INDEX friendships_pending_idx ON friendships (addressee_id, created_at DESC) WHERE status = 'pending';

-- RLS - Users can manage their own friendship requests
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendship requests" ON friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendship requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendship status" ON friendships
  FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- Function to get user's friends
CREATE OR REPLACE VIEW user_friends AS
SELECT 
  CASE 
    WHEN f.requester_id = auth.uid() THEN f.addressee_id
    ELSE f.requester_id
  END AS friend_id,
  f.accepted_at AS friendship_date
FROM friendships f
WHERE f.status = 'accepted' 
  AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid());
```

### Activity Feed

```sql
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- level_up, achievement_unlocked, challenge_completed, etc.
  activity_data JSONB NOT NULL, -- Flexible data structure for different activity types
  
  -- Content
  message_en TEXT,
  message_th TEXT,
  
  -- Visibility and engagement
  visibility VARCHAR(20) DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry for temporary activities
  
  -- Partitioning column
  created_month DATE GENERATED ALWAYS AS (DATE_TRUNC('month', created_at)) STORED
  
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for activity feed
CREATE TABLE activity_feed_y2024m01 PARTITION OF activity_feed
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes
CREATE INDEX activity_feed_user_date_idx ON activity_feed (user_id, created_at DESC);
CREATE INDEX activity_feed_type_date_idx ON activity_feed (activity_type, created_at DESC);
CREATE INDEX activity_feed_visibility_idx ON activity_feed (visibility, created_at DESC) WHERE visibility IN ('public', 'friends');

-- RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON activity_feed
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' activities" ON activity_feed
  FOR SELECT USING (
    visibility = 'friends' AND
    user_id IN (SELECT friend_id FROM user_friends)
  );

CREATE POLICY "Anyone can view public activities" ON activity_feed
  FOR SELECT USING (visibility = 'public');
```

### Community Challenges

```sql
CREATE TABLE community_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Challenge details
  title_en VARCHAR(200) NOT NULL,
  title_th VARCHAR(200) NOT NULL,
  description_en TEXT NOT NULL,
  description_th TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  banner_image_url TEXT,
  
  -- Challenge parameters
  challenge_type VARCHAR(50) NOT NULL, -- provincial, national, school, company
  target_type VARCHAR(30) NOT NULL, -- total_credits, total_entries, trees_saved
  target_value BIGINT NOT NULL,
  current_progress BIGINT DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Participation criteria
  eligibility_criteria JSONB, -- Who can participate
  participation_limit INTEGER, -- Max participants (null = unlimited)
  current_participants INTEGER DEFAULT 0,
  
  -- Timeline
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Rewards
  rewards JSONB, -- Different rewards for different ranks/milestones
  credits_pool BIGINT DEFAULT 0, -- Total credits to distribute
  
  -- Management
  created_by UUID REFERENCES profiles(id),
  moderator_ids UUID[], -- Array of moderator user IDs
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  
  -- Metadata
  tags TEXT[],
  external_url TEXT, -- Link to external website/info
  rules_en TEXT,
  rules_th TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX community_challenges_type_status_idx ON community_challenges (challenge_type, status);
CREATE INDEX community_challenges_dates_idx ON community_challenges (start_date, end_date) WHERE status = 'active';
CREATE INDEX community_challenges_progress_idx ON community_challenges (progress_percentage DESC) WHERE status = 'active';

-- Community challenge participation
CREATE TABLE community_participations (
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Participation details
  contribution INTEGER DEFAULT 0,
  rank INTEGER,
  rank_previous INTEGER,
  
  -- Rewards earned
  credits_earned INTEGER DEFAULT 0,
  badges_earned JSONB DEFAULT '[]',
  
  -- Engagement
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contribution_at TIMESTAMP WITH TIME ZONE,
  
  PRIMARY KEY (challenge_id, user_id)
);

CREATE INDEX community_participations_contribution_idx ON community_participations (challenge_id, contribution DESC);
CREATE INDEX community_participations_user_idx ON community_participations (user_id, joined_at DESC);

-- RLS for community challenges
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active challenges" ON community_challenges
  FOR SELECT USING (status = 'active');

ALTER TABLE community_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view challenge participants" ON community_participations
  FOR SELECT USING (true); -- Public leaderboards

CREATE POLICY "Users can manage own participation" ON community_participations
  FOR ALL USING (auth.uid() = user_id);
```

### Referral System

```sql
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Referral details
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  invitation_method VARCHAR(30), -- link, qr_code, social_share
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'qualified', 'rewarded', 'expired')),
  
  -- Qualification criteria (e.g., referee must complete onboarding)
  qualification_criteria JSONB DEFAULT '{"onboarding": true, "first_entry": true}',
  qualification_progress JSONB DEFAULT '{}',
  
  -- Rewards
  referrer_credits INTEGER DEFAULT 0,
  referee_credits INTEGER DEFAULT 0,
  bonus_credits INTEGER DEFAULT 0, -- Special bonuses
  
  -- Metadata
  expires_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE, -- When referee signed up
  qualified_at TIMESTAMP WITH TIME ZONE,  -- When qualification criteria met
  rewarded_at TIMESTAMP WITH TIME ZONE,   -- When rewards distributed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (referrer_id != referee_id)
);

CREATE INDEX referrals_code_idx ON referrals (referral_code);
CREATE INDEX referrals_referrer_idx ON referrals (referrer_id, created_at DESC);
CREATE INDEX referrals_status_idx ON referrals (status, created_at DESC);
CREATE INDEX referrals_pending_qualification_idx ON referrals (referee_id) WHERE status = 'registered';

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);
```

## 5. Analytics and Reporting

### Analytics Events (Time-series data for ClickHouse or TimescaleDB)

```sql
-- If using TimescaleDB extension in PostgreSQL
CREATE TABLE analytics_events (
  timestamp TIMESTAMPTZ NOT NULL,
  event_id UUID DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id VARCHAR(100),
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- waste_entry_created, achievement_unlocked, etc.
  event_category VARCHAR(30), -- user_action, system_event, gamification
  
  -- User context
  user_province VARCHAR(50),
  user_district VARCHAR(50),
  user_level INTEGER,
  user_total_credits INTEGER,
  
  -- Waste-specific data
  waste_category_id VARCHAR(50),
  waste_disposal_method VARCHAR(50),
  waste_weight_kg DECIMAL(8,3),
  carbon_credits INTEGER,
  co2_impact_kg DECIMAL(10,6),
  
  -- Technical context
  device_type VARCHAR(20),
  platform VARCHAR(20),
  app_version VARCHAR(20),
  user_agent TEXT,
  ip_address INET,
  
  -- Custom properties
  properties JSONB,
  
  PRIMARY KEY (timestamp, event_id)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('analytics_events', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Indexes for common queries
CREATE INDEX analytics_events_user_idx ON analytics_events (user_id, timestamp DESC);
CREATE INDEX analytics_events_type_idx ON analytics_events (event_type, timestamp DESC);
CREATE INDEX analytics_events_category_idx ON analytics_events (waste_category_id, timestamp DESC);
CREATE INDEX analytics_events_province_idx ON analytics_events (user_province, timestamp DESC);
```

### Pre-aggregated Statistics (Materialized Views)

```sql
-- Daily statistics by province
CREATE MATERIALIZED VIEW daily_province_stats AS
SELECT 
  DATE(created_at) as date,
  location_province as province,
  category_id,
  disposal_method,
  COUNT(*) as entries_count,
  SUM(weight_kg) as total_weight_kg,
  SUM(carbon_credits) as total_credits,
  SUM(co2_impact_kg) as total_co2_impact_kg,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(weight_kg) as avg_weight_kg,
  AVG(carbon_credits) as avg_credits
FROM waste_entries
WHERE deleted_at IS NULL
GROUP BY date, province, category_id, disposal_method
ORDER BY date DESC, province, category_id;

-- Refresh daily at 1 AM
CREATE UNIQUE INDEX ON daily_province_stats (date, province, category_id, disposal_method);

-- Weekly user engagement stats
CREATE MATERIALIZED VIEW weekly_user_engagement AS
SELECT 
  DATE_TRUNC('week', created_at)::date as week_start,
  user_id,
  COUNT(*) as entries_count,
  SUM(carbon_credits) as total_credits,
  COUNT(DISTINCT DATE(created_at)) as active_days,
  ARRAY_AGG(DISTINCT category_id) as categories_used,
  MIN(created_at) as first_entry,
  MAX(created_at) as last_entry
FROM waste_entries
WHERE deleted_at IS NULL
  AND created_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY week_start, user_id
ORDER BY week_start DESC, user_id;

CREATE UNIQUE INDEX ON weekly_user_engagement (week_start, user_id);
```

### Leaderboards (Materialized Views for Performance)

```sql
-- Global leaderboard (updated hourly)
CREATE MATERIALIZED VIEW leaderboard_global AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY ug.total_credits DESC) as rank,
  p.id as user_id,
  p.display_name,
  p.username,
  p.avatar_url,
  p.province,
  ug.total_credits,
  ug.current_level,
  ug.trees_saved,
  ug.daily_streak,
  ug.last_activity_date
FROM user_gamification ug
JOIN profiles p ON p.id = ug.user_id
WHERE p.is_active = true 
  AND p.privacy_level IN (1, 2) -- Public or friends-only
  AND ug.last_activity_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ug.total_credits DESC
LIMIT 10000; -- Top 10k users

-- Provincial leaderboards
CREATE MATERIALIZED VIEW leaderboard_provincial AS
SELECT 
  p.province,
  ROW_NUMBER() OVER (PARTITION BY p.province ORDER BY ug.total_credits DESC) as province_rank,
  p.id as user_id,
  p.display_name,
  p.username,
  p.avatar_url,
  ug.total_credits,
  ug.current_level,
  ug.trees_saved,
  ug.daily_streak
FROM user_gamification ug
JOIN profiles p ON p.id = ug.user_id
WHERE p.is_active = true 
  AND p.privacy_level IN (1, 2)
  AND ug.last_activity_date >= CURRENT_DATE - INTERVAL '30 days'
  AND p.province IS NOT NULL
ORDER BY p.province, ug.total_credits DESC;

-- Weekly challenge leaderboard
CREATE MATERIALIZED VIEW leaderboard_weekly AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY weekly_credits DESC) as rank,
  user_id,
  weekly_credits,
  weekly_entries,
  week_start,
  week_end
FROM (
  SELECT 
    we.user_id,
    SUM(we.carbon_credits) as weekly_credits,
    COUNT(*) as weekly_entries,
    DATE_TRUNC('week', CURRENT_DATE)::date as week_start,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date as week_end
  FROM waste_entries we
  JOIN profiles p ON p.id = we.user_id
  WHERE we.created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND we.deleted_at IS NULL
    AND p.is_active = true
    AND p.privacy_level IN (1, 2)
  GROUP BY we.user_id
) weekly_stats
ORDER BY weekly_credits DESC
LIMIT 1000;

-- Refresh leaderboards every hour
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_global;
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_provincial;
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
SELECT cron.schedule('refresh-leaderboards', '0 * * * *', 'SELECT refresh_leaderboards();');
```

## 6. System Management

### Audit Log

```sql
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  
  -- Action details
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, etc.
  table_name VARCHAR(50),
  record_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  device_id VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_log_y2024m01 PARTITION OF audit_log
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX audit_log_user_idx ON audit_log (user_id, created_at DESC);
CREATE INDEX audit_log_table_idx ON audit_log (table_name, created_at DESC);
CREATE INDEX audit_log_action_idx ON audit_log (action, created_at DESC);
```

### Background Jobs

```sql
CREATE TABLE job_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 0,
  
  -- Job data
  payload JSONB NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  result JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX job_queue_status_priority_idx ON job_queue (status, priority DESC, scheduled_at ASC);
CREATE INDEX job_queue_type_status_idx ON job_queue (job_type, status);
CREATE INDEX job_queue_retry_idx ON job_queue (next_retry_at) WHERE status = 'retrying';
```

## Database Functions and Triggers

### Automatic Timestamp Updates

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waste_entries_updated_at BEFORE UPDATE ON waste_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Gamification Auto-Updates

```sql
-- Function to update user gamification stats when waste entry is added
CREATE OR REPLACE FUNCTION update_user_gamification_on_entry()
RETURNS TRIGGER AS $$
DECLARE
  level_info RECORD;
  old_level INTEGER;
BEGIN
  -- Get current level before update
  SELECT current_level INTO old_level 
  FROM user_gamification 
  WHERE user_id = NEW.user_id;
  
  -- Update gamification stats
  INSERT INTO user_gamification (user_id, total_credits, total_entries, total_waste_kg)
  VALUES (NEW.user_id, NEW.carbon_credits, 1, NEW.weight_kg)
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = user_gamification.total_credits + NEW.carbon_credits,
    total_entries = user_gamification.total_entries + 1,
    total_waste_kg = user_gamification.total_waste_kg + NEW.weight_kg,
    trees_saved = FLOOR((user_gamification.total_credits + NEW.carbon_credits) / 500),
    last_activity_date = CURRENT_DATE,
    last_entry_date = CURRENT_DATE,
    updated_at = NOW();
  
  -- Calculate new level
  SELECT * FROM calculate_user_level(
    (SELECT total_credits FROM user_gamification WHERE user_id = NEW.user_id)
  ) INTO level_info;
  
  -- Update level information
  UPDATE user_gamification SET
    current_level = level_info.level,
    credits_to_next_level = level_info.credits_to_next,
    level_progress = CASE 
      WHEN level_info.credits_to_next = 0 THEN 100.00
      ELSE ROUND(((total_credits::decimal / (total_credits + level_info.credits_to_next)) * 100), 2)
    END
  WHERE user_id = NEW.user_id;
  
  -- Check for level up
  IF level_info.level > old_level THEN
    -- Create activity feed entry
    INSERT INTO activity_feed (user_id, activity_type, activity_data, message_en, message_th)
    VALUES (NEW.user_id, 'level_up', 
            jsonb_build_object('old_level', old_level, 'new_level', level_info.level, 'level_name', level_info.level_name),
            format('Leveled up to %s!', level_info.level_name),
            format('เลื่อนขั้นเป็น %s แล้ว!', level_info.level_name));
    
    -- Update last level up timestamp
    UPDATE user_gamification SET last_level_up = NOW() WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gamification_on_entry
  AFTER INSERT ON waste_entries
  FOR EACH ROW EXECUTE FUNCTION update_user_gamification_on_entry();
```

### Daily Streak Calculation

```sql
-- Function to update daily streaks (run daily via cron)
CREATE OR REPLACE FUNCTION update_daily_streaks()
RETURNS void AS $$
BEGIN
  -- Update streaks for users who logged entries today
  WITH today_active AS (
    SELECT DISTINCT user_id
    FROM waste_entries
    WHERE DATE(created_at) = CURRENT_DATE
      AND deleted_at IS NULL
  ),
  yesterday_active AS (
    SELECT DISTINCT user_id
    FROM waste_entries  
    WHERE DATE(created_at) = CURRENT_DATE - 1
      AND deleted_at IS NULL
  )
  UPDATE user_gamification SET
    daily_streak = CASE
      -- Continue streak if active today and yesterday
      WHEN ug.user_id IN (SELECT user_id FROM today_active) AND 
           ug.user_id IN (SELECT user_id FROM yesterday_active) AND
           last_activity_date = CURRENT_DATE - 1
      THEN daily_streak + 1
      
      -- Start new streak if active today but not yesterday
      WHEN ug.user_id IN (SELECT user_id FROM today_active) AND
           (ug.user_id NOT IN (SELECT user_id FROM yesterday_active) OR last_activity_date < CURRENT_DATE - 1)
      THEN 1
      
      -- Reset streak if not active today
      WHEN ug.user_id NOT IN (SELECT user_id FROM today_active)
      THEN 0
      
      ELSE daily_streak
    END,
    max_streak = GREATEST(max_streak, 
      CASE
        WHEN ug.user_id IN (SELECT user_id FROM today_active) THEN daily_streak + 1
        ELSE max_streak
      END
    ),
    last_activity_date = CASE
      WHEN ug.user_id IN (SELECT user_id FROM today_active) THEN CURRENT_DATE
      ELSE last_activity_date
    END
  FROM user_gamification ug
  WHERE user_gamification.user_id = ug.user_id;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily at midnight
SELECT cron.schedule('update-daily-streaks', '0 0 * * *', 'SELECT update_daily_streaks();');
```

## Performance Monitoring

### Query Performance Views

```sql
-- View for monitoring slow queries
CREATE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time,
  stddev_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 100 -- Queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- View for table sizes and bloat
CREATE VIEW table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

This comprehensive database schema provides the foundation for a scalable, feature-rich Thailand waste diary application. The schema is optimized for performance, includes proper security measures, and supports all gamification and social features while maintaining data integrity and GDPR/PDPA compliance.