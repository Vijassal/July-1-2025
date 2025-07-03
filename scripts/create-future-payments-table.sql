-- Create future_payments table
CREATE TABLE IF NOT EXISTS future_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_item_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid')),
    paid_at TIMESTAMP WITH TIME ZONE,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_future_payments_account_instance_id ON future_payments(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_future_payments_budget_item_id ON future_payments(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_future_payments_status ON future_payments(status);
CREATE INDEX IF NOT EXISTS idx_future_payments_due_date ON future_payments(due_date);

-- Enable RLS
ALTER TABLE future_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage future payments in their accounts" ON future_payments
  FOR ALL USING (
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage future payments in accessible accounts" ON future_payments
  FOR ALL USING (
    account_instance_id IN (
      SELECT account_instance_id FROM professional_account_access 
      WHERE professional_id = auth.uid() AND is_active = true
    )
  ); 