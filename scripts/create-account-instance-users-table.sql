-- Migration: Create account_instance_users table for team invite functionality

CREATE TABLE IF NOT EXISTS public.account_instance_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_instance_id UUID NOT NULL REFERENCES public.account_instances(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    invited_email TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_instance_users_account_instance_id ON public.account_instance_users(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_account_instance_users_invited_email ON public.account_instance_users(invited_email);

-- Enable RLS (optional, but recommended for security)
ALTER TABLE public.account_instance_users ENABLE ROW LEVEL SECURITY;

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