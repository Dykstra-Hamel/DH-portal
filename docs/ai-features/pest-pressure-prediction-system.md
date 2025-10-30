# AI-Powered Pest Pressure Prediction System

**Version:** 1.0.0
**Last Updated:** October 27, 2025
**Status:** Phase 1 Implementation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Flow](#data-flow)
4. [Database Schema](#database-schema)
5. [AI Components](#ai-components)
6. [API Reference](#api-reference)
7. [Background Jobs](#background-jobs)
8. [Implementation Guide](#implementation-guide)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Overview

### Purpose

The Pest Pressure Prediction System uses AI and machine learning to analyze historical pest data, call transcripts, form submissions, and weather patterns to:

- **Predict** pest pressure 7-90 days in advance
- **Detect** anomalies and emerging trends in real-time
- **Generate** actionable marketing and operational recommendations
- **Correlate** weather patterns with pest activity
- **Provide** geographic-specific insights

### Key Features

✅ **AI-Powered Analysis** - Google Gemini AI analyzes call transcripts and form submissions
✅ **Weather Integration** - Free Open-Meteo API for historical and forecast data
✅ **Zero Duplicates** - Intelligent source hierarchy prevents double-counting
✅ **Real-time Anomalies** - Hourly detection of unusual pest activity
✅ **Self-Improving** - Models retrain automatically with new data
✅ **Natural Language Insights** - Human-readable recommendations

### Technology Stack

- **AI/ML:** Google Gemini AI (via @google/generative-ai)
- **Statistical Models:** Custom time-series forecasting & anomaly detection
- **Weather API:** Open-Meteo (100% free, no API key required)
- **Database:** PostgreSQL with PostGIS
- **Background Jobs:** Inngest
- **Language:** TypeScript

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Data Sources  │
├─────────────────┤
│ • Call Records  │──┐
│ • Form Submit   │──┼──> Aggregation ──> pest_pressure_data_points
│ • Leads         │──┘      Layer              (deduplicated)
│ • Weather API   │                                 │
└─────────────────┘                                 │
                                                    ▼
┌─────────────────┐                        ┌──────────────┐
│  Gemini AI      │<───────────────────────│   Feature    │
│  Analysis       │                        │  Engineering │
├─────────────────┤                        └──────────────┘
│ • Transcript    │                                 │
│ • Severity      │                                 ▼
│ • Context       │                        ┌──────────────┐
└─────────────────┘                        │  ML Models   │
                                           ├──────────────┤
                                           │ • Seasonal   │
                                           │ • Anomaly    │
                                           └──────────────┘
                                                    │
                                                    ▼
                                           ┌──────────────┐
                                           │ Predictions  │
                                           │   & Alerts   │
                                           └──────────────┘
                                                    │
                                                    ▼
                                           ┌──────────────┐
                                           │ Gemini AI    │
                                           │ Insights Gen │
                                           └──────────────┘
```

### Component Layers

#### 1. Data Ingestion Layer
- Monitors leads, calls, form submissions
- Applies waterfall source logic to prevent duplicates
- Extracts location data for geographic analysis

#### 2. AI Analysis Layer
- Gemini AI analyzes call transcripts
- Extracts pest types, urgency, severity, context
- Normalizes free-text form fields

#### 3. Weather Integration Layer
- Fetches historical weather from Open-Meteo
- Caches data to minimize API calls
- Correlates weather with pest activity

#### 4. ML/Statistical Layer
- Seasonal forecasting models
- Anomaly detection algorithms
- Feature engineering pipeline

#### 5. Insight Generation Layer
- Gemini AI generates natural language insights
- Creates actionable recommendations
- Formats predictions for UI consumption

---

## Data Flow

### Source Hierarchy (Deduplication Logic)

To prevent counting the same pest observation multiple times, we follow a strict source hierarchy:

```typescript
For each Lead:
  1. Check lead.converted_from_ticket_id
     ├─ If EXISTS → Get Ticket
     │   ├─ Check ticket.call_record_id
     │   │   └─ If EXISTS → SOURCE: call_record (HIGHEST PRIORITY)
     │   │
     │   ├─ Else check ticket.form_submission_id
     │   │   └─ If EXISTS → SOURCE: form_submission
     │   │
     │   └─ Else query form_submissions WHERE ticket_id = ticket.id
     │       └─ If EXISTS → SOURCE: form_submission
     │
  2. Else query form_submissions WHERE lead_id = lead.id
     └─ If EXISTS → SOURCE: form_submission (direct form-to-lead)

  3. Else → SOURCE: lead (orphaned/manually created)
```

**Result:** Each pest observation counted exactly once from the richest data source.

### Example Scenarios

**Scenario 1: Inbound Call → Ticket → Lead**
```
Call Record (transcript: "I see ants everywhere")
    ↓ creates
Ticket
    ↓ converts to
Lead (pest_type: "ants")

SOURCE USED: call_record (analyzed transcript)
NOT USED: ticket pest_type, lead pest_type (would be duplicates)
```

**Scenario 2: Web Form → Ticket → Lead**
```
Form Submission (pest_issue: "Termites swarming in garage")
    ↓ creates
Ticket
    ↓ converts to
Lead (pest_type: "termites")

SOURCE USED: form_submission (normalized data)
NOT USED: ticket pest_type, lead pest_type
```

**Scenario 3: Manual Lead Entry**
```
Lead (pest_type: "roaches", no parent ticket/form/call)

SOURCE USED: lead (only source available)
```

---

## Database Schema

### pest_pressure_data_points

Historical pest observations with source tracking.

```sql
CREATE TABLE pest_pressure_data_points (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,

  -- Source tracking (prevents duplicates)
  source_type VARCHAR(20) CHECK (IN 'call', 'form', 'lead', 'manual'),
  source_id UUID NOT NULL,

  -- Pest data
  pest_type VARCHAR(255) NOT NULL,
  pest_mentions_count INT DEFAULT 1,

  -- Location
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  service_area_name VARCHAR(255),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),

  -- Pressure indicators
  urgency_level INT CHECK (BETWEEN 1 AND 10),
  infestation_severity VARCHAR(20) CHECK (IN 'minor', 'moderate', 'severe', 'critical'),

  -- AI analysis
  ai_extracted_context JSONB,
  confidence_score DECIMAL(3, 2),

  -- Temporal
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(source_type, source_id, pest_type)
);
```

**Key Fields:**
- `source_type` + `source_id` - Tracks origin (call/form/lead)
- `pest_mentions_count` - How many times mentioned in transcript
- `urgency_level` - 1-10 scale derived from sentiment/keywords
- `ai_extracted_context` - Symptoms, location in home, duration, concerns
- `observed_at` - When interaction happened (not when data point created)

### weather_cache

Caches weather data from Open-Meteo API.

```sql
CREATE TABLE weather_cache (
  id UUID PRIMARY KEY,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  date DATE NOT NULL,

  -- Weather data
  temp_max_f DECIMAL(5, 2),
  temp_min_f DECIMAL(5, 2),
  temp_avg_f DECIMAL(5, 2),
  precipitation_inches DECIMAL(5, 2),
  humidity_avg_percent DECIMAL(5, 2),

  -- Metadata
  data_source VARCHAR(50) DEFAULT 'open-meteo',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lat, lng, date)
);
```

**Cache Strategy:**
- One record per location per day
- Check cache before API calls
- Daily job refreshes yesterday's weather

### pest_pressure_predictions

Stores generated predictions and anomaly alerts.

```sql
CREATE TABLE pest_pressure_predictions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,

  -- Scope
  pest_type VARCHAR(255) NOT NULL,
  location_city VARCHAR(255),
  location_state VARCHAR(2),
  prediction_window VARCHAR(10) CHECK (IN '7d', '30d', '90d'),

  -- Metrics
  current_pressure DECIMAL(3, 1) CHECK (BETWEEN 0 AND 10),
  predicted_pressure DECIMAL(3, 1) CHECK (BETWEEN 0 AND 10),
  confidence_score DECIMAL(3, 2),

  -- Trend
  trend VARCHAR(20) CHECK (IN 'increasing', 'stable', 'decreasing', 'spike'),
  trend_percentage DECIMAL(5, 2),

  -- Anomaly
  anomaly_detected BOOLEAN DEFAULT FALSE,
  anomaly_severity VARCHAR(20) CHECK (IN 'low', 'medium', 'high', 'critical'),
  anomaly_description TEXT,

  -- Insights (JSONB)
  contributing_factors JSONB,
  recommendations JSONB,

  -- Model metadata
  model_version VARCHAR(50),
  data_points_used INT,
  weather_influence_score DECIMAL(3, 2),

  -- Validity
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL
);
```

**Key Features:**
- Geographic specificity (city/state level)
- Multiple time windows (7/30/90 days)
- Anomaly detection built-in
- Natural language factors & recommendations

### pest_pressure_ml_models

Tracks ML model versions and performance.

```sql
CREATE TABLE pest_pressure_ml_models (
  id UUID PRIMARY KEY,
  company_id UUID,

  model_type VARCHAR(50) CHECK (IN 'seasonal_forecast', 'anomaly_detection'),
  model_version VARCHAR(50) NOT NULL,
  pest_type VARCHAR(255), -- NULL = all pests

  -- Model parameters (lightweight, no files)
  model_parameters JSONB NOT NULL,

  -- Training metadata
  training_data_count INT,
  training_date_range JSONB,
  accuracy_metrics JSONB,

  trained_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

**Model Storage:**
- Parameters stored as JSON (no external files)
- Lightweight statistical models
- Version tracking for experiments

---

## AI Components

### 1. Gemini Transcript Analysis

**Purpose:** Extract structured pest data from unstructured call transcripts.

**Input:** Call transcript text
**Output:** Pest types, urgency, severity, context, confidence

**Example:**

```typescript
Input: "Hi, I've been seeing a lot of ants in my kitchen for the past two weeks.
        They're everywhere - on the counters, in the cabinets. I have small children
        and I'm really worried about food safety."

Output: {
  pestTypes: [{ type: "ants", mentions: 2 }],
  urgency: 7,
  severity: "moderate",
  context: {
    symptoms: ["trails on counters", "in cabinets"],
    location: "kitchen",
    duration: "past two weeks",
    customerConcerns: ["food safety", "has small children"]
  },
  confidence: 0.94
}
```

**Prompt Template:**

```
Analyze this pest control call transcript and extract pest information.

Transcript:
${transcript}

Extract ALL pest types mentioned with context. Return JSON:
{
  "pestTypes": [{"type": "ants", "mentions": 3}],
  "urgency": 7,
  "severity": "moderate",
  "context": {
    "symptoms": ["description of what customer is seeing"],
    "location": "where in home/building",
    "duration": "how long this has been happening",
    "customerConcerns": ["safety", "damage", etc]
  },
  "confidence": 0.92
}

Rules:
- Normalize pest names (e.g., "cockroach" → "roaches")
- Count actual mentions, not every pronoun
- Urgency 1-10: 1=minor annoyance, 10=emergency/health hazard
- Severity: minor (few pests), moderate (noticeable), severe (infestation), critical (dangerous)
- Extract exact quotes for symptoms when possible
```

### 2. Weather Correlation

**Purpose:** Understand how weather affects pest pressure.

**Data Source:** Open-Meteo API (free, no API key)

**Metrics Tracked:**
- Temperature (max, min, average)
- Precipitation (total inches)
- Humidity (average %)

**Correlation Examples:**
- **Termites:** Spike when temp > 70°F + recent rain
- **Mosquitoes:** High after 2+ inches rain + warm temps
- **Ants:** Increase with temperature, seek shelter during heavy rain
- **Roaches:** Active in warm + humid conditions

**Weather Influence Score:**
```
0.0 = No weather impact (e.g., bed bugs - indoor pest)
0.5 = Moderate impact (e.g., ants - temperature sensitive)
1.0 = High impact (e.g., mosquitoes - rain dependent)
```

### 3. Seasonal Forecasting Model

**Type:** Statistical time-series model
**Technique:** Seasonal decomposition + weather adjustment

**Components:**

1. **Baseline:** Historical average pressure for pest type
2. **Seasonal Factor:** Month-specific multiplier (e.g., termites 3x in April)
3. **Trend:** Year-over-year growth/decline
4. **Weather Adjustment:** Temperature/precipitation impact
5. **Confidence:** Based on data volume and consistency

**Formula:**

```
Predicted Pressure =
  Baseline × SeasonalFactor[month] × (1 + Trend) × WeatherAdjustment

Where:
  Baseline = Average of past 2 years same period
  SeasonalFactor = (This month avg / All months avg)
  Trend = Linear regression of year-over-year
  WeatherAdjustment = f(temp, precip, humidity)
```

**Model Parameters (stored in JSON):**

```json
{
  "pestType": "termites",
  "baseline": 5.2,
  "seasonalFactors": {
    "1": 0.3,  // January: very low
    "2": 0.5,
    "3": 1.8,  // March: increasing
    "4": 3.2,  // April: peak swarming
    "5": 2.1,
    "6": 1.0,
    ...
  },
  "trendCoefficient": 0.05,  // 5% annual growth
  "weatherInfluence": {
    "tempCoefficient": 0.15,      // +15% per 10°F above normal
    "precipCoefficient": 0.08,    // +8% per inch above normal
    "humidityCoefficient": 0.05   // +5% per 10% above normal
  },
  "accuracy": 0.84,
  "trainingDataPoints": 1247
}
```

### 4. Anomaly Detection Model

**Type:** Statistical outlier detection
**Technique:** Z-score with rolling window

**Detection Logic:**

```typescript
// Calculate rolling statistics
const historicalMean = average(last_52_weeks);
const historicalStdDev = stddev(last_52_weeks);
const currentWeekPressure = sum(last_7_days);

// Z-score
const zScore = (currentWeekPressure - historicalMean) / historicalStdDev;

// Thresholds
if (zScore > 3.0) {
  severity = "critical";  // 99.7th percentile
} else if (zScore > 2.0) {
  severity = "high";      // 95th percentile
} else if (zScore > 1.5) {
  severity = "medium";    // 86th percentile
}
```

**Anomaly Types:**

1. **Spike:** Sudden increase (>2σ above mean)
2. **Drop:** Sudden decrease (>2σ below mean)
3. **Sustained Elevation:** Above normal for 2+ weeks
4. **Unusual Pattern:** Out-of-season activity

**Model Parameters:**

```json
{
  "pestType": "mosquito",
  "historicalMean": 12.3,
  "historicalStdDev": 4.7,
  "spikeThreshold": 2.0,
  "windowDays": 7,
  "minDataPoints": 52,
  "seasonalAdjusted": true
}
```

---

## API Reference

### GET /api/ai/predictions

**Enhanced Pest Pressure Predictions**

#### Request

```typescript
POST /api/ai/predictions

{
  "companyId": "uuid",
  "predictionType": "pest_pressure",
  "parameters": {
    "predictionWindow": "30d",      // "7d" | "30d" | "90d"
    "includeAnomalies": true,
    "locationFilter": {
      "cities": ["Austin", "Round Rock"],
      "states": ["TX"]
    },
    "pestTypes": ["termites", "ants"]  // Optional filter
  }
}
```

#### Response

```typescript
{
  "predictionType": "pest_pressure",
  "predictions": [
    {
      "pestType": "termites",
      "location": {
        "city": "Austin",
        "state": "TX"
      },
      "window": "30d",
      "currentPressure": 3.2,
      "predictedPressure": 8.1,
      "trend": "increasing",
      "trendPercentage": 152.8,
      "confidence": 0.87,
      "contributingFactors": [
        "Historical swarming season (March-April)",
        "Temperature 5.2°F above 10-year average",
        "Precipitation 1.3 inches above normal",
        "Call volume up 47% vs last year"
      ],
      "recommendations": [
        "Launch termite inspection campaign by March 1st",
        "Prepare for 50% increase in treatment bookings",
        "Stock up on termite treatment materials",
        "Schedule additional technician training"
      ],
      "weatherInfluence": 0.42,
      "dataPointsAnalyzed": 247
    }
  ],
  "anomalies": [
    {
      "pestType": "mosquito",
      "location": {
        "city": "Round Rock",
        "state": "TX"
      },
      "severity": "high",
      "currentPressure": 8.9,
      "expectedPressure": 2.3,
      "deviation": "+287%",
      "description": "Unusual spike: 89 calls in 7 days vs 26 expected",
      "possibleCauses": [
        "Heavy rainfall (2.4 inches past week)",
        "Standing water from storm",
        "Temperature spike (85°F avg)"
      ],
      "urgentRecommendations": [
        "Run emergency mosquito promo THIS WEEK",
        "Alert customers in Round Rock",
        "Increase service capacity immediately"
      ],
      "detectedAt": "2025-10-27T14:00:00Z"
    }
  ],
  "modelVersion": "v1.2.0",
  "generatedAt": "2025-10-27T14:09:24Z",
  "cached": false
}
```

### POST /api/ai/pest-pressure/train

**Trigger Model Training (Admin Only)**

#### Request

```typescript
POST /api/ai/pest-pressure/train

{
  "companyId": "uuid",
  "modelType": "all",  // "seasonal_forecast" | "anomaly_detection" | "all"
  "pestType": null,    // null = all pests, or specific pest
  "lookbackDays": 730  // How much history to use (default 730 = 2 years)
}
```

#### Response

```typescript
{
  "success": true,
  "modelsTrainedCount": 5,
  "models": [
    {
      "pestType": "ants",
      "modelType": "seasonal_forecast",
      "version": "v1.2.0",
      "dataPointsUsed": 1247,
      "accuracy": 0.84,
      "trainedAt": "2025-10-27T14:09:24Z"
    },
    {
      "pestType": "ants",
      "modelType": "anomaly_detection",
      "version": "v1.2.0",
      "dataPointsUsed": 1247,
      "trainedAt": "2025-10-27T14:09:24Z"
    }
  ],
  "duration": 45.3
}
```

---

## Background Jobs

### 1. Aggregate Pest Pressure Data

**Schedule:** Daily at 2:00 AM
**File:** `src/inngest/functions/aggregate-pest-pressure-data.ts`

**Purpose:** Process yesterday's leads/calls/forms into data points.

**Process:**
1. Get all companies
2. For each company:
   - Fetch yesterday's leads
   - Apply waterfall source logic
   - Extract pest data via Gemini (if needed)
   - Insert into `pest_pressure_data_points`
   - Prevent duplicates via UNIQUE constraint

**Monitoring:**
- Check for errors in Inngest dashboard
- Verify data points created = leads processed
- Alert if processing takes > 30 minutes

### 2. Sync Weather Data

**Schedule:** Daily at 3:00 AM
**File:** `src/inngest/functions/sync-weather-data.ts`

**Purpose:** Fetch yesterday's weather for all active locations.

**Process:**
1. Get unique locations from recent data points
2. Fetch yesterday's weather from Open-Meteo
3. Cache in `weather_cache` table
4. Log API calls and latency

**Monitoring:**
- Verify API success rate > 99%
- Check for missing dates
- Alert if cache hit rate < 90%

### 3. Train Pest Pressure Models

**Schedule:** Weekly on Sundays at 4:00 AM
**File:** `src/inngest/functions/train-pest-pressure-models.ts`

**Purpose:** Retrain models with new data.

**Process:**
1. For each company:
   2. For each pest type with sufficient data (>100 points):
      - Train seasonal forecast model
      - Train anomaly detection model
      - Calculate accuracy metrics
      - Store in `pest_pressure_ml_models`
      - Set is_active=true, deactivate old version

**Monitoring:**
- Track model accuracy trends
- Alert if accuracy drops > 10%
- Log training duration

### 4. Generate Pest Predictions

**Schedule:** Daily at 5:00 AM
**File:** `src/inngest/functions/generate-pest-predictions.ts`

**Purpose:** Generate fresh predictions for all companies.

**Process:**
1. For each company:
   2. For each active pest type:
      3. For each time window (7d, 30d, 90d):
         - Load active model
         - Fetch recent data points
         - Fetch weather forecast
         - Generate prediction
         - Store in `pest_pressure_predictions`

**Monitoring:**
- Verify predictions generated for all companies
- Check prediction coverage (all major pests)
- Alert if generation fails

### 5. Detect Pest Anomalies

**Schedule:** Every hour
**File:** `src/inngest/functions/detect-pest-anomalies.ts`

**Purpose:** Real-time anomaly detection and alerting.

**Process:**
1. Get last hour's data points
2. For each company/pest/location:
   - Calculate current pressure
   - Compare to historical baseline
   - Detect anomalies (Z-score)
   - Generate alert if critical/high
   - Update `pest_pressure_predictions` with anomaly flag

**Monitoring:**
- Track false positive rate
- Measure time to detection
- Verify alerts delivered

---

## Implementation Guide

### Phase 1: Database Setup (Week 1)

**Step 1: Run Migrations**

```bash
# In order:
npx supabase db push --local

# Test locally first
# Then production:
npx supabase db push --linked
```

**Step 2: Verify Tables**

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'pest_pressure%';

-- Verify indexes
SELECT indexname FROM pg_indexes
WHERE tablename LIKE 'pest_pressure%';
```

### Phase 2: Data Aggregation (Week 1-2)

**Step 1: Test Waterfall Logic**

```typescript
// Test with sample lead
const lead = await supabase.from('leads').select('*').limit(1).single();
const source = await determinePestSource(lead);
console.log('Source:', source); // Should show correct source type and ID
```

**Step 2: Run Historical Backfill**

```typescript
// Backfill last 2 years
const startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 2);

await aggregatePestPressureData(
  companyId,
  startDate.toISOString(),
  new Date().toISOString()
);
```

**Step 3: Verify Deduplication**

```sql
-- Should be 0 if working correctly
SELECT source_type, source_id, pest_type, COUNT(*)
FROM pest_pressure_data_points
GROUP BY source_type, source_id, pest_type
HAVING COUNT(*) > 1;
```

### Phase 3: Weather Integration (Week 2)

**Step 1: Test API**

```typescript
const weather = await fetchWeatherForLocation(
  30.2672,  // Austin, TX
  -97.7431,
  '2024-01-01',
  '2024-01-31'
);
console.log(weather);
```

**Step 2: Backfill Weather**

```typescript
// Get all unique locations
const locations = await getUniqueLocations();

// Fetch last 2 years weather
for (const loc of locations) {
  await fetchWeatherForLocation(
    loc.lat,
    loc.lng,
    twoYearsAgo,
    today
  );
}
```

### Phase 4: ML Models (Week 2-3)

**Step 1: Train Initial Models**

```typescript
await trainAllModels(companyId);
```

**Step 2: Validate Predictions**

```typescript
// Generate prediction
const prediction = await generatePrediction(
  companyId,
  'termites',
  '30d',
  { city: 'Austin', state: 'TX' }
);

// Compare to actual (for past period)
const actual = await getActualPressure(/*...*/);
const error = Math.abs(prediction - actual);
console.log('MAE:', error);
```

### Phase 5: Background Jobs (Week 3)

**Step 1: Test Jobs Locally**

```typescript
// Trigger manually
await aggregatePestPressureData.invoke({});
```

**Step 2: Deploy to Inngest**

```bash
# Jobs auto-deploy with app
npm run build
git push origin main  # Triggers Vercel deploy
```

**Step 3: Monitor First Runs**

Check Inngest dashboard for:
- Job completion status
- Duration
- Errors
- Output logs

---

## Monitoring & Maintenance

### Key Metrics to Track

#### Data Quality
- **Aggregation Rate:** Data points created per day
- **Source Distribution:** % from calls vs forms vs leads
- **Confidence Scores:** Average AI confidence
- **Duplicate Rate:** Should be 0%

#### Model Performance
- **Prediction Accuracy:** MAE, RMSE
- **Anomaly Detection:** False positive rate
- **Coverage:** % of pests with active models
- **Training Duration:** Time to retrain

#### System Health
- **API Response Time:** predictions endpoint
- **Cache Hit Rate:** weather_cache
- **Job Success Rate:** background jobs
- **Gemini API Quota:** requests per day

### Alerts to Configure

#### Critical
- 🔴 Aggregation job fails
- 🔴 Prediction generation fails
- 🔴 Model accuracy drops >20%

#### Warning
- 🟡 Cache hit rate <80%
- 🟡 Gemini API quota >80%
- 🟡 Job duration >2x normal

#### Info
- 🔵 New anomaly detected (high/critical)
- 🔵 Model retrained successfully
- 🔵 Data points milestone (10K, 50K, 100K)

### Maintenance Tasks

#### Weekly
- Review anomaly alerts (true vs false positives)
- Check model accuracy trends
- Verify weather cache coverage

#### Monthly
- Analyze top-performing predictions
- Review Gemini API costs
- Optimize slow queries

#### Quarterly
- Evaluate TensorFlow upgrade (if accuracy plateaus)
- User feedback survey on prediction quality
- Competitive analysis

---

## Troubleshooting

### Common Issues

#### Issue: No Data Points Being Created

**Symptoms:** `pest_pressure_data_points` table empty

**Diagnosis:**
```sql
-- Check if leads exist
SELECT COUNT(*) FROM leads WHERE company_id = 'xxx';

-- Check aggregation job logs
-- (Check Inngest dashboard)
```

**Solutions:**
1. Verify leads exist in date range
2. Check Gemini API key is set
3. Run aggregation job manually
4. Check logs for errors

#### Issue: Predictions Are Always the Same

**Symptoms:** Predicted pressure = current pressure for all time windows

**Diagnosis:**
```sql
-- Check if models exist
SELECT * FROM pest_pressure_ml_models WHERE company_id = 'xxx';

-- Check model parameters
SELECT model_parameters FROM pest_pressure_ml_models
WHERE pest_type = 'ants' LIMIT 1;
```

**Solutions:**
1. Train models (may not exist yet)
2. Verify sufficient data (>100 points)
3. Check seasonal factors are calculated
4. Review training logs

#### Issue: Weather Data Missing

**Symptoms:** `weather_influence_score` always 0

**Diagnosis:**
```sql
-- Check weather cache
SELECT COUNT(*) FROM weather_cache
WHERE date > NOW() - INTERVAL '30 days';
```

**Solutions:**
1. Run weather sync job
2. Check Open-Meteo API status
3. Verify lat/lng are valid
4. Check for rate limiting

#### Issue: Anomaly Alerts Are Spam

**Symptoms:** Too many false positive anomalies

**Diagnosis:**
```sql
-- Check anomaly rate
SELECT pest_type, COUNT(*) as anomaly_count
FROM pest_pressure_predictions
WHERE anomaly_detected = true
AND generated_at > NOW() - INTERVAL '7 days'
GROUP BY pest_type;
```

**Solutions:**
1. Increase Z-score threshold (2.0 → 2.5)
2. Require minimum data points (>200)
3. Enable seasonal adjustment
4. Increase rolling window (7 days → 14 days)

---

## Future Enhancements

### Phase 2: Advanced ML (Months 12-18)

- Upgrade to TensorFlow LSTM for time-series
- Autoencoder anomaly detection
- Multi-variate regression with 20+ features
- Online learning / continuous training

### Phase 3: Advanced Features

- Customer churn prediction based on pest patterns
- Marketing campaign ROI optimization
- Service scheduling optimization
- Competitive intel integration
- Social media trend analysis

### Phase 4: Platform Features

- Customer-facing predictions (public widget)
- Mobile app notifications
- SMS alerts for critical anomalies
- Integration with CRM/marketing automation
- White-label API for partners

---

## Appendix

### Glossary

- **Pest Pressure:** Measure of pest activity/infestation level (0-10 scale)
- **Anomaly:** Unusual pest activity that deviates from historical patterns
- **Waterfall Logic:** Prioritized source selection to prevent duplicates
- **Seasonal Factor:** Month-specific multiplier for pest activity
- **Z-Score:** Statistical measure of how many standard deviations a value is from mean
- **MAE:** Mean Absolute Error (accuracy metric)
- **RMSE:** Root Mean Square Error (accuracy metric)

### References

- Open-Meteo API: https://open-meteo.com/
- Google Generative AI: https://ai.google.dev/
- Inngest: https://www.inngest.com/docs
- PostGIS: https://postgis.net/

### Support

For questions or issues:
- **Internal:** #ai-features Slack channel
- **Documentation:** /docs/ai-features/
- **API Logs:** Vercel dashboard
- **Job Logs:** Inngest dashboard

---

**Document Version:** 1.0.0
**Last Updated:** October 27, 2025
**Authors:** AI Development Team
**Review Cycle:** Monthly
