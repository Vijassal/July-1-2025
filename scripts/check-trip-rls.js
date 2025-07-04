const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
})

async function checkTripRLS() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Check if RLS is enabled
    const rlsCheck = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'trips'
    `)
    
    console.log('RLS status for trips table:')
    rlsCheck.rows.forEach(row => {
      console.log(`- Schema: ${row.schemaname}, Table: ${row.tablename}, RLS: ${row.rowsecurity}`)
    })

    // Check RLS policies
    const policies = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'trips'
    `)
    
    console.log('\nRLS policies for trips table:')
    if (policies.rows.length === 0) {
      console.log('- No policies found!')
    } else {
      policies.rows.forEach(row => {
        console.log(`- ${row.policyname}: ${row.cmd} (${row.qual})`)
      })
    }

    // Check if user can access the table
    const userAccess = await client.query(`
      SELECT has_table_privilege('authenticated', 'trips', 'SELECT') as can_select,
             has_table_privilege('authenticated', 'trips', 'INSERT') as can_insert,
             has_table_privilege('authenticated', 'trips', 'UPDATE') as can_update,
             has_table_privilege('authenticated', 'trips', 'DELETE') as can_delete
    `)
    
    console.log('\nUser privileges for trips table:')
    userAccess.rows.forEach(row => {
      console.log(`- SELECT: ${row.can_select}`)
      console.log(`- INSERT: ${row.can_insert}`)
      console.log(`- UPDATE: ${row.can_update}`)
      console.log(`- DELETE: ${row.can_delete}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
    console.log('\nDatabase connection closed')
  }
}

checkTripRLS() 