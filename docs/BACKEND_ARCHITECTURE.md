# Scalable Backend Architecture for Carbon-Pixels Thailand Waste Diary

## Executive Summary

This document outlines a comprehensive backend architecture design to transform the carbon-pixels waste diary app from a client-side localStorage application into a scalable multi-user platform capable of supporting millions of Thai users. The architecture prioritizes cost-effectiveness, performance, and viral growth features while maintaining the app's core gamification and environmental impact tracking capabilities.

## Current State Analysis

**Existing Architecture:**
- Frontend: Next.js 15 with TypeScript, Tailwind CSS
- Data Persistence: localStorage with JSON
- Features: Waste tracking, TGO carbon credits, gamification system
- Data Model: User entries, carbon credits, levels, achievements
- Storage: Client-side only (~50KB per user)

**Key Data Structures:**
- 8 Thai waste categories with TGO emission factors
- Gamification system (5 levels, achievements, daily goals)
- Carbon credit calculations (-67 to +67 credits per disposal method)
- Daily/historical waste entry tracking

## Target Architecture Overview

### System Requirements
- **Scale**: 10M+ Thai users
- **Performance**: <200ms API response times
- **Availability**: 99.9% uptime
- **Cost**: <$2,000/month at 1M active users
- **Compliance**: Thai PDPA + GDPR compliance
- **Mobile-first**: Optimized for 3G/4G networks

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                      │
├─────────────────────────────────────────────────────────────────┤
│ Next.js 15 Web App │ React Native Mobile │ PWA Offline         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                     CDN + EDGE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│ Cloudflare CDN │ Edge Functions │ DDoS Protection │ Cache       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    API GATEWAY LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│ Kong Gateway │ Rate Limiting │ Auth │ Load Balancing │ Metrics  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                  MICROSERVICES LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│ User Service │ Waste Service │ Gamification │ Analytics │ Social │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    DATA & MESSAGE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│ Supabase │ Redis Cache │ S3 Storage │ PubSub │ ElasticSearch    │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Service Architecture

### 1. User Service (Authentication & Profiles)

**Technology Stack:**
- Runtime: Node.js 20+ with Fastify framework
- Database: Supabase PostgreSQL with RLS
- Authentication: Supabase Auth + JWT
- Caching: Redis for session management

**Key Features:**
- Thai phone number authentication (OTP)
- Social login (LINE, Facebook, Google)
- Anonymous user support (localStorage migration)
- Profile management with privacy controls
- Multi-device synchronization

**Database Schema:**
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  phone_number VARCHAR(15),
  province VARCHAR(50),
  district VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  privacy_level INTEGER DEFAULT 1, -- 1=public, 2=friends, 3=private
  notification_settings JSONB DEFAULT '{"daily_reminder": true, "achievements": true}',
  onboarding_completed BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP DEFAULT NOW()
);

-- User preferences for localization and settings
CREATE TABLE user_preferences (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  language VARCHAR(5) DEFAULT 'th-TH',
  timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
  daily_goal INTEGER DEFAULT 100,
  measurement_unit VARCHAR(10) DEFAULT 'kg',
  theme VARCHAR(20) DEFAULT 'notebook',
  auto_sync BOOLEAN DEFAULT true
);
```

**API Endpoints:**
```typescript
// User Authentication & Management
POST   /auth/phone-otp          // Send OTP to Thai phone
POST   /auth/verify-otp         // Verify OTP and create session
POST   /auth/social/{provider}  // Social login (LINE/Facebook/Google)
GET    /user/profile            // Get current user profile
PUT    /user/profile            // Update user profile
POST   /user/migrate-local      // Migrate localStorage data to cloud
DELETE /user/account            // GDPR compliant account deletion

// Multi-device sync
GET    /user/sync/status        // Check sync status across devices
POST   /user/sync/request       // Request full data sync
```

### 2. Waste Tracking Service

**Technology Stack:**
- Runtime: Go 1.21+ with Gin framework (high performance)
- Database: Supabase PostgreSQL with partitioning
- File Storage: Supabase Storage (images)
- Search: PostgreSQL full-text search + Elasticsearch

**Key Features:**
- Waste entry CRUD operations
- Batch entry processing
- Image upload and AI recognition
- TGO carbon credit calculations
- Historical data analytics
- Offline synchronization

**Database Schema:**
```sql
-- Partitioned by month for performance
CREATE TABLE waste_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  category_id VARCHAR(50) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  disposal_method VARCHAR(50) NOT NULL,
  weight_kg DECIMAL(8,3) NOT NULL CHECK (weight_kg > 0),
  carbon_credits INTEGER NOT NULL,
  image_url TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW(),
  device_id VARCHAR(100),
  offline_id VARCHAR(100) -- For offline sync deduplication
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE waste_entries_y2024m01 PARTITION OF waste_entries
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for performance
CREATE INDEX waste_entries_user_date_idx ON waste_entries (user_id, created_at DESC);
CREATE INDEX waste_entries_category_idx ON waste_entries (category_id, created_at DESC);
CREATE INDEX waste_entries_credits_idx ON waste_entries (carbon_credits DESC);
```

**API Endpoints:**
```typescript
// Waste Entry Management
POST   /waste/entries              // Create single entry
POST   /waste/entries/batch        // Batch create entries (offline sync)
GET    /waste/entries              // Get entries with pagination/filtering
PUT    /waste/entries/{id}         // Update entry
DELETE /waste/entries/{id}         // Delete entry

// Analytics & Insights
GET    /waste/stats/daily          // Today's stats
GET    /waste/stats/monthly        // Monthly aggregations
GET    /waste/stats/category       // Category breakdown
GET    /waste/leaderboard         // Regional/national rankings

// Image Processing
POST   /waste/image/upload         // Upload waste image
POST   /waste/image/recognize      // AI waste recognition (future)
```

### 3. Gamification Service

**Technology Stack:**
- Runtime: Node.js with TypeScript (complex business logic)
- Database: Supabase PostgreSQL
- Real-time: Supabase Realtime channels
- Background Jobs: BullMQ + Redis

**Key Features:**
- Level progression calculation
- Achievement system with notifications
- Daily/weekly challenges
- Leaderboards and rankings
- Social features and friend connections

**Database Schema:**
```sql
-- User gamification progress
CREATE TABLE user_gamification (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  total_credits INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  credits_to_next_level INTEGER DEFAULT 100,
  daily_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  trees_saved INTEGER DEFAULT 0,
  last_activity_date DATE,
  achievements_unlocked JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievement definitions and progress
CREATE TABLE achievements (
  id VARCHAR(50) PRIMARY KEY,
  name_th VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  description_th TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  credits_reward INTEGER NOT NULL,
  criteria JSONB NOT NULL, -- Flexible achievement criteria
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievement progress
CREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id),
  achievement_id VARCHAR(50) REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  progress JSONB DEFAULT '{}', -- Track progress toward criteria
  notified BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, achievement_id)
);

-- Daily challenges
CREATE TABLE daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  challenge_type VARCHAR(50) NOT NULL,
  title_th VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  description_th TEXT NOT NULL,
  description_en TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  credits_reward INTEGER NOT NULL,
  active BOOLEAN DEFAULT true
);

-- User challenge participation
CREATE TABLE user_daily_challenges (
  user_id UUID REFERENCES profiles(id),
  challenge_id UUID REFERENCES daily_challenges(id),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  credits_earned INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, challenge_id)
);

-- Leaderboards (materialized view for performance)
CREATE MATERIALIZED VIEW leaderboard_monthly AS
SELECT 
  p.id,
  p.display_name,
  p.province,
  ug.total_credits,
  ug.current_level,
  ug.trees_saved,
  RANK() OVER (ORDER BY ug.total_credits DESC) as rank,
  RANK() OVER (PARTITION BY p.province ORDER BY ug.total_credits DESC) as province_rank
FROM profiles p
JOIN user_gamification ug ON p.id = ug.user_id
WHERE ug.last_activity_date >= DATE_TRUNC('month', NOW());

-- Refresh hourly
CREATE INDEX ON leaderboard_monthly (rank);
CREATE INDEX ON leaderboard_monthly (province, province_rank);
```

**API Endpoints:**
```typescript
// Gamification Progress
GET    /gamification/profile       // User's gamification status
GET    /gamification/achievements  // Available achievements
POST   /gamification/achievement/check // Check achievement progress
GET    /gamification/leaderboard   // Rankings (global/regional)

// Daily Challenges
GET    /gamification/challenges/today    // Today's challenges
POST   /gamification/challenges/progress // Update challenge progress
GET    /gamification/challenges/history  // Challenge completion history

// Social Features
GET    /gamification/friends        // Friends' progress
POST   /gamification/friends/add    // Add friend by username
GET    /gamification/feed          // Activity feed from friends
```

### 4. Analytics Service

**Technology Stack:**
- Runtime: Python 3.11+ with FastAPI
- Analytics: ClickHouse for time-series data
- Processing: Apache Airflow for ETL
- Visualization: Grafana dashboards

**Key Features:**
- Real-time waste tracking analytics
- Environmental impact calculations
- User behavior insights
- Government reporting (TGO integration)
- Trend analysis and predictions

**Database Schema (ClickHouse):**
```sql
-- Analytics events table
CREATE TABLE waste_analytics (
  timestamp DateTime64(3),
  user_id UUID,
  province String,
  district String,
  category_id String,
  disposal_method String,
  weight_kg Float64,
  carbon_credits Int32,
  co2_impact_kg Float64,
  session_id String,
  device_type String,
  app_version String
) ENGINE = MergeTree()
ORDER BY (timestamp, user_id)
PARTITION BY toYYYYMM(timestamp);

-- Pre-aggregated daily stats for performance
CREATE MATERIALIZED VIEW daily_province_stats AS
SELECT 
  toDate(timestamp) as date,
  province,
  category_id,
  disposal_method,
  count() as entries_count,
  sum(weight_kg) as total_weight_kg,
  sum(carbon_credits) as total_credits,
  sum(co2_impact_kg) as total_co2_impact_kg,
  uniq(user_id) as unique_users
FROM waste_analytics
GROUP BY date, province, category_id, disposal_method;
```

**API Endpoints:**
```typescript
// Analytics & Reporting
GET    /analytics/dashboard         // Real-time dashboard data
GET    /analytics/impact/national   // Thailand national impact stats
GET    /analytics/impact/province/{province} // Provincial statistics
GET    /analytics/trends/waste      // Waste category trends
GET    /analytics/export/tgo        // TGO compliance report generation

// Personal Analytics
GET    /analytics/user/impact       // Personal environmental impact
GET    /analytics/user/comparison   // Compare with averages
GET    /analytics/user/predictions  // AI-powered insights
```

### 5. Social & Community Service

**Technology Stack:**
- Runtime: Node.js with Express
- Real-time: Supabase Realtime + WebSockets
- Push Notifications: Firebase Cloud Messaging
- Content Moderation: OpenAI Moderation API

**Key Features:**
- Friend connections and social graphs
- Community challenges and competitions
- Content sharing and environmental tips
- Push notifications for engagement
- Viral referral system

**Database Schema:**
```sql
-- Social connections
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id),
  addressee_id UUID REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(requester_id, addressee_id)
);

-- Activity feed
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB NOT NULL,
  visibility VARCHAR(20) DEFAULT 'friends', -- public, friends, private
  created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Community challenges
CREATE TABLE community_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_th VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  description_th TEXT NOT NULL,
  description_en TEXT NOT NULL,
  challenge_type VARCHAR(50) NOT NULL, -- provincial, national, school
  target_value BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'active'
);

-- Community challenge participation
CREATE TABLE community_participations (
  challenge_id UUID REFERENCES community_challenges(id),
  user_id UUID REFERENCES profiles(id),
  contribution INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);

-- Referral system for viral growth
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id),
  referee_id UUID REFERENCES profiles(id),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rewarded
  credits_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**API Endpoints:**
```typescript
// Social Connections
GET    /social/friends              // User's friends list
POST   /social/friends/request      // Send friend request
PUT    /social/friends/accept/{id}  // Accept friend request
GET    /social/feed                 // Activity feed

// Community Features
GET    /social/challenges           // Active community challenges
POST   /social/challenges/join/{id} // Join community challenge
GET    /social/leaderboard/community // Community leaderboards

// Viral Features
POST   /social/referral/generate    // Generate referral code
POST   /social/referral/redeem      // Redeem referral code
GET    /social/referral/stats       // Referral statistics
```

## Real-Time Architecture

### WebSocket/Realtime Features

**Supabase Realtime Channels:**
```typescript
// Real-time subscriptions
/realtime/user/{user_id}/gamification    // Level ups, achievements
/realtime/user/{user_id}/challenges      // Challenge progress updates
/realtime/leaderboard/live               // Live leaderboard updates
/realtime/community/{challenge_id}       // Community challenge progress
/realtime/friends/{user_id}              // Friends' activities
```

**Event Types:**
- Achievement unlocked notifications
- Friend activity updates
- Challenge completion celebrations
- Leaderboard position changes
- Community milestone reached

### Push Notification Strategy

**FCM Integration:**
```typescript
// Notification categories
- daily_reminder: "Don't forget to track your waste today!"
- achievement_unlocked: "🏆 New achievement: {achievement_name}"
- level_up: "🌟 Level up! You're now a {level_name}"
- friend_activity: "{friend_name} just saved their {nth} tree!"
- challenge_complete: "🎯 Challenge completed! +{credits} credits earned"
- community_milestone: "🌍 Your community just reached {milestone}!"
```

## Caching Strategy

### Redis Caching Layers

**Cache Architecture:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser Cache│    │   CDN Cache      │    │   Redis Cache   │
│   (1 hour)     │────│   (24 hours)     │────│   (varies)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   Database      │
                                               │   (PostgreSQL)  │
                                               └─────────────────┘
```

**Cache Keys and TTL:**
```typescript
// User data caching
user:profile:{user_id}                    // TTL: 15 minutes
user:gamification:{user_id}               // TTL: 5 minutes
user:achievements:{user_id}               // TTL: 30 minutes

// Leaderboards (expensive queries)
leaderboard:global:daily                  // TTL: 1 hour
leaderboard:province:{province}:weekly    // TTL: 2 hours
leaderboard:friends:{user_id}             // TTL: 10 minutes

// Static data
waste:categories:thailand                 // TTL: 24 hours
achievements:all                          // TTL: 6 hours
challenges:daily:{date}                   // TTL: 24 hours

// Analytics aggregations
analytics:daily:{date}:{province}         // TTL: 6 hours
analytics:trends:weekly                   // TTL: 4 hours
```

## Performance Optimization

### Database Performance

**Indexing Strategy:**
```sql
-- Critical performance indexes
CREATE INDEX CONCURRENTLY waste_entries_user_recent ON waste_entries (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY waste_entries_leaderboard ON waste_entries (user_id) INCLUDE (carbon_credits);
CREATE INDEX CONCURRENTLY user_gamification_leaderboard ON user_gamification (total_credits DESC);
CREATE INDEX CONCURRENTLY friendships_lookup ON friendships (requester_id, addressee_id) WHERE status = 'accepted';

-- Partial indexes for hot queries
CREATE INDEX CONCURRENTLY waste_entries_today ON waste_entries (user_id) 
WHERE created_at >= CURRENT_DATE;

CREATE INDEX CONCURRENTLY active_challenges ON daily_challenges (date, active) 
WHERE active = true;
```

**Query Optimization:**
- Connection pooling: 100 connections per service
- Read replicas for analytics queries
- Materialized views for complex aggregations
- Partitioning for historical data

### API Performance

**Response Time Targets:**
- User profile data: <100ms
- Waste entry creation: <150ms
- Leaderboard queries: <200ms
- Analytics dashboards: <500ms

**Optimization Techniques:**
- Response compression (gzip/brotli)
- GraphQL for flexible data fetching
- Pagination for large datasets
- Background job processing for heavy operations

### Mobile Network Optimization

**Offline-First Strategy:**
```typescript
// Service Worker implementation
- Cache critical API responses
- Queue offline waste entries
- Sync when connectivity restored
- Progressive image loading
- Delta sync for efficiency
```

**Data Compression:**
- JSON response compression: 70-80% size reduction
- Image optimization: WebP format, multiple sizes
- Bundle splitting: Load only necessary features

## Security Architecture

### Authentication & Authorization

**Multi-layered Security:**
```typescript
// JWT Token Structure
{
  "sub": "user_uuid",
  "role": "authenticated", 
  "aal": "aal1",
  "phone": "+66812345678",
  "province": "Bangkok",
  "exp": 1640995200
}

// Row Level Security Policies
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON waste_entries
FOR SELECT USING (user_id = auth.uid());

-- Privacy controls for social features
CREATE POLICY "Friends can view based on privacy" ON profiles
FOR SELECT USING (
  privacy_level = 1 OR 
  (privacy_level = 2 AND auth.uid() IN (
    SELECT CASE 
      WHEN requester_id = auth.uid() THEN addressee_id
      WHEN addressee_id = auth.uid() THEN requester_id
    END FROM friendships 
    WHERE status = 'accepted'
  ))
);
```

### Data Protection & Privacy

**GDPR/PDPA Compliance:**
```typescript
// Data retention policies
- Waste entries: 7 years (environmental compliance)
- User profiles: Until account deletion + 30 days
- Analytics data: Anonymized after 2 years
- Logs: 90 days maximum

// Privacy controls
- Data export API (JSON format)
- Account deletion (soft delete + anonymization)
- Consent management for analytics
- Cookie consent for EU users
```

### API Security

**Rate Limiting (Kong Gateway):**
```yaml
# Rate limiting rules
user_authentication: 5 req/min
waste_entry_creation: 60 req/hour  
image_uploads: 10 req/hour
leaderboard_queries: 120 req/hour
```

**Input Validation:**
```typescript
// Zod schemas for validation
const WasteEntrySchema = z.object({
  categoryId: z.enum(['food_waste', 'plastic_bottles', ...]),
  weight: z.number().min(0.01).max(100),
  disposalMethod: z.string().min(1).max(50),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});
```

## Deployment Architecture

### Infrastructure Stack

**Cloud Provider: AWS (Cost-Effective + Thai Region)**
- **Compute**: ECS Fargate (serverless containers)
- **Database**: RDS PostgreSQL Multi-AZ 
- **Storage**: S3 + CloudFront CDN
- **Cache**: ElastiCache Redis
- **Load Balancer**: Application Load Balancer
- **Monitoring**: CloudWatch + Grafana

**Container Architecture:**
```dockerfile
# Production-optimized Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime  
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

### Auto-Scaling Configuration

**ECS Service Auto-Scaling:**
```yaml
# Auto-scaling targets
cpu_utilization: 70%
memory_utilization: 80%
request_count: 1000 req/min

# Scaling policies
scale_up: +2 instances, cooldown 300s
scale_down: -1 instance, cooldown 600s
min_instances: 2
max_instances: 50

# Regional deployment
primary: ap-southeast-1 (Singapore)
secondary: ap-southeast-3 (Jakarta) 
```

### CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy Carbon Pixels Backend
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    steps:
    - uses: actions/checkout@v3
    - name: Run tests
      run: npm test
    - name: Build Docker image
      run: docker build -t carbon-pixels:${{ github.sha }} .
    - name: Deploy to ECS
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: .aws/task-definition.json
        service: carbon-pixels-service
        cluster: carbon-pixels-cluster
```

## Cost Analysis & Optimization

### Monthly Cost Estimation (1M Active Users)

**Infrastructure Costs:**
```
AWS ECS Fargate (4 services × 3 instances):     $280
RDS PostgreSQL (db.r5.xlarge Multi-AZ):         $650  
ElastiCache Redis (cache.r5.large):             $180
S3 Storage (100GB images + backups):            $25
CloudFront CDN (10TB transfer):                 $850
Application Load Balancer:                      $25
CloudWatch Logs & Monitoring:                   $120
Total Infrastructure:                           $2,130/month

Supabase Pro (Auth + Realtime):                $100/month  
External APIs (FCM, Moderation):               $50/month
Monitoring & Alerting (Grafana Cloud):         $30/month

TOTAL ESTIMATED COST:                          $2,310/month
Cost per user:                                 $0.0023/user/month
```

**Cost Optimization Strategies:**
1. **Reserved Instances**: 40% savings on predictable workloads
2. **Spot Instances**: Use for background jobs and analytics
3. **S3 Intelligent Tiering**: Automatic cost optimization for images
4. **CloudFront**: Reduce data transfer costs
5. **Database Optimization**: Read replicas + connection pooling

### Scaling Cost Projections

```
100K users:   $350/month  ($0.035/user)
1M users:     $2,310/month ($0.0023/user)  
10M users:    $18,500/month ($0.0019/user)
```

## Migration Strategy

### Phase 1: Backend Foundation (Month 1-2)

**Week 1-2: Core Infrastructure**
- Set up AWS infrastructure with Terraform
- Deploy Supabase instance with RLS policies
- Implement User Service with phone authentication
- Create database schema and indexes

**Week 3-4: Waste Tracking Service**
- Migrate waste categories and gamification data
- Implement waste entry CRUD APIs
- Set up Redis caching layer
- Create batch import tools for localStorage migration

**Week 5-6: Client Integration**  
- Update Next.js app to use backend APIs
- Implement offline synchronization
- Create localStorage-to-cloud migration flow
- Deploy with feature flags for gradual rollout

**Week 7-8: Testing & Polish**
- Load testing with simulated traffic
- Security audit and penetration testing
- Performance optimization
- Beta testing with 100 users

### Phase 2: Social & Gamification (Month 3)

**Week 1-2: Gamification Service**
- Implement achievement system
- Create leaderboards with caching
- Set up real-time notifications via Supabase
- Deploy daily challenges system

**Week 3-4: Social Features**
- Friend connections and activity feeds  
- Community challenges
- Referral system implementation
- Push notification integration

### Phase 3: Analytics & Growth (Month 4)

**Week 1-2: Analytics Service**
- ClickHouse deployment for analytics
- Real-time dashboard creation
- TGO reporting integration
- User behavior tracking

**Week 3-4: Viral Growth Features**
- Referral program optimization
- Social sharing integration
- Community competitions
- Influencer partnership APIs

### Data Migration Process

**localStorage to Cloud Migration:**
```typescript
// Migration API endpoint
POST /user/migrate-local
{
  "waste_entries": [...],
  "carbon_credits": 1250,
  "achievements": [...],
  "user_preferences": {...}
}

// Migration process:
1. User creates account via OTP
2. Client uploads localStorage data
3. Server validates and imports data
4. Conflicts resolved (duplicate entries)
5. Gamification status recalculated
6. Success confirmation to client
7. Client clears localStorage
```

**Migration Safety:**
- Backup localStorage before migration
- Rollback capability if migration fails
- Data validation and sanitization
- Gradual migration with user consent

## Monitoring & Observability

### Application Monitoring

**Key Metrics Dashboard:**
```typescript
// Performance Metrics
- API response times (p95, p99)
- Database query performance  
- Cache hit rates
- Error rates and status codes

// Business Metrics  
- Daily active users (DAU)
- Waste entries per day
- Carbon credits generated
- User retention rates
- Achievement unlock rates

// Infrastructure Metrics
- Container CPU/Memory usage
- Database connections
- Redis memory utilization
- S3 storage and bandwidth
```

**Alerting Rules:**
- API response time > 500ms (P1)
- Error rate > 1% (P2) 
- Database CPU > 80% (P1)
- Failed authentication > 10/min (P1)
- Disk usage > 85% (P2)

### Health Checks & SLOs

**Service Level Objectives:**
```yaml
user_service:
  availability: 99.9%
  response_time_p95: 200ms
  
waste_service:
  availability: 99.95%
  response_time_p95: 150ms
  
gamification_service:
  availability: 99.5% 
  response_time_p95: 300ms

analytics_service:
  availability: 99.0%
  response_time_p95: 1000ms
```

**Health Check Endpoints:**
```typescript
GET /health                    // Basic service health
GET /health/detailed          // Detailed dependency status  
GET /metrics                  // Prometheus metrics
GET /ready                    // Readiness probe for K8s
```

## Future Enhancements & Roadmap

### Year 1 Roadmap

**Q1: Foundation & Migration**
- Complete backend infrastructure
- Migrate 10,000 localStorage users
- Launch social features
- Basic analytics dashboard

**Q2: Growth & Engagement** 
- AI waste recognition (TensorFlow.js)
- Community challenges
- Referral program launch
- Government partnership (TGO)

**Q3: Scale & Optimize**
- Support 100,000+ users
- Advanced analytics & insights
- Mobile app launch (React Native)
- Enterprise features (schools/companies)

**Q4: Innovation & Expansion**
- IoT integration (smart bins)
- Blockchain carbon credits
- Regional expansion (ASEAN)
- AI-powered insights

### Advanced Features (Year 2+)

**AI & Machine Learning:**
- Computer vision for waste recognition
- Predictive analytics for environmental impact
- Personalized recommendations
- Anomaly detection for data quality

**IoT Integration:**
- Smart bin connectivity
- Automatic weight measurements  
- RFID/NFC waste tagging
- Environmental sensor data

**Blockchain Features:**
- Tokenized carbon credits
- NFT achievements and rewards
- Decentralized governance
- Cross-platform credit exchange

**Government Integration:**
- TGO official reporting
- Municipal waste tracking
- Policy compliance monitoring
- Environmental impact studies

## Risk Assessment & Mitigation

### Technical Risks

**Database Performance at Scale**
- Risk: Slow queries affecting user experience
- Mitigation: Read replicas, partitioning, caching
- Monitoring: Query performance alerts

**Third-party Service Dependencies**
- Risk: Supabase/AWS outages
- Mitigation: Multi-region deployment, fallback services
- Monitoring: Dependency health checks

### Business Risks

**User Adoption & Retention**
- Risk: Low engagement after initial use
- Mitigation: Gamification, social features, push notifications
- Monitoring: DAU/MAU ratios, retention cohorts

**Competition from Established Players**
- Risk: Large tech companies entering market
- Mitigation: Focus on Thai market, government partnerships
- Monitoring: Market share analysis

### Compliance Risks

**Data Privacy Violations**
- Risk: GDPR/PDPA non-compliance
- Mitigation: Privacy by design, regular audits
- Monitoring: Data access logging, consent tracking

**Environmental Data Accuracy**
- Risk: Incorrect TGO calculations affecting credibility
- Mitigation: Regular data validation, expert review
- Monitoring: Data quality metrics

## Conclusion

This backend architecture provides a robust, scalable foundation for the carbon-pixels Thailand waste diary app to grow from a client-side application to a platform supporting millions of users. The design prioritizes:

1. **Cost-effectiveness**: <$0.003 per user per month at scale
2. **Performance**: <200ms API response times
3. **Scalability**: Auto-scaling from 1K to 10M+ users
4. **Viral Growth**: Social features and referral systems
5. **Thai Localization**: Phone auth, government integration
6. **Environmental Impact**: Accurate TGO data and analytics

The phased migration approach minimizes risk while enabling rapid feature development. The architecture leverages proven technologies (PostgreSQL, Redis, Node.js) while incorporating modern patterns (microservices, API-first, real-time features) to ensure long-term success.

With proper implementation of this architecture, carbon-pixels can become Thailand's leading environmental impact tracking platform, supporting the nation's 2050 carbon neutrality goals while creating an engaging, gamified experience that motivates sustainable behavior change at scale.