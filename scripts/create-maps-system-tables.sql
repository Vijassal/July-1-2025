-- Maps System Tables
-- This script creates all tables needed for the maps functionality

-- Blueprints table
CREATE TABLE IF NOT EXISTS blueprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    canvas_data JSONB DEFAULT '{}',
    background_image_url TEXT,
    measurements_unit TEXT DEFAULT 'ft' CHECK (measurements_unit IN ('ft', 'in')),
    width_ft NUMERIC NOT NULL DEFAULT 20,
    height_ft NUMERIC NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destinations table
CREATE TABLE IF NOT EXISTS event_destinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    estimated_travel_time INTEGER, -- in minutes
    estimated_cost DECIMAL(10,2),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS event_transportation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL,
    vehicle_name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    driver_name TEXT,
    driver_contact TEXT,
    cost_per_person DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    notes TEXT,
    assigned_passengers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables table for seat arrangements
CREATE TABLE IF NOT EXISTS event_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
    table_number INTEGER NOT NULL,
    table_name TEXT,
    capacity INTEGER NOT NULL,
    table_type TEXT NOT NULL,
    position_x NUMERIC DEFAULT 0,
    position_y NUMERIC DEFAULT 0,
    rotation NUMERIC DEFAULT 0,
    notes TEXT,
    assigned_guests INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, table_number)
);

-- Participants table
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    table_id UUID REFERENCES event_tables(id) ON DELETE SET NULL,
    dietary_restrictions TEXT,
    special_needs TEXT,
    has_handicap_needs BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_transportation ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own blueprints" ON blueprints
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage destinations for their events" ON event_destinations
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage transportation for their events" ON event_transportation
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage tables for their events" ON event_tables
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage participants for their events" ON event_participants
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE creator_id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blueprints_user_event ON blueprints(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_destinations_event ON event_destinations(event_id);
CREATE INDEX IF NOT EXISTS idx_transportation_event ON event_transportation(event_id);
CREATE INDEX IF NOT EXISTS idx_tables_event ON event_tables(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_table ON event_participants(table_id);
