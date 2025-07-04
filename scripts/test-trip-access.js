const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
})

async function testTripAccess() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Check if there are any trips in the database
    const tripCount = await client.query('SELECT COUNT(*) as count FROM trips')
    console.log(`Total trips in database: ${tripCount.rows[0].count}`)

    // Check if there are any users
    const userCount = await client.query('SELECT COUNT(*) as count FROM auth.users')
    console.log(`Total users in database: ${userCount.rows[0].count}`)

    // Check the structure of the trips table
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'trips' 
      ORDER BY ordinal_position
    `)
    
    console.log('\nTrips table structure:')
    tableStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${row.column_default ? `default: ${row.column_default}` : ''}`)
    })

    // Test a simple query without RLS (as admin)
    const testQuery = await client.query('SELECT id, name, user_id FROM trips LIMIT 5')
    console.log('\nSample trips (admin view):')
    if (testQuery.rows.length === 0) {
      console.log('- No trips found')
    } else {
      testQuery.rows.forEach(row => {
        console.log(`- ${row.id}: ${row.name} (user: ${row.user_id})`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
    console.log('\nDatabase connection closed')
  }
}

testTripAccess() 