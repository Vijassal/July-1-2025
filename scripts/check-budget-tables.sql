-- Check Budget System Tables and Fields
-- Run this in Supabase SQL Editor to see what exists

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('budgets', 'logged_payments', 'logged_item_costs', 'categories', 'future_payments', 'exchange_rates') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('budgets', 'logged_payments', 'logged_item_costs', 'categories', 'future_payments', 'exchange_rates');

-- Check budgets table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'budgets'
ORDER BY ordinal_position;

-- Check logged_payments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'logged_payments'
ORDER BY ordinal_position;

-- Check logged_item_costs table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'logged_item_costs'
ORDER BY ordinal_position;

-- Check if categories table exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'categories'
ORDER BY ordinal_position;

-- Check if future_payments table exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'future_payments'
ORDER BY ordinal_position; 