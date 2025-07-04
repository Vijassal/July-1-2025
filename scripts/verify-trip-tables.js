const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
})

async function verifyTripTables() {
  try {
    await client.connect()
    console.log('Connected to database')

    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE 'trip_%' OR table_name = 'trips')
      ORDER BY table_name
    `)
    
    console.log('Trip tables found:')
    result.rows.forEach(row => console.log('- ' + row.table_name))
    
    // Check if trips table has the correct structure
    const tripsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trips' 
      ORDER BY ordinal_position
    `)
    
    console.log('\nTrips table structure:')
    tripsStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
    console.log('\nDatabase connection closed')
  }
}

verifyTripTables() 