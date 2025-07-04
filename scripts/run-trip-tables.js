const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const client = new Client({
  connectionString: 'postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
})

async function runTripTables() {
  try {
    await client.connect()
    console.log('Connected to database')

    console.log('Reading SQL file...')
    const sqlPath = path.join(__dirname, 'create-trip-system-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('Executing trip system tables SQL...')
    await client.query(sql)
    
    console.log('✅ Trip system tables created successfully!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

runTripTables() 