# FUTURE REFERENCE

# Migration Testing Guide -

This guide explains how to test database migrations against production-like state to catch conflicts that don't appear in fresh database resets.

## The Problem

**Local Fresh Reset vs. Production State:**

- **Local Reset**: Creates completely empty database → migrations run without conflicts
- **Production**: Has existing functions, tables, and data → migrations may conflict with existing objects

**Example Issue:**

```sql
-- Production has this function:
promote_ab_test_winner(UUID, VARCHAR(10)) RETURNS BOOLEAN

-- New migration tries to create:
promote_ab_test_winner(UUID, VARCHAR) RETURNS void

-- Result: ERROR: cannot change return type of existing function (SQLSTATE 42P13)
```

## Testing Strategies

### 1. **Use Supabase Branching (Recommended for Pro/Team)**

```bash
# Create a branch that mirrors production
npx supabase branches create staging --db-branch main

# Test your migrations on the branch
npx supabase db push --db-url [staging-branch-url]

# If successful, merge to main
npx supabase branches delete staging
```

### 2. **Migration Testing Script (Recommended for Local Development)**

Create this script to test migrations against production-like state:

```bash
#!/bin/bash
# scripts/test-migration.sh

MIGRATION_TO_TEST=$1

if [ -z "$MIGRATION_TO_TEST" ]; then
    echo "Usage: ./test-migration.sh migration_file.sql"
    echo "Example: ./test-migration.sh 20250822160000_new_feature.sql"
    exit 1
fi

echo "🔄 Setting up production-like state..."
npx supabase db reset --local

echo "📦 Applying all existing migrations..."
# This applies everything up to but not including your new migration
npx supabase db push --local

echo "🧪 Testing the new migration..."
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f "supabase/migrations/$MIGRATION_TO_TEST"

if [ $? -eq 0 ]; then
    echo "✅ Migration test successful!"
    echo "🌱 Re-seeding data for continued development..."
    npx supabase db reset --local --seed-only
else
    echo "❌ Migration test failed!"
    echo "🔍 Check the error output above for details"
    exit 1
fi
```

**Usage:**

```bash
chmod +x scripts/test-migration.sh
./scripts/test-migration.sh 20250822160000_new_migration.sql
```

### 3. **Production Schema Dump (Safest)**

```bash
# 1. Create a sanitized dump of production schema (no sensitive data)
pg_dump --schema-only production_url > scripts/production_schema.sql

# 2. Create test script
#!/bin/bash
# scripts/test-against-prod-schema.sh
npx supabase db reset --local
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f scripts/production_schema.sql
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/migrations/$1
```

### 4. **Manual Production State Setup**

Create a file with key production objects that might conflict:

```sql
-- scripts/production-state-setup.sql
-- Recreate critical functions that exist in production

CREATE OR REPLACE FUNCTION promote_ab_test_winner(
    p_campaign_id UUID,
    p_winner_variant VARCHAR(10)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Minimal implementation for testing
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add other production functions that commonly conflict
CREATE OR REPLACE FUNCTION assign_lead_to_ab_test(
    p_company_id UUID,
    p_lead_id UUID,
    p_template_id UUID
) RETURNS UUID AS $$
BEGIN
    RETURN p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Add production tables that might have different schemas
CREATE TABLE IF NOT EXISTS ab_test_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50),
    winner_variant VARCHAR(10),
    -- Add other critical columns
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Test with:**

```bash
npx supabase db reset --local
psql local_url -f scripts/production-state-setup.sql
psql local_url -f supabase/migrations/new_migration.sql
```

### 5. **Supabase CLI Staging Environment**

```bash
# Set up staging project that mirrors production
npx supabase link --project-ref your-staging-project

# Test migrations on staging first
npx supabase db push --linked

# If successful, deploy to production
npx supabase link --project-ref your-production-project
npx supabase db push --linked
```

### 6. **Docker Isolated Testing**

```dockerfile
# docker/docker-compose.test.yml
version: '3'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: test_db
    ports:
      - "5433:5432"
    volumes:
      - ./scripts/production-state-setup.sql:/docker-entrypoint-initdb.d/setup.sql
```

**Usage:**

```bash
# Spin up isolated test environment
docker-compose -f docker/docker-compose.test.yml up -d

# Test migration
psql postgres://postgres:postgres@localhost:5433/test_db -f supabase/migrations/new_migration.sql

# Cleanup
docker-compose -f docker/docker-compose.test.yml down
```

## Best Practices

### Before Creating Migrations

1. **Understand existing production objects:**

   ```bash
   # Check existing functions that might conflict
   psql production_url -c "SELECT proname, pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname LIKE '%function_name%';"
   ```

2. **Use proper DROP statements for function changes:**

   ```sql
   -- Always drop conflicting signatures first
   DROP FUNCTION IF EXISTS public.function_name(old_signature) CASCADE;
   DROP FUNCTION IF EXISTS public.function_name(conflicting_signature) CASCADE;

   -- Then create with correct signature
   CREATE OR REPLACE FUNCTION public.function_name(correct_signature) ...
   ```

### Testing Workflow

```bash
# 1. Create your migration
npx supabase migration new feature_name

# 2. Test against production-like state
./scripts/test-migration.sh 20250822160000_feature_name.sql

# 3. If test passes, you're ready for production
npx supabase db push --linked
```

### Common Conflict Scenarios

**Function Signature Conflicts:**

- Changing parameter types: `VARCHAR(10)` vs `VARCHAR` vs `TEXT`
- Changing return types: `BOOLEAN` vs `void` vs `UUID`
- Adding/removing parameters

**Table Schema Conflicts:**

- Column type changes: `VARCHAR(50)` vs `TEXT`
- Constraint additions/removals
- Index conflicts

**Policy Conflicts:**

- Multiple policies with same name
- Conflicting RLS logic

## Troubleshooting

### Migration Fails in Production but Works Locally

1. **Check for existing objects:**

   ```sql
   -- Check if function exists in production
   SELECT proname, pg_get_function_identity_arguments(oid), pg_get_function_result(oid)
   FROM pg_proc
   WHERE proname = 'your_function_name';
   ```

2. **Compare signatures:**

   ```bash
   # Local
   psql local_url -c "SELECT proname, pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'function_name';"

   # Production
   psql production_url -c "SELECT proname, pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'function_name';"
   ```

3. **Create compatibility migration:**

   ```sql
   -- Drop all possible conflicting versions
   DROP FUNCTION IF EXISTS public.function_name(version1_signature) CASCADE;
   DROP FUNCTION IF EXISTS public.function_name(version2_signature) CASCADE;

   -- Create with production-compatible signature
   CREATE OR REPLACE FUNCTION public.function_name(production_signature) ...
   ```

## Quick Reference Commands

```bash
# Test single migration against production-like state
./scripts/test-migration.sh migration_file.sql

# Check function signatures in database
psql db_url -c "SELECT proname, pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname LIKE '%search_term%';"

# Reset and re-seed after testing
npx supabase db reset --local

# Push to production (after testing!)
npx supabase db push --linked
```

## Files to Create

1. `scripts/test-migration.sh` - Main testing script
2. `scripts/production-state-setup.sql` - Manual production state recreation
3. `docker/docker-compose.test.yml` - Docker testing environment (optional)

Remember: **Always test migrations against production-like state before deploying!**
