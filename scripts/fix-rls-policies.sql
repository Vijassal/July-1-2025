-- Fix RLS Policies to use consistent user identification
-- This script standardizes all RLS policies to use auth.uid() instead of email-based lookups

-- Drop existing inconsistent policies
DROP POLICY IF EXISTS "Users can read their own configurations" ON app_configurations;
DROP POLICY IF EXISTS "Users can insert their own configurations" ON app_configurations;
DROP POLICY IF EXISTS "Users can update their own configurations" ON app_configurations;
DROP POLICY IF EXISTS "Users can delete their own configurations" ON app_configurations;

DROP POLICY IF EXISTS "Users can manage their own website configurations" ON website_configurations;
DROP POLICY IF EXISTS "Users can manage their own website pages" ON website_pages;
DROP POLICY IF EXISTS "Users can manage their own website components" ON website_components;
DROP POLICY IF EXISTS "Users can manage their own RSVP questions" ON rsvp_questions;
DROP POLICY IF EXISTS "Users can view responses to their events" ON rsvp_responses;
DROP POLICY IF EXISTS "Users can manage their own website assets" ON website_assets;

-- Create standardized policies for app_configurations
CREATE POLICY "Users can manage their own configurations" ON app_configurations
    FOR ALL USING (
        account_instance_id IN (
            SELECT id FROM account_instances 
            WHERE owner_user_id = auth.uid()
        )
    );

-- Create standardized policies for website_configurations
CREATE POLICY "Users can manage their own website configurations" ON website_configurations
    FOR ALL USING (
        account_instance_id IN (
            SELECT id FROM account_instances 
            WHERE owner_user_id = auth.uid()
        )
    );

-- Create standardized policies for website_pages
CREATE POLICY "Users can manage their own website pages" ON website_pages
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE owner_user_id = auth.uid()
            )
        )
    );

-- Create standardized policies for website_components
CREATE POLICY "Users can manage their own website components" ON website_components
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE owner_user_id = auth.uid()
            )
        )
    );

-- Create standardized policies for rsvp_questions
CREATE POLICY "Users can manage their own RSVP questions" ON rsvp_questions
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE owner_user_id = auth.uid()
            )
        )
    );

-- Create standardized policies for rsvp_responses
CREATE POLICY "Users can view responses to their events" ON rsvp_responses
    FOR SELECT USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE owner_user_id = auth.uid()
            )
        )
    );

-- Allow public insert for RSVP responses (guests responding)
CREATE POLICY "Anyone can submit RSVP responses" ON rsvp_responses
    FOR INSERT WITH CHECK (true);

-- Create standardized policies for website_assets
CREATE POLICY "Users can manage their own website assets" ON website_assets
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT id FROM account_instances 
                WHERE owner_user_id = auth.uid()
            )
        )
    );

-- Add professional access policies
CREATE POLICY "Professionals can access client accounts" ON app_configurations
    FOR ALL USING (
        account_instance_id IN (
            SELECT account_instance_id FROM professional_account_access 
            WHERE professional_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Professionals can access client websites" ON website_configurations
    FOR ALL USING (
        account_instance_id IN (
            SELECT account_instance_id FROM professional_account_access 
            WHERE professional_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Professionals can access client website pages" ON website_pages
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT account_instance_id FROM professional_account_access 
                WHERE professional_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "Professionals can access client website components" ON website_components
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT account_instance_id FROM professional_account_access 
                WHERE professional_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "Professionals can access client RSVP questions" ON rsvp_questions
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT account_instance_id FROM professional_account_access 
                WHERE professional_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "Professionals can view client RSVP responses" ON rsvp_responses
    FOR SELECT USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT account_instance_id FROM professional_account_access 
                WHERE professional_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "Professionals can access client website assets" ON website_assets
    FOR ALL USING (
        website_id IN (
            SELECT id FROM website_configurations 
            WHERE account_instance_id IN (
                SELECT account_instance_id FROM professional_account_access 
                WHERE professional_id = auth.uid() AND is_active = true
            )
        )
    ); 