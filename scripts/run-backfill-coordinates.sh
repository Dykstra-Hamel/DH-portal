#!/bin/bash
# Helper script to run backfill-coordinates.ts with proper environment variables

# Production Supabase credentials
export PROD_SUPABASE_URL="https://cwmckkfkcjxznkpdxgie.supabase.co"
export PROD_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3bWNra2ZrY2p4em5rcGR4Z2llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA1NjcwMiwiZXhwIjoyMDY2NjMyNzAyfQ.yBrIGMAo1M7Ny6mTTWLxPqaDlh9t6fBydbhIGNSCW6k"

# Google Places API key
export GOOGLE_PLACES_API_KEY="AIzaSyC_lFuWVrA99PI94O6H52JAoJlw1KDKIts"

# Run the backfill script
npx tsx scripts/backfill-coordinates.ts
