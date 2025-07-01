-- Create blueprint collaboration table for real-time shape syncing
CREATE TABLE IF NOT EXISTS blueprint_collaboration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  shapes_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blueprint cursors table for real-time cursor syncing
CREATE TABLE IF NOT EXISTS blueprint_cursors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  cursor_x INTEGER NOT NULL DEFAULT 0,
  cursor_y INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add canvas_data column to blueprints table if it doesn't exist
ALTER TABLE blueprints ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT '[]';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blueprint_collaboration_blueprint_id ON blueprint_collaboration(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_collaboration_user_id ON blueprint_collaboration(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_collaboration_updated_at ON blueprint_collaboration(updated_at);

CREATE INDEX IF NOT EXISTS idx_blueprint_cursors_blueprint_id ON blueprint_cursors(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_cursors_user_id ON blueprint_cursors(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_cursors_updated_at ON blueprint_cursors(updated_at);

-- Enable Row Level Security
ALTER TABLE blueprint_collaboration ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_cursors ENABLE ROW LEVEL SECURITY;

-- Create policies for blueprint_collaboration
CREATE POLICY "Users can view collaboration data for blueprints they have access to" ON blueprint_collaboration
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blueprints 
      WHERE blueprints.id = blueprint_collaboration.blueprint_id 
      AND blueprints.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert collaboration data for their own blueprints" ON blueprint_collaboration
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blueprints 
      WHERE blueprints.id = blueprint_collaboration.blueprint_id 
      AND blueprints.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update collaboration data for their own blueprints" ON blueprint_collaboration
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM blueprints 
      WHERE blueprints.id = blueprint_collaboration.blueprint_id 
      AND blueprints.user_id = auth.uid()
    )
  );

-- Create policies for blueprint_cursors
CREATE POLICY "Users can view cursor data for blueprints they have access to" ON blueprint_cursors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blueprints 
      WHERE blueprints.id = blueprint_cursors.blueprint_id 
      AND blueprints.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cursor data for their own blueprints" ON blueprint_cursors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blueprints 
      WHERE blueprints.id = blueprint_cursors.blueprint_id 
      AND blueprints.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cursor data for their own blueprints" ON blueprint_cursors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM blueprints 
      WHERE blueprints.id = blueprint_cursors.blueprint_id 
      AND blueprints.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_blueprint_collaboration_updated_at 
  BEFORE UPDATE ON blueprint_collaboration 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blueprint_cursors_updated_at 
  BEFORE UPDATE ON blueprint_cursors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 