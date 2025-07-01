-- Create website configurations table
CREATE TABLE IF NOT EXISTS website_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    site_slug VARCHAR(100) UNIQUE NOT NULL,
    site_title VARCHAR(200),
    site_subtitle VARCHAR(500),
    theme_id VARCHAR(50) DEFAULT 'classic',
    color_scheme JSONB DEFAULT '{"primary": "#e11d48", "secondary": "#f59e0b", "accent": "#8b5cf6", "background": "#ffffff", "text": "#1f2937"}',
    layout_config JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    is_password_protected BOOLEAN DEFAULT false,
    site_password VARCHAR(255),
    custom_domain VARCHAR(255),
    seo_settings JSONB DEFAULT '{}',
    analytics_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_instance_id)
);

-- Create website pages table
CREATE TABLE IF NOT EXISTS website_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    website_id UUID NOT NULL REFERENCES website_configurations(id) ON DELETE CASCADE,
    page_slug VARCHAR(100) NOT NULL,
    page_title VARCHAR(200) NOT NULL,
    page_type VARCHAR(50) DEFAULT 'custom', -- 'home', 'rsvp', 'gallery', 'info', 'custom'
    content JSONB DEFAULT '{}',
    layout_config JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(website_id, page_slug)
);

-- Create website components table (for reusable elements)
CREATE TABLE IF NOT EXISTS website_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    website_id UUID NOT NULL REFERENCES website_configurations(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL, -- 'hero', 'countdown', 'gallery', 'text', 'video', 'rsvp_form'
    component_name VARCHAR(200),
    component_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RSVP questions table
CREATE TABLE IF NOT EXISTS rsvp_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    website_id UUID NOT NULL REFERENCES website_configurations(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'short_text', 'long_text', 'multiple_choice', 'checkbox', 'dropdown', 'rating', 'date', 'file_upload'
    question_options JSONB DEFAULT '[]', -- For multiple choice, dropdown, etc.
    is_required BOOLEAN DEFAULT false,
    applies_to VARCHAR(20) DEFAULT 'individual', -- 'individual', 'family', 'party'
    conditional_logic JSONB DEFAULT '{}', -- For conditional questions
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RSVP responses table
CREATE TABLE IF NOT EXISTS rsvp_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES website_configurations(id) ON DELETE CASCADE,
    response_status VARCHAR(20) DEFAULT 'pending', -- 'accepted', 'declined', 'pending'
    response_data JSONB DEFAULT '{}', -- Stores all question responses
    additional_guests INTEGER DEFAULT 0,
    dietary_restrictions TEXT,
    special_requests TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, website_id)
);

-- Create website assets table (for uploaded images, files)
CREATE TABLE IF NOT EXISTS website_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    website_id UUID NOT NULL REFERENCES website_configurations(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document', 'audio'
    asset_name VARCHAR(255) NOT NULL,
    asset_url TEXT NOT NULL,
    asset_size INTEGER,
    mime_type VARCHAR(100),
    alt_text VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_configurations_account_instance_id ON website_configurations(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_website_configurations_site_slug ON website_configurations(site_slug);
CREATE INDEX IF NOT EXISTS idx_website_pages_website_id ON website_pages(website_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_page_type ON website_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_website_components_website_id ON website_components(website_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_questions_website_id ON rsvp_questions(website_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_participant_id ON rsvp_responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_website_id ON rsvp_responses(website_id);
CREATE INDEX IF NOT EXISTS idx_website_assets_website_id ON website_assets(website_id);

-- Add RLS policies
ALTER TABLE website_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_assets ENABLE ROW LEVEL SECURITY;

-- Policies for website_configurations
CREATE POLICY "Users can manage their own website configurations" ON website_configurations
    FOR ALL USING (
        account_instance_id IN (
            SELECT id FROM account_instances 
            WHERE name = auth.jwt() ->> 'email'
        )
    );

-- Policies for website_pages
CREATE POLICY "Users can manage their own website pages" ON website_pages
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE name = auth.jwt() ->> 'email'
            )
        )
    );

-- Policies for website_components
CREATE POLICY "Users can manage their own website components" ON website_components
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE name = auth.jwt() ->> 'email'
            )
        )
    );

-- Policies for rsvp_questions
CREATE POLICY "Users can manage their own RSVP questions" ON rsvp_questions
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE name = auth.jwt() ->> 'email'
            )
        )
    );

-- Policies for rsvp_responses
CREATE POLICY "Users can view responses to their events" ON rsvp_responses
    FOR SELECT USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE name = auth.jwt() ->> 'email'
            )
        )
    );

-- Allow public insert for RSVP responses (guests responding)
CREATE POLICY "Anyone can submit RSVP responses" ON rsvp_responses
    FOR INSERT WITH CHECK (true);

-- Policies for website_assets
CREATE POLICY "Users can manage their own website assets" ON website_assets
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE name = auth.jwt() ->> 'email'
            )
        )
    );
