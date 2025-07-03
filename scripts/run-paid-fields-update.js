const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oskhkfnhikxveddjgodz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg3NjA0MywiZXhwIjoyMDYzNDUyMDQzfQ.wVsqXnEgVVdg-BC_fwVTx0-LJaka5zDZzs54rVtqLO0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addPaidFields() {
  try {
    console.log('Adding paid fields to budget tables...')

    // Add paid field to budgets table
    const { error: budgetsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE budgets ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;'
    })
    
    if (budgetsError) {
      console.log('Budgets table paid field:', budgetsError.message)
    } else {
      console.log('✓ Added paid field to budgets table')
    }

    // Add paid field to logged_payments table
    const { error: paymentsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;'
    })
    
    if (paymentsError) {
      console.log('Logged payments table paid field:', paymentsError.message)
    } else {
      console.log('✓ Added paid field to logged_payments table')
    }

    // Add paid field to logged_item_costs table
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE logged_item_costs ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;'
    })
    
    if (itemsError) {
      console.log('Logged item costs table paid field:', itemsError.message)
    } else {
      console.log('✓ Added paid field to logged_item_costs table')
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_budgets_paid ON budgets(paid);
        CREATE INDEX IF NOT EXISTS idx_logged_payments_paid ON logged_payments(paid);
        CREATE INDEX IF NOT EXISTS idx_logged_item_costs_paid ON logged_item_costs(paid);
      `
    })
    
    if (indexError) {
      console.log('Index creation:', indexError.message)
    } else {
      console.log('✓ Created indexes for paid fields')
    }

    // Update existing records
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE budgets 
        SET paid = true 
        WHERE id IN (
          SELECT DISTINCT budget_id 
          FROM logged_payments 
          WHERE payment_amount > 0
        );

        UPDATE logged_payments 
        SET paid = true 
        WHERE payment_amount > 0;

        UPDATE logged_item_costs 
        SET paid = true 
        WHERE total > 0;
      `
    })
    
    if (updateError) {
      console.log('Record updates:', updateError.message)
    } else {
      console.log('✓ Updated existing records')
    }

    console.log('\n✅ Paid fields added successfully!')

  } catch (error) {
    console.error('Error adding paid fields:', error)
  }
}

addPaidFields() 