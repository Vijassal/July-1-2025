const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzYwNDMsImV4cCI6MjA2MzQ1MjA0M30.Izet6wonn6vwEM9ZzOkSK2WkcIIMSP5nqoNpbFGF0EM"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
      console.error('SQL Error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Execution Error:', error)
    return false
  }
}

async function runBudgetFixes() {
  try {
    console.log('Starting budget system fixes...')
    
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
        if (statement.trim()) {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`)
          const success = await executeSQL(statement)
          if (success) {
            console.log(`  ✓ Statement ${i + 1} executed successfully`)
          } else {
            console.log(`  ✗ Statement ${i + 1} failed`)
          }
        }
      }
    }
    
    console.log('\n✅ Budget system fixes completed!')
    
  } catch (error) {
    console.error('Error running budget fixes:', error)
  }
}

// Run the fixes
runBudgetFixes() 