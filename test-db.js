const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTable() {
  try {
    const { data, error } = await supabase
      .from('account_instance_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Table error:', error.message);
    } else {
      console.log('Table exists and is accessible');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

testTable(); 