-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    service_address_id UUID REFERENCES service_addresses(id) ON DELETE CASCADE,

    -- Pest information (copied from lead at time of quote)
    primary_pest VARCHAR(255), -- pest_type slug or name
    additional_pests TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of pest slugs/names

    -- Size ranges (copied from service_address at time of quote)
    home_size_range VARCHAR(50),
    yard_size_range VARCHAR(50),

    -- Pricing totals
    total_initial_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_recurring_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Quote status
    quote_status VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- Possible values: draft, sent, accepted, declined, expired

    -- Quote validity
    valid_until TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_quote_status CHECK (
        quote_status IN ('draft', 'sent', 'accepted', 'declined', 'expired')
    )
);

-- Create quote_line_items table
CREATE TABLE IF NOT EXISTS quote_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
    service_plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL,

    -- Plan details (copied at time of quote)
    plan_name VARCHAR(255) NOT NULL,
    plan_description TEXT,
    initial_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    recurring_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    billing_frequency VARCHAR(50) NOT NULL,

    -- Discount information
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,

    -- Final pricing after discounts
    final_initial_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_recurring_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Display order
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_status ON quotes(quote_status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_service_plan_id ON quote_line_items(service_plan_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_display_order ON quote_line_items(display_order);

-- Create updated_at trigger for quotes
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

-- Create updated_at trigger for quote_line_items
CREATE OR REPLACE FUNCTION update_quote_line_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quote_line_items_updated_at
    BEFORE UPDATE ON quote_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_line_items_updated_at();

-- Add comments for documentation
COMMENT ON TABLE quotes IS 'Stores price quotes for leads with service plans and pricing details';
COMMENT ON TABLE quote_line_items IS 'Individual service plans included in a quote with pricing and discounts';

COMMENT ON COLUMN quotes.primary_pest IS 'Primary pest concern from lead.pest_type';
COMMENT ON COLUMN quotes.additional_pests IS 'Additional pests beyond primary pest';
COMMENT ON COLUMN quotes.home_size_range IS 'Home size range selected (e.g., "0-1500", "1501-2000")';
COMMENT ON COLUMN quotes.yard_size_range IS 'Yard size range selected (e.g., "0-0.25", "0.26-0.50")';
COMMENT ON COLUMN quotes.quote_status IS 'Status: draft, sent, accepted, declined, expired';

COMMENT ON COLUMN quote_line_items.discount_percentage IS 'Percentage discount applied (0-100)';
COMMENT ON COLUMN quote_line_items.discount_amount IS 'Fixed dollar amount discount';
COMMENT ON COLUMN quote_line_items.final_initial_price IS 'Initial price after discounts';
COMMENT ON COLUMN quote_line_items.final_recurring_price IS 'Recurring price after discounts';

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes
CREATE POLICY "Users can view quotes for their company"
    ON quotes FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can insert quotes for their company"
    ON quotes FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can update quotes for their company"
    ON quotes FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can delete quotes for their company"
    ON quotes FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for quote_line_items
CREATE POLICY "Users can view quote line items for their company"
    ON quote_line_items FOR SELECT
    USING (
        quote_id IN (
            SELECT id FROM quotes WHERE company_id IN (
                SELECT company_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can insert quote line items for their company"
    ON quote_line_items FOR INSERT
    WITH CHECK (
        quote_id IN (
            SELECT id FROM quotes WHERE company_id IN (
                SELECT company_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can update quote line items for their company"
    ON quote_line_items FOR UPDATE
    USING (
        quote_id IN (
            SELECT id FROM quotes WHERE company_id IN (
                SELECT company_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can delete quote line items for their company"
    ON quote_line_items FOR DELETE
    USING (
        quote_id IN (
            SELECT id FROM quotes WHERE company_id IN (
                SELECT company_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );