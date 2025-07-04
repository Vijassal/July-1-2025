-- Trip Planning System Tables

-- Main trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    password_hash VARCHAR(255), -- For password protection
    is_password_protected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip travelers
CREATE TABLE IF NOT EXISTS trip_travelers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    is_organizer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip destinations
CREATE TABLE IF NOT EXISTS trip_destinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    city VARCHAR(100),
    arrival_date DATE,
    departure_date DATE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flight information
CREATE TABLE IF NOT EXISTS trip_flights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES trip_destinations(id) ON DELETE SET NULL,
    flight_type VARCHAR(20) NOT NULL CHECK (flight_type IN ('departure', 'arrival')),
    airline VARCHAR(100),
    flight_number VARCHAR(20),
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    flight_date DATE NOT NULL,
    departure_time TIME,
    arrival_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accommodations
CREATE TABLE IF NOT EXISTS trip_accommodations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES trip_destinations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    check_in_date DATE,
    check_out_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itinerary items
CREATE TABLE IF NOT EXISTS trip_itinerary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES trip_destinations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses for cost splitting
CREATE TABLE IF NOT EXISTS trip_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    paid_by_traveler_id UUID NOT NULL REFERENCES trip_travelers(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'flight', 'accommodation', 'food', 'transport', 'other'
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense splits (who owes what)
CREATE TABLE IF NOT EXISTS trip_expense_splits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES trip_expenses(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES trip_travelers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packing lists
CREATE TABLE IF NOT EXISTS trip_packing_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    traveler_id UUID REFERENCES trip_travelers(id) ON DELETE CASCADE, -- NULL means shared list
    name VARCHAR(255) NOT NULL DEFAULT 'Packing List',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packing list items
CREATE TABLE IF NOT EXISTS trip_packing_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    packing_list_id UUID NOT NULL REFERENCES trip_packing_lists(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_packed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip sharing (for collaboration)
CREATE TABLE IF NOT EXISTS trip_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
    shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, shared_with_user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_travelers_trip_id ON trip_travelers(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_destinations_trip_id ON trip_destinations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_flights_trip_id ON trip_flights(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_accommodations_trip_id ON trip_accommodations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_itinerary_trip_id ON trip_itinerary(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expense_splits_expense_id ON trip_expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_trip_packing_lists_trip_id ON trip_packing_lists(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_shares_trip_id ON trip_shares(trip_id);

-- Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own trips" ON trips
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access shared trips" ON trips
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM trip_shares 
            WHERE trip_shares.trip_id = trips.id 
            AND trip_shares.shared_with_user_id = auth.uid()
        )
    );

-- Similar policies for other tables (abbreviated for brevity)
CREATE POLICY "Trip data access" ON trip_travelers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_travelers.trip_id 
            AND (trips.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM trip_shares 
                WHERE trip_shares.trip_id = trips.id 
                AND trip_shares.shared_with_user_id = auth.uid()
            ))
        )
    );

-- Apply similar policies to all other trip-related tables
CREATE POLICY "Trip destinations access" ON trip_destinations FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_destinations.trip_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip flights access" ON trip_flights FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_flights.trip_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip accommodations access" ON trip_accommodations FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_accommodations.trip_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip itinerary access" ON trip_itinerary FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_itinerary.trip_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip expenses access" ON trip_expenses FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_expenses.trip_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip expense splits access" ON trip_expense_splits FOR ALL USING (EXISTS (SELECT 1 FROM trip_expenses JOIN trips ON trips.id = trip_expenses.trip_id WHERE trip_expenses.id = trip_expense_splits.expense_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip packing lists access" ON trip_packing_lists FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_packing_lists.trip_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip packing items access" ON trip_packing_items FOR ALL USING (EXISTS (SELECT 1 FROM trip_packing_lists JOIN trips ON trips.id = trip_packing_lists.trip_id WHERE trip_packing_lists.id = trip_packing_items.packing_list_id AND (trips.user_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid()))));
CREATE POLICY "Trip shares access" ON trip_shares FOR ALL USING (auth.uid() = shared_with_user_id OR auth.uid() = shared_by_user_id OR EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_shares.trip_id AND trips.user_id = auth.uid())); 