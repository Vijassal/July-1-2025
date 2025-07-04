-- Fix RLS Policies for account_instance_users table
-- This script adds the missing RLS policies that are preventing DELETE operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view team members in their accounts" ON public.account_instance_users;
DROP POLICY IF EXISTS "Users can insert team members in their accounts" ON public.account_instance_users;
DROP POLICY IF EXISTS "Users can update team members in their accounts" ON public.account_instance_users;
DROP POLICY IF EXISTS "Users can delete team members in their accounts" ON public.account_instance_users;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.account_instance_users;
DROP POLICY IF EXISTS "Users can update their own memberships" ON public.account_instance_users;

-- RLS Policies for account_instance_users
-- Users can view team members in their own accounts
CREATE POLICY "Users can view team members in their accounts" ON public.account_instance_users
    FOR SELECT USING (
        account_instance_id IN (
            SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
        )
    );

-- Users can insert team members in their own accounts (for invites)
CREATE POLICY "Users can insert team members in their accounts" ON public.account_instance_users
    FOR INSERT WITH CHECK (
        account_instance_id IN (
            SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
        )
    );

-- Users can update team members in their own accounts
CREATE POLICY "Users can update team members in their accounts" ON public.account_instance_users
    FOR UPDATE USING (
        account_instance_id IN (
            SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
        )
    );

-- Users can delete team members in their own accounts
CREATE POLICY "Users can delete team members in their accounts" ON public.account_instance_users
    FOR DELETE USING (
        account_instance_id IN (
            SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
        )
    );

-- Users can view their own team memberships
CREATE POLICY "Users can view their own memberships" ON public.account_instance_users
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own memberships
CREATE POLICY "Users can update their own memberships" ON public.account_instance_users
    FOR UPDATE USING (user_id = auth.uid()); 