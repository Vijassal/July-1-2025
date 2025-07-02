-- Database Cleanup Script
-- This script removes unused tables and consolidates duplicates

-- ============================================================================
-- DROP UNUSED TABLES
-- ============================================================================

-- Drop unused tables that are not needed
DROP TABLE IF EXISTS account_instance_members CASCADE;
DROP TABLE IF EXISTS professional_access_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS views CASCADE;

-- ============================================================================
-- ENHANCE VENDORS TABLE WITH MISSING CONTACT FIELDS
-- ============================================================================

-- Add missing contact fields to vendors table for chat functionality
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS service_category TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add foreign key constraint for user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendors_user_id_fkey' 
        AND table_name = 'vendors'
    ) THEN
        ALTER TABLE vendors 
        ADD CONSTRAINT vendors_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing vendors to have proper structure
-- Map existing fields to new structure where possible
UPDATE vendors 
SET 
    business_name = COALESCE(name, ''),
    service_category = COALESCE(category, ''),
    description = COALESCE(event, ''),
    updated_at = NOW()
WHERE business_name IS NULL;

-- ============================================================================
-- ENSURE VENDOR_PROFILES TABLE HAS ALL NECESSARY FIELDS
-- ============================================================================

-- Add any missing fields to vendor_profiles table
ALTER TABLE vendor_profiles 
ADD COLUMN IF NOT EXISTS pricing_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS portfolio_images TEXT[],
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS revenue_share_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Ensure vendors table has proper RLS policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can view vendors in their account" ON vendors;

-- Create comprehensive RLS policies for vendors table
CREATE POLICY "Users can manage their own vendors" ON vendors
  FOR ALL USING (
    user_id = auth.uid() OR
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view vendors in their account" ON vendors
  FOR SELECT USING (
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    ) OR
    account_instance_id IN (
      SELECT account_instance_id FROM professional_account_access 
      WHERE professional_id = auth.uid() AND is_active = true
    )
  );

-- Ensure vendor_profiles table has proper RLS policies
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own vendor profiles" ON vendor_profiles;
DROP POLICY IF EXISTS "Anyone can view vendor profiles" ON vendor_profiles;

-- Create comprehensive RLS policies for vendor_profiles table
CREATE POLICY "Vendors can manage their own profile" ON vendor_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view vendor profiles" ON vendor_profiles
  FOR SELECT USING (true);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for vendors table
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_account_instance_id ON vendors(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_vendors_business_name ON vendors(business_name);
CREATE INDEX IF NOT EXISTS idx_vendors_service_category ON vendors(service_category);
CREATE INDEX IF NOT EXISTS idx_vendors_date ON vendors(date);

-- Create indexes for vendor_profiles table
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_service_category ON vendor_profiles(service_category);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_approved ON vendor_profiles(is_approved);

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================

-- List remaining tables to verify cleanup
DO $$
DECLARE
    table_record RECORD;
BEGIN
    RAISE NOTICE 'Remaining tables in public schema:';
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        RAISE NOTICE '- %', table_record.table_name;
    END LOOP;
END $$;

-- ============================================================================
-- FINAL CLEANUP SUMMARY
-- ============================================================================

/*
CLEANUP COMPLETED:

REMOVED TABLES:
- account_instance_members (duplicate of account_instance_users)
- professional_access_requests (duplicate of account_creation_requests)
- profiles (unused, Supabase auth handles this)
- settings (unused)
- views (unused)

ENHANCED TABLES:
- vendors (added business_name, service_category, description, availability, user_id, updated_at)
- vendor_profiles (added pricing_info, portfolio_images, rating, review_count, is_approved, is_featured, revenue_share_percentage, approved_at, approved_by)

KEPT TABLES:
- exchange_rates (needed for budget system)
- logged_item_costs (needed for budget tracking)
- logged_payments (needed for payment tracking)
- vendor_profiles (kept - different purpose from vendors)
- vendors (kept - user-added vendors)
- spotlight_vendors (kept - admin-curated vendors)

TABLE PURPOSES:
- vendors: User-added vendors for specific events (with contact_info for chat)
- vendor_profiles: Vendor user profiles (for vendor users)
- spotlight_vendors: Admin-curated vendor directory
- vendor_contacts: Multiple contacts per vendor

REMAINING TABLES (42 total):
- account_creation_requests
- account_instance_users
- account_instances
- additional_participants
- blueprints
- budgets
- chat_messages
- chat_notifications
- chat_participants
- chat_rooms
- destinations
- events
- exchange_rates
- logged_item_costs
- logged_payments
- participants
- professional_account_access
- rsvp_questions
- rsvp_responses
- seating_arrangements
- seating_assignments
- seating_tables
- spotlight_vendors
- sub_events
- transportation_assignments
- transportation_vehicles
- user_type_registrations
- vendor_booking_links
- vendor_bookings
- vendor_contacts
- vendor_profiles
- vendors
- website_assets
- website_components
- website_configurations
- website_pages
*/ 