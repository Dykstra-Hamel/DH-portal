# Pest Pressure Prediction - Quick Start

## 🚀 5-Minute Setup

### 1. Seed Data (30 seconds)
```bash
npx tsx scripts/seed-pest-pressure-data-simple.ts
```

### 2. Aggregate Data (5 seconds)
```bash
COMPANY_ID="<from-step-1-output>"

curl -X POST http://localhost:3000/api/ai/pest-pressure/aggregate \
  -H "Content-Type: application/json" \
  -d "{\"companyId\": \"$COMPANY_ID\"}"
```

### 3. Train Models (10-30 seconds)
```bash
curl -X POST http://localhost:3000/api/ai/pest-pressure/train \
  -H "Content-Type: application/json" \
  -d "{\"companyId\": \"$COMPANY_ID\"}"
```

### 4. Generate Predictions (5-10 seconds)
```bash
curl -X POST http://localhost:3000/api/ai/predictions \
  -H "Content-Type: application/json" \
  -d "{\"companyId\": \"$COMPANY_ID\", \"predictionType\": \"pest_pressure\"}"
```

## ✅ Verify It Worked

### Check Training Status
```bash
curl "http://localhost:3000/api/ai/pest-pressure/train?companyId=$COMPANY_ID"
```

Should show:
```json
{
  "ready_for_training": true,
  "data_points_available": 75+,
  "models": {
    "seasonal_forecast": { "version": "v...", "accuracy": {...} },
    "anomaly_detection": { "version": "v..." }
  }
}
```

### Check Data Points
```sql
SELECT COUNT(*), pest_type
FROM pest_pressure_data_points
WHERE company_id = 'YOUR_COMPANY_ID'
GROUP BY pest_type;
```

Should show ~60-90 rows across 8 pest types.

### Check Predictions
```sql
SELECT pest_type, prediction_window, predicted_pressure, trend
FROM pest_pressure_predictions
WHERE company_id = 'YOUR_COMPANY_ID'
ORDER BY generated_at DESC
LIMIT 5;
```

Should show 3 predictions (7d, 30d, 90d).

## 🐛 Troubleshooting

### "No active company found"
Create a company in your database first:
```sql
INSERT INTO companies (name, is_active) VALUES ('Test Company', true);
```

### "Insufficient data for training"
Need at least 30 data points. Check:
```bash
curl "http://localhost:3000/api/ai/pest-pressure/aggregate?companyId=$COMPANY_ID"
```

### "No trained model found"
Run step 3 (train models) first before generating predictions.

### Module not found errors
Install dependencies:
```bash
npm install dotenv @supabase/supabase-js
```

## 📚 Full Documentation

See `TESTING_PEST_PRESSURE.md` for:
- Detailed explanations
- SQL verification queries
- Inngest job testing
- Performance expectations
- Clean-up scripts

## 🎯 What You Get

After running these 4 commands, you'll have:

✅ **90 days** of historical pest data
✅ **Trained ML models** with 70-85% accuracy
✅ **7/30/90 day forecasts** with confidence scores
✅ **Natural language insights** from Gemini AI
✅ **Trend analysis** (increasing/stable/decreasing)
✅ **Anomaly detection** ready for real-time alerts

Example prediction:
```json
{
  "pest_type": "all",
  "prediction_window": "30d",
  "current_pressure": 5.2,
  "predicted_pressure": 6.8,
  "trend": "increasing",
  "contributing_factors": [
    "Rising temperatures favor increased pest activity",
    "Recent rainfall creates ideal breeding conditions"
  ],
  "recommendations": [
    "Increase preventive service frequency",
    "Stock up on summer pest control products"
  ]
}
```

## 🔄 Production Deployment

Once testing is complete:

1. Deploy migrations: `npx supabase db push --linked`
2. Set up Inngest cron jobs (auto-scheduled)
3. Configure alerts for critical anomalies
4. Integrate predictions into dashboard UI

Jobs run automatically:
- **Daily 2 AM** - Aggregate new pest data
- **Daily 3 AM** - Sync weather data
- **Weekly Sun 4 AM** - Retrain ML models
- **Daily 5 AM** - Generate fresh predictions
- **Hourly :15** - Detect anomalies
