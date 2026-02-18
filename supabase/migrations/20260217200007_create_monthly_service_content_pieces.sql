-- Create monthly_service_content_pieces table for tracking content deliverables
-- Tracks blogs, location pages, pest IDs, etc. produced for a monthly service

CREATE TABLE IF NOT EXISTS monthly_service_content_pieces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_service_id UUID NOT NULL REFERENCES monthly_services(id) ON DELETE CASCADE,

    -- Content metadata
    content_type TEXT CHECK (content_type IN ('blog', 'evergreen', 'location', 'pillar', 'cluster', 'pest_id', 'other')),
    title TEXT,
    publish_date DATE,
    link TEXT,

    -- Audit fields
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups by service
CREATE INDEX IF NOT EXISTS idx_ms_content_pieces_service_id
    ON monthly_service_content_pieces(monthly_service_id);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_ms_content_pieces_content_type
    ON monthly_service_content_pieces(content_type);

-- updated_at trigger
CREATE TRIGGER update_monthly_service_content_pieces_updated_at
    BEFORE UPDATE ON monthly_service_content_pieces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE monthly_service_content_pieces ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view content pieces
CREATE POLICY "Admins can view monthly service content pieces"
    ON monthly_service_content_pieces
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policy: Only admins can manage content pieces
CREATE POLICY "Admins can manage monthly service content pieces"
    ON monthly_service_content_pieces
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_content_pieces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_content_pieces TO service_role;

-- Comments
COMMENT ON TABLE monthly_service_content_pieces IS 'Content deliverables (blogs, location pages, pest IDs, etc.) produced for a monthly service';
COMMENT ON COLUMN monthly_service_content_pieces.content_type IS 'Type of content: blog, evergreen, location, pillar, cluster, pest_id, or other';
COMMENT ON COLUMN monthly_service_content_pieces.title IS 'Title of the content piece (nullable, may be unknown when first created)';
COMMENT ON COLUMN monthly_service_content_pieces.publish_date IS 'Date the content was published on the client website';
COMMENT ON COLUMN monthly_service_content_pieces.link IS 'URL to the published page on the client website';
