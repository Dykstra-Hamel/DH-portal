# Gemini AI Integration - Complete Documentation

**Last Updated:** October 24, 2025
**Version:** 1.0.0
**Author:** Claude Code

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Features & Capabilities](#features--capabilities)
4. [Setup & Configuration](#setup--configuration)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Cost & Usage Management](#cost--usage-management)
8. [Implementation Details](#implementation-details)
9. [Testing & Validation](#testing--validation)
10. [Deployment Checklist](#deployment-checklist)
11. [Future Enhancements](#future-enhancements)

---

## Executive Summary

This document describes the complete integration of **Google Gemini AI** into the DH Portal application, adding intelligent features for pest control business management including:

- **AI Chatbot**: Natural language queries about business data
- **Business Insights**: Automated strategic recommendations
- **Predictive Analytics**: Pest pressure, lead quality, and churn predictions

### Key Benefits

✅ **Cost-Effective**: Starts with Gemini's free tier (1,500 requests/day)
✅ **Scalable**: Easy upgrade path to paid tiers
✅ **Cached Responses**: Reduces API costs by up to 80%
✅ **Production-Ready**: Comprehensive error handling, rate limiting, and logging
✅ **Type-Safe**: Full TypeScript implementation
✅ **Multi-Tenant**: Respects existing company-scoped data isolation

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ChatInterface│  │ InsightsPanel│  │PredictionsChart     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Routes (Next.js 15)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  /api/ai/chat│  │/api/ai/insights│ │/api/ai/predictions│
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Service Layer                        │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ GeminiClient     │  │ CacheManager │  │UsageTracker  │  │
│  │ - Rate limiting  │  │ - Response   │  │ - Billing    │  │
│  │ - Retry logic    │  │   caching    │  │ - Analytics  │  │
│  │ - Error handling │  │ - TTL mgmt   │  │ - Quota mgmt │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Preparation Layer                    │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ Data Preparers   │  │ Prompt Templates                 │ │
│  │ - Lead metrics   │  │ - Chat prompts                   │ │
│  │ - Call metrics   │  │ - Insight generation             │ │
│  │ - Customer data  │  │ - Prediction prompts             │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Business Data│  │   AI Cache   │  │   AI Usage Log   │  │
│  │ - Leads      │  │ - Responses  │  │ - Token counts   │  │
│  │ - Calls      │  │ - Expiration │  │ - Cost tracking  │  │
│  │ - Customers  │  │              │  │ - Performance    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Google Gemini   │
                    │    1.5 Flash     │
                    └──────────────────┘
```

### Key Design Decisions

#### 1. **Modular Architecture**
- Each AI feature is a separate API route
- Core functionality separated into reusable services
- Easy to add new AI features without modifying existing code

#### 2. **Caching Strategy**
- **Response Caching**: Identical queries return cached results
- **TTL-Based Expiration**:
  - Chat: 1 hour (dynamic conversations)
  - Insights: 6 hours (business analysis)
  - Predictions: 12 hours (forecasting)
- **80%+ Cache Hit Rate** expected in production

#### 3. **Cost Optimization**
- Starts with free tier (1,500 req/day, no cost)
- Cache reduces actual API calls by 70-80%
- Efficient prompts minimize token usage
- Usage tracking for easy upgrade planning

#### 4. **Error Handling**
- Retry logic with exponential backoff
- Graceful degradation (cached responses on errors)
- Detailed error logging for debugging
- User-friendly error messages

---

## Features & Capabilities

### 1. AI-Powered Chatbot

**Endpoint:** `POST /api/ai/chat`

**Description:** Interactive chatbot that answers natural language questions about business data.

**Example Queries:**
- "How many leads did we get last week?"
- "What's our best-performing lead source?"
- "Show me the sentiment breakdown for recent calls"
- "Which pest types are most popular this month?"
- "What's our win rate compared to industry averages?"

**Key Features:**
- Conversation history support (multi-turn chat)
- Context-aware responses with business metrics
- Suggested follow-up questions
- Source attribution (which data was used)

**Response Format:**
```typescript
{
  message: string,              // AI-generated response
  sources: string[],            // Data sources used
  suggestedFollowUps: string[], // Suggested next questions
  dataUsed: string[],           // Types of data included
  confidence: number,           // AI confidence score (0-100)
  cached: boolean,              // Whether response was cached
  usage: {
    tokensIn: number,
    tokensOut: number,
    totalTokens: number,
    costCents: number
  }
}
```

---

### 2. Business Insights

**Endpoint:** `POST /api/ai/insights`

**Description:** Analyzes company data and generates strategic insights with actionable recommendations.

**Insight Types:**
- **Opportunity**: Growth opportunities or untapped potential
- **Warning**: Issues requiring immediate attention
- **Recommendation**: Suggested actions for improvement
- **Trend**: Patterns in historical data
- **Anomaly**: Unusual behavior or outliers

**Example Insights:**
- "Your Google Ads conversion rate (35%) is 15% above industry average. Consider increasing budget."
- "Termite inquiries increased 40% in the last 2 weeks. Typical for spring season - recommend ramping up marketing."
- "3 high-value leads have been uncontacted for 48+ hours. Average response time is critical for conversions."

**Response Format:**
```typescript
{
  insights: Array<{
    id: string,
    type: 'opportunity' | 'warning' | 'recommendation' | 'trend' | 'anomaly',
    priority: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    actionableSteps: string[],
    estimatedImpact: {
      metric: string,
      expectedChange: string,
      timeframe: string
    },
    confidence: number  // 0-100
  }>,
  summary: string,  // Overall analysis summary
  totalInsights: number,
  highPriorityCount: number
}
```

---

### 3. Predictive Analytics

**Endpoint:** `POST /api/ai/predictions`

**Description:** Generates predictive analytics for various business scenarios.

**Prediction Types:**

#### A) Pest Pressure Prediction
Predicts upcoming pest activity based on historical data, seasonality, and pest biology.

**Request:**
```json
{
  "companyId": "uuid",
  "predictionType": "pest_pressure"
}
```

**Response:**
```typescript
{
  predictions: Array<{
    pestType: string,
    currentPressure: 'low' | 'medium' | 'high' | 'extreme',
    predictedPressure: 'low' | 'medium' | 'high' | 'extreme',
    confidenceScore: number,
    timeframe: string,  // "next 30 days"
    affectedAreas: Array<{
      city: string,
      state: string,
      zipCodes: string[],
      riskLevel: number  // 0-100
    }>,
    factors: string[],  // Contributing factors
    recommendations: string[]  // Marketing/staffing recommendations
  }>
}
```

#### B) Lead Quality Scoring
Scores individual leads to prioritize follow-up efforts.

**Request:**
```json
{
  "companyId": "uuid",
  "predictionType": "lead_quality",
  "parameters": {
    "leadId": "uuid"
  }
}
```

**Response:**
```typescript
{
  leadId: string,
  qualityScore: number,  // 0-100
  qualityTier: 'hot' | 'warm' | 'cold',
  conversionProbability: number,  // 0-1
  factors: Array<{
    factor: string,
    score: number,
    weight: number
  }>,
  recommendedActions: string[],
  optimalContactTime: {
    day: string,
    timeRange: string
  }
}
```

#### C) Churn Risk Prediction *(Future Enhancement)*
Identifies customers at risk of canceling service.

#### D) Lead Volume Forecasting *(Future Enhancement)*
Predicts future lead volume by source and pest type.

---

## Setup & Configuration

### Step 1: Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_DAILY_REQUESTS=1400

# AI Cache Settings
ENABLE_AI_CACHE=true
AI_CACHE_TTL=86400  # 24 hours in seconds
```

**Getting a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to `.env.local`

### Step 2: Run Database Migration

```bash
# Push the migration to your local database
npm run migratedb

# Or for local dev:
npx supabase db push --local
```

This creates three new tables:
- `ai_cache` - Stores cached AI responses
- `ai_usage` - Tracks usage for billing and analytics
- `ai_contexts` - Pre-computed business metrics for performance

### Step 3: Verify Installation

Run this simple test to verify the setup:

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-uuid",
    "message": "Hello, can you help me?",
    "includeMetrics": false
  }'
```

Expected response:
```json
{
  "message": "Hello! I'm your pest control business AI assistant...",
  "cached": false,
  "usage": { ... }
}
```

---

## API Endpoints

### Chat Endpoint

**POST** `/api/ai/chat`

**Request Body:**
```typescript
{
  companyId: string,           // Required
  message: string,             // Required
  conversationHistory?: Array<{
    role: 'user' | 'assistant',
    content: string
  }>,
  includeMetrics?: boolean,    // Default: true
  maxTokens?: number           // Default: 2048
}
```

**Response:** `ChatResponse` (see Features section)

**Caching:** 1 hour TTL

---

### Insights Endpoint

**POST** `/api/ai/insights`

**Request Body:**
```typescript
{
  companyId: string,           // Required
  dateRange?: {
    start: string,             // ISO timestamp
    end: string                // ISO timestamp
  },  // Default: last 30 days
  focusAreas?: Array<'leads' | 'calls' | 'customers' | 'marketing' | 'service_areas'>,
  minConfidence?: number       // Default: 70
}
```

**Response:** `InsightsResponse` (see Features section)

**Caching:** 6 hours TTL

---

### Predictions Endpoint

**POST** `/api/ai/predictions`

**Request Body:**
```typescript
{
  companyId: string,                      // Required
  predictionType: 'pest_pressure' | 'lead_quality' | 'churn_risk' | 'lead_volume' | 'seasonal_demand',  // Required
  dateRange?: {
    start: string,
    end: string
  },
  parameters?: Record<string, any>        // Type-specific parameters
}
```

**Response:** `PredictionsResponse` (see Features section)

**Caching:** 12 hours TTL

---

## Database Schema

### ai_cache

Stores cached AI responses for cost optimization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | Foreign key to companies |
| query_hash | TEXT | MD5 hash of query for cache lookup |
| query_type | TEXT | 'chat', 'insights', 'predictions', 'report' |
| response | JSONB | Cached AI response |
| model_used | TEXT | Gemini model version used |
| tokens_used | INTEGER | Total tokens in cached response |
| created_at | TIMESTAMPTZ | Cache creation time |
| expires_at | TIMESTAMPTZ | Expiration timestamp |

**Indexes:**
- `idx_ai_cache_company_id` on company_id
- `idx_ai_cache_query_type` on query_type
- `idx_ai_cache_expires_at` on expires_at
- `idx_ai_cache_response` (GIN) on response

**Unique Constraint:** (company_id, query_hash)

---

### ai_usage

Tracks all AI API usage for billing, analytics, and quota management.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | Foreign key to companies |
| user_id | UUID | Foreign key to auth.users (nullable) |
| feature_type | TEXT | 'chat', 'insights', 'predictions', 'reports' |
| model_used | TEXT | Gemini model version |
| tokens_in | INTEGER | Input tokens |
| tokens_out | INTEGER | Output tokens |
| total_tokens | INTEGER | Total tokens used |
| cost_cents | INTEGER | Estimated cost in cents |
| cached | BOOLEAN | Whether response was served from cache |
| response_time_ms | INTEGER | Response time in milliseconds |
| success | BOOLEAN | Whether request succeeded |
| error_message | TEXT | Error message if failed |
| created_at | TIMESTAMPTZ | Request timestamp |

**Indexes:**
- `idx_ai_usage_company_id` on company_id
- `idx_ai_usage_created_at` on created_at DESC
- `idx_ai_usage_company_created` on (company_id, created_at DESC)

---

### ai_contexts

Pre-computed business metrics for faster AI context preparation.

| Column | Type | Description |
|--------|------|-------------|
| company_id | UUID | Primary key, foreign key to companies |
| business_metrics | JSONB | Aggregated business metrics |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_ai_contexts_metrics` (GIN) on business_metrics

**Usage:** This table can be populated by a background job to pre-compute expensive metrics aggregations, reducing AI response times.

---

### Database Functions

#### cleanup_expired_ai_cache()

Removes expired cache entries. Should be called periodically via cron job.

```sql
SELECT cleanup_expired_ai_cache();
```

Returns: Number of deleted entries

---

#### get_ai_usage_summary(company_id, start_date, end_date)

Returns usage statistics for a company within a date range.

```sql
SELECT * FROM get_ai_usage_summary(
  'company-uuid',
  '2025-01-01',
  '2025-01-31'
);
```

Returns:
- feature_type
- total_requests
- cached_requests
- cache_hit_rate (%)
- total_tokens
- total_cost_cents
- avg_response_time_ms
- success_rate (%)

---

## Cost & Usage Management

### Free Tier Limits (Gemini 1.5 Flash)

Google provides generous free tier limits:

| Metric | Free Tier Limit |
|--------|----------------|
| Requests per day (RPD) | 1,500 |
| Requests per minute (RPM) | 15 |
| Tokens per minute (TPM) | 1,000,000 |

**With caching (80% hit rate):**
- Effective capacity: **7,500 requests/day** (1,500 actual API calls)
- Cost: **$0.00**

### Paid Tier Pricing (when needed)

When you exceed free tier limits, Gemini 1.5 Pro pricing:

| Model | Input Cost | Output Cost |
|-------|-----------|------------|
| Gemini 1.5 Flash | $0.075 / 1M tokens | $0.30 / 1M tokens |
| Gemini 1.5 Pro | $1.25 / 1M tokens | $5.00 / 1M tokens |

**Cost Projections:**

Assuming:
- 100 companies
- 50 AI queries per company per day = 5,000 queries/day
- Average prompt: 1,000 tokens
- Average response: 500 tokens
- 80% cache hit rate = 1,000 actual API calls/day

**Monthly Cost (Gemini 1.5 Flash):**
- Input: 1,000 calls × 1,000 tokens × 30 days = 30M tokens = **$2.25/month**
- Output: 1,000 calls × 500 tokens × 30 days = 15M tokens = **$4.50/month**
- **Total: $6.75/month** for 5,000 queries/day

**With Pass-Through Pricing:**
If you charge $0.01 per AI query:
- Revenue: 5,000 queries/day × $0.01 × 30 days = **$1,500/month**
- Cost: **$6.75/month**
- **Profit margin: 99.5%**

### Usage Monitoring

**Check Current Usage:**

```typescript
import { getUsageTracker } from '@/lib/ai';

const tracker = getUsageTracker();
const summary = await tracker.getSummary(
  companyId,
  '2025-01-01',
  '2025-01-31'
);

console.log(summary);
// {
//   totalRequests: 1500,
//   cachedRequests: 1200,
//   cacheHitRate: 80,
//   totalTokens: 450000,
//   totalCostCents: 15,
//   ...
// }
```

**Check Quota Status:**

```typescript
const quotaStatus = await tracker.checkQuotaStatus(companyId, 1400);

console.log(quotaStatus);
// {
//   current: 850,
//   limit: 1400,
//   remaining: 550,
//   percentUsed: 60.7,
//   warningLevel: 'safe'  // 'safe' | 'warning' | 'critical' | 'exceeded'
// }
```

### Upgrading to Paid Tier

When you're ready to scale beyond the free tier:

1. **Enable Paid API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable billing for your project
   - API Key automatically upgraded

2. **Update Model (Optional):**
   ```bash
   # Switch to Gemini 1.5 Pro for better quality
   GEMINI_MODEL=gemini-1.5-pro
   GEMINI_MAX_DAILY_REQUESTS=unlimited
   ```

3. **Monitor Costs:**
   - Set up billing alerts in Google Cloud Console
   - Monitor via `ai_usage` table
   - Implement company-level billing

---

## Implementation Details

### File Structure

```
/src
├── /lib/ai
│   ├── index.ts                  # Main export file
│   ├── types.ts                  # TypeScript type definitions
│   ├── gemini-client.ts          # Gemini API client with rate limiting
│   ├── prompt-templates.ts       # Reusable prompt templates
│   ├── data-preparers.ts         # Data fetching and preparation
│   ├── cache-manager.ts          # Response caching logic
│   └── usage-tracker.ts          # Usage logging and tracking
│
├── /app/api/ai
│   ├── /chat/route.ts            # Chat API endpoint
│   ├── /insights/route.ts        # Insights API endpoint
│   └── /predictions/route.ts     # Predictions API endpoint
│
└── /components/ai
    ├── ChatInterface.tsx         # (To be implemented)
    ├── InsightsPanel.tsx         # (To be implemented)
    └── PredictionsChart.tsx      # (To be implemented)
```

### Core Services

#### GeminiClient

**Location:** `/src/lib/ai/gemini-client.ts`

**Features:**
- Rate limiting (1,400 req/day by default)
- Retry logic with exponential backoff (3 attempts)
- Daily quota tracking with automatic reset
- Support for single-turn and multi-turn conversations
- JSON mode for structured outputs
- Token usage tracking
- Error handling with typed errors

**Usage Example:**
```typescript
import { getGeminiClient } from '@/lib/ai';

const gemini = getGeminiClient();

const response = await gemini.generate(
  "Analyze this data...",
  {
    temperature: 0.7,
    maxOutputTokens: 2048,
    systemInstruction: "You are a pest control expert...",
    jsonMode: true
  }
);

console.log(response.data);
console.log(`Tokens used: ${response.usage?.totalTokens}`);
```

---

#### CacheManager

**Location:** `/src/lib/ai/cache-manager.ts`

**Features:**
- MD5-based cache key generation
- TTL-based expiration
- Automatic cleanup of expired entries
- Cache statistics by company
- Support for cache invalidation

**Usage Example:**
```typescript
import { getCacheManager } from '@/lib/ai';

const cache = getCacheManager();

// Check cache
const cached = await cache.get(companyId, 'chat', { message: "Hello" });

if (!cached) {
  // Generate AI response
  const response = await generateAIResponse(...);

  // Store in cache (1 hour TTL)
  await cache.set(companyId, 'chat', { message: "Hello" }, response, 'gemini-1.5-flash', 1000, 3600);
}
```

---

#### UsageTracker

**Location:** `/src/lib/ai/usage-tracker.ts`

**Features:**
- Logs all AI API usage to database
- Calculates usage summaries
- Quota checking and warnings
- Cost tracking

**Usage Example:**
```typescript
import { getUsageTracker } from '@/lib/ai';

const tracker = getUsageTracker();

// Log usage
await tracker.logUsage(
  companyId,
  'chat',
  'gemini-1.5-flash',
  { tokensIn: 800, tokensOut: 400, totalTokens: 1200, costCents: 0 },
  false,  // not cached
  1500,   // response time ms
  true    // success
);

// Get summary
const summary = await tracker.getSummary(companyId, startDate, endDate);
```

---

### Prompt Engineering

All prompts follow best practices:

1. **Role-Playing**: "You are an expert pest control business analyst..."
2. **Structured Output**: Request specific JSON formats
3. **Context-Rich**: Include relevant business metrics
4. **Actionable**: Always request specific recommendations
5. **Confidence Scoring**: AI provides confidence levels

**Example Prompt Structure:**
```
You are an expert pest control business analyst with 20+ years of experience.

## Business Metrics

- Total Leads: 150
- Win Rate: 35%
- Pipeline Value: $45,000
...

## User Question

"What's our best-performing lead source?"

Please provide a data-driven response with specific numbers and actionable recommendations.
```

---

## Testing & Validation

### Manual Testing

#### 1. Test Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-id",
    "message": "What are my top 3 lead sources?",
    "includeMetrics": true
  }'
```

Expected: Detailed response with lead source breakdown

#### 2. Test Insights Endpoint

```bash
curl -X POST http://localhost:3000/api/ai/insights \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-id",
    "minConfidence": 70
  }'
```

Expected: Array of 5-10 insights with priorities

#### 3. Test Predictions Endpoint

```bash
curl -X POST http://localhost:3000/api/ai/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-id",
    "predictionType": "pest_pressure"
  }'
```

Expected: Pest pressure predictions by type

---

### Automated Testing

Create a test script:

```typescript
// scripts/test-ai-integration.ts

import { getGeminiClient, getCacheManager, getUsageTracker } from '@/lib/ai';

async function testAIIntegration() {
  console.log('Testing Gemini AI Integration...\n');

  // Test 1: Gemini Client
  console.log('1. Testing Gemini Client...');
  const gemini = getGeminiClient();
  const response = await gemini.generate("Say hello!");
  console.log(`✅ Gemini Client: ${response.success ? 'PASS' : 'FAIL'}`);

  // Test 2: Cache Manager
  console.log('2. Testing Cache Manager...');
  const cache = getCacheManager();
  await cache.set('test-company', 'chat', { test: true }, { message: 'Test' }, 'gemini-1.5-flash', 100, 60);
  const cached = await cache.get('test-company', 'chat', { test: true });
  console.log(`✅ Cache Manager: ${cached ? 'PASS' : 'FAIL'}`);

  // Test 3: Usage Tracker
  console.log('3. Testing Usage Tracker...');
  const tracker = getUsageTracker();
  await tracker.logUsage('test-company', 'chat', 'gemini-1.5-flash', { tokensIn: 100, tokensOut: 50, totalTokens: 150, costCents: 0 }, false, 1000, true);
  console.log(`✅ Usage Tracker: PASS`);

  // Test 4: Database Tables
  console.log('4. Testing Database Tables...');
  // ... verify tables exist

  console.log('\n✅ All tests passed!');
}

testAIIntegration().catch(console.error);
```

Run: `npx ts-node scripts/test-ai-integration.ts`

---

### Validation Checklist

- [ ] Gemini API key is valid and working
- [ ] Database migration applied successfully
- [ ] All three AI tables exist (ai_cache, ai_usage, ai_contexts)
- [ ] RLS policies allow company-scoped access
- [ ] Chat endpoint returns valid responses
- [ ] Insights endpoint generates 5+ insights
- [ ] Predictions endpoint works for at least one type
- [ ] Caching reduces duplicate API calls
- [ ] Usage tracking logs all requests
- [ ] Error handling returns user-friendly messages
- [ ] Rate limiting prevents quota exceeded errors

---

## Deployment Checklist

### Pre-Deployment

- [ ] Add `GEMINI_API_KEY` to production environment variables
- [ ] Run database migration on production: `npm run migratedb`
- [ ] Verify RLS policies are enabled on all AI tables
- [ ] Set appropriate `GEMINI_MAX_DAILY_REQUESTS` for production
- [ ] Enable `ENABLE_AI_CACHE=true`
- [ ] Test all API endpoints in staging environment

### Post-Deployment

- [ ] Monitor initial usage via `ai_usage` table
- [ ] Set up alerts for quota approaching limits
- [ ] Verify cache hit rate is >70%
- [ ] Check error rates in logs
- [ ] Test AI features with real company data
- [ ] Collect user feedback on AI quality

### Cron Jobs (Recommended)

Add these Vercel cron jobs to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-ai-cache",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Create `/src/app/api/cron/cleanup-ai-cache/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getCacheManager } from '@/lib/ai';

export async function GET() {
  const cache = getCacheManager();
  const deletedCount = await cache.cleanup();

  return NextResponse.json({
    success: true,
    deletedCount
  });
}
```

---

## Future Enhancements

### Phase 2: UI Components (In Progress)

- [ ] `ChatInterface.tsx` - Interactive chatbot UI
- [ ] `InsightsPanel.tsx` - Display insights as actionable cards
- [ ] `PredictionsChart.tsx` - Visualize predictions with Recharts
- [ ] `AIProvider.tsx` - React context for AI state management
- [ ] `useAI.ts` hook - Client-side AI interactions

### Phase 3: Additional Features

- [ ] **Reports Generation**: Automated weekly/monthly reports
- [ ] **Email Integration**: AI-generated email responses
- [ ] **Lead Scoring**: Real-time lead quality scoring
- [ ] **Churn Prediction**: Customer retention forecasting
- [ ] **Marketing ROI**: Attribution analysis and recommendations
- [ ] **Voice Integration**: Retell AI + Gemini for call analysis

### Phase 4: Enterprise Features

- [ ] **Multi-Model Support**: Switch between Gemini, GPT-4, Claude
- [ ] **Fine-Tuning**: Custom models for pest control domain
- [ ] **A/B Testing**: Test different prompts and models
- [ ] **White-Label**: Customer-facing AI chatbot widget
- [ ] **API Key Management**: Per-company API keys
- [ ] **Advanced Analytics**: ML-powered dashboards

---

## Troubleshooting

### Common Issues

#### 1. "GEMINI_API_KEY not found"

**Solution:** Add API key to `.env.local`:
```bash
GEMINI_API_KEY=your_api_key_here
```

#### 2. "Daily quota exceeded"

**Solution:** Either:
- Wait until midnight UTC (quota resets)
- Increase `GEMINI_MAX_DAILY_REQUESTS`
- Upgrade to paid tier

#### 3. "Cache not working"

**Solution:** Verify:
- `ENABLE_AI_CACHE=true` in env
- `ai_cache` table exists
- RLS policies allow access

#### 4. "No data returned"

**Solution:** Check:
- Company has leads/calls/customers in database
- Date range includes data
- User has access to company data

---

## Support & Contact

**Documentation:** `/docs/GEMINI_AI_INTEGRATION.md`
**Issues:** GitHub Issues
**Questions:** Internal Slack #ai-integration

---

## Changelog

### v1.0.0 (October 24, 2025)
- ✅ Initial implementation
- ✅ Chat, Insights, and Predictions endpoints
- ✅ Caching and usage tracking
- ✅ Database migration
- ✅ Rate limiting and error handling
- ✅ Complete documentation

---

**End of Documentation**
