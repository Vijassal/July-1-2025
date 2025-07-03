const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzYwNDMsImV4cCI6MjA2MzQ1MjA0M30.Izet6wonn6vwEM9ZzOkSK2WkcIIMSP5nqoNpbFGF0EM"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function runBudgetFixes() {
  try {
    console.log('Starting budget system fixes...')
    
    // First, let's check what tables exist
    console.log('\n1. Checking existing tables...')
    
    // Try to query each table to see if it exists
    const tables = ['categories', 'future_payments', 'budgets', 'logged_payments', 'logged_item_costs']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error && error.code === 'PGRST116') {
          console.log(`  ✗ Table '${table}' does not exist`)
        } else if (error) {
          console.log(`  ? Table '${table}' status unclear: ${error.message}`)
        } else {
          console.log(`  ✓ Table '${table}' exists`)
        }
      } catch (error) {
        console.log(`  ? Table '${table}' status unclear: ${error.message}`)
      }
    }
    
    // Since we can't create tables directly through the client,
    // let's test if the categories table exists by trying to insert a test record
    console.log('\n2. Testing categories table...')
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`  ✗ Categories table error: ${error.message}`)
        console.log('  → You need to run the SQL scripts in Supabase SQL Editor')
      } else {
        console.log('  ✓ Categories table exists and is accessible')
      }
    } catch (error) {
      console.log(`  ✗ Categories table error: ${error.message}`)
    }
    
    // Test future_payments table
    console.log('\n3. Testing future_payments table...')
    try {
      const { data, error } = await supabase
        .from('future_payments')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`  ✗ Future payments table error: ${error.message}`)
        console.log('  → You need to run the SQL scripts in Supabase SQL Editor')
      } else {
        console.log('  ✓ Future payments table exists and is accessible')
      }
    } catch (error) {
      console.log(`  ✗ Future payments table error: ${error.message}`)
    }
    
    // Test budgets table with new fields
    console.log('\n4. Testing budgets table fields...')
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, category_id, actual_cost, actual_currency, notes')
        .limit(1)
      
      if (error) {
        console.log(`  ✗ Budgets table missing fields: ${error.message}`)
        console.log('  → You need to run the SQL scripts in Supabase SQL Editor')
      } else {
        console.log('  ✓ Budgets table has all required fields')
      }
    } catch (error) {
      console.log(`  ✗ Budgets table error: ${error.message}`)
    }
    
    console.log('\n📋 SUMMARY:')
    console.log('The budget system requires database schema updates.')
    console.log('Please run these SQL scripts in your Supabase SQL Editor:')
    console.log('1. scripts/create-categories-table.sql')
    console.log('2. scripts/create-future-payments-table.sql')
    console.log('3. scripts/add-missing-fields.sql')
    
  } catch (error) {
    console.error('Error running budget fixes:', error)
  }
}

// Run the fixes
runBudgetFixes() 