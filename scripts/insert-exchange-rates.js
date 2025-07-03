const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Database connection
const DATABASE_URL = "postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres"

async function insertExchangeRates() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('Connected to database')
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'insert-sample-exchange-rates.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} exchange rate insert statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          await client.query(statement)
          console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`)
        } catch (error) {
          console.log(`✗ Statement ${i + 1}/${statements.length} failed:`, error.message)
        }
      }
    }
    
    console.log('\n✅ Exchange rates insertion completed!')
    
  } catch (error) {
    console.error('Error inserting exchange rates:', error)
  } finally {
    await client.end()
  }
}

// Run the insertion
insertExchangeRates() 