const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

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

    console.log('\n✅ Paid fields added successfully!')

  } catch (error) {
    console.error('Error adding paid fields:', error)
  }
}

addPaidFields() 