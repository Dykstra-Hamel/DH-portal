/**
 * Migration: AI Integration Tables
 * Created: 2025-10-24
 *
 * This migration creates tables for Gemini AI integration including:
 * - ai_cache: Response caching for cost optimization
 * - ai_usage: Usage tracking and billing
 * - ai_contexts: Pre-computed business metrics for performance
 */

-- ============================================================================
-- AI RESPONSE CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    query_hash TEXT NOT NULL,
    query_type TEXT NOT NULL CHECK (query_type IN ('chat', 'insights', 'predictions', 'report')),
    response JSONB NOT NULL,
    model_used TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Composite unique constraint on company + query_hash
    UNIQUE (company_id, query_hash)
);

-- Indexes for ai_cache
CREATE INDEX idx_ai_cache_company_id ON ai_cache(company_id);
CREATE INDEX idx_ai_cache_query_type ON ai_cache(query_type);
CREATE INDEX idx_ai_cache_expires_at ON ai_cache(expires_at);
CREATE INDEX idx_ai_cache_created_at ON ai_cache(created_at DESC);

-- GIN index for JSONB response
CREATE INDEX idx_ai_cache_response ON ai_cache USING GIN (response);

COMMENT ON TABLE ai_cache IS 'Caches AI responses to reduce API costs and improve response times';
COMMENT ON COLUMN ai_cache.query_hash IS 'MD5 hash of the query for cache lookup';
COMMENT ON COLUMN ai_cache.expires_at IS 'Expiration timestamp for cache invalidation';

-- ============================================================================
-- AI USAGE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('chat', 'insights', 'predictions', 'reports')),
    model_used TEXT NOT NULL,
    tokens_in INTEGER NOT NULL DEFAULT 0,
    tokens_out INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    response_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_usage
CREATE INDEX idx_ai_usage_company_id ON ai_usage(company_id);
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_feature_type ON ai_usage(feature_type);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_company_created ON ai_usage(company_id, created_at DESC);

COMMENT ON TABLE ai_usage IS 'Tracks all AI API usage for billing and analytics';
COMMENT ON COLUMN ai_usage.cost_cents IS 'Estimated cost in cents (free tier = 0)';
COMMENT ON COLUMN ai_usage.cached IS 'Whether the response was served from cache';
COMMENT ON COLUMN ai_usage.response_time_ms IS 'Response time in milliseconds';

-- ============================================================================
-- AI CONTEXTS TABLE (Pre-computed Business Metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_contexts (
    company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    business_metrics JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN index for JSONB business_metrics
CREATE INDEX idx_ai_contexts_metrics ON ai_contexts USING GIN (business_metrics);

COMMENT ON TABLE ai_contexts IS 'Pre-computed business metrics for faster AI context preparation';
COMMENT ON COLUMN ai_contexts.business_metrics IS 'Aggregated business metrics in JSON format';

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER for ai_contexts
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_contexts_updated_at
    BEFORE UPDATE ON ai_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_contexts_updated_at();

-- ============================================================================
-- CACHE CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired cache entries
    WITH deleted AS (
        DELETE FROM ai_cache
        WHERE expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_ai_cache IS 'Removes expired cache entries. Should be run periodically via cron.';

-- ============================================================================
-- AI USAGE SUMMARY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ai_usage_summary(
    p_company_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    feature_type TEXT,
    total_requests BIGINT,
    cached_requests BIGINT,
    cache_hit_rate NUMERIC,
    total_tokens BIGINT,
    total_cost_cents BIGINT,
    avg_response_time_ms NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ai_usage.feature_type,
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE cached = TRUE) AS cached_requests,
        ROUND(
            (COUNT(*) FILTER (WHERE cached = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        ) AS cache_hit_rate,
        SUM(total_tokens) AS total_tokens,
        SUM(cost_cents) AS total_cost_cents,
        ROUND(AVG(response_time_ms), 0) AS avg_response_time_ms,
        ROUND(
            (COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        ) AS success_rate
    FROM ai_usage
    WHERE
        ai_usage.company_id = p_company_id
        AND ai_usage.created_at >= p_start_date
        AND ai_usage.created_at <= p_end_date
    GROUP BY ai_usage.feature_type
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION get_ai_usage_summary IS 'Returns AI usage statistics for a company within a date range';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all AI tables
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_cache
CREATE POLICY "Users can view their company's AI cache"
    ON ai_cache FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = ai_cache.company_id
            AND uc.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Service role can manage AI cache"
    ON ai_cache FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for ai_usage
CREATE POLICY "Users can view their company's AI usage"
    ON ai_usage FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = ai_usage.company_id
            AND uc.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Service role can manage AI usage"
    ON ai_usage FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for ai_contexts
CREATE POLICY "Users can view their company's AI contexts"
    ON ai_contexts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = ai_contexts.company_id
            AND uc.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Service role can manage AI contexts"
    ON ai_contexts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON ai_cache TO authenticated;
GRANT SELECT ON ai_usage TO authenticated;
GRANT SELECT ON ai_contexts TO authenticated;

-- Grant full access to service_role
GRANT ALL ON ai_cache TO service_role;
GRANT ALL ON ai_usage TO service_role;
GRANT ALL ON ai_contexts TO service_role;
