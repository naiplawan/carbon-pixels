# Carbon-Pixels Backend API Specifications

## API Overview

This document provides detailed API specifications for the carbon-pixels Thailand waste diary backend services. All APIs follow RESTful conventions with consistent error handling, authentication, and response formats.

## Base Configuration

**Base URL:** `https://api.carbon-pixels.com/v1`
**Authentication:** Bearer JWT tokens
**Content-Type:** `application/json`
**Rate Limiting:** Per-endpoint limits (see individual endpoints)

## Common Response Formats

### Success Response
```typescript
{
  "success": true,
  "data": T, // Response data
  "meta": { // Optional metadata
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "weight",
      "reason": "Must be greater than 0"
    },
    "request_id": "req_abc123"
  }
}
```

### Error Codes
```typescript
// Authentication & Authorization
AUTH_REQUIRED: 401,           // Authentication required
AUTH_INVALID: 401,            // Invalid token
AUTH_EXPIRED: 401,            // Token expired
PERMISSION_DENIED: 403,       // Insufficient permissions

// Validation & Client Errors  
VALIDATION_ERROR: 400,        // Input validation failed
NOT_FOUND: 404,              // Resource not found
CONFLICT: 409,               // Resource already exists
RATE_LIMITED: 429,           // Too many requests

// Server Errors
INTERNAL_ERROR: 500,         // Internal server error
SERVICE_UNAVAILABLE: 503,    // Service temporarily unavailable
```

## 1. Authentication Service

### Phone OTP Authentication

```http
POST /auth/phone-otp
Content-Type: application/json

{
  "phone_number": "+66812345678",
  "country_code": "TH"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "otp_id": "otp_abc123",
    "expires_at": "2024-01-15T10:35:00.000Z",
    "resend_available_at": "2024-01-15T10:31:00.000Z"
  }
}
```

**Rate Limit:** 5 requests per minute per phone number

### Verify OTP

```http
POST /auth/verify-otp
Content-Type: application/json

{
  "otp_id": "otp_abc123",
  "otp_code": "123456",
  "device_info": {
    "device_id": "device_unique_id",
    "platform": "web|ios|android",
    "app_version": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_abc123",
    "expires_in": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phone_number": "+66812345678",
      "is_new_user": true,
      "onboarding_completed": false
    }
  }
}
```

### Social Authentication

```http
POST /auth/social/{provider}
Content-Type: application/json

// Providers: line, facebook, google
{
  "provider_token": "provider_access_token",
  "device_info": {
    "device_id": "device_unique_id",
    "platform": "web|ios|android",
    "app_version": "1.0.0"
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer {refresh_token}

{
  "refresh_token": "refresh_abc123"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {access_token}

{
  "device_id": "device_unique_id" // Optional: logout from specific device
}
```

## 2. User Management Service

### Get User Profile

```http
GET /user/profile
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "eco_warrior_th",
    "display_name": "สมชาย ใจดี",
    "phone_number": "+66812345678",
    "province": "กรุงเทพมหานคร",
    "district": "วัฒนา",
    "avatar_url": "https://storage.carbon-pixels.com/avatars/user_123.jpg",
    "privacy_level": 2,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_active_at": "2024-01-15T10:30:00.000Z",
    "preferences": {
      "language": "th-TH",
      "timezone": "Asia/Bangkok",
      "daily_goal": 100,
      "notifications": {
        "daily_reminder": true,
        "achievements": true,
        "friends": true
      }
    }
  }
}
```

### Update User Profile

```http
PUT /user/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "display_name": "สมชาย ใจดี",
  "username": "eco_warrior_th", // Must be unique
  "province": "กรุงเทพมหานคร",
  "district": "วัฒนา",
  "privacy_level": 2, // 1=public, 2=friends, 3=private
  "preferences": {
    "daily_goal": 150,
    "notifications": {
      "daily_reminder": true,
      "achievements": false
    }
  }
}
```

### Upload Avatar

```http
POST /user/avatar
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

avatar: [image file] // Max 5MB, JPEG/PNG only
```

### Migrate localStorage Data

```http
POST /user/migrate-local
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "waste_entries": [
    {
      "category_id": "plastic_bags",
      "disposal_method": "recycled",
      "weight_kg": 0.5,
      "carbon_credits": 25,
      "timestamp": "2024-01-14T15:30:00.000Z",
      "offline_id": "local_123"
    }
  ],
  "total_credits": 1250,
  "achievements_unlocked": ["first_scan", "daily_tracker"],
  "preferences": {
    "daily_goal": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "migrated_entries": 45,
    "duplicate_entries": 2,
    "total_credits_imported": 1248,
    "achievements_granted": ["tree_saver"],
    "current_level": 3
  }
}
```

## 3. Waste Tracking Service

### Create Waste Entry

```http
POST /waste/entries
Authorization: Bearer {access_token}
Content-Type: application/json
Rate Limit: 60 requests per hour

{
  "category_id": "plastic_bags",
  "disposal_method": "recycled",
  "weight_kg": 0.5,
  "image_url": "https://storage.carbon-pixels.com/waste/image_123.jpg", // Optional
  "location": { // Optional
    "latitude": 13.7563,
    "longitude": 100.5018
  },
  "offline_id": "local_456" // For deduplication
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "entry_abc123",
    "category_id": "plastic_bags",
    "category_name": "ถุงพลาสติก",
    "category_icon": "🛍️",
    "disposal_method": "recycled",
    "weight_kg": 0.5,
    "carbon_credits": 25,
    "co2_impact_kg": 0.025,
    "image_url": "https://storage.carbon-pixels.com/waste/image_123.jpg",
    "created_at": "2024-01-15T10:30:00.000Z",
    "achievements_unlocked": [], // Any new achievements
    "level_up": null // Level up info if applicable
  }
}
```

### Batch Create Entries (Offline Sync)

```http
POST /waste/entries/batch
Authorization: Bearer {access_token}
Content-Type: application/json
Rate Limit: 10 requests per hour

{
  "entries": [
    {
      "category_id": "food_waste",
      "disposal_method": "composted",
      "weight_kg": 1.2,
      "timestamp": "2024-01-14T08:00:00.000Z",
      "offline_id": "local_789"
    },
    {
      "category_id": "plastic_bottles", 
      "disposal_method": "recycled",
      "weight_kg": 0.3,
      "timestamp": "2024-01-14T12:00:00.000Z",
      "offline_id": "local_790"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "created": 2,
    "duplicates": 0,
    "errors": 0,
    "total_credits_earned": 55,
    "achievements_unlocked": ["compost_master"],
    "level_up": {
      "old_level": 2,
      "new_level": 3,
      "level_name": "Eco Champion"
    },
    "entries": [
      {
        "id": "entry_def456",
        "offline_id": "local_789",
        "carbon_credits": 30
      },
      {
        "id": "entry_ghi789", 
        "offline_id": "local_790",
        "carbon_credits": 25
      }
    ]
  }
}
```

### Get User Waste Entries

```http
GET /waste/entries?page=1&limit=20&date_from=2024-01-01&date_to=2024-01-31&category_id=plastic_bags
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (max: 100, default: 20)  
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `category_id`: Filter by waste category
- `disposal_method`: Filter by disposal method

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "entry_abc123",
        "category_id": "plastic_bags",
        "category_name": "ถุงพลาสติก",
        "category_icon": "🛍️",
        "disposal_method": "recycled",
        "weight_kg": 0.5,
        "carbon_credits": 25,
        "image_url": "https://storage.carbon-pixels.com/waste/image_123.jpg",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### Update Waste Entry

```http
PUT /waste/entries/{entry_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "disposal_method": "reused", // Can only update disposal method and weight
  "weight_kg": 0.6
}
```

### Delete Waste Entry

```http
DELETE /waste/entries/{entry_id}
Authorization: Bearer {access_token}
```

### Get Daily Stats

```http
GET /waste/stats/daily?date=2024-01-15
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "total_entries": 5,
    "total_weight_kg": 2.3,
    "total_credits": 125,
    "credits_positive": 145,
    "credits_negative": -20,
    "co2_impact_kg": 0.125,
    "trees_equivalent": 0.25,
    "categories": {
      "food_waste": {
        "entries": 2,
        "weight_kg": 1.5,
        "credits": 60
      },
      "plastic_bags": {
        "entries": 2, 
        "weight_kg": 0.5,
        "credits": 50
      },
      "glass_bottles": {
        "entries": 1,
        "weight_kg": 0.3,
        "credits": 15
      }
    }
  }
}
```

### Get Monthly Aggregations

```http
GET /waste/stats/monthly?year=2024&month=1
Authorization: Bearer {access_token}
```

### Upload Waste Image

```http
POST /waste/image/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
Rate Limit: 10 requests per hour

image: [image file] // Max 10MB, JPEG/PNG only
```

**Response:**
```json
{
  "success": true,
  "data": {
    "image_url": "https://storage.carbon-pixels.com/waste/user_123/image_456.jpg",
    "image_id": "img_abc123",
    "processing_status": "completed",
    "ai_recognition": { // Future feature
      "confidence": 0.95,
      "detected_category": "plastic_bottles",
      "suggestions": [
        {
          "category_id": "plastic_bottles",
          "confidence": 0.95
        }
      ]
    }
  }
}
```

## 4. Gamification Service

### Get User Gamification Profile

```http
GET /gamification/profile
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "total_credits": 1250,
    "current_level": 3,
    "level_name": "Eco Champion",
    "level_icon": "🌳",
    "credits_to_next_level": 750,
    "progress_percentage": 33.33,
    "daily_streak": 7,
    "max_streak": 15,
    "trees_saved": 2,
    "achievements_count": 5,
    "total_waste_kg": 45.6,
    "co2_saved_kg": 1.25,
    "rank": {
      "global": 1543,
      "province": 89,
      "percentile": 85
    }
  }
}
```

### Get Achievements

```http
GET /gamification/achievements
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unlocked": [
      {
        "id": "first_scan",
        "name_th": "ก้าวแรก",
        "name_en": "First Step", 
        "description_th": "สแกนขยะรายการแรก",
        "description_en": "Scanned your first waste item",
        "icon": "🎯",
        "credits_reward": 10,
        "unlocked_at": "2024-01-10T14:20:00.000Z"
      }
    ],
    "available": [
      {
        "id": "recycling_hero",
        "name_th": "นักรีไซเคิล",
        "name_en": "Recycling Hero",
        "description_th": "รีไซเคิล 10 ชิ้นในวันเดียว",
        "description_en": "Recycle 10 items in one day",
        "icon": "♻️",
        "credits_reward": 100,
        "progress": {
          "current": 6,
          "target": 10,
          "percentage": 60
        }
      }
    ]
  }
}
```

### Check Achievement Progress

```http
POST /gamification/achievement/check
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "achievement_ids": ["recycling_hero", "compost_master"] // Optional: specific achievements
}
```

### Get Leaderboards

```http
GET /gamification/leaderboard?type=global&timeframe=weekly&page=1&limit=50
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `type`: global, province, friends
- `timeframe`: daily, weekly, monthly, all_time
- `page`: Page number
- `limit`: Results per page (max 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user_id": "user_123",
        "display_name": "EcoMaster",
        "province": "กรุงเทพมหานคร",
        "avatar_url": "https://storage.carbon-pixels.com/avatars/user_123.jpg",
        "total_credits": 5420,
        "current_level": 5,
        "level_name": "Planet Protector",
        "trees_saved": 10,
        "is_current_user": false,
        "is_friend": true
      }
    ],
    "current_user": {
      "rank": 1543,
      "total_credits": 1250,
      "rank_change": "+50" // Change since last week
    }
  },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 125000,
    "total_pages": 2500
  }
}
```

### Get Today's Challenges

```http
GET /gamification/challenges/today
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "daily_challenges": [
      {
        "id": "challenge_scan_5",
        "title_th": "สแกนขยะ 5 ชิ้น",
        "title_en": "Scan 5 Items",
        "description_th": "สแกนขยะ 5 ชิ้นวันนี้",
        "description_en": "Scan 5 waste items today",
        "target_value": 5,
        "credits_reward": 20,
        "progress": {
          "current": 3,
          "completed": false
        },
        "expires_at": "2024-01-15T23:59:59.000Z"
      }
    ]
  }
}
```

### Update Challenge Progress

```http
POST /gamification/challenges/progress
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "challenge_id": "challenge_scan_5",
  "progress_increment": 1 // Add to current progress
}
```

## 5. Social & Community Service

### Get Friends List

```http
GET /social/friends?status=accepted&page=1&limit=20
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `status`: pending, accepted, sent (default: accepted)
- `page`: Page number
- `limit`: Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "user_id": "friend_123",
        "display_name": "มาลี ใจดี", 
        "username": "mali_eco",
        "avatar_url": "https://storage.carbon-pixels.com/avatars/friend_123.jpg",
        "province": "เชียงใหม่",
        "current_level": 4,
        "total_credits": 3200,
        "trees_saved": 6,
        "last_active": "2024-01-15T09:30:00.000Z",
        "friendship_date": "2024-01-05T10:00:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### Send Friend Request

```http
POST /social/friends/request
Authorization: Bearer {access_token}
Content-Type: application/json
Rate Limit: 20 requests per hour

{
  "username": "eco_warrior_bkk" // or phone_number: "+66812345678"
}
```

### Accept Friend Request

```http
PUT /social/friends/accept/{request_id}
Authorization: Bearer {access_token}
```

### Get Activity Feed

```http
GET /social/feed?page=1&limit=20
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "user": {
          "user_id": "friend_123",
          "display_name": "มาลี ใจดี",
          "avatar_url": "https://storage.carbon-pixels.com/avatars/friend_123.jpg"
        },
        "activity_type": "level_up",
        "activity_data": {
          "old_level": 3,
          "new_level": 4,
          "level_name": "Climate Hero"
        },
        "created_at": "2024-01-15T10:15:00.000Z"
      },
      {
        "id": "activity_124",
        "user": {
          "user_id": "friend_456",
          "display_name": "สมชาย รักษ์โลก",
          "avatar_url": "https://storage.carbon-pixels.com/avatars/friend_456.jpg"
        },
        "activity_type": "achievement_unlocked",
        "activity_data": {
          "achievement_id": "tree_saver",
          "achievement_name": "Tree Saver",
          "achievement_icon": "🌳"
        },
        "created_at": "2024-01-15T09:45:00.000Z"
      }
    ]
  }
}
```

### Generate Referral Code

```http
POST /social/referral/generate
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referral_code": "ECO2024THAI",
    "referral_url": "https://carbon-pixels.com/join?ref=ECO2024THAI",
    "expires_at": "2024-04-15T00:00:00.000Z",
    "max_uses": 10,
    "current_uses": 0,
    "reward_credits": 100
  }
}
```

### Redeem Referral Code

```http
POST /social/referral/redeem
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "referral_code": "ECO2024THAI"
}
```

## 6. Analytics Service

### Get Personal Analytics

```http
GET /analytics/user/impact?timeframe=monthly
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `timeframe`: daily, weekly, monthly, yearly

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "monthly",
    "period": "2024-01",
    "total_entries": 89,
    "total_weight_kg": 23.4,
    "total_credits": 1240,
    "co2_saved_kg": 1.24,
    "trees_equivalent": 2.48,
    "categories_breakdown": {
      "food_waste": {
        "entries": 35,
        "weight_kg": 12.1,
        "credits": 520,
        "percentage": 41.9
      },
      "plastic_bags": {
        "entries": 28,
        "weight_kg": 4.2, 
        "credits": 380,
        "percentage": 30.6
      }
    },
    "daily_trend": [
      {
        "date": "2024-01-01",
        "entries": 3,
        "credits": 45
      }
    ]
  }
}
```

### Get Comparison Analytics

```http
GET /analytics/user/comparison
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_stats": {
      "total_credits": 1240,
      "monthly_credits": 340,
      "trees_saved": 2.48
    },
    "comparisons": {
      "national_average": {
        "monthly_credits": 180,
        "performance": "+88.9%",
        "percentile": 78
      },
      "province_average": {
        "monthly_credits": 220,
        "performance": "+54.5%",
        "percentile": 65
      },
      "friends_average": {
        "monthly_credits": 280,
        "performance": "+21.4%",
        "percentile": 58
      }
    }
  }
}
```

### Get Thailand National Impact

```http
GET /analytics/impact/national?timeframe=monthly
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "monthly", 
    "period": "2024-01",
    "total_users": 125000,
    "active_users": 89000,
    "total_entries": 2340000,
    "total_weight_kg": 567000,
    "total_credits": 12400000,
    "co2_saved_tonnes": 1240,
    "trees_equivalent": 24800,
    "top_provinces": [
      {
        "province": "กรุงเทพมหานคร",
        "users": 35000,
        "credits": 4200000,
        "trees_saved": 8400
      }
    ],
    "category_breakdown": {
      "food_waste": 32.5,
      "plastic_bags": 28.3,
      "plastic_bottles": 15.7,
      "paper_cardboard": 12.1,
      "other": 11.4
    }
  }
}
```

## 7. Real-Time Features

### WebSocket Connection

```typescript
// Connection endpoint
wss://api.carbon-pixels.com/ws?token={jwt_token}

// Message format
{
  "type": "subscribe|unsubscribe|message",
  "channel": "user.{user_id}.gamification",
  "data": {...}
}

// Available channels
user.{user_id}.gamification     // Achievements, level ups
user.{user_id}.challenges       // Challenge progress
user.{user_id}.social          // Friend activities  
leaderboard.live               // Live leaderboard updates
community.{challenge_id}       // Community challenge progress
```

### Push Notifications

```http
POST /notifications/register
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "device_token": "fcm_device_token_123",
  "platform": "web|ios|android",
  "preferences": {
    "daily_reminder": true,
    "achievements": true,
    "friends": true,
    "challenges": false
  }
}
```

### Webhook Events (for external integrations)

```http
POST https://your-app.com/webhooks/carbon-pixels
Content-Type: application/json
X-Carbon-Pixels-Signature: sha256=abc123

{
  "event": "user.achievement.unlocked",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "achievement_id": "tree_saver",
    "credits_earned": 300,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Handling Examples

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid waste entry data",
    "details": {
      "weight_kg": "Must be between 0.01 and 100",
      "category_id": "Invalid category identifier"
    },
    "request_id": "req_abc123"
  }
}
```

### Rate Limiting Error

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "limit": 60,
      "remaining": 0,
      "reset_at": "2024-01-15T11:00:00.000Z"
    },
    "request_id": "req_def456"
  }
}
```

### Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "AUTH_EXPIRED",
    "message": "Access token has expired",
    "details": {
      "expired_at": "2024-01-15T10:00:00.000Z"
    },
    "request_id": "req_ghi789"
  }
}
```

## SDKs and Client Libraries

### JavaScript/TypeScript SDK

```typescript
import { CarbonPixelsAPI } from '@carbon-pixels/sdk';

const api = new CarbonPixelsAPI({
  baseUrl: 'https://api.carbon-pixels.com/v1',
  apiKey: 'your_api_key'
});

// Create waste entry
const entry = await api.waste.createEntry({
  categoryId: 'plastic_bags',
  disposalMethod: 'recycled',
  weightKg: 0.5
});

// Get user profile
const profile = await api.user.getProfile();

// Subscribe to real-time updates
api.realtime.subscribe('gamification', (event) => {
  console.log('Achievement unlocked:', event.data);
});
```

This comprehensive API specification provides the foundation for building a scalable, feature-rich backend for the carbon-pixels Thailand waste diary application. The APIs are designed to support all current features while enabling future enhancements and viral growth capabilities.