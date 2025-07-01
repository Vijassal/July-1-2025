-- Update vendors table to include contact information
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '[]'::jsonb;

-- Create vendor contacts table for multiple contacts per vendor
CREATE TABLE IF NOT EXISTS public.vendor_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT vendor_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_contacts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE
);

-- Create spotlight vendors table (admin controlled)
CREATE TABLE IF NOT EXISTS public.spotlight_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  description TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  pricing_info JSONB DEFAULT '{}'::jsonb,
  portfolio_images TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  revenue_share_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  CONSTRAINT spotlight_vendors_pkey PRIMARY KEY (id)
);

-- Create vendor booking links table
CREATE TABLE IF NOT EXISTS public.vendor_booking_links (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  link_token TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  show_other_bookings BOOLEAN DEFAULT false,
  show_vendor_names BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT vendor_booking_links_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_booking_links_event_id_fkey FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

-- Create vendor bookings table
CREATE TABLE IF NOT EXISTS public.vendor_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_link_id UUID NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT,
  vendor_phone TEXT,
  setup_date DATE NOT NULL,
  setup_start_time TIME NOT NULL,
  setup_end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT vendor_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_bookings_booking_link_id_fkey FOREIGN KEY (booking_link_id) REFERENCES vendor_booking_links (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_id ON public.vendor_contacts USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS idx_spotlight_vendors_category ON public.spotlight_vendors USING btree (service_category);
CREATE INDEX IF NOT EXISTS idx_spotlight_vendors_approved ON public.spotlight_vendors USING btree (is_approved);
CREATE INDEX IF NOT EXISTS idx_vendor_booking_links_event_id ON public.vendor_booking_links USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_booking_links_token ON public.vendor_booking_links USING btree (link_token);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_link_id ON public.vendor_bookings USING btree (booking_link_id);
