-- Create vendor_bookings table for Supabase
-- This table stores vendor booking requests for booking links

CREATE TABLE IF NOT EXISTS vendor_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_link_id UUID REFERENCES vendor_booking_links(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT NOT NULL,
  vendor_phone TEXT,
  service_type TEXT NOT NULL,
  service_description TEXT,
  proposed_date DATE,
  proposed_time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE vendor_bookings ENABLE ROW LEVEL SECURITY;

-- Policy for reading bookings (users can see bookings for their booking links)
CREATE POLICY "Users can view bookings for their booking links" ON vendor_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendor_booking_links vbl
      WHERE vbl.id = vendor_bookings.booking_link_id
      AND vbl.created_by = auth.uid()
    )
  );

-- Policy for inserting bookings (anyone can create a booking - for external invitations)
CREATE POLICY "Anyone can create bookings" ON vendor_bookings
  FOR INSERT WITH CHECK (true);

-- Policy for updating bookings (only booking link creators can update)
CREATE POLICY "Booking link creators can update bookings" ON vendor_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vendor_booking_links vbl
      WHERE vbl.id = vendor_bookings.booking_link_id
      AND vbl.created_by = auth.uid()
    )
  );

-- Policy for deleting bookings (only booking link creators can delete)
CREATE POLICY "Booking link creators can delete bookings" ON vendor_bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM vendor_booking_links vbl
      WHERE vbl.id = vendor_bookings.booking_link_id
      AND vbl.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_booking_link_id ON vendor_bookings(booking_link_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_event_id ON vendor_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_status ON vendor_bookings(status);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_created_at ON vendor_bookings(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_bookings_updated_at 
    BEFORE UPDATE ON vendor_bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 