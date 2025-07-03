const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
})

async function runSQL() {
  try {
    await client.connect()
    console.log('Connected to database')

    const sqlCommands = [
      'ALTER TABLE budgets ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE logged_payments ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE logged_item_costs ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;',
      'CREATE INDEX IF NOT EXISTS idx_budgets_paid ON budgets(paid);',
      'CREATE INDEX IF NOT EXISTS idx_logged_payments_paid ON logged_payments(paid);',
      'CREATE INDEX IF NOT EXISTS idx_logged_item_costs_paid ON logged_item_costs(paid);',
      `UPDATE budgets 
       SET paid = true 
       WHERE id IN (
         SELECT DISTINCT budget_id 
         FROM logged_payments 
         WHERE payment_amount > 0
       );`,
      'UPDATE logged_payments SET paid = true WHERE payment_amount > 0;',
      'UPDATE logged_item_costs SET paid = true WHERE total > 0;'
    ]

    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`Executing command ${i + 1}/${sqlCommands.length}...`)
      
      try {
        await client.query(sql)
        console.log(`✓ Command ${i + 1} executed successfully`)
      } catch (error) {
        console.log(`⚠ Command ${i + 1} had an issue:`, error.message)
      }
    }

    console.log('\n✅ All SQL commands completed!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

runSQL() 