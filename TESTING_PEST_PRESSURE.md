# Testing Pest Pressure Prediction System

Complete guide for testing the AI-powered pest pressure prediction system locally.

## Prerequisites

1. **Environment variables** (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_local_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

2. **Database migrations applied**:
```bash
npx supabase db push --linked
```

3. **Local dev server running**:
```bash
npm run dev
```

## Step 1: Seed Test Data

### Option A: Using TypeScript Script (Recommended)

```bash
# Install dotenv if not already installed
npm install dotenv

# Run the seeding script
npx tsx scripts/seed-pest-pressure-data-simple.ts
```

This script will:
- ✅ Find your active company
- ✅ Create 90 days of test leads with seasonal patterns
- ✅ Show you the exact commands for next steps

### Option B: Using SQL File

```bash
# Apply the SQL seed file
npx supabase db execute --file supabase/seed/pest_pressure_test_data.sql
```

This creates:
- 90 days of historical data
- Mix of calls, forms, and orphaned leads
- Realistic seasonal patterns (summer peaks, winter lows)
- 5 different cities with proper lat/lng coordinates
- 8 different pest types (ants, termites, roaches, etc.)

## Step 2: Aggregate Data

After seeding, you need to aggregate the leads into pest_pressure_data_points:

```bash
# Get your company ID from the seeding script output
COMPANY_ID="your-company-id-here"

# Run aggregation (processes last 90 days by default)
curl -X POST http://localhost:3000/api/ai/pest-pressure/aggregate \
  -H "Content-Type: application/json" \
  -d "{\"companyId\": \"$COMPANY_ID\"}"
```

Expected response:
```json
{
  "success": true,
  "result": {
    "inserted": 75,
    "skipped": 5,
    "errors": 0
  },
  "date_range": {
    "start": "2024-10-28T00:00:00Z",
    "end": "2025-01-26T00:00:00Z"
  },
  "response_time_ms": 3421
}
```

## Step 3: Verify Data

Check that data was created and aggregated successfully:

```sql
-- Check raw leads
SELECT COUNT(*), pest_type
FROM leads
WHERE company_id = 'YOUR_COMPANY_ID'
  AND created_at > NOW() - INTERVAL '90 days'
GROUP BY pest_type;

-- Check aggregated data points
SELECT COUNT(*), source_type, pest_type
FROM pest_pressure_data_points
WHERE company_id = 'YOUR_COMPANY_ID'
GROUP BY source_type, pest_type;

-- Check aggregation stats via API
curl "http://localhost:3000/api/ai/pest-pressure/aggregate?companyId=YOUR_COMPANY_ID"
```

Expected results:
- **90 leads** across various pest types
- **60-90 data points** (depending on deduplication)
- Source type will be `lead` (since we're creating direct leads for simplicity)

## Step 4: Train ML Models

### Using curl:

```bash
# Get your company ID first
COMPANY_ID="your-company-id-here"

# Train models (takes 10-30 seconds)
curl -X POST http://localhost:3000/api/ai/pest-pressure/train \
  -H "Content-Type: application/json" \
  -d "{\"companyId\": \"$COMPANY_ID\"}"
```

Expected response:
```json
{
  "success": true,
  "models": {
    "seasonal_forecast": {
      "version": "v20251027_1234",
      "accuracy": {
        "mae": 0.85,
        "rmse": 1.12,
        "r_squared": 0.73
      },
      "training_data_count": 75
    },
    "anomaly_detection": {
      "version": "v20251027_1234",
      "training_data_count": 75
    }
  },
  "response_time_ms": 8523
}
```

### Check Training Status:

```bash
# Check if models are ready
curl "http://localhost:3000/api/ai/pest-pressure/train?companyId=$COMPANY_ID"
```

Expected response:
```json
{
  "ready_for_training": true,
  "data_points_available": 75,
  "models": {
    "seasonal_forecast": {
      "version": "v20251027_1234",
      "trained_at": "2025-10-27T12:34:56Z",
      "accuracy": { "mae": 0.85, "r_squared": 0.73 }
    },
    "anomaly_detection": {
      "version": "v20251027_1234",
      "trained_at": "2025-10-27T12:34:56Z"
    }
  }
}
```

## Step 5: Generate Predictions

### Request predictions:

```bash
# Generate predictions for all pests
curl -X POST http://localhost:3000/api/ai/predictions \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\": \"$COMPANY_ID\",
    \"predictionType\": \"pest_pressure\"
  }"
```

Expected response:
```json
{
  "predictionType": "pest_pressure",
  "predictions": [
    {
      "pest_type": "all",
      "prediction_window": "7d",
      "current_pressure": 5.2,
      "predicted_pressure": 6.8,
      "confidence_score": 0.75,
      "trend": "increasing",
      "trend_percentage": 30.8,
      "contributing_factors": [
        "Rising temperatures favor increased pest activity",
        "Recent rainfall creates ideal breeding conditions",
        "Historical data shows seasonal uptick in this region"
      ],
      "recommendations": [
        "Increase preventive service frequency in high-risk areas",
        "Stock up on summer pest control products",
        "Proactively reach out to customers about seasonal services"
      ],
      "anomaly_detected": false,
      "model_version": "v20251027_1234"
    },
    // ... predictions for 30d and 90d windows
  ],
  "dataQuality": {
    "score": 73,
    "notes": [
      "Model trained on 75 data points",
      "Model version: v20251027_1234",
      "Mean error: ±0.9"
    ]
  }
}
```

### Predict for specific pest type:

```bash
curl -X POST http://localhost:3000/api/ai/predictions \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\": \"$COMPANY_ID\",
    \"predictionType\": \"pest_pressure\",
    \"parameters\": {
      \"pestType\": \"termites\",
      \"location\": {
        \"city\": \"Atlanta\",
        \"state\": \"GA\"
      }
    }
  }"
```

## Step 6: Verify Database Records

Check that predictions were stored:

```sql
-- View predictions
SELECT
  pest_type,
  prediction_window,
  current_pressure,
  predicted_pressure,
  trend,
  anomaly_detected,
  generated_at,
  valid_until
FROM pest_pressure_predictions
WHERE company_id = 'YOUR_COMPANY_ID'
ORDER BY generated_at DESC;

-- View trained models
SELECT
  model_type,
  model_version,
  pest_type,
  training_data_count,
  accuracy_metrics,
  trained_at,
  is_active
FROM pest_pressure_ml_models
WHERE company_id = 'YOUR_COMPANY_ID'
ORDER BY trained_at DESC;
```

## Step 7: Test Inngest Background Jobs (Optional)

If you have Inngest running locally:

```bash
# Start Inngest dev server
npx inngest-cli dev

# Then navigate to http://localhost:8288

# Manually trigger jobs:
# 1. aggregate-pest-pressure-data
# 2. sync-weather-data
# 3. train-pest-pressure-models
# 4. generate-pest-predictions
# 5. detect-pest-anomalies
```

## Troubleshooting

### Issue: "Insufficient data for training"

**Solution:** Need at least 30 data points.

```bash
# Check data point count
curl "http://localhost:3000/api/ai/pest-pressure/train?companyId=$COMPANY_ID"

# If low, run aggregation again or create more seed data
```

### Issue: "No trained model found"

**Solution:** Train models first before generating predictions.

```bash
# Train models
curl -X POST http://localhost:3000/api/ai/pest-pressure/train \
  -H "Content-Type: application/json" \
  -d "{\"companyId\": \"$COMPANY_ID\"}"
```

### Issue: Gemini API errors

**Solution:** Check your API key and quota.

```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Get it from: https://aistudio.google.com/app/apikey
```

### Issue: Weather data not loading

**Solution:** Open-Meteo doesn't require an API key, but check network.

```sql
-- Check weather cache
SELECT COUNT(*), date
FROM weather_cache
GROUP BY date
ORDER BY date DESC
LIMIT 10;
```

## Expected Timeline

| Step | Time | Description |
|------|------|-------------|
| Seeding | 30-60s | Creates 90 days of test data |
| Aggregation | 5-10s | Processes leads into data points |
| Training | 10-30s | Trains ML models |
| Prediction | 5-10s | Generates forecasts with AI insights |

## What to Expect

✅ **Seasonal Forecast Model Accuracy:**
- R² (coefficient of determination): 0.65-0.85 (65-85% variance explained)
- MAE (mean absolute error): 0.5-1.5 pressure points
- RMSE (root mean square error): 0.8-2.0 pressure points

✅ **Prediction Confidence:**
- Base confidence: 0.75 (75%)
- Higher with more training data
- Weather correlation improves accuracy

✅ **Anomaly Detection:**
- Z-score threshold: 2.5 (1% false positive rate)
- Severity levels: low, medium, high, critical
- 14-day rolling window

## Clean Up Test Data

```sql
-- Remove test data (careful - this deletes everything!)
DELETE FROM pest_pressure_predictions WHERE company_id = 'YOUR_COMPANY_ID';
DELETE FROM pest_pressure_data_points WHERE company_id = 'YOUR_COMPANY_ID';
DELETE FROM pest_pressure_ml_models WHERE company_id = 'YOUR_COMPANY_ID';
DELETE FROM leads WHERE company_id = 'YOUR_COMPANY_ID' AND lead_source IN ('web_form', 'phone_call', 'referral');
```

## Next Steps

Once testing is complete:

1. **Deploy migrations** to production: `npx supabase db push --linked`
2. **Configure Inngest** cron schedules in production
3. **Monitor logs** for daily aggregation/training
4. **Set up alerts** for critical anomalies
5. **Integrate predictions** into your dashboard UI

## Support

Questions? Check:
- 📚 **Full docs**: `docs/ai-features/pest-pressure-prediction-system.md`
- 🐛 **Issues**: GitHub issues
- 💬 **Discord**: #ai-features channel
