-- Create starred_items table for tracking which projects/tasks users are working on
CREATE TABLE IF NOT EXISTS starred_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('project', 'task')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a user can only star an item once
  UNIQUE (user_id, item_type, item_id)
);

-- Index for fast lookups
CREATE INDEX idx_starred_items_user ON starred_items(user_id, item_type);
CREATE INDEX idx_starred_items_item ON starred_items(item_type, item_id);

-- RLS Policies
ALTER TABLE starred_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own starred items
CREATE POLICY "Users can view their own starred items"
  ON starred_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own starred items
CREATE POLICY "Users can create their own starred items"
  ON starred_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own starred items
CREATE POLICY "Users can delete their own starred items"
  ON starred_items FOR DELETE
  USING (auth.uid() = user_id);
