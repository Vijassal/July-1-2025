-- Add "paid" field to budget tables
-- Run this in Supabase SQL Editor

-- Add paid field to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

-- Add paid field to logged_payments table  
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

-- Add paid field to logged_item_costs table
ALTER TABLE logged_item_costs ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

-- Create indexes for the new paid fields for better query performance
CREATE INDEX IF NOT EXISTS idx_budgets_paid ON budgets(paid);
CREATE INDEX IF NOT EXISTS idx_logged_payments_paid ON logged_payments(paid);
CREATE INDEX IF NOT EXISTS idx_logged_item_costs_paid ON logged_item_costs(paid);

-- Update existing records to set paid = true for items that have payments
UPDATE budgets 
SET paid = true 
WHERE id IN (
  SELECT DISTINCT budget_id 
  FROM logged_payments 
  WHERE payment_amount > 0
);

-- Update logged_payments to set paid = true for payments with amounts
UPDATE logged_payments 
SET paid = true 
WHERE payment_amount > 0;

-- Update logged_item_costs to set paid = true for items with costs
UPDATE logged_item_costs 
SET paid = true 
WHERE total > 0; 