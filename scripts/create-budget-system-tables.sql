-- Budget System Tables Setup
-- This script creates and configures the budget-related tables with proper relationships

-- ============================================================================
-- CREATE BUDGET TABLES
-- ============================================================================

-- Create budgets table if it doesn't exist
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase TEXT NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    cost NUMERIC(10,2) NOT NULL,
    tags TEXT[],
    payment_for TEXT,
    payment_by TEXT,
    conversion_rate NUMERIC(10,4),
    converted_amount NUMERIC(10,2),
    currency TEXT DEFAULT 'USD',
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

-- Create logged_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS logged_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    purchase TEXT NOT NULL,
    payment_amount NUMERIC(10,2) NOT NULL,
    payment_by TEXT NOT NULL,
    payment_for TEXT NOT NULL,
    payment_date DATE NOT NULL,
    item TEXT NOT NULL,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_future BOOLEAN DEFAULT FALSE
);

-- Create logged_item_costs table if it doesn't exist
CREATE TABLE IF NOT EXISTS logged_item_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    logged_payment_id UUID NOT NULL REFERENCES logged_payments(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    per_cost NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    units INTEGER DEFAULT 1,
    per_unit_cost NUMERIC(10,2)
);

-- Create exchange_rates table if it doesn't exist
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC(10,4) NOT NULL,
    date DATE NOT NULL,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(from_currency, to_currency, date, account_instance_id)
);

-- Categories table (for custom categories)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Future Payments table
CREATE TABLE IF NOT EXISTS future_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_item_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_account_instance_id ON budgets(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_budgets_vendor_id ON budgets(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budgets_event_id ON budgets(event_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(date);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at);

-- Logged payments indexes
CREATE INDEX IF NOT EXISTS idx_logged_payments_account_instance_id ON logged_payments(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_logged_payments_budget_id ON logged_payments(budget_id);
CREATE INDEX IF NOT EXISTS idx_logged_payments_payment_date ON logged_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_logged_payments_created_at ON logged_payments(created_at);

-- Logged item costs indexes
CREATE INDEX IF NOT EXISTS idx_logged_item_costs_account_instance_id ON logged_item_costs(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_logged_item_costs_logged_payment_id ON logged_item_costs(logged_payment_id);
CREATE INDEX IF NOT EXISTS idx_logged_item_costs_created_at ON logged_item_costs(created_at);

-- Exchange rates indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_account_instance_id ON exchange_rates(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_account_instance_id ON categories(account_instance_id);

-- Future payments indexes
CREATE INDEX IF NOT EXISTS idx_future_payments_account_instance_id ON future_payments(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_future_payments_budget_item_id ON future_payments(budget_item_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE logged_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE logged_item_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage budgets in their accounts" ON budgets;
DROP POLICY IF EXISTS "Professionals can manage budgets in accessible accounts" ON budgets;
DROP POLICY IF EXISTS "Users can manage logged payments in their accounts" ON logged_payments;
DROP POLICY IF EXISTS "Professionals can manage logged payments in accessible accounts" ON logged_payments;
DROP POLICY IF EXISTS "Users can manage logged item costs in their accounts" ON logged_item_costs;
DROP POLICY IF EXISTS "Professionals can manage logged item costs in accessible accounts" ON logged_item_costs;
DROP POLICY IF EXISTS "Users can manage exchange rates in their accounts" ON exchange_rates;
DROP POLICY IF EXISTS "Professionals can manage exchange rates in accessible accounts" ON exchange_rates;

-- Budgets policies
CREATE POLICY "Users can manage budgets in their accounts" ON budgets
  FOR ALL USING (
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage budgets in accessible accounts" ON budgets
  FOR ALL USING (
    account_instance_id IN (
      SELECT account_instance_id FROM professional_account_access 
      WHERE professional_id = auth.uid() AND is_active = true
    )
  );

-- Logged payments policies
CREATE POLICY "Users can manage logged payments in their accounts" ON logged_payments
  FOR ALL USING (
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage logged payments in accessible accounts" ON logged_payments
  FOR ALL USING (
    account_instance_id IN (
      SELECT account_instance_id FROM professional_account_access 
      WHERE professional_id = auth.uid() AND is_active = true
    )
  );

-- Logged item costs policies
CREATE POLICY "Users can manage logged item costs in their accounts" ON logged_item_costs
  FOR ALL USING (
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage logged item costs in accessible accounts" ON logged_item_costs
  FOR ALL USING (
    account_instance_id IN (
      SELECT account_instance_id FROM professional_account_access 
      WHERE professional_id = auth.uid() AND is_active = true
    )
  );

-- Exchange rates policies
CREATE POLICY "Users can manage exchange rates in their accounts" ON exchange_rates
  FOR ALL USING (
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage exchange rates in accessible accounts" ON exchange_rates
  FOR ALL USING (
    account_instance_id IN (
      SELECT account_instance_id FROM professional_account_access 
      WHERE professional_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS update_logged_payments_updated_at ON logged_payments;
DROP TRIGGER IF EXISTS update_logged_item_costs_updated_at ON logged_item_costs;

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logged_payments_updated_at
    BEFORE UPDATE ON logged_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logged_item_costs_updated_at
    BEFORE UPDATE ON logged_item_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert some sample exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 
    'EUR', 'USD', 1.08, CURRENT_DATE, ai.id
FROM account_instances ai
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_rates er 
    WHERE er.from_currency = 'EUR' 
    AND er.to_currency = 'USD' 
    AND er.account_instance_id = ai.id
    AND er.date = CURRENT_DATE
);

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 
    'GBP', 'USD', 1.27, CURRENT_DATE, ai.id
FROM account_instances ai
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_rates er 
    WHERE er.from_currency = 'GBP' 
    AND er.to_currency = 'USD' 
    AND er.account_instance_id = ai.id
    AND er.date = CURRENT_DATE
);

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 
    'CAD', 'USD', 0.74, CURRENT_DATE, ai.id
FROM account_instances ai
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_rates er 
    WHERE er.from_currency = 'CAD' 
    AND er.to_currency = 'USD' 
    AND er.account_instance_id = ai.id
    AND er.date = CURRENT_DATE
); 