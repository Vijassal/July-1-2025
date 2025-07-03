-- Add missing fields to existing budget tables

-- Add missing fields to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(10,2);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS actual_currency TEXT DEFAULT 'USD';
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing fields to logged_payments table
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS budget_item_id UUID REFERENCES budgets(id) ON DELETE CASCADE;
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add missing fields to logged_item_costs table
ALTER TABLE logged_item_costs ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE logged_item_costs ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_actual_cost ON budgets(actual_cost);
CREATE INDEX IF NOT EXISTS idx_logged_payments_budget_item_id ON logged_payments(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_logged_payments_payment_method ON logged_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_logged_payments_payment_status ON logged_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_logged_payments_currency ON logged_payments(currency);
CREATE INDEX IF NOT EXISTS idx_logged_item_costs_quantity ON logged_item_costs(quantity); 