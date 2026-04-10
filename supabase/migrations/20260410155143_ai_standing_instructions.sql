-- Create ai_standing_instructions table
-- Per-company rules that get automatically injected into AI prompts

CREATE TABLE IF NOT EXISTS ai_standing_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    scope TEXT CHECK (scope IN ('draft', 'headlines', 'edit', 'all')) DEFAULT 'all',
    content_type TEXT NULL,  -- null = applies to all types; 'blog','pest_id', etc. for type-specific
    instruction_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    source TEXT CHECK (source IN ('manual', 'saved_prompt', 'feedback')) DEFAULT 'manual',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ai_feedback table
-- Records thumbs-down feedback on AI-generated content; can be promoted to standing instructions

CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    content_piece_id UUID REFERENCES monthly_service_content_pieces(id) ON DELETE SET NULL,
    feature_type TEXT CHECK (feature_type IN ('draft', 'headlines', 'edit')) NOT NULL,
    content_type TEXT NULL,
    rating TEXT CHECK (rating IN ('positive', 'negative')) NOT NULL,
    notes TEXT NULL,
    original_prompt TEXT NULL,
    promoted_to_instruction BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_standing_instructions_company_id
    ON ai_standing_instructions(company_id);

CREATE INDEX IF NOT EXISTS idx_ai_standing_instructions_company_scope
    ON ai_standing_instructions(company_id, scope)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_feedback_company_id
    ON ai_feedback(company_id);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_unpromoted
    ON ai_feedback(company_id, promoted_to_instruction)
    WHERE rating = 'negative' AND promoted_to_instruction = false;

-- updated_at trigger for ai_standing_instructions
CREATE TRIGGER update_ai_standing_instructions_updated_at
    BEFORE UPDATE ON ai_standing_instructions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE ai_standing_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_standing_instructions
CREATE POLICY "Admins and project managers can manage ai standing instructions"
    ON ai_standing_instructions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'project_manager')
        )
    );

-- RLS Policies for ai_feedback
CREATE POLICY "Admins and project managers can manage ai feedback"
    ON ai_feedback
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'project_manager')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_standing_instructions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_standing_instructions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_feedback TO service_role;
