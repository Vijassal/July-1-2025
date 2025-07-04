-- Fix infinite recursion in RLS policies for trip tables

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can manage their own trips" ON trips;
DROP POLICY IF EXISTS "Users can access shared trips" ON trips;
DROP POLICY IF EXISTS "Trip data access" ON trip_travelers;
DROP POLICY IF EXISTS "Trip destinations access" ON trip_destinations;
DROP POLICY IF EXISTS "Trip flights access" ON trip_flights;
DROP POLICY IF EXISTS "Trip accommodations access" ON trip_accommodations;
DROP POLICY IF EXISTS "Trip itinerary access" ON trip_itinerary;
DROP POLICY IF EXISTS "Trip expenses access" ON trip_expenses;
DROP POLICY IF EXISTS "Trip expense splits access" ON trip_expense_splits;
DROP POLICY IF EXISTS "Trip packing lists access" ON trip_packing_lists;
DROP POLICY IF EXISTS "Trip packing items access" ON trip_packing_items;
DROP POLICY IF EXISTS "Trip shares access" ON trip_shares;

-- Create simplified policies that avoid circular references

-- Trips table: Simple user-based access
CREATE POLICY "Users can manage their own trips" ON trips
    FOR ALL USING (auth.uid() = user_id);

-- Trip travelers: Access based on trip ownership
CREATE POLICY "Trip travelers access" ON trip_travelers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_travelers.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip destinations: Access based on trip ownership
CREATE POLICY "Trip destinations access" ON trip_destinations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_destinations.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip flights: Access based on trip ownership
CREATE POLICY "Trip flights access" ON trip_flights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_flights.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip accommodations: Access based on trip ownership
CREATE POLICY "Trip accommodations access" ON trip_accommodations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_accommodations.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip itinerary: Access based on trip ownership
CREATE POLICY "Trip itinerary access" ON trip_itinerary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_itinerary.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip expenses: Access based on trip ownership
CREATE POLICY "Trip expenses access" ON trip_expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_expenses.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip expense splits: Access based on expense ownership
CREATE POLICY "Trip expense splits access" ON trip_expense_splits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trip_expenses 
            JOIN trips ON trips.id = trip_expenses.trip_id 
            WHERE trip_expenses.id = trip_expense_splits.expense_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip packing lists: Access based on trip ownership
CREATE POLICY "Trip packing lists access" ON trip_packing_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_packing_lists.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip packing items: Access based on packing list ownership
CREATE POLICY "Trip packing items access" ON trip_packing_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trip_packing_lists 
            JOIN trips ON trips.id = trip_packing_lists.trip_id 
            WHERE trip_packing_lists.id = trip_packing_items.packing_list_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Trip shares: Simple user-based access (no circular reference)
CREATE POLICY "Trip shares access" ON trip_shares
    FOR ALL USING (
        auth.uid() = shared_with_user_id OR 
        auth.uid() = shared_by_user_id
    );

-- Add a separate policy for trip owners to manage shares
CREATE POLICY "Trip owners can manage shares" ON trip_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_shares.trip_id 
            AND trips.user_id = auth.uid()
        )
    ); 