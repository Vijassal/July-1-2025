const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const client = new Client({
  connectionString: 'postgresql://postgres:%21Rogers123456%21@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
})

async function fixRLSPolicies() {
  try {
    await client.connect()
    console.log('Connected to database')

    console.log('Reading RLS fix SQL file...')
    const sqlPath = path.join(__dirname, 'fix-trip-rls-policies.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('Executing RLS policy fixes...')
    await client.query(sql)
    
    console.log('✅ RLS policies fixed successfully!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

fixRLSPolicies() 