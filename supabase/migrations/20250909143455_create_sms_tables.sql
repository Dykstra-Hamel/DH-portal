-- Create SMS conversations table
CREATE TABLE IF NOT EXISTS sms_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    -- Nullable for future lead system integration (currently deferred)
    lead_id UUID DEFAULT NULL,
    customer_id UUID DEFAULT NULL,
    agent_id TEXT NOT NULL, -- Retell agent ID
    customer_number TEXT NOT NULL, -- Customer's phone number in E.164 format
    retell_number TEXT NOT NULL, -- Retell phone number used
    sms_id TEXT UNIQUE NOT NULL, -- Retell SMS conversation ID
    status TEXT NOT NULL DEFAULT 'active', -- active, completed, failed
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create SMS messages table
CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES sms_conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    message_id TEXT, -- Retell message ID if available
    sender_number TEXT NOT NULL,
    recipient_number TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- sent, delivered, failed, pending
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- Create SMS logs table for tracking events and debugging
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES sms_conversations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- webhook_received, message_sent, error, etc.
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_conversations_company_id ON sms_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_sms_id ON sms_conversations(sms_id);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_status ON sms_conversations(status);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_created_at ON sms_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_messages_conversation_id ON sms_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_logs_conversation_id ON sms_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_event_type ON sms_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- Create updated_at trigger for sms_conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sms_conversations_updated_at ON sms_conversations;
CREATE TRIGGER update_sms_conversations_updated_at
    BEFORE UPDATE ON sms_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Policy for sms_conversations
CREATE POLICY "Users can view SMS conversations for their company" ON sms_conversations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert SMS conversations for their company" ON sms_conversations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update SMS conversations for their company" ON sms_conversations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for sms_messages
CREATE POLICY "Users can view SMS messages for their company" ON sms_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM sms_conversations
            WHERE company_id IN (
                SELECT company_id FROM user_companies 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert SMS messages for their company" ON sms_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM sms_conversations
            WHERE company_id IN (
                SELECT company_id FROM user_companies 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy for sms_logs
CREATE POLICY "Users can view SMS logs for their company" ON sms_logs
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM sms_conversations
            WHERE company_id IN (
                SELECT company_id FROM user_companies 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Service role can manage all SMS data" ON sms_conversations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all SMS messages" ON sms_messages
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all SMS logs" ON sms_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');