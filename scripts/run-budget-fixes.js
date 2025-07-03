const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzYwNDMsImV4cCI6MjA2MzQ1MjA0M30.Izet6wonn6vwEM9ZzOkSK2WkcIIMSP5nqoNpbFGF0EM"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function runBudgetFixes() {
  try {
    console.log('Starting budget system fixes...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-budget-system-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        console.log(statement.substring(0, 100) + '...')
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error)
          // Continue with other statements
        } else {
          console.log(`Statement ${i + 1} executed successfully`)
        }
      }
    }
    
    console.log('Budget system fixes completed!')
    
  } catch (error) {
    console.error('Error running budget fixes:', error)
  }
}

// Run the fixes
runBudgetFixes() 