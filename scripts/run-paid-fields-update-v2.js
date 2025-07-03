const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oskhkfnhikxveddjgodz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg3NjA0MywiZXhwIjoyMDYzNDUyMDQzfQ.wVsqXnEgVVdg-BC_fwVTx0-LJaka5zDZzs54rVtqLO0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addPaidFields() {
  try {
    console.log('Adding paid fields to budget tables...')

    // First, let's check if the tables exist and their current structure
    console.log('Checking existing table structure...')
    
    const { data: budgetsData, error: budgetsCheckError } = await supabase
      .from('budgets')
      .select('*')
      .limit(1)
    
    if (budgetsCheckError) {
      console.log('Error checking budgets table:', budgetsCheckError.message)
      return
    }
    
    console.log('✓ Budgets table exists')

    const { data: paymentsData, error: paymentsCheckError } = await supabase
      .from('logged_payments')
      .select('*')
      .limit(1)
    
    if (paymentsCheckError) {
      console.log('Error checking logged_payments table:', paymentsCheckError.message)
      return
    }
    
    console.log('✓ Logged_payments table exists')

    const { data: itemsData, error: itemsCheckError } = await supabase
      .from('logged_item_costs')
      .select('*')
      .limit(1)
    
    if (itemsCheckError) {
      console.log('Error checking logged_item_costs table:', itemsCheckError.message)
      return
    }
    
    console.log('✓ Logged_item_costs table exists')

    // Since we can't execute DDL directly through the client, let's try to add the paid field
    // by attempting to insert a record with the paid field and see if it works
    console.log('\nTesting paid field functionality...')
    
    // Try to update an existing record with paid field
    const { data: testUpdate, error: testError } = await supabase
      .from('budgets')
      .update({ paid: false })
      .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID to avoid actual updates
      .select()
    
    if (testError && testError.message.includes('column "paid" does not exist')) {
      console.log('❌ Paid field does not exist in budgets table')
      console.log('You need to run the SQL script manually in Supabase SQL Editor:')
      console.log('\nCopy and paste this into your Supabase SQL Editor:')
      console.log(`
-- Add "paid" field to budget tables
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
ALTER TABLE logged_item_costs ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_paid ON budgets(paid);
CREATE INDEX IF NOT EXISTS idx_logged_payments_paid ON logged_payments(paid);
CREATE INDEX IF NOT EXISTS idx_logged_item_costs_paid ON logged_item_costs(paid);

-- Update existing records
UPDATE budgets SET paid = true WHERE id IN (SELECT DISTINCT budget_id FROM logged_payments WHERE payment_amount > 0);
UPDATE logged_payments SET paid = true WHERE payment_amount > 0;
UPDATE logged_item_costs SET paid = true WHERE total > 0;
      `)
    } else if (testError) {
      console.log('✓ Paid field exists in budgets table (or other error):', testError.message)
    } else {
      console.log('✓ Paid field functionality appears to be working')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

addPaidFields() 