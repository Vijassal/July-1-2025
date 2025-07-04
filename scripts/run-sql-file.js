const { Client } = require('pg');
const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Usage: node run-sql-file.js <path-to-sql-file>');
  process.exit(1);
}

const sqlFilePath = process.argv[2];
const sql = fs.readFileSync(sqlFilePath, 'utf8');

const client = new Client({
  connectionString: 'postgresql://postgres:!Rogers123456!@db.oskhkfnhikxveddjgodz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runSQL() {
  try {
    await client.connect();
    console.log('Connected to database');
    console.log(`Executing SQL from file: ${sqlFilePath}`);
    await client.query(sql);
    console.log('✅ SQL executed successfully!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runSQL(); 