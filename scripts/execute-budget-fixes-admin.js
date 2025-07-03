const { createClient } = require('@supabase/supabase-js')
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Supabase configuration with service role key
const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg3NjA0MywiZXhwIjoyMDYzNDUyMDQzfQ.wVsqXnEgVVdg-BC_fwVTx0-LJaka5zDZzs54rVtqLO0"

// Database connection
const DATABASE_URL = "postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQLViaSupabase(sql) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql })
    if (error) {
      console.error('Supabase SQL Error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Supabase Execution Error:', error)
    return false
  }
}

async function executeSQLViaPostgres(sql) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    await client.query(sql)
    await client.end()
    return true
  } catch (error) {
    console.error('PostgreSQL Error:', error.message)
    await client.end()
    return false
  }
}

async function executeSQL(sql) {
  // Try Supabase first, then PostgreSQL as fallback
  const success = await executeSQLViaSupabase(sql)
  if (!success) {
    console.log('  Trying PostgreSQL direct connection...')
    return await executeSQLViaPostgres(sql)
  }
  return success
}

async function setSearchPathToPublic(client) {
  try {
    await client.query('SET search_path TO public;')
    return true
  } catch (error) {
    console.error('Failed to set search_path:', error.message)
    return false
  }
}

async function debugCreateCategoriesTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  const createTableSQL = `CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );`
  try {
    await client.connect()
    await setSearchPathToPublic(client)
    await client.query(createTableSQL)
    console.log('CREATE TABLE categories executed successfully.')
    await client.end()
    return true
  } catch (error) {
    console.error('DEBUG: CREATE TABLE categories failed:', error)
    await client.end()
    return false
  }
}

async function debugCreateFuturePaymentsTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  const createTableSQL = `CREATE TABLE IF NOT EXISTS future_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_item_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid')),
    paid_at TIMESTAMP WITH TIME ZONE,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );`
  try {
    await client.connect()
    await setSearchPathToPublic(client)
    await client.query(createTableSQL)
    console.log('CREATE TABLE future_payments executed successfully.')
    await client.end()
    return true
  } catch (error) {
    console.error('DEBUG: CREATE TABLE future_payments failed:', error)
    await client.end()
    return false
  }
}

async function columnExists(table, column) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    await client.connect()
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [table, column])
    await client.end()
    return res.rows.length > 0
  } catch (error) {
    await client.end()
    return false
  }
}

async function runBudgetFixes() {
  try {
    console.log('Starting budget system fixes with admin privileges...')
    
    // Read and execute each SQL file
    const sqlFiles = [
      'create-categories-table.sql',
      'create-future-payments-table.sql', 
      'add-missing-fields.sql'
    ]
    
    for (const fileName of sqlFiles) {
      console.log(`\nExecuting ${fileName}...`)
      const sqlPath = path.join(__dirname, fileName)
      const sqlContent = fs.readFileSync(sqlPath, 'utf8')
      
      // Split into individual statements and execute
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        // Patch: skip index creation if column does not exist
        if (statement.includes('CREATE INDEX') && statement.includes('idx_logged_payments_budget_item_id')) {
          const exists = await columnExists('logged_payments', 'budget_item_id')
          if (!exists) {
            console.log('  Skipping index creation for logged_payments.budget_item_id (column does not exist)')
            continue
          }
        }
        if (statement.includes('CREATE INDEX') && statement.includes('idx_logged_item_costs_quantity')) {
          const exists = await columnExists('logged_item_costs', 'quantity')
          if (!exists) {
            console.log('  Skipping index creation for logged_item_costs.quantity (column does not exist)')
            continue
          }
        }
        if (statement.trim()) {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`)
          const success = await executeSQL(statement)
          if (success) {
            console.log(`  ✓ Statement ${i + 1} executed successfully`)
          } else {
            console.log(`  ✗ Statement ${i + 1} failed. Stopping further execution in this file.`)
            break
          }
        }
      }
    }
    
    console.log('\n✅ Budget system fixes completed!')
    
  } catch (error) {
    console.error('Error running budget fixes:', error)
  }
}

// Run debug for CREATE TABLE categories and future_payments first, then proceed if successful
(async () => {
  const debugCategories = await debugCreateCategoriesTable()
  if (!debugCategories) {
    console.error('Aborting further execution due to CREATE TABLE categories failure.')
    process.exit(1)
  }
  const debugFuturePayments = await debugCreateFuturePaymentsTable()
  if (!debugFuturePayments) {
    console.error('Aborting further execution due to CREATE TABLE future_payments failure.')
    process.exit(1)
  }
  await runBudgetFixes()
})() 