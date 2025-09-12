-- Create service addresses system to support multiple addresses per customer
-- This addresses the real-world need where customers have multiple service locations
-- and service addresses may be shared between customers

-- Create service_addresses table
CREATE TABLE IF NOT EXISTS service_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Standardized address fields
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    
    -- Additional address details
    apartment_unit VARCHAR(50), -- For apartment, unit, suite numbers
    address_line_2 TEXT, -- For additional address info
    
    -- Geocoding and service area matching
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geocoded_at TIMESTAMP WITH TIME ZONE,
    
    -- Service area relationship
    service_area_id UUID REFERENCES service_areas(id) ON DELETE SET NULL,
    
    -- Address metadata
    address_type VARCHAR(50) DEFAULT 'residential' CHECK (address_type IN ('residential', 'commercial', 'industrial', 'mixed_use')),
    property_notes TEXT, -- Special instructions, gate codes, etc.
    
    -- Tracking
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_service_addresses junction table for many-to-many relationships
CREATE TABLE IF NOT EXISTS customer_service_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_address_id UUID NOT NULL REFERENCES service_addresses(id) ON DELETE CASCADE,
    
    -- Relationship metadata
    relationship_type VARCHAR(50) DEFAULT 'owner' CHECK (relationship_type IN ('owner', 'tenant', 'property_manager', 'family_member', 'authorized_contact', 'other')),
    is_primary_address BOOLEAN DEFAULT false,
    
    -- Contact preferences for this address
    contact_preferences JSONB DEFAULT '{}',
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique customer-address relationships
    UNIQUE(customer_id, service_address_id)
);

-- Add service_address_id to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS service_address_id UUID REFERENCES service_addresses(id) ON DELETE SET NULL;

-- Add service_address_id to tickets table  
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS service_address_id UUID REFERENCES service_addresses(id) ON DELETE SET NULL;

-- Add service_address_id to partial_leads table
ALTER TABLE partial_leads
ADD COLUMN IF NOT EXISTS service_address_id UUID REFERENCES service_addresses(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_addresses_company_id ON service_addresses(company_id);
CREATE INDEX IF NOT EXISTS idx_service_addresses_city_state ON service_addresses(city, state);
CREATE INDEX IF NOT EXISTS idx_service_addresses_zip_code ON service_addresses(zip_code);
CREATE INDEX IF NOT EXISTS idx_service_addresses_service_area_id ON service_addresses(service_area_id);
CREATE INDEX IF NOT EXISTS idx_service_addresses_coordinates ON service_addresses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_service_addresses_is_active ON service_addresses(is_active);

CREATE INDEX IF NOT EXISTS idx_customer_service_addresses_customer_id ON customer_service_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_addresses_service_address_id ON customer_service_addresses(service_address_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_addresses_primary ON customer_service_addresses(customer_id, is_primary_address) WHERE is_primary_address = true;

CREATE INDEX IF NOT EXISTS idx_leads_service_address_id ON leads(service_address_id);
CREATE INDEX IF NOT EXISTS idx_tickets_service_address_id ON tickets(service_address_id);
CREATE INDEX IF NOT EXISTS idx_partial_leads_service_address_id ON partial_leads(service_address_id);

-- Create updated_at triggers
CREATE TRIGGER update_service_addresses_updated_at
    BEFORE UPDATE ON service_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_service_addresses_updated_at
    BEFORE UPDATE ON customer_service_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE service_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_service_addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_addresses
CREATE POLICY "Allow authenticated users to view service addresses" ON service_addresses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert service addresses" ON service_addresses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update service addresses" ON service_addresses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete service addresses" ON service_addresses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for customer_service_addresses
CREATE POLICY "Allow authenticated users to view customer service address relationships" ON customer_service_addresses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert customer service address relationships" ON customer_service_addresses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update customer service address relationships" ON customer_service_addresses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete customer service address relationships" ON customer_service_addresses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to ensure only one primary address per customer
CREATE OR REPLACE FUNCTION ensure_single_primary_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this as primary, unset all other primary addresses for this customer
    IF NEW.is_primary_address = true THEN
        UPDATE customer_service_addresses 
        SET is_primary_address = false 
        WHERE customer_id = NEW.customer_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one primary address per customer
CREATE TRIGGER trigger_ensure_single_primary_address
    AFTER INSERT OR UPDATE ON customer_service_addresses
    FOR EACH ROW
    WHEN (NEW.is_primary_address = true)
    EXECUTE FUNCTION ensure_single_primary_address();

-- Create function to migrate existing customer addresses to service addresses
CREATE OR REPLACE FUNCTION migrate_customer_addresses_to_service_addresses()
RETURNS TEXT AS $$
DECLARE
    customer_record RECORD;
    new_service_address_id UUID;
    total_migrated INTEGER := 0;
BEGIN
    -- Migrate existing customer addresses to service_addresses table
    FOR customer_record IN 
        SELECT id, company_id, address, city, state, zip_code
        FROM customers 
        WHERE address IS NOT NULL 
        AND city IS NOT NULL 
        AND state IS NOT NULL 
        AND zip_code IS NOT NULL
    LOOP
        -- Create new service address
        INSERT INTO service_addresses (
            company_id,
            street_address,
            city,
            state,
            zip_code,
            address_type
        ) VALUES (
            customer_record.company_id,
            customer_record.address,
            customer_record.city,
            customer_record.state,
            customer_record.zip_code,
            'residential'
        ) RETURNING id INTO new_service_address_id;
        
        -- Create customer-service address relationship
        INSERT INTO customer_service_addresses (
            customer_id,
            service_address_id,
            relationship_type,
            is_primary_address
        ) VALUES (
            customer_record.id,
            new_service_address_id,
            'owner',
            true
        );
        
        total_migrated := total_migrated + 1;
    END LOOP;
    
    RETURN format('Successfully migrated %s customer addresses to service addresses', total_migrated);
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE service_addresses IS 'Service addresses that can be shared between multiple customers';
COMMENT ON TABLE customer_service_addresses IS 'Many-to-many relationship between customers and service addresses';
COMMENT ON COLUMN service_addresses.property_notes IS 'Special instructions, gate codes, access notes, etc.';
COMMENT ON COLUMN customer_service_addresses.relationship_type IS 'Defines the customer relationship to the service address';
COMMENT ON COLUMN customer_service_addresses.is_primary_address IS 'Marks the primary service address for a customer';
COMMENT ON FUNCTION migrate_customer_addresses_to_service_addresses() IS 'One-time migration function to move existing customer addresses to the new service address system';